using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace identity.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailOtpToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmailOtpAttempts",
                schema: "identity",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailOtpExpiresAt",
                schema: "identity",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailOtpHash",
                schema: "identity",
                table: "Users",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailVerified",
                schema: "identity",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerifiedAt",
                schema: "identity",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailOtpAttempts",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailOtpExpiresAt",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailOtpHash",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailVerified",
                schema: "identity",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailVerifiedAt",
                schema: "identity",
                table: "Users");
        }
    }
}
