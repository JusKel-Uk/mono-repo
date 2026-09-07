using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace identity.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganisationEmailDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailDomain",
                schema: "identity",
                table: "Organisations",
                type: "nvarchar(253)",
                maxLength: 253,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE o
                SET EmailDomain = LOWER(SUBSTRING(u.Email, CHARINDEX('@', u.Email) + 1, LEN(u.Email)))
                FROM [identity].[Organisations] o
                INNER JOIN [identity].[OrganisationMembers] m
                    ON m.OrganisationId = o.Id AND m.Role = 0
                INNER JOIN [identity].[Users] u
                    ON u.Id = m.UserId
                WHERE o.EmailDomain IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "EmailDomain",
                schema: "identity",
                table: "Organisations",
                type: "nvarchar(253)",
                maxLength: 253,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(253)",
                oldMaxLength: 253,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailDomain",
                schema: "identity",
                table: "Organisations");
        }
    }
}
