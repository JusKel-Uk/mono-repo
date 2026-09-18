using lender.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace lender.Core.Examples;

public sealed class LenderRequestAccessRequestExample : IExamplesProvider<LenderRequestAccessRequest>
{
    public LenderRequestAccessRequest GetExamples() => new(
        "Jane",
        "Smith",
        "jane.smith@acmelending.co.uk",
        "Acme Lending Ltd",
        "https://acmelending.co.uk",
        "Head of Partnerships",
        "We would like to review SME sustainability scores for our pilot portfolio.");
}

public sealed class LenderAccessRequestAcceptedResponseExample
    : IExamplesProvider<LenderAccessRequestAcceptedResponse>
{
    public LenderAccessRequestAcceptedResponse GetExamples() =>
        new(Guid.Parse("11111111-1111-1111-1111-111111111111"));
}

public sealed class LenderInvitePreviewResponseExample : IExamplesProvider<LenderInvitePreviewResponse>
{
    public LenderInvitePreviewResponse GetExamples() => new(
        "jane.smith@acmelending.co.uk",
        "Jane",
        "Smith",
        "Acme Lending Ltd");
}

public sealed class LenderCreateAccountRequestExample : IExamplesProvider<LenderCreateAccountRequest>
{
    public LenderCreateAccountRequest GetExamples() => new(
        "Jane",
        "Smith",
        "jane.smith@acmelending.co.uk",
        "SecurePass123!@#",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
}

public sealed class LenderCreateAccountResponseExample : IExamplesProvider<LenderCreateAccountResponse>
{
    public LenderCreateAccountResponse GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example");
}

public sealed class LenderSignInRequestExample : IExamplesProvider<LenderSignInRequest>
{
    public LenderSignInRequest GetExamples() => new(
        "jane.smith@acmelending.co.uk",
        "SecurePass123!@#");
}

public sealed class LenderSignInResponseExample : IExamplesProvider<LenderSignInResponse>
{
    public LenderSignInResponse GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example",
        "Jane",
        "Smith");
}

public sealed class LenderMeResponseExample : IExamplesProvider<LenderMeResponse>
{
    public LenderMeResponse GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        "jane.smith@acmelending.co.uk",
        "Jane",
        "Smith",
        new LenderOrganisationSummaryDto(
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            "Acme Lending Ltd"));
}

public sealed class LenderAccessRequestSummaryExample : IExamplesProvider<LenderAccessRequestSummaryDto>
{
    public LenderAccessRequestSummaryDto GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        LenderAccessRequestStatus.Pending,
        "Jane",
        "Smith",
        "jane.smith@acmelending.co.uk",
        "Acme Lending Ltd",
        "https://acmelending.co.uk",
        "Head of Partnerships",
        "Pilot portfolio review.",
        DateTime.UtcNow.AddDays(-1),
        null,
        null);
}

public sealed class LenderAccessRequestListExample : IExamplesProvider<IReadOnlyList<LenderAccessRequestSummaryDto>>
{
    public IReadOnlyList<LenderAccessRequestSummaryDto> GetExamples() =>
        [new LenderAccessRequestSummaryExample().GetExamples()];
}

public sealed class LenderRejectAccessRequestExample : IExamplesProvider<LenderRejectAccessRequest>
{
    public LenderRejectAccessRequest GetExamples() => new(
        "We are onboarding lenders in phases and cannot approve this request yet.");
}
