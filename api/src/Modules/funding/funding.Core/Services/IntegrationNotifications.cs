using notifications.Contracts;
using onboarding.Contracts;

namespace funding.Core.Services;

internal sealed class IntegrationNotifications
{
    private readonly INotificationModule _notifications;
    private readonly IOnboardingModule _onboarding;

    public IntegrationNotifications(
        INotificationModule notifications,
        IOnboardingModule onboarding)
    {
        _notifications = notifications;
        _onboarding = onboarding;
    }

    public async Task NotifySyncAsync(
        Guid userId,
        Guid applicationId,
        string providerLabel,
        CancellationToken ct)
    {
        var organisationId = await _onboarding.GetOrganisationIdForApplicationAsync(applicationId, ct);
        if (organisationId is null)
            return;

        await _notifications.NotifyAsync(
            ProductNotifications.Integration(
                userId,
                organisationId.Value,
                $"{providerLabel} sync completed",
                "Your financial data imported successfully.",
                "/sme/assessment"),
            ct);
    }

    public Task NotifyRevokedAsync(
        Guid userId,
        Guid organisationId,
        string providerLabel,
        CancellationToken ct) =>
        _notifications.NotifyAsync(
            ProductNotifications.Integration(
                userId,
                organisationId,
                $"{providerLabel} access was revoked",
                "Reconnect to keep your accounting data, documents, and reports updated. Your existing evidence stays safe.",
                "/sme/assessment"),
            ct);

    public static string ProviderLabel(funding.Contracts.IntegrationProvider provider) => provider switch
    {
        funding.Contracts.IntegrationProvider.Xero => "Xero",
        funding.Contracts.IntegrationProvider.QuickBooks => "QuickBooks",
        funding.Contracts.IntegrationProvider.OpenBanking => "Open Banking",
        _ => provider.ToString(),
    };
}
