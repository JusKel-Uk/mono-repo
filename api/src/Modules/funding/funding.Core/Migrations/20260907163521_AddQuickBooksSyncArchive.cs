using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace funding.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddQuickBooksSyncArchive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuickBooksSyncArchive",
                schema: "funding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExternalRealmId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    CompanyInfoJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProfitAndLossJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProfitAndLossPriorJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BalanceSheetJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AgedReceivablesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AgedPayablesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CashFlowJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtendedSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuickBooksSyncArchive", x => x.ApplicationId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuickBooksSyncArchive",
                schema: "funding");
        }
    }
}
