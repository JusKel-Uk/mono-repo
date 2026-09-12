using identity.Contracts;
using identity.Core.Persistence;
using identity.Core.Services;

namespace identity.Core.Features.Organisations;

internal sealed class PreviewOrganisationInviteHandler
{
    private readonly IdentityDbContext _db;
    private readonly IOrganisationInviteTokenService _tokenService;

    public PreviewOrganisationInviteHandler(
        IdentityDbContext db,
        IOrganisationInviteTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<PreviewOrganisationInviteResponse?> HandleAsync(
        PreviewOrganisationInviteRequest request,
        CancellationToken ct = default)
    {
        var invite = await OrganisationInviteQueries.FindPendingByCodeAsync(
            _db,
            _tokenService,
            request.Code,
            ct);

        if (invite is null || string.IsNullOrWhiteSpace(invite.Email))
            return null;

        return new PreviewOrganisationInviteResponse(
            invite.Email,
            invite.Organisation.Name,
            invite.Role,
            invite.ExpiresAt);
    }
}
