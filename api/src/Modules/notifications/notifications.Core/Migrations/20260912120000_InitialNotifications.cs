using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace notifications.Core.Migrations;

/// <inheritdoc />
public partial class InitialNotifications : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "notifications");

        migrationBuilder.CreateTable(
            name: "InboxItems",
            schema: "notifications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrganisationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Category = table.Column<int>(type: "int", nullable: false),
                Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Body = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                ActionUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                Read = table.Column<bool>(type: "bit", nullable: false),
                ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                InAppDelivered = table.Column<bool>(type: "bit", nullable: false),
                EmailDelivered = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_InboxItems", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_InboxItems_UserId_OrganisationId_CreatedAt",
            schema: "notifications",
            table: "InboxItems",
            columns: new[] { "UserId", "OrganisationId", "CreatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_InboxItems_UserId_OrganisationId_Read",
            schema: "notifications",
            table: "InboxItems",
            columns: new[] { "UserId", "OrganisationId", "Read" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "InboxItems", schema: "notifications");
    }
}
