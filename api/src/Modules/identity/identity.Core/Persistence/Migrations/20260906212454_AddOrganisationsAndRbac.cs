using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace identity.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganisationsAndRbac : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LastOrganisationId",
                schema: "identity",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Organisations",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosureRequestedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organisations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrganisationInvites",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmailLookupHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InvitedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganisationInvites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrganisationInvites_Organisations_OrganisationId",
                        column: x => x.OrganisationId,
                        principalSchema: "identity",
                        principalTable: "Organisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrganisationMembers",
                schema: "identity",
                columns: table => new
                {
                    OrganisationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganisationMembers", x => new { x.OrganisationId, x.UserId });
                    table.ForeignKey(
                        name: "FK_OrganisationMembers_Organisations_OrganisationId",
                        column: x => x.OrganisationId,
                        principalSchema: "identity",
                        principalTable: "Organisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrganisationMembers_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "identity",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_LastOrganisationId",
                schema: "identity",
                table: "Users",
                column: "LastOrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_OrganisationInvites_OrganisationId_EmailLookupHash",
                schema: "identity",
                table: "OrganisationInvites",
                columns: new[] { "OrganisationId", "EmailLookupHash" });

            migrationBuilder.CreateIndex(
                name: "IX_OrganisationInvites_TokenHash",
                schema: "identity",
                table: "OrganisationInvites",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganisationMembers_UserId",
                schema: "identity",
                table: "OrganisationMembers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Organisations_LastOrganisationId",
                schema: "identity",
                table: "Users",
                column: "LastOrganisationId",
                principalSchema: "identity",
                principalTable: "Organisations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.Sql("""
                DECLARE @UserId uniqueidentifier;
                DECLARE @Closure datetime2;
                DECLARE @OrgId uniqueidentifier;
                DECLARE @Name nvarchar(200);

                DECLARE user_cursor CURSOR LOCAL FAST_FORWARD FOR
                SELECT Id, AccountClosureRequestedAt
                FROM [identity].[Users]
                WHERE DeletedAt IS NULL;

                OPEN user_cursor;
                FETCH NEXT FROM user_cursor INTO @UserId, @Closure;

                WHILE @@FETCH_STATUS = 0
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM [identity].[OrganisationMembers] WHERE UserId = @UserId)
                    BEGIN
                        SET @OrgId = NEWID();
                        SET @Name = NULL;

                        SELECT TOP 1 @Name = cs.LegalName
                        FROM [onboarding].[Applications] a
                        INNER JOIN [onboarding].[CompanySetups] cs ON cs.ApplicationId = a.Id
                        WHERE a.UserId = @UserId AND cs.LegalName IS NOT NULL
                        ORDER BY a.CreatedAt DESC;

                        IF @Name IS NULL
                            SET @Name = CONCAT('Organisation ', LEFT(CAST(@UserId AS nvarchar(36)), 8));

                        INSERT INTO [identity].[Organisations] (Id, Name, CreatedAt, UpdatedAt, ClosureRequestedAt)
                        VALUES (@OrgId, @Name, SYSUTCDATETIME(), SYSUTCDATETIME(), @Closure);

                        INSERT INTO [identity].[OrganisationMembers] (OrganisationId, UserId, Role, JoinedAt)
                        VALUES (@OrgId, @UserId, 0, SYSUTCDATETIME());

                        UPDATE [identity].[Users]
                        SET LastOrganisationId = @OrgId
                        WHERE Id = @UserId;
                    END

                    FETCH NEXT FROM user_cursor INTO @UserId, @Closure;
                END

                CLOSE user_cursor;
                DEALLOCATE user_cursor;
                """);

            migrationBuilder.DropColumn(
                name: "AccountClosureRequestedAt",
                schema: "identity",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Organisations_LastOrganisationId",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropTable(
                name: "OrganisationInvites",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "OrganisationMembers",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Organisations",
                schema: "identity");

            migrationBuilder.DropIndex(
                name: "IX_Users_LastOrganisationId",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastOrganisationId",
                schema: "identity",
                table: "Users");

            migrationBuilder.AddColumn<DateTime>(
                name: "AccountClosureRequestedAt",
                schema: "identity",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }
    }
}
