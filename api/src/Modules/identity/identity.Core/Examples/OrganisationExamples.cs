using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class OrganisationSummaryExample : IExamplesProvider<OrganisationSummaryDto>
{
    public OrganisationSummaryDto GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        "JusKel E2E Ltd",
        OrganisationRole.Owner,
        false,
        true);
}

public sealed class OrganisationSummaryListExample : IExamplesProvider<IReadOnlyList<OrganisationSummaryDto>>
{
    public IReadOnlyList<OrganisationSummaryDto> GetExamples() =>
        [new OrganisationSummaryExample().GetExamples()];
}

public sealed class SetCurrentOrganisationRequestExample : IExamplesProvider<SetCurrentOrganisationRequest>
{
    public SetCurrentOrganisationRequest GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"));
}

public sealed class OrganisationMemberExample : IExamplesProvider<OrganisationMemberDto>
{
    public OrganisationMemberDto GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "hello@example.com",
        "Ada",
        "Lovelace",
        OrganisationRole.Admin,
        DateTime.Parse("2026-01-15T10:00:00Z"));
}

public sealed class OrganisationMemberListExample : IExamplesProvider<IReadOnlyList<OrganisationMemberDto>>
{
    public IReadOnlyList<OrganisationMemberDto> GetExamples() =>
        [new OrganisationMemberExample().GetExamples()];
}

public sealed class CreateOrganisationInviteRequestExample : IExamplesProvider<CreateOrganisationInviteRequest>
{
    public CreateOrganisationInviteRequest GetExamples() => new(
        "teammate@example.com",
        OrganisationRole.Contributor);
}

public sealed class CreateOrganisationInviteResponseExample : IExamplesProvider<CreateOrganisationInviteResponse>
{
    public CreateOrganisationInviteResponse GetExamples() => new(
        Guid.Parse("33333333-3333-3333-3333-333333333333"),
        "teammate@example.com",
        OrganisationRole.Contributor,
        DateTime.Parse("2026-01-22T10:00:00Z"),
        "invite-token-example");
}

public sealed class AcceptOrganisationInviteResponseExample : IExamplesProvider<AcceptOrganisationInviteResponse>
{
    public AcceptOrganisationInviteResponse GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        "JusKel E2E Ltd",
        OrganisationRole.Contributor);
}

public sealed class UpdateOrganisationMemberRequestExample : IExamplesProvider<UpdateOrganisationMemberRequest>
{
    public UpdateOrganisationMemberRequest GetExamples() => new(OrganisationRole.Admin);
}

public sealed class OrganisationClosureResponseExample : IExamplesProvider<OrganisationClosureResponse>
{
    public OrganisationClosureResponse GetExamples() => new(
        "requested",
        DateTime.Parse("2026-01-20T12:00:00Z"));
}
