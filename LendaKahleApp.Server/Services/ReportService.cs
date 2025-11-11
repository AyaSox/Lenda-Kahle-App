using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.Interfaces;
using LendaKahleApp.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace LendaKahleApp.Server.Services
{
    public class ReportService : IReportService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPdfService _pdfService;

        public ReportService(ApplicationDbContext context, IPdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        public async Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync()
        {
            var loans = await _context.Loans
                .Include(l => l.Repayments)
                .ToListAsync();

            var totalLoans = loans.Count;
            var totalRepayments = loans.Sum(l => l.Repayments.Sum(r => r.Amount));
            var activeLoans = loans.Count(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Approved);
            var defaultedLoans = loans.Count(l => l.Status == LoanStatus.Active && DateTime.UtcNow > l.EndDate); // Simple default logic
            var outstandingBalance = loans.Where(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Approved)
                .Sum(l => l.TotalRepayable - l.Repayments.Sum(r => r.Amount));

            return new DashboardAnalyticsDto
            {
                TotalLoans = totalLoans,
                TotalRepayments = totalRepayments,
                ActiveLoans = activeLoans,
                DefaultedLoans = defaultedLoans,
                OutstandingBalance = outstandingBalance
            };
        }

        public async Task<byte[]> ExportLoansReportAsync(string format = "pdf")
        {
            var loans = await _context.Loans
                .Include(l => l.Borrower)
                .Include(l => l.Repayments)
                .OrderBy(l => l.Id)
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                return GenerateLoansCSV(loans);
            }
            else
            {
                return await _pdfService.GenerateLoanSummaryReportAsync(loans);
            }
        }

        public async Task<byte[]> ExportRepaymentsReportAsync(string format = "pdf")
        {
            var repayments = await _context.Repayments
                .Include(r => r.Loan)
                    .ThenInclude(l => l.Borrower)
                .OrderBy(r => r.PaymentDate)
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                return GenerateRepaymentsCSV(repayments);
            }
            else
            {
                return await GenerateRepaymentsPDF(repayments);
            }
        }

        private byte[] GenerateLoansCSV(IEnumerable<Loan> loans)
        {
            var csv = new StringBuilder();
            csv.AppendLine("Loan ID,Borrower Name,Principal Amount,Interest Rate,Term (Months),Status,Application Date,Start Date,End Date,Total Repayable,Monthly Installment,Purpose");

            foreach (var loan in loans)
            {
                csv.AppendLine($"{loan.Id}," +
                              $"\"{loan.Borrower?.FirstName} {loan.Borrower?.LastName}\"," +
                              $"{loan.PrincipalAmount}," +
                              $"{loan.InterestRate}," +
                              $"{loan.TermMonths}," +
                              $"{loan.Status}," +
                              $"{loan.ApplicationDate:yyyy-MM-dd}," +
                              $"{loan.StartDate?.ToString("yyyy-MM-dd") ?? "N/A"}," +
                              $"{loan.EndDate?.ToString("yyyy-MM-dd") ?? "N/A"}," +
                              $"{loan.TotalRepayable}," +
                              $"{loan.MonthlyInstallment}," +
                              $"\"{loan.Purpose}\"");
            }

            return Encoding.UTF8.GetBytes(csv.ToString());
        }

        private byte[] GenerateRepaymentsCSV(IEnumerable<Repayment> repayments)
        {
            var csv = new StringBuilder();
            csv.AppendLine("Repayment ID,Loan ID,Borrower Name,Amount,Payment Date,Transaction Reference,Status");

            foreach (var repayment in repayments)
            {
                csv.AppendLine($"{repayment.Id}," +
                              $"{repayment.LoanId}," +
                              $"\"{repayment.Loan?.Borrower?.FirstName} {repayment.Loan?.Borrower?.LastName}\"," +
                              $"{repayment.Amount}," +
                              $"{repayment.PaymentDate:yyyy-MM-dd HH:mm:ss}," +
                              $"{repayment.TransactionReference}," +
                              $"{repayment.Status}");
            }

            return Encoding.UTF8.GetBytes(csv.ToString());
        }

        private async Task<byte[]> GenerateRepaymentsPDF(IEnumerable<Repayment> repayments)
        {
            return await Task.Run(() =>
            {
                using var memoryStream = new MemoryStream();
                var document = new iTextSharp.text.Document(iTextSharp.text.PageSize.A4.Rotate(), 50, 50, 50, 50);
                var writer = iTextSharp.text.pdf.PdfWriter.GetInstance(document, memoryStream);
                
                document.Open();

                // Header
                var headerFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 18, iTextSharp.text.BaseColor.DarkGray);
                var title = new iTextSharp.text.Paragraph("LendaKahle Financial Services - Repayments Report", headerFont)
                {
                    Alignment = iTextSharp.text.Element.ALIGN_CENTER,
                    SpacingAfter = 20f
                };
                document.Add(title);

                var reportDate = new iTextSharp.text.Paragraph($"Generated on: {DateTime.Now:dd MMMM yyyy HH:mm:ss}", 
                    iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA, 12))
                {
                    Alignment = iTextSharp.text.Element.ALIGN_CENTER,
                    SpacingAfter = 30f
                };
                document.Add(reportDate);

                // Summary
                var totalAmount = repayments.Sum(r => r.Amount);
                var totalCount = repayments.Count();
                var summaryParagraph = new iTextSharp.text.Paragraph(
                    $"Total Repayments: {totalCount} | Total Amount: R{totalAmount:N2}",
                    iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 14))
                {
                    Alignment = iTextSharp.text.Element.ALIGN_CENTER,
                    SpacingAfter = 20f
                };
                document.Add(summaryParagraph);

                // Repayments Table
                var table = new iTextSharp.text.pdf.PdfPTable(6) { WidthPercentage = 100 };
                table.SetWidths(new float[] { 0.8f, 0.8f, 2f, 1.2f, 1.5f, 1f });

                var headerFont2 = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 10, iTextSharp.text.BaseColor.White);
                var valueFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA, 9);

                // Headers
                table.AddCell(CreateHeaderCell("ID", headerFont2));
                table.AddCell(CreateHeaderCell("Loan ID", headerFont2));
                table.AddCell(CreateHeaderCell("Borrower", headerFont2));
                table.AddCell(CreateHeaderCell("Amount", headerFont2));
                table.AddCell(CreateHeaderCell("Date", headerFont2));
                table.AddCell(CreateHeaderCell("Status", headerFont2));

                // Data rows
                foreach (var repayment in repayments)
                {
                    table.AddCell(CreateCell(repayment.Id.ToString(), valueFont));
                    table.AddCell(CreateCell(repayment.LoanId.ToString(), valueFont));
                    table.AddCell(CreateCell($"{repayment.Loan?.Borrower?.FirstName} {repayment.Loan?.Borrower?.LastName}" ?? "N/A", valueFont));
                    table.AddCell(CreateCell($"R{repayment.Amount:N2}", valueFont));
                    table.AddCell(CreateCell(repayment.PaymentDate.ToString("dd/MM/yyyy"), valueFont));
                    table.AddCell(CreateCell(repayment.Status.ToString(), valueFont));
                }

                document.Add(table);
                document.Close();
                return memoryStream.ToArray();
            });
        }

        private iTextSharp.text.pdf.PdfPCell CreateHeaderCell(string text, iTextSharp.text.Font font)
        {
            var cell = new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(text, font))
            {
                BackgroundColor = iTextSharp.text.BaseColor.DarkGray,
                Padding = 8f,
                HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER
            };
            return cell;
        }

        private iTextSharp.text.pdf.PdfPCell CreateCell(string text, iTextSharp.text.Font font)
        {
            return new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(text, font)) { Padding = 5f };
        }
    }
}