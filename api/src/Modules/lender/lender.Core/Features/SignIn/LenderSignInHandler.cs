using identity.Contracts;
using lender.Contracts;
using lender.Core.Persistence;
using Microsoft.EntityFrameworkCore;

namespace lender.Core.Features.SignIn;

internal sealed class LenderSignInHandler
{
    private readonly LenderDbContext _db;
    private readonly IIdentityAuthService _identityAuth;

    public LenderSignInHandler(LenderDbContext db, IIdentityAuthService identityAuth)
    {
        _db = db;
        _identityAuth = identityAuth;
    }

    public async Task<LenderSignInResponse> HandleAsync(
        LenderSignInRequest request,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.");

        var credentials = await _identityAuth.ValidateCredentialsAsync(
            request.Email,
            request.Password,
            ct);

        if (credentials is null)
            throw new ArgumentException("Invalid email or password.");

        if (!credentials.EmailVerified)
            throw new EmailNotVerifiedException(credentials.Email);

        var isLender = await _db.LenderMembers
            .AsNoTracking()
            .AnyAsync(m => m.UserId == credentials.UserId, ct);

        if (!isLender)
            throw new NotLenderAccountException();

        var session = await _identityAuth.CreateSessionAsync(
            new CreateSessionCommand(
                credentials.UserId,
                credentials.Email,
                PortalNames.Lender,
                userAgent,
                ipAddress),
            ct);

        return new LenderSignInResponse(
            session.UserId,
            session.AccessToken,
            session.FirstName,
            session.LastName);
    }
}
