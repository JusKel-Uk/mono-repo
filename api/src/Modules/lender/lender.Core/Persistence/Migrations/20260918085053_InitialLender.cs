using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lender.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialLender : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "lender");

            migrationBuilder.CreateTable(
                name: "LenderOrganisations",
                schema: "lender",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Website = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LenderOrganisations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LenderAccessRequests",
                schema: "lender",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                    WorkEmail = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                    WorkEmailLookupHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Organisation = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                    Website = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    JobTitle = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LenderOrganisationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LenderAccessRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LenderAccessRequests_LenderOrganisations_LenderOrganisationId",
                        column: x => x.LenderOrganisationId,
                        principalSchema: "lender",
                        principalTable: "LenderOrganisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LenderMembers",
                schema: "lender",
                columns: table => new
                {
                    LenderOrganisationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LenderMembers", x => new { x.LenderOrganisationId, x.UserId });
                    table.ForeignKey(
                        name: "FK_LenderMembers_LenderOrganisations_LenderOrganisationId",
                        column: x => x.LenderOrganisationId,
                        principalSchema: "lender",
                        principalTable: "LenderOrganisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LenderInvites",
                schema: "lender",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccessRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LenderOrganisationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmailLookupHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LenderInvites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LenderInvites_LenderAccessRequests_AccessRequestId",
                        column: x => x.AccessRequestId,
                        principalSchema: "lender",
                        principalTable: "LenderAccessRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LenderInvites_LenderOrganisations_LenderOrganisationId",
                        column: x => x.LenderOrganisationId,
                        principalSchema: "lender",
                        principalTable: "LenderOrganisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LenderAccessRequests_LenderOrganisationId",
                schema: "lender",
                table: "LenderAccessRequests",
                column: "LenderOrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_LenderAccessRequests_Status",
                schema: "lender",
                table: "LenderAccessRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_LenderAccessRequests_WorkEmailLookupHash",
                schema: "lender",
                table: "LenderAccessRequests",
                column: "WorkEmailLookupHash");

            migrationBuilder.CreateIndex(
                name: "IX_LenderInvites_AccessRequestId",
                schema: "lender",
                table: "LenderInvites",
                column: "AccessRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_LenderInvites_LenderOrganisationId",
                schema: "lender",
                table: "LenderInvites",
                column: "LenderOrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_LenderInvites_TokenHash",
                schema: "lender",
                table: "LenderInvites",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LenderMembers_UserId",
                schema: "lender",
                table: "LenderMembers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LenderInvites",
                schema: "lender");

            migrationBuilder.DropTable(
                name: "LenderMembers",
                schema: "lender");

            migrationBuilder.DropTable(
                name: "LenderAccessRequests",
                schema: "lender");

            migrationBuilder.DropTable(
                name: "LenderOrganisations",
                schema: "lender");
        }
    }
}
