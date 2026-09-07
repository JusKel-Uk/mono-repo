namespace identity.Contracts;

public sealed record OrganisationSummaryDto(
    Guid Id,
    string Name,
    OrganisationRole Role,
    bool IsClosed,
    bool IsCurrent);

public sealed record OrganisationAccessDto(
    Guid OrganisationId,
    string OrganisationName,
    OrganisationRole Role,
    bool IsClosed,
    bool CanWrite,
    bool CanSubmit,
    bool CanManageTeam,
    bool CanClose)
{
    public static OrganisationAccessDto Create(
        Guid organisationId,
        string organisationName,
        OrganisationRole role,
        bool isClosed) =>
        new(
            organisationId,
            organisationName,
            role,
            isClosed,
            !isClosed && OrganisationPermissions.CanWrite(role),
            !isClosed && OrganisationPermissions.CanSubmit(role),
            !isClosed && OrganisationPermissions.CanManageTeam(role),
            !isClosed && OrganisationPermissions.CanCloseOrganisation(role));
}

public sealed record OrganisationMemberDto(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    OrganisationRole Role,
    DateTime JoinedAt);

public sealed record OrganisationInviteDto(
    Guid Id,
    string Email,
    OrganisationRole Role,
    DateTime ExpiresAt,
    DateTime CreatedAt);

public enum OrganisationResolutionStatus
{
    Success,
    ContextRequired,
    Forbidden,
    OrganisationClosed,
}

public sealed record OrganisationResolutionResult(
    OrganisationResolutionStatus Status,
    OrganisationAccessDto? Access = null);
