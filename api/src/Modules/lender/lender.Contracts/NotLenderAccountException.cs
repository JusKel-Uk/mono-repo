namespace lender.Contracts;

public sealed class NotLenderAccountException : Exception
{
    public NotLenderAccountException()
        : base("This account is not registered for the lender portal. Use SME sign-in instead.")
    {
    }
}
