using identity.Contracts;
using identity.Core.Services;

namespace identity.Core.Features.SignIn;

internal sealed class SignInHandler
{
    private readonly IIdentityAuthService _authService;

    public SignInHandler(IIdentityAuthService authService)
    {
        _authService = authService;
    }

    public async Task<SignInResponse> HandleAsync(
        SignInCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
            throw new ArgumentException("Email is required.", nameof(command.Email));

        if (string.IsNullOrWhiteSpace(command.Password))
            throw new ArgumentException("Password is required.", nameof(command.Password));

        var credentials = await _authService.ValidateCredentialsAsync(
            command.Email,
            command.Password,
            ct);

        if (credentials is null)
            throw new ArgumentException("Invalid email or password.");

        if (!credentials.EmailVerified)
            throw new EmailNotVerifiedException(credentials.Email);

        var session = await _authService.CreateSessionAsync(
            new CreateSessionCommand(
                credentials.UserId,
                credentials.Email,
                PortalNames.Sme,
                command.UserAgent,
                command.IpAddress),
            ct);

        return new SignInResponse(
            session.UserId,
            session.AccessToken,
            session.FirstName,
            session.LastName);
    }
}
