using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace identity.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncIdentityModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DROP INDEX IX_Users_EmailLookupHash ON [identity].[Users];");

            migrationBuilder.AlterColumn<string>(
                name: "EmailLookupHash",
                schema: "identity",
                table: "Users",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX IX_Users_EmailLookupHash
                ON [identity].[Users] (EmailLookupHash)
                WHERE EmailLookupHash IS NOT NULL AND EmailLookupHash <> ''
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DROP INDEX IX_Users_EmailLookupHash ON [identity].[Users];");

            migrationBuilder.AlterColumn<string>(
                name: "EmailLookupHash",
                schema: "identity",
                table: "Users",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX IX_Users_EmailLookupHash
                ON [identity].[Users] (EmailLookupHash)
                WHERE EmailLookupHash IS NOT NULL AND EmailLookupHash <> ''
                """);
        }
    }
}
