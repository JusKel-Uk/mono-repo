using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace funding.Core.Migrations
{
    /// <inheritdoc />
    public partial class AlignFinancialProfileWithFrontend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [funding].[FinancialProfiles];");

            migrationBuilder.DropColumn(
                name: "RevenueBand",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "DebtBand",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "CashReservesBand",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "MonthlyRevenueBand",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.AddColumn<int>(
                name: "AnnualRevenueBand",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExistingDebtBand",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CashReserves",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AvgMonthlyRevenue",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [funding].[FinancialProfiles];");

            migrationBuilder.DropColumn(
                name: "AnnualRevenueBand",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "ExistingDebtBand",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "CashReserves",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "AvgMonthlyRevenue",
                schema: "funding",
                table: "FinancialProfiles");

            migrationBuilder.AddColumn<int>(
                name: "RevenueBand",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DebtBand",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CashReservesBand",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MonthlyRevenueBand",
                schema: "funding",
                table: "FinancialProfiles",
                type: "int",
                nullable: true);
        }
    }
}
