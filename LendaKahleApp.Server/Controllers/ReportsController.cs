using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using ClosedXML.Excel;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly IPdfService _pdfService;
        private readonly ApplicationDbContext _context;

        public ReportsController(IReportService reportService, IPdfService pdfService, ApplicationDbContext context)
        {
            _reportService = reportService;
            _pdfService = pdfService;
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardAnalytics()
        {
            var analytics = await _reportService.GetDashboardAnalyticsAsync();
            return Ok(analytics);
        }

        [HttpGet("repayment/{repaymentId}/receipt")]
        public async Task<IActionResult> GetRepaymentReceipt(int repaymentId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var repayment = await _context.Repayments
                .Include(r => r.Loan)
                    .ThenInclude(l => l.Borrower)
                .FirstOrDefaultAsync(r => r.Id == repaymentId);

            if (repayment == null) return NotFound("Repayment not found");

            // Check if user owns this repayment or is admin/loan officer
            var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value);
            bool isAuthorized = repayment.Loan.BorrowerId == userId || 
                               userRoles.Contains("Admin") || 
                               userRoles.Contains("LoanOfficer");

            if (!isAuthorized) return Forbid();

            try
            {
                var pdfBytes = await _pdfService.GenerateRepaymentReceiptAsync(repayment, repayment.Loan, repayment.Loan.Borrower);
                var fileName = $"Receipt_{repayment.TransactionReference}_{DateTime.Now:yyyyMMdd}.pdf";
                
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error generating receipt: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,LoanOfficer")]
        [HttpGet("loans/export")]
        public async Task<IActionResult> ExportLoansReport(string format = "pdf")
        {
            try
            {
                var reportBytes = await _reportService.ExportLoansReportAsync(format);
                var fileName = $"LoansReport_{DateTime.Now:yyyyMMdd_HHmmss}.{format}";
                var contentType = format.ToLower() == "csv" ? "text/csv" : "application/pdf";
                
                return File(reportBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error generating report: {ex.Message}");
            }
        }

        [Authorize(Roles = "Admin,LoanOfficer")]
        [HttpGet("repayments/export")]
        public async Task<IActionResult> ExportRepaymentsReport(string format = "pdf")
        {
            try
            {
                var reportBytes = await _reportService.ExportRepaymentsReportAsync(format);
                var fileName = $"RepaymentsReport_{DateTime.Now:yyyyMMdd_HHmmss}.{format}";
                var contentType = format.ToLower() == "csv" ? "text/csv" : "application/pdf";
                
                return File(reportBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error generating report: {ex.Message}");
            }
        }

        /// <summary>
        /// Export transactions as CSV or XLSX. Supports query params:
        /// - type: loan_application|loan_approval|loan_rejection|repayment|loan_completion
        /// - dateFrom, dateTo (ISO)
        /// - search (borrower, description, reference)
        /// - page, pageSize (server-side pagination)
        /// - format (csv or xlsx)
        /// Accessible to authenticated users; Admin/LoanOfficer see all, others see only their loans.
        /// </summary>
        [HttpGet("transactions/export")]
        public async Task<IActionResult> ExportTransactions([FromQuery] string type = "", [FromQuery] string dateFrom = "", [FromQuery] string dateTo = "", [FromQuery] string search = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 1000, [FromQuery] string format = "csv")
        {
            if (string.IsNullOrWhiteSpace(format) || (format.ToLower() != "csv" && format.ToLower() != "xlsx"))
            {
                return BadRequest("Supported formats: csv, xlsx");
            }

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();
            bool isPrivileged = userRoles.Contains("Admin") || userRoles.Contains("LoanOfficer");

            DateTime? from = null, to = null;
            if (!string.IsNullOrWhiteSpace(dateFrom) && DateTime.TryParse(dateFrom, out var tmpFrom)) from = tmpFrom;
            if (!string.IsNullOrWhiteSpace(dateTo) && DateTime.TryParse(dateTo, out var tmpTo)) to = tmpTo;

            // Fetch loans according to user scope
            var loansQuery = _context.Loans
                .Include(l => l.Borrower)
                .Include(l => l.Repayments)
                .AsQueryable();

            if (!isPrivileged)
            {
                loansQuery = loansQuery.Where(l => l.BorrowerId == userId);
            }

            var loans = await loansQuery.ToListAsync();

            // Collect filtered rows
            var rows = new List<(string Type, string Description, string Borrower, int LoanId, decimal? Amount, DateTime Date, string Status, string Reference)>();

            // Helper to check date/search/type filters
            bool RowMatchesFilters(string rowType, string rowDescription, string borrowerName, string reference, DateTime rowDate)
            {
                if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, rowType, StringComparison.OrdinalIgnoreCase)) return false;
                if (from.HasValue && rowDate < from.Value) return false;
                if (to.HasValue && rowDate > to.Value) return false;
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.ToLowerInvariant();
                    if (!( (borrowerName ?? string.Empty).ToLowerInvariant().Contains(s) || (rowDescription ?? string.Empty).ToLowerInvariant().Contains(s) || (reference ?? string.Empty).ToLowerInvariant().Contains(s) ))
                        return false;
                }
                return true;
            }

            foreach (var loan in loans.OrderByDescending(l => l.ApplicationDate))
            {
                // Loan application
                if (loan.ApplicationDate != default)
                {
                    var rowType = "loan_application";
                    var rowDate = loan.ApplicationDate;
                    var desc = $"Loan application submitted for {loan.Purpose}";
                    if (RowMatchesFilters(rowType, desc, loan.Borrower?.Email ?? string.Empty, null, rowDate))
                    {
                        rows.Add((rowType, desc, loan.Borrower?.Email ?? string.Empty, loan.Id, null, rowDate, "completed", ""));
                    }
                }

                // Approval / rejection
                if (loan.ApprovalDate.HasValue)
                {
                    var rowType = loan.Status == Models.LoanStatus.Rejected ? "loan_rejection" : "loan_approval";
                    var rowDate = loan.ApprovalDate.Value;
                    var desc = rowType == "loan_approval" ? $"Loan approved for {loan.Purpose}" : $"Loan rejected for {loan.Purpose}";
                    if (RowMatchesFilters(rowType, desc, loan.Borrower?.Email ?? string.Empty, null, rowDate))
                    {
                        rows.Add((rowType, desc, loan.Borrower?.Email ?? string.Empty, loan.Id, null, rowDate, "completed", ""));
                    }
                }

                // Completion
                if (loan.EndDate.HasValue && loan.Status == Models.LoanStatus.Completed)
                {
                    var rowType = "loan_completion";
                    var rowDate = loan.EndDate.Value;
                    var desc = $"Loan completed - {loan.Purpose}";
                    if (RowMatchesFilters(rowType, desc, loan.Borrower?.Email ?? string.Empty, null, rowDate))
                    {
                        rows.Add((rowType, desc, loan.Borrower?.Email ?? string.Empty, loan.Id, null, rowDate, "completed", ""));
                    }
                }

                // Repayments
                if (loan.Repayments != null && loan.Repayments.Any())
                {
                    foreach (var rep in loan.Repayments.OrderBy(r => r.PaymentDate))
                    {
                        var rowType = "repayment";
                        var rowDate = rep.PaymentDate;
                        var desc = $"Monthly repayment for {loan.Purpose}";
                        var reference = rep.TransactionReference ?? string.Empty;
                        if (RowMatchesFilters(rowType, desc, loan.Borrower?.Email ?? string.Empty, reference, rowDate))
                        {
                            rows.Add((rowType, desc, loan.Borrower?.Email ?? string.Empty, loan.Id, rep.Amount, rowDate, "completed", reference));
                        }
                    }
                }
            }

            // Apply pagination
            long startIndex = Math.Max(0, (long)(page - 1) * pageSize);
            var paginatedRows = rows.Skip((int)startIndex).Take(pageSize).ToList();

            if (format.ToLower() == "csv")
            {
                // Stream CSV
                Response.ContentType = "text/csv";
                var fileName = $"Transactions_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
                Response.Headers["Content-Disposition"] = $"attachment; filename=\"{fileName}\"";

                await using var writer = new StreamWriter(Response.Body, Encoding.UTF8, leaveOpen: true);
                await writer.WriteLineAsync("Type,Description,Borrower,LoanId,Amount,Date,Status,Reference");

                foreach (var row in paginatedRows)
                {
                    var amountStr = row.Amount.HasValue ? row.Amount.Value.ToString("F2") : "";
                    var line = $"{row.Type},\"{EscapeCsv(row.Description)}\",\"{EscapeCsv(row.Borrower)}\",{row.LoanId},{amountStr},{row.Date:o},{row.Status},\"{EscapeCsv(row.Reference)}\"";
                    await writer.WriteLineAsync(line);
                }

                await writer.FlushAsync();
                return new EmptyResult();
            }
            else // xlsx
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Transactions");

                // Headers
                worksheet.Cell(1, 1).Value = "Type";
                worksheet.Cell(1, 2).Value = "Description";
                worksheet.Cell(1, 3).Value = "Borrower";
                worksheet.Cell(1, 4).Value = "LoanId";
                worksheet.Cell(1, 5).Value = "Amount";
                worksheet.Cell(1, 6).Value = "Date";
                worksheet.Cell(1, 7).Value = "Status";
                worksheet.Cell(1, 8).Value = "Reference";

                // Data
                for (int i = 0; i < paginatedRows.Count; i++)
                {
                    var row = paginatedRows[i];
                    worksheet.Cell(i + 2, 1).Value = row.Type;
                    worksheet.Cell(i + 2, 2).Value = row.Description;
                    worksheet.Cell(i + 2, 3).Value = row.Borrower;
                    worksheet.Cell(i + 2, 4).Value = row.LoanId;
                    if (row.Amount.HasValue)
                        worksheet.Cell(i + 2, 5).Value = row.Amount.Value;
                    worksheet.Cell(i + 2, 6).Value = row.Date;
                    worksheet.Cell(i + 2, 7).Value = row.Status;
                    worksheet.Cell(i + 2, 8).Value = row.Reference;
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var fileName = $"Transactions_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
        }

        [Authorize(Roles = "Admin,LoanOfficer")]
        [HttpGet("defaulted-loans")]
        public async Task<IActionResult> GetDefaultedLoans()
        {
            try
            {
                var defaultedLoans = await _context.Loans
                    .Include(l => l.Borrower)
                    .Include(l => l.Repayments)
                    .Where(l => l.Status == Models.LoanStatus.Active && 
                               l.EndDate.HasValue && 
                               l.EndDate.Value < DateTime.UtcNow)
                    .ToListAsync();

                var result = defaultedLoans.Select(l => new
                {
                    Id = l.Id,
                    BorrowerName = (l.Borrower != null) 
                        ? $"{l.Borrower.FirstName ?? ""} {l.Borrower.LastName ?? ""}".Trim() 
                        : "Unknown",
                    PrincipalAmount = l.PrincipalAmount,
                    EndDate = l.EndDate,
                    DaysOverdue = l.EndDate.HasValue 
                        ? (int)(DateTime.UtcNow - l.EndDate.Value).TotalDays 
                        : 0,
                    Purpose = l.Purpose ?? "",
                    TotalPaid = l.Repayments?.Sum(r => r.Amount) ?? 0m,
                    RemainingBalance = l.TotalRepayable - (l.Repayments?.Sum(r => r.Amount) ?? 0m)
                })
                .OrderByDescending(l => l.DaysOverdue)
                .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message, stackTrace = ex.StackTrace });
            }
        }

        private static string EscapeCsv(string input)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            return input.Replace("\"", "\"\"");
        }
    }
}