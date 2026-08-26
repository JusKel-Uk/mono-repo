using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace funding.Core.Migrations
{
    /// <inheritdoc />
    public partial class InitialFunding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "funding");

            migrationBuilder.CreateTable(
                name: "FinancialEvidence",
                schema: "funding",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BlobPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialEvidence", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinancialProfiles",
                schema: "funding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RevenueBand = table.Column<int>(type: "int", nullable: true),
                    EbitdaBand = table.Column<int>(type: "int", nullable: true),
                    DebtBand = table.Column<int>(type: "int", nullable: true),
                    CashReservesBand = table.Column<int>(type: "int", nullable: true),
                    MonthlyRevenueBand = table.Column<int>(type: "int", nullable: true),
                    BandsLockedByIntegration = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialProfiles", x => x.ApplicationId);
                });

            migrationBuilder.CreateTable(
                name: "FundingProfiles",
                schema: "funding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Purpose = table.Column<int>(type: "int", nullable: false),
                    TermMonths = table.Column<int>(type: "int", nullable: false),
                    Urgency = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FundingProfiles", x => x.ApplicationId);
                });

            migrationBuilder.CreateTable(
                name: "IntegrationConnections",
                schema: "funding",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<int>(type: "int", nullable: false),
                    AccessTokenEncrypted = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    RefreshTokenEncrypted = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntegrationConnections", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IntegrationConnections_ApplicationId_Provider",
                schema: "funding",
                table: "IntegrationConnections",
                columns: new[] { "ApplicationId", "Provider" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinancialEvidence",
                schema: "funding");

            migrationBuilder.DropTable(
                name: "FinancialProfiles",
                schema: "funding");

            migrationBuilder.DropTable(
                name: "FundingProfiles",
                schema: "funding");

            migrationBuilder.DropTable(
                name: "IntegrationConnections",
                schema: "funding");
        }
    }
}
