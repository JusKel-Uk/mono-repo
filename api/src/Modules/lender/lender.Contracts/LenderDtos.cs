namespace lender.Contracts;

public sealed record LenderAccessRequestAcceptedResponse(Guid RequestId);

public sealed record LenderRequestAccessRequest(
    string FirstName,
    string LastName,
    string WorkEmail,
    string Organisation,
    string? Website,
    string? Role,
    string? Message);

public sealed record LenderInvitePreviewResponse(
    string Email,
    string? FirstName,
    string? LastName,
    string OrganisationName);

public sealed record LenderCreateAccountRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string InviteToken);

public sealed record LenderCreateAccountResponse(
    Guid UserId,
    string AccessToken);

public sealed record LenderSignInRequest(string Email, string Password);

public sealed record LenderSignInResponse(
    Guid UserId,
    string AccessToken,
    string FirstName,
    string LastName);

public sealed record LenderMeResponse(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    LenderOrganisationSummaryDto Organisation);

public sealed record LenderOrganisationSummaryDto(Guid Id, string Name);

public sealed record LenderAccessRequestSummaryDto(
    Guid Id,
    LenderAccessRequestStatus Status,
    string FirstName,
    string LastName,
    string WorkEmail,
    string Organisation,
    string? Website,
    string? JobTitle,
    string? Message,
    DateTime CreatedAt,
    DateTime? ReviewedAt,
    string? RejectionReason);

public sealed record LenderRejectAccessRequest(string? Reason);
