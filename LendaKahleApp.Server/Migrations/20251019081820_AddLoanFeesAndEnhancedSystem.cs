using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LendaKahleApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLoanFeesAndEnhancedSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "InitiationFee",
                table: "Loans",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyCreditLifePremium",
                table: "Loans",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyServiceFee",
                table: "Loans",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalFees",
                table: "Loans",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalInterest",
                table: "Loans",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitiationFee",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "MonthlyCreditLifePremium",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "MonthlyServiceFee",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "TotalFees",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "TotalInterest",
                table: "Loans");
        }
    }
}
