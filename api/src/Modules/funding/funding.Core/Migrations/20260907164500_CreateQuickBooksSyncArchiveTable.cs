using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace funding.Core.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// Idempotent follow-up for databases that applied an earlier empty AddQuickBooksSyncArchive migration.
    /// </remarks>
    public partial class CreateQuickBooksSyncArchiveTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[funding].[QuickBooksSyncArchive]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [funding].[QuickBooksSyncArchive] (
                        [ApplicationId] uniqueidentifier NOT NULL,
                        [ExternalRealmId] nvarchar(64) NOT NULL,
                        [SyncedAt] datetime2 NOT NULL,
                        [PeriodStart] date NOT NULL,
                        [PeriodEnd] date NOT NULL,
                        [CompanyInfoJson] nvarchar(max) NULL,
                        [ProfitAndLossJson] nvarchar(max) NULL,
                        [ProfitAndLossPriorJson] nvarchar(max) NULL,
                        [BalanceSheetJson] nvarchar(max) NULL,
                        [AgedReceivablesJson] nvarchar(max) NULL,
                        [AgedPayablesJson] nvarchar(max) NULL,
                        [CashFlowJson] nvarchar(max) NULL,
                        [AccountsJson] nvarchar(max) NULL,
                        [ExtendedSnapshotJson] nvarchar(max) NULL,
                        CONSTRAINT [PK_QuickBooksSyncArchive] PRIMARY KEY ([ApplicationId])
                    );
                END
                """);
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
