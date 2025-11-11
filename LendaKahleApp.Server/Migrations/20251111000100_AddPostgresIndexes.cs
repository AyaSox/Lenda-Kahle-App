using Microsoft.EntityFrameworkCore.Migrations;

#pragma warning disable CA1813 // Avoid unsealed attributes (EF needs inheritance)

namespace LendaKahleApp.Server.Migrations
{
    /// <summary>
    /// PostgreSQL specific performance indexes to optimize common query patterns.
    /// Safe to run on existing schema; only adds non?unique indexes.
    /// </summary>
    public partial class AddPostgresIndexes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Loans: frequent filtering by borrower and status
            migrationBuilder.CreateIndex(
                name: "IX_Loans_BorrowerId_Status",
                table: "Loans",
                columns: new[] { "BorrowerId", "Status" });

            // LoanDocuments: lookup by LoanId + DocumentType (verification checks)
            migrationBuilder.CreateIndex(
                name: "IX_LoanDocuments_LoanId_DocumentType",
                table: "LoanDocuments",
                columns: new[] { "LoanId", "DocumentType" });

            // Repayments: reporting & remaining balance calculations
            migrationBuilder.CreateIndex(
                name: "IX_Repayments_LoanId_PaymentDate",
                table: "Repayments",
                columns: new[] { "LoanId", "PaymentDate" });

            // AuditLogs: admin filtering by action & time range
            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp_Action",
                table: "AuditLogs",
                columns: new[] { "Timestamp", "Action" });

            // Notifications: unread notifications per user
            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead" });

            // AffordabilityAssessments: quick lookup per loan
            migrationBuilder.CreateIndex(
                name: "IX_AffordabilityAssessments_LoanId",
                table: "AffordabilityAssessments",
                column: "LoanId");

            // CreditChecks: quick lookup per loan
            migrationBuilder.CreateIndex(
                name: "IX_CreditChecks_LoanId",
                table: "CreditChecks",
                column: "LoanId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Loans_BorrowerId_Status",
                table: "Loans");

            migrationBuilder.DropIndex(
                name: "IX_LoanDocuments_LoanId_DocumentType",
                table: "LoanDocuments");

            migrationBuilder.DropIndex(
                name: "IX_Repayments_LoanId_PaymentDate",
                table: "Repayments");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_Timestamp_Action",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId_IsRead",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_AffordabilityAssessments_LoanId",
                table: "AffordabilityAssessments");

            migrationBuilder.DropIndex(
                name: "IX_CreditChecks_LoanId",
                table: "CreditChecks");
        }
    }
}
