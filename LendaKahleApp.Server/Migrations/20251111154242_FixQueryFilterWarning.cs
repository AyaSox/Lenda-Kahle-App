using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LendaKahleApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixQueryFilterWarning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2025, 11, 11, 15, 42, 39, 155, DateTimeKind.Utc).AddTicks(2067));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2025, 11, 11, 11, 44, 15, 468, DateTimeKind.Utc).AddTicks(8743));
        }
    }
}
