namespace lender.Core.Options;

public sealed class LenderAdminOptions
{
    public const string SectionName = "Lender";

    public List<Guid> AdminUserIds { get; set; } = [];

    public string? AdminNotificationEmail { get; set; }
}
