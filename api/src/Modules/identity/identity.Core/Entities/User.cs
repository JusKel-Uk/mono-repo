namespace identity.Core.Entities;

internal sealed class User
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? JobTitle { get; set; }

    public string? Phone { get; set; }

    public Guid? LastOrganisationId { get; set; }

    public Organisation? LastOrganisation { get; set; }

    public string Email { get; set; } = string.Empty;

    public string EmailLookupHash { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime? LastPasswordChangeAt { get; set; }

    public bool EmailVerified { get; set; }

    public DateTime? EmailVerifiedAt { get; set; }

    public string? EmailOtpHash { get; set; }

    public DateTime? EmailOtpExpiresAt { get; set; }

    public int EmailOtpAttempts { get; set; }
}