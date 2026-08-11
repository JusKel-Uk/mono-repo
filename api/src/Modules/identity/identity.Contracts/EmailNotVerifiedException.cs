namespace identity.Contracts;

public sealed class EmailNotVerifiedException : Exception
{
    public EmailNotVerifiedException(string email)
        : base("Email address is not verified. Check your inbox for the verification code.")
    {
        Email = email;
    }

    public string Email { get; }
}
