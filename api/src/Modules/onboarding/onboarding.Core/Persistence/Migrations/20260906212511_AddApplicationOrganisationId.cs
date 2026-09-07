using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace onboarding.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationOrganisationId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Applications_UserId",
                schema: "onboarding",
                table: "Applications");

            migrationBuilder.AddColumn<Guid>(
                name: "OrganisationId",
                schema: "onboarding",
                table: "Applications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE a
                SET OrganisationId = m.OrganisationId
                FROM [onboarding].[Applications] a
                INNER JOIN [identity].[OrganisationMembers] m
                    ON m.UserId = a.UserId AND m.Role = 0;

                UPDATE a
                SET OrganisationId = u.LastOrganisationId
                FROM [onboarding].[Applications] a
                INNER JOIN [identity].[Users] u ON u.Id = a.UserId
                WHERE a.OrganisationId IS NULL AND u.LastOrganisationId IS NOT NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "OrganisationId",
                schema: "onboarding",
                table: "Applications",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Applications_OrganisationId",
                schema: "onboarding",
                table: "Applications",
                column: "OrganisationId",
                unique: true,
                filter: "[Status] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_UserId",
                schema: "onboarding",
                table: "Applications",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Applications_OrganisationId",
                schema: "onboarding",
                table: "Applications");

            migrationBuilder.DropIndex(
                name: "IX_Applications_UserId",
                schema: "onboarding",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "OrganisationId",
                schema: "onboarding",
                table: "Applications");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_UserId",
                schema: "onboarding",
                table: "Applications",
                column: "UserId",
                unique: true,
                filter: "[Status] = 0");
        }
    }
}
