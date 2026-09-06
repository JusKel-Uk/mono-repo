using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class SessionListResponseExample : IExamplesProvider<SessionListResponse>
{
    public SessionListResponse GetExamples() => new(
    [
        new SessionDto(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            "Chrome on macOS",
            DateTime.Parse("2026-09-06T18:00:00Z").ToUniversalTime(),
            DateTime.Parse("2026-09-06T19:00:00Z").ToUniversalTime(),
            true),
        new SessionDto(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Safari on iOS",
            DateTime.Parse("2026-09-04T12:00:00Z").ToUniversalTime(),
            DateTime.Parse("2026-09-04T13:00:00Z").ToUniversalTime(),
            false)
    ]);
}
