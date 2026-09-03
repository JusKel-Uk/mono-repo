using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace funding.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddQuickBooksConnectionMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalRealmId",
                schema: "funding",
                table: "IntegrationConnections",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderMetadataJson",
                schema: "funding",
                table: "IntegrationConnections",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalRealmId",
                schema: "funding",
                table: "IntegrationConnections");

            migrationBuilder.DropColumn(
                name: "ProviderMetadataJson",
                schema: "funding",
                table: "IntegrationConnections");
        }
    }
}
