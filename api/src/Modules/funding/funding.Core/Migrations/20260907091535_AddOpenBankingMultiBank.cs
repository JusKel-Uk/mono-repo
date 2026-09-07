using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace funding.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddOpenBankingMultiBank : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BankingCompletenessAttestations",
                schema: "funding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AttestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AttestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AllRelevantAccountsConnected = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankingCompletenessAttestations", x => x.ApplicationId);
                });

            migrationBuilder.CreateTable(
                name: "BankingIntegrationMetrics",
                schema: "funding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    PeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConnectionCount = table.Column<int>(type: "int", nullable: false),
                    AccountCount = table.Column<int>(type: "int", nullable: false),
                    TotalCashBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalCredits = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalDebits = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NetCashFlow = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AvgMonthlyInflow = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AvgMonthlyOutflow = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TransactionCount = table.Column<int>(type: "int", nullable: false),
                    HasNonGbpAccounts = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankingIntegrationMetrics", x => x.ApplicationId);
                });

            migrationBuilder.CreateTable(
                name: "OpenBankingConnections",
                schema: "funding",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InstitutionId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    InstitutionName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ExternalConnectionId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    AccessTokenEncrypted = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    RefreshTokenEncrypted = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AccountsJson = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpenBankingConnections", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OpenBankingConnections_ApplicationId_InstitutionId",
                schema: "funding",
                table: "OpenBankingConnections",
                columns: new[] { "ApplicationId", "InstitutionId" },
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO funding.OpenBankingConnections (
                    Id,
                    ApplicationId,
                    InstitutionId,
                    InstitutionName,
                    ExternalConnectionId,
                    AccessTokenEncrypted,
                    RefreshTokenEncrypted,
                    ConnectedAt,
                    ExpiresAt,
                    AccountsJson)
                SELECT
                    NEWID(),
                    ApplicationId,
                    N'legacy',
                    N'Legacy Open Banking Connection',
                    ExternalRealmId,
                    AccessTokenEncrypted,
                    RefreshTokenEncrypted,
                    ConnectedAt,
                    ExpiresAt,
                    N'[]'
                FROM funding.IntegrationConnections
                WHERE Provider = 1;

                DELETE FROM funding.IntegrationConnections WHERE Provider = 1;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BankingCompletenessAttestations",
                schema: "funding");

            migrationBuilder.DropTable(
                name: "BankingIntegrationMetrics",
                schema: "funding");

            migrationBuilder.DropTable(
                name: "OpenBankingConnections",
                schema: "funding");
        }
    }
}
