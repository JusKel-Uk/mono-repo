using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace scoring.Core.Migrations
{
    /// <inheritdoc />
    public partial class InitialScoring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "scoring");

            migrationBuilder.CreateTable(
                name: "SustainabilityEvidence",
                schema: "scoring",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionKey = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BlobPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SustainabilityEvidence", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SustainabilityProfiles",
                schema: "scoring",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EnergyEfficiency = table.Column<int>(type: "int", nullable: false),
                    WasteReduction = table.Column<int>(type: "int", nullable: false),
                    CarbonFootprint = table.Column<int>(type: "int", nullable: false),
                    SustainableSourcing = table.Column<int>(type: "int", nullable: false),
                    WaterConservation = table.Column<int>(type: "int", nullable: false),
                    EmployeeWellbeing = table.Column<int>(type: "int", nullable: false),
                    CommunityEngagement = table.Column<int>(type: "int", nullable: false),
                    EthicalGovernance = table.Column<int>(type: "int", nullable: false),
                    EnvironmentalCertification = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SustainabilityProfiles", x => x.ApplicationId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SustainabilityEvidence_ApplicationId_QuestionKey",
                schema: "scoring",
                table: "SustainabilityEvidence",
                columns: new[] { "ApplicationId", "QuestionKey" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SustainabilityEvidence",
                schema: "scoring");

            migrationBuilder.DropTable(
                name: "SustainabilityProfiles",
                schema: "scoring");
        }
    }
}
