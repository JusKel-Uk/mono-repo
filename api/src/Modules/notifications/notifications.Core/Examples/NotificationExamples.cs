using identity.Contracts;
using notifications.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace notifications.Core.Examples;

public sealed class InboxItemDtoExample : IExamplesProvider<InboxItemDto>
{
    public InboxItemDto GetExamples() => new(
        Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "2 new funding matches",
        "FUNDING MATCH",
        "Lloyds Clean Growth and Innovate UK Smart Grants added to your list.",
        DateTime.Parse("2026-09-10T10:00:00Z").ToUniversalTime(),
        false,
        "/sme/funding-matches");
}

public sealed class InboxListResponseExample : IExamplesProvider<InboxListResponse>
{
    public InboxListResponse GetExamples() => new(
    [
        new InboxItemDto(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            "2 new funding matches",
            "FUNDING MATCH",
            "Lloyds Clean Growth and Innovate UK Smart Grants added to your list.",
            DateTime.Parse("2026-09-10T10:00:00Z").ToUniversalTime(),
            false,
            "/sme/funding-matches"),
        new InboxItemDto(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Xero access was revoked",
            "INTEGRATION",
            "Reconnect to keep your accounting data, documents, and reports updated. Your existing evidence stays safe.",
            DateTime.Parse("2026-09-09T10:00:00Z").ToUniversalTime(),
            true,
            null),
    ]);
}

public sealed class UnreadCountResponseExample : IExamplesProvider<UnreadCountResponse>
{
    public UnreadCountResponse GetExamples() => new(2);
}

public sealed class NotificationPreferencesExample : IExamplesProvider<NotificationPreferencesDto>
{
    public NotificationPreferencesDto GetExamples() => NotificationPreferencesDto.AllEnabled;
}
