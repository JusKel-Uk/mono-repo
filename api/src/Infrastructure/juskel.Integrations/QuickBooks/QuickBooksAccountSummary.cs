namespace juskel.Integrations.QuickBooks;

public sealed record QuickBooksAccountSummary(
    string? AccountType,
    string? AccountSubType,
    string? Classification,
    decimal CurrentBalance);
