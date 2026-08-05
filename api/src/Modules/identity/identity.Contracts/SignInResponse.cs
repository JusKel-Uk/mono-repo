namespace identity.Contracts;

public sealed record SignInResponse(Guid UserId, string AccessToken);