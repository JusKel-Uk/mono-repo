using System.Text.Json;
using funding.Core.Entities;
using funding.Core.Persistence;
using juskel.Integrations;
using juskel.Integrations.OpenBanking;
using juskel.Shared.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace funding.Core.Services;

internal sealed class OpenBankingSyncService
{
    private readonly FundingDbContext _db;
    private readonly IOpenBankingProvider _openBanking;
    private readonly IFieldEncryptor _encryptor;
    private readonly OpenBankingOptions _options;

    public OpenBankingSyncService(
        FundingDbContext db,
        IOpenBankingProvider openBanking,
        IFieldEncryptor encryptor,
        IOptions<OpenBankingOptions> options)
    {
        _db = db;
        _openBanking = openBanking;
        _encryptor = encryptor;
        _options = options.Value;
    }

    public async Task ConnectFromCallbackAsync(Guid applicationId, string code, CancellationToken ct = default)
    {
        var token = await _openBanking.ExchangeCodeAsync(code, ct);
        var snapshot = await _openBanking.FetchConnectionSnapshotAsync(
            token.AccessToken,
            _options.TransactionDays,
            ct);

        var institution = snapshot.Institution;
        var connection = await _db.OpenBankingConnections
            .FirstOrDefaultAsync(
                c => c.ApplicationId == applicationId && c.InstitutionId == institution.InstitutionId,
                ct);

        connection ??= new OpenBankingConnection
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            InstitutionId = institution.InstitutionId,
        };

        connection.InstitutionName = institution.InstitutionName;
        connection.AccessTokenEncrypted = EncryptAccess(token.AccessToken);
        connection.RefreshTokenEncrypted = EncryptRefresh(token.RefreshToken);
        connection.ConnectedAt = DateTime.UtcNow;
        connection.ExpiresAt = token.ExpiresAt;
        connection.AccountsJson = JsonSerializer.Serialize(snapshot.Accounts);

        if (_db.Entry(connection).State == EntityState.Detached)
            _db.OpenBankingConnections.Add(connection);

        await ClearAttestationAsync(applicationId, ct);
        await _db.SaveChangesAsync(ct);
        await RecomputeAllAsync(applicationId, ct);
    }

    public async Task RecomputeAllAsync(Guid applicationId, CancellationToken ct = default)
    {
        var connections = await _db.OpenBankingConnections
            .Where(c => c.ApplicationId == applicationId)
            .ToListAsync(ct);

        if (connections.Count == 0)
        {
            await RemoveMetricsAsync(applicationId, ct);
            await UnlockProfileBandsAsync(applicationId, ct);
            await _db.SaveChangesAsync(ct);
            return;
        }

        var periodEnd = DateOnly.FromDateTime(DateTime.UtcNow);
        var periodStart = periodEnd.AddDays(-Math.Max(1, _options.TransactionDays));

        decimal totalBalance = 0m;
        decimal totalCredits = 0m;
        decimal totalDebits = 0m;
        var accountCount = 0;
        var transactionCount = 0;
        var hasNonGbpAccounts = false;

        foreach (var connection in connections)
        {
            var accessToken = DecryptAccess(connection.AccessTokenEncrypted);
            var snapshot = await _openBanking.FetchConnectionSnapshotAsync(
                accessToken,
                _options.TransactionDays,
                ct);

            connection.AccountsJson = JsonSerializer.Serialize(snapshot.Accounts);

            foreach (var account in snapshot.Accounts)
            {
                accountCount++;
                if (!IsGbp(account.Currency))
                {
                    hasNonGbpAccounts = true;
                    continue;
                }

                totalBalance += account.CurrentBalance;
            }

            foreach (var transaction in snapshot.Transactions)
            {
                if (!IsGbp(transaction.Currency))
                {
                    hasNonGbpAccounts = true;
                    continue;
                }

                transactionCount++;
                if (transaction.Amount > 0m)
                    totalCredits += transaction.Amount;
                else
                    totalDebits += Math.Abs(transaction.Amount);
            }
        }

        var metrics = await UpsertMetricsAsync(
            applicationId,
            periodStart,
            periodEnd,
            connections.Count,
            accountCount,
            totalBalance,
            totalCredits,
            totalDebits,
            transactionCount,
            hasNonGbpAccounts,
            ct);

        var profile = await _db.FinancialProfiles
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct)
            ?? new FinancialProfile { ApplicationId = applicationId };

        FinancialProfileService.ApplyBankingMetricsBands(profile, metrics);

        if (_db.Entry(profile).State == EntityState.Detached)
            _db.FinancialProfiles.Add(profile);

        await _db.SaveChangesAsync(ct);
    }

    public async Task ClearAttestationAsync(Guid applicationId, CancellationToken ct = default)
    {
        var attestation = await _db.BankingCompletenessAttestations
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId, ct);

        if (attestation is not null)
            _db.BankingCompletenessAttestations.Remove(attestation);
    }

    private async Task<BankingIntegrationMetrics> UpsertMetricsAsync(
        Guid applicationId,
        DateOnly periodStart,
        DateOnly periodEnd,
        int connectionCount,
        int accountCount,
        decimal totalCashBalance,
        decimal totalCredits,
        decimal totalDebits,
        int transactionCount,
        bool hasNonGbpAccounts,
        CancellationToken ct)
    {
        var mapped = BankingIntegrationMetricsMapper.FromAggregates(
            applicationId,
            periodStart,
            periodEnd,
            connectionCount,
            accountCount,
            totalCashBalance,
            totalCredits,
            totalDebits,
            transactionCount,
            hasNonGbpAccounts,
            _options.TransactionDays);

        var metrics = await _db.BankingIntegrationMetrics
            .FirstOrDefaultAsync(m => m.ApplicationId == applicationId, ct);

        if (metrics is null)
        {
            _db.BankingIntegrationMetrics.Add(mapped);
            return mapped;
        }

        metrics.Currency = mapped.Currency;
        metrics.PeriodStart = mapped.PeriodStart;
        metrics.PeriodEnd = mapped.PeriodEnd;
        metrics.SyncedAt = mapped.SyncedAt;
        metrics.ConnectionCount = mapped.ConnectionCount;
        metrics.AccountCount = mapped.AccountCount;
        metrics.TotalCashBalance = mapped.TotalCashBalance;
        metrics.TotalCredits = mapped.TotalCredits;
        metrics.TotalDebits = mapped.TotalDebits;
        metrics.NetCashFlow = mapped.NetCashFlow;
        metrics.AvgMonthlyInflow = mapped.AvgMonthlyInflow;
        metrics.AvgMonthlyOutflow = mapped.AvgMonthlyOutflow;
        metrics.TransactionCount = mapped.TransactionCount;
        metrics.HasNonGbpAccounts = mapped.HasNonGbpAccounts;
        return metrics;
    }

    private async Task RemoveMetricsAsync(Guid applicationId, CancellationToken ct)
    {
        var metrics = await _db.BankingIntegrationMetrics
            .FirstOrDefaultAsync(m => m.ApplicationId == applicationId, ct);

        if (metrics is not null)
            _db.BankingIntegrationMetrics.Remove(metrics);
    }

    private async Task UnlockProfileBandsAsync(Guid applicationId, CancellationToken ct)
    {
        var profile = await _db.FinancialProfiles
            .FirstOrDefaultAsync(f => f.ApplicationId == applicationId, ct);

        if (profile is null)
            return;

        profile.BandsLockedByIntegration = false;
        profile.UpdatedAt = DateTime.UtcNow;
    }

    private static bool IsGbp(string currency) =>
        string.Equals(currency, "GBP", StringComparison.OrdinalIgnoreCase);

    private string EncryptAccess(string accessToken) =>
        _encryptor.Encrypt(accessToken, IntegrationEncryptionPurposes.OpenBankingAccessToken);

    private string DecryptAccess(string encrypted) =>
        _encryptor.Decrypt(encrypted, IntegrationEncryptionPurposes.OpenBankingAccessToken);

    private string? EncryptRefresh(string? refreshToken) =>
        string.IsNullOrWhiteSpace(refreshToken)
            ? null
            : _encryptor.Encrypt(refreshToken, IntegrationEncryptionPurposes.OpenBankingRefreshToken);
}
