using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace identity.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSettingsIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AccountClosureRequestedAt",
                schema: "identity",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JobTitle",
                schema: "identity",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                schema: "identity",
                table: "Users",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuthSessions",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Jti = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DeviceLabel = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                schema: "identity",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssessmentProgress = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    SubmissionsNeedAttention = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ExpertReviewUpdates = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IntegrationSyncEvents = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ScoreUpdates = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    NewFundingMatches = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetRequests",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OtpHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    OtpExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OtpAttempts = table.Column<int>(type: "int", nullable: false),
                    ResetTokenHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ResetTokenExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConsumedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetRequests", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_Jti",
                schema: "identity",
                table: "AuthSessions",
                column: "Jti",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_UserId",
                schema: "identity",
                table: "AuthSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetRequests_UserId",
                schema: "identity",
                table: "PasswordResetRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuthSessions",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "NotificationPreferences",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "PasswordResetRequests",
                schema: "identity");

            migrationBuilder.DropColumn(
                name: "AccountClosureRequestedAt",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "JobTitle",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Phone",
                schema: "identity",
                table: "Users");
        }
    }
}
