using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeeklyPlanTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPlanningDone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPlanningDone",
                table: "WeeklyPlanMembers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPlanningDone",
                table: "WeeklyPlanMembers");
        }
    }
}
