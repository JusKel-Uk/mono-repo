using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace onboarding.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyAndBusinessProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessProfiles",
                schema: "onboarding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sector = table.Column<int>(type: "int", nullable: false),
                    Region = table.Column<int>(type: "int", nullable: false),
                    EmployeeSizeBand = table.Column<int>(type: "int", nullable: false),
                    AnnualTurnoverBand = table.Column<int>(type: "int", nullable: false),
                    YearsInOperationBand = table.Column<int>(type: "int", nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Postcode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessProfiles", x => x.ApplicationId);
                    table.ForeignKey(
                        name: "FK_BusinessProfiles_Applications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalSchema: "onboarding",
                        principalTable: "Applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompanySetups",
                schema: "onboarding",
                columns: table => new
                {
                    ApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TradingName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CompaniesHouseNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsCompaniesHouseVerified = table.Column<bool>(type: "bit", nullable: false),
                    Relationship = table.Column<int>(type: "int", nullable: false),
                    Region = table.Column<int>(type: "int", nullable: false),
                    RegisteredAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RegisteredAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Postcode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EmployeeSizeBand = table.Column<int>(type: "int", nullable: false),
                    AnnualTurnoverBand = table.Column<int>(type: "int", nullable: false),
                    YearsInOperationBand = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanySetups", x => x.ApplicationId);
                    table.ForeignKey(
                        name: "FK_CompanySetups_Applications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalSchema: "onboarding",
                        principalTable: "Applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessProfiles",
                schema: "onboarding");

            migrationBuilder.DropTable(
                name: "CompanySetups",
                schema: "onboarding");
        }
    }
}
