namespace identity.Core.Features.SignIn;

public sealed record SignInCommand(string Email, string Password);