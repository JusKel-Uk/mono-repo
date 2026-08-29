using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace scoring.Core.Migrations
{
    /// <inheritdoc />
    public partial class AlignSustainabilityProfileWithFrontend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [scoring].[SustainabilityEvidence];");
            migrationBuilder.Sql("DELETE FROM [scoring].[SustainabilityProfiles];");

            migrationBuilder.DropColumn(
                name: "EnergyEfficiency",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "WasteReduction",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "CarbonFootprint",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "SustainableSourcing",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "WaterConservation",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "EmployeeWellbeing",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "CommunityEngagement",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "EthicalGovernance",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "EnvironmentalCertification",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.AddColumn<int>(
                name: "GhgEmissions",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SustainabilityPolicy",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ResourceTracking",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Wellbeing",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Training",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Dei",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Continuity",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GovernancePolicies",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RiskReview",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [scoring].[SustainabilityEvidence];");
            migrationBuilder.Sql("DELETE FROM [scoring].[SustainabilityProfiles];");

            migrationBuilder.DropColumn(
                name: "GhgEmissions",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "SustainabilityPolicy",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "ResourceTracking",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "Wellbeing",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "Training",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "Dei",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "Continuity",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "GovernancePolicies",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.DropColumn(
                name: "RiskReview",
                schema: "scoring",
                table: "SustainabilityProfiles");

            migrationBuilder.AddColumn<int>(
                name: "EnergyEfficiency",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WasteReduction",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CarbonFootprint",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SustainableSourcing",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WaterConservation",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EmployeeWellbeing",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CommunityEngagement",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EthicalGovernance",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EnvironmentalCertification",
                schema: "scoring",
                table: "SustainabilityProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
