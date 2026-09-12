using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace identity.Core.Persistence.Migrations;

/// <inheritdoc />
public partial class AddNotificationChannelPreferences : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "EmailEnabled",
            schema: "identity",
            table: "NotificationPreferences",
            type: "bit",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "InAppEnabled",
            schema: "identity",
            table: "NotificationPreferences",
            type: "bit",
            nullable: false,
            defaultValue: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "EmailEnabled",
            schema: "identity",
            table: "NotificationPreferences");

        migrationBuilder.DropColumn(
            name: "InAppEnabled",
            schema: "identity",
            table: "NotificationPreferences");
    }
}
