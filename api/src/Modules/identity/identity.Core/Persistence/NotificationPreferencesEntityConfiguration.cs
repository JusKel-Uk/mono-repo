using identity.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace identity.Core.Persistence;

internal sealed class NotificationPreferencesEntityConfiguration
    : IEntityTypeConfiguration<NotificationPreferences>
{
    public void Configure(EntityTypeBuilder<NotificationPreferences> entity)
    {
        entity.ToTable("NotificationPreferences");
        entity.HasKey(p => p.UserId);

        entity.Property(p => p.AssessmentProgress).HasDefaultValue(true).IsRequired();
        entity.Property(p => p.SubmissionsNeedAttention).HasDefaultValue(true).IsRequired();
        entity.Property(p => p.ExpertReviewUpdates).HasDefaultValue(true).IsRequired();
        entity.Property(p => p.IntegrationSyncEvents).HasDefaultValue(true).IsRequired();
        entity.Property(p => p.ScoreUpdates).HasDefaultValue(true).IsRequired();
        entity.Property(p => p.NewFundingMatches).HasDefaultValue(true).IsRequired();
    }
}
