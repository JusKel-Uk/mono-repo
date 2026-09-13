using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace onboarding.Core.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenumberPublishedStatusForInReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Published was 2; InReview now occupies 2 and Published is 3.
            migrationBuilder.Sql("""
                UPDATE [onboarding].[Applications]
                SET [Status] = 3
                WHERE [Status] = 2;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE [onboarding].[Applications]
                SET [Status] = 2
                WHERE [Status] = 3;
                """);
        }
    }
}
