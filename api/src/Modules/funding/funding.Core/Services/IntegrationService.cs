using System.Text;
using System.Text.Json;
using funding.Contracts;
using funding.Core.Entities;
using funding.Core.Persistence;
using juskel.Integrations;
using juskel.Integrations.OpenBanking;
using juskel.Integrations.QuickBooks;
using juskel.Integrations.Xero;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using onboarding.Contracts;

namespace funding.Core.Services;

internal sealed class IntegrationService
{
    private readonly FundingDbContext _db;
    private readonly IOnboardingModule _onboarding;
    private readonly IFundingModule _funding;
    private readonly IOpenBankingProvider _openBanking;
    private readonly IXeroClient _xero;
    private readonly IQuickBooksClient _quickBooks;
    private readonly IFieldEncryptor _encryptor;

    public IntegrationService(
        FundingDbContext db,
        IOnboardingModule onboarding,
        IFundingModule funding,
        IOpenBankingProvider openBanking,
        IXeroClient xero,
        IQuickBooksClient quickBooks,
        IFieldEncryptor encryptor)
    {
        _db = db;
        _onboarding = onboarding;
        _funding = funding;
        _openBanking = openBanking;
        _xero = xero;
        _quickBooks = quickBooks;
        _encryptor = encryptor;
    }

    public async Task<OAuthAuthorizeResponse?> BuildOpenBankingAuthorizationAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var result = _openBanking.BuildAuthorizationUrl(applicationId.Value, userId);
        return new OAuthAuthorizeResponse(result.AuthorizationUrl, result.State);
    }

    public async Task<bool> HandleOpenBankingCallbackAsync(
        string code,
        string state,
        CancellationToken ct = default)
    {
        var (applicationId, _) = ParseState(state);
        var token = await _openBanking.ExchangeCodeAsync(code, ct);
        await UpsertConnectionAsync(
            applicationId,
            IntegrationProvider.OpenBanking,
            token.AccessToken,
            token.RefreshToken,
            token.ExpiresAt,
            null,
            null,
            ct);

        var accounts = await _openBanking.GetAccountsAsync(token.AccessToken, ct);
        var profile = await _db.FinancialProfiles.FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct)
            ?? new FinancialProfile { ApplicationId = applicationId };

        FinancialProfileService.ApplyOpenBankingBands(profile, accounts);

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.FinancialProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);
        await _onboarding.MarkStepAsync(applicationId, OnboardingStep.Financial, StepStatus.Complete, ct);
        return true;
    }

    public async Task<OAuthAuthorizeResponse?> BuildXeroAuthorizationAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var result = _xero.BuildAuthorizationUrl(applicationId.Value, userId);
        return new OAuthAuthorizeResponse(result.AuthorizationUrl, result.State);
    }

    public async Task<bool> HandleXeroCallbackAsync(string code, string state, CancellationToken ct = default)
    {
        var (applicationId, _) = ParseState(state);
        var token = await _xero.ExchangeCodeAsync(code, ct);
        await UpsertConnectionAsync(
            applicationId,
            IntegrationProvider.Xero,
            token.AccessToken,
            token.RefreshToken,
            token.ExpiresAt,
            null,
            null,
            ct);
        return true;
    }

    public async Task<OAuthAuthorizeResponse?> BuildQuickBooksAuthorizationAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return null;

        var result = _quickBooks.BuildAuthorizationUrl(applicationId.Value, userId);
        return new OAuthAuthorizeResponse(result.AuthorizationUrl, result.State);
    }

    public async Task<bool> HandleQuickBooksCallbackAsync(
        string code,
        string state,
        string? realmId,
        CancellationToken ct = default)
    {
        var (applicationId, _) = ParseState(state);
        var token = await _quickBooks.ExchangeCodeAsync(code, ct);
        var resolvedRealmId = string.IsNullOrWhiteSpace(realmId) ? "stub-realm" : realmId.Trim();

        var accessToken = token.AccessToken;
        var refreshToken = token.RefreshToken;
        var expiresAt = token.ExpiresAt;

        var sync = await _quickBooks.SyncFinancialDataAsync(accessToken, refreshToken, resolvedRealmId, ct);
        if (sync.RefreshedTokens is not null)
        {
            accessToken = sync.RefreshedTokens.AccessToken;
            refreshToken = sync.RefreshedTokens.RefreshToken ?? refreshToken;
            expiresAt = sync.RefreshedTokens.ExpiresAt;
        }

        var metadataJson = BuildQuickBooksMetadataJson(sync.Snapshot);
        await UpsertConnectionAsync(
            applicationId,
            IntegrationProvider.QuickBooks,
            accessToken,
            refreshToken,
            expiresAt,
            resolvedRealmId,
            metadataJson,
            ct);

        var profile = await _db.FinancialProfiles.FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct)
            ?? new FinancialProfile { ApplicationId = applicationId };

        FinancialProfileService.ApplyQuickBooksBands(profile, sync.Snapshot);
        await FinancialProfileService.UpsertQuickBooksMetricsAsync(_db, applicationId, sync.Snapshot, ct);

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.FinancialProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);

        var complete = await _funding.IsFinancialStepCompleteAsync(applicationId, ct);
        await _onboarding.MarkStepAsync(
            applicationId,
            OnboardingStep.Financial,
            complete ? StepStatus.Complete : StepStatus.InProgress,
            ct);

        return true;
    }

    public async Task<bool> DisconnectAsync(
        Guid userId,
        IntegrationProvider provider,
        CancellationToken ct = default)
    {
        var applicationId = await _onboarding.GetDraftApplicationIdAsync(userId, ct);
        if (applicationId is null)
            return false;

        var connection = await _db.IntegrationConnections
            .FirstOrDefaultAsync(i => i.ApplicationId == applicationId && i.Provider == provider, ct);

        if (connection is null)
            return false;

        _db.IntegrationConnections.Remove(connection);

        if (provider == IntegrationProvider.OpenBanking)
        {
            var profile = await _db.FinancialProfiles.FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);
            if (profile is not null)
            {
                profile.BandsLockedByIntegration = false;
                profile.UpdatedAt = DateTime.UtcNow;
            }
        }

        if (provider == IntegrationProvider.QuickBooks)
        {
            var profile = await _db.FinancialProfiles.FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);
            if (profile is not null)
            {
                profile.BandsLockedByIntegration = false;
                profile.UpdatedAt = DateTime.UtcNow;
            }

            var metrics = await _db.FinancialIntegrationMetrics
                .FirstOrDefaultAsync(m => m.ApplicationId == applicationId, ct);
            if (metrics is not null)
                _db.FinancialIntegrationMetrics.Remove(metrics);
        }

        await _db.SaveChangesAsync(ct);

        if (provider == IntegrationProvider.OpenBanking)
        {
            var complete = await _funding.IsFinancialStepCompleteAsync(applicationId.Value, ct);
            await _onboarding.MarkStepAsync(
                applicationId.Value,
                OnboardingStep.Financial,
                complete ? StepStatus.Complete : StepStatus.InProgress,
                ct);
        }

        if (provider == IntegrationProvider.QuickBooks)
        {
            var complete = await _funding.IsFinancialStepCompleteAsync(applicationId.Value, ct);
            await _onboarding.MarkStepAsync(
                applicationId.Value,
                OnboardingStep.Financial,
                complete ? StepStatus.Complete : StepStatus.InProgress,
                ct);
        }

        return true;
    }

    private static string BuildQuickBooksMetadataJson(QuickBooksFinancialSnapshot snapshot) =>
        JsonSerializer.Serialize(new
        {
            companyName = snapshot.CompanyName,
            snapshot.Currency,
            snapshot.HasReportData,
            snapshot.PeriodStart,
            snapshot.PeriodEnd,
            annualRevenue = snapshot.AnnualRevenue,
            snapshot.NetIncome,
            cashBalance = snapshot.CashBalance,
            outstandingDebt = snapshot.OutstandingDebt,
            totalLiabilities = snapshot.TotalLiabilities,
            syncedAt = DateTime.UtcNow,
        });

    private async Task UpsertConnectionAsync(
        Guid applicationId,
        IntegrationProvider provider,
        string accessToken,
        string? refreshToken,
        DateTime? expiresAt,
        string? externalRealmId,
        string? providerMetadataJson,
        CancellationToken ct)
    {
        var connection = await _db.IntegrationConnections
            .FirstOrDefaultAsync(i => i.ApplicationId == applicationId && i.Provider == provider, ct);

        connection ??= new IntegrationConnection
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            Provider = provider,
        };

        connection.AccessTokenEncrypted = _encryptor.Encrypt(
            accessToken,
            provider switch
            {
                IntegrationProvider.OpenBanking => IntegrationEncryptionPurposes.OpenBankingAccessToken,
                IntegrationProvider.Xero => IntegrationEncryptionPurposes.XeroAccessToken,
                IntegrationProvider.QuickBooks => IntegrationEncryptionPurposes.QuickBooksAccessToken,
                _ => IntegrationEncryptionPurposes.OpenBankingAccessToken,
            });

        connection.RefreshTokenEncrypted = string.IsNullOrWhiteSpace(refreshToken)
            ? null
            : _encryptor.Encrypt(
                refreshToken,
                provider switch
                {
                    IntegrationProvider.OpenBanking => IntegrationEncryptionPurposes.OpenBankingRefreshToken,
                    IntegrationProvider.Xero => IntegrationEncryptionPurposes.XeroRefreshToken,
                    IntegrationProvider.QuickBooks => IntegrationEncryptionPurposes.QuickBooksRefreshToken,
                    _ => IntegrationEncryptionPurposes.OpenBankingRefreshToken,
                });

        connection.ConnectedAt = DateTime.UtcNow;
        connection.ExpiresAt = expiresAt;

        if (!string.IsNullOrWhiteSpace(externalRealmId))
            connection.ExternalRealmId = externalRealmId;

        if (!string.IsNullOrWhiteSpace(providerMetadataJson))
            connection.ProviderMetadataJson = providerMetadataJson;

        if (_db.Entry(connection).State == EntityState.Detached)
            _db.IntegrationConnections.Add(connection);

        await _db.SaveChangesAsync(ct);
    }

    private static (Guid ApplicationId, Guid UserId) ParseState(string state)
    {
        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(state));
        var parts = decoded.Split(':');
        if (parts.Length < 2 || !Guid.TryParse(parts[0], out var applicationId) || !Guid.TryParse(parts[1], out var userId))
            throw new InvalidOperationException("Invalid OAuth state.");

        return (applicationId, userId);
    }
}
