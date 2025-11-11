using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LendaKahleApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaxLoanAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MaxLoanTermMonths = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedByEmail = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "MaxLoanAmount", "MaxLoanTermMonths", "UpdatedAt", "UpdatedByEmail", "UpdatedByUserId" },
                values: new object[] { 1, 100000m, 60, new DateTime(2025, 11, 8, 21, 58, 29, 533, DateTimeKind.Utc).AddTicks(1779), null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
