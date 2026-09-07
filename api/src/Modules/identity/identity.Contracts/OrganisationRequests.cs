namespace identity.Contracts;

public sealed record OrganisationClosureResponse(string Status, DateTime RequestedAt);

public sealed record SetCurrentOrganisationRequest(Guid OrganisationId);

public sealed record CreateOrganisationInviteRequest(string Email, OrganisationRole Role);

public sealed record CreateOrganisationInviteResponse(
    Guid InviteId,
    string Email,
    OrganisationRole Role,
    DateTime ExpiresAt,
    string AcceptToken);

public sealed record AcceptOrganisationInviteResponse(
    Guid OrganisationId,
    string OrganisationName,
    OrganisationRole Role);

public sealed record UpdateOrganisationMemberRequest(OrganisationRole Role);

public sealed record RegisterUserResponse(
    Guid UserId,
    string Email,
    bool EmailVerified,
    Guid DefaultOrganisationId);
