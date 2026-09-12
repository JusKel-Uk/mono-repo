using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using notifications.Core.Persistence;

#nullable disable

namespace notifications.Core.Migrations;

[DbContext(typeof(NotificationDbContext))]
[Migration("20260912120000_InitialNotifications")]
partial class InitialNotifications
{
    /// <inheritdoc />
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasDefaultSchema("notifications")
            .HasAnnotation("ProductVersion", "10.0.0")
            .HasAnnotation("Relational:MaxIdentifierLength", 128);

        SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

        modelBuilder.Entity("notifications.Core.Entities.InboxItem", b =>
            {
                b.Property<Guid>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("uniqueidentifier");

                b.Property<string>("ActionUrl")
                    .HasMaxLength(500)
                    .HasColumnType("nvarchar(500)");

                b.Property<string>("Body")
                    .IsRequired()
                    .HasMaxLength(2000)
                    .HasColumnType("nvarchar(2000)");

                b.Property<int>("Category")
                    .HasColumnType("int");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("datetime2");

                b.Property<bool>("EmailDelivered")
                    .HasColumnType("bit");

                b.Property<bool>("InAppDelivered")
                    .HasColumnType("bit");

                b.Property<Guid>("OrganisationId")
                    .HasColumnType("uniqueidentifier");

                b.Property<bool>("Read")
                    .HasColumnType("bit");

                b.Property<DateTime?>("ReadAt")
                    .HasColumnType("datetime2");

                b.Property<string>("Title")
                    .IsRequired()
                    .HasMaxLength(200)
                    .HasColumnType("nvarchar(200)");

                b.Property<Guid>("UserId")
                    .HasColumnType("uniqueidentifier");

                b.HasKey("Id");

                b.HasIndex("UserId", "OrganisationId", "CreatedAt");

                b.HasIndex("UserId", "OrganisationId", "Read");

                b.ToTable("InboxItems", "notifications");
            });
#pragma warning restore 612, 618
    }
}
