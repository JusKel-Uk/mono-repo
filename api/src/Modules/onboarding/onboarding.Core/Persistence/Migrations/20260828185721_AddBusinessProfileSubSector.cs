using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace onboarding.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessProfileSubSector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubSector",
                schema: "onboarding",
                table: "BusinessProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubSector",
                schema: "onboarding",
                table: "BusinessProfiles");
        }
    }
}
