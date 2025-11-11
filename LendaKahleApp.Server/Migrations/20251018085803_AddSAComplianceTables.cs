using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LendaKahleApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSAComplianceTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AffordabilityAssessed",
                table: "Loans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ApplicationMethod",
                table: "Loans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "CreditCheckCompleted",
                table: "Loans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DocumentsVerified",
                table: "Loans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NCACompliant",
                table: "Loans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AffordabilityAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanId = table.Column<int>(type: "int", nullable: false),
                    MonthlyGrossIncome = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MonthlyNetIncome = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MonthlyRentOrBond = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MonthlyLivingExpenses = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MonthlyDebtObligations = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MonthlyInsurance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OtherExpenses = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalMonthlyExpenses = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DisposableIncome = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DebtToIncomeRatio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CanAffordLoan = table.Column<bool>(type: "bit", nullable: false),
                    AffordabilityNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssessmentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssessedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffordabilityAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AffordabilityAssessments_Loans_LoanId",
                        column: x => x.LoanId,
                        principalTable: "Loans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CreditChecks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanId = table.Column<int>(type: "int", nullable: false),
                    CreditBureau = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreditScore = table.Column<int>(type: "int", nullable: true),
                    CreditScoreRating = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HasAdverseListings = table.Column<bool>(type: "bit", nullable: false),
                    IsUnderDebtReview = table.Column<bool>(type: "bit", nullable: false),
                    HasPreviousDefaults = table.Column<bool>(type: "bit", nullable: false),
                    NumberOfCreditAccounts = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CheckDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CheckedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CreditChecks_Loans_LoanId",
                        column: x => x.LoanId,
                        principalTable: "Loans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoanDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    DocumentType = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    UploadedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    VerifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VerifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VerificationNotes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoanDocuments_Loans_LoanId",
                        column: x => x.LoanId,
                        principalTable: "Loans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AffordabilityAssessments_LoanId",
                table: "AffordabilityAssessments",
                column: "LoanId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditChecks_LoanId",
                table: "CreditChecks",
                column: "LoanId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LoanDocuments_LoanId",
                table: "LoanDocuments",
                column: "LoanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AffordabilityAssessments");

            migrationBuilder.DropTable(
                name: "CreditChecks");

            migrationBuilder.DropTable(
                name: "LoanDocuments");

            migrationBuilder.DropColumn(
                name: "AffordabilityAssessed",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "ApplicationMethod",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "CreditCheckCompleted",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "DocumentsVerified",
                table: "Loans");

            migrationBuilder.DropColumn(
                name: "NCACompliant",
                table: "Loans");
        }
    }
}
