using iTextSharp.text;
using iTextSharp.text.pdf;
using LendaKahleApp.Server.Models;
using LendaKahleApp.Server.Interfaces;

namespace LendaKahleApp.Server.Services
{
    public class PdfService : IPdfService
    {
        public async Task<byte[]> GenerateRepaymentReceiptAsync(Repayment repayment, Loan loan, ApplicationUser borrower)
        {
            return await Task.Run(() =>
            {
                using var memoryStream = new MemoryStream();
                var document = new Document(PageSize.A4, 50, 50, 50, 50);
                var writer = PdfWriter.GetInstance(document, memoryStream);
                
                document.Open();

                // Header
                var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DarkGray);
                var companyName = new Paragraph("LendaKahle Financial Services", headerFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 20f
                };
                document.Add(companyName);

                // Receipt Title
                var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.Black);
                var title = new Paragraph("REPAYMENT RECEIPT", titleFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 30f
                };
                document.Add(title);

                // Receipt Details Table
                var table = new PdfPTable(2) { WidthPercentage = 100 };
                table.SetWidths(new float[] { 1f, 2f });

                var labelFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12);
                var valueFont = FontFactory.GetFont(FontFactory.HELVETICA, 12);

                // Add receipt information
                AddTableRow(table, "Receipt No:", repayment.TransactionReference, labelFont, valueFont);
                AddTableRow(table, "Date:", repayment.PaymentDate.ToString("dd MMMM yyyy"), labelFont, valueFont);
                AddTableRow(table, "Time:", repayment.PaymentDate.ToString("HH:mm:ss"), labelFont, valueFont);
                AddTableRow(table, "", "", labelFont, valueFont); // Spacer

                AddTableRow(table, "Borrower Name:", $"{borrower.FirstName} {borrower.LastName}", labelFont, valueFont);
                AddTableRow(table, "ID Number:", borrower.IDNumber, labelFont, valueFont);
                AddTableRow(table, "Email:", borrower.Email, labelFont, valueFont);
                AddTableRow(table, "", "", labelFont, valueFont); // Spacer

                AddTableRow(table, "Loan ID:", loan.Id.ToString(), labelFont, valueFont);
                AddTableRow(table, "Loan Purpose:", loan.Purpose, labelFont, valueFont);
                AddTableRow(table, "Principal Amount:", $"R{loan.PrincipalAmount:N2}", labelFont, valueFont);
                AddTableRow(table, "Monthly Installment:", $"R{loan.MonthlyInstallment:N2}", labelFont, valueFont);
                AddTableRow(table, "", "", labelFont, valueFont); // Spacer

                // Payment Details (highlighted)
                var paymentFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.DarkGray);
                var amountCell = new PdfPCell(new Phrase("Payment Amount:", paymentFont))
                {
                    BackgroundColor = BaseColor.LightGray,
                    Padding = 10f,
                    Border = Rectangle.BOX
                };
                var amountValueCell = new PdfPCell(new Phrase($"R{repayment.Amount:N2}", paymentFont))
                {
                    BackgroundColor = BaseColor.LightGray,
                    Padding = 10f,
                    Border = Rectangle.BOX
                };
                table.AddCell(amountCell);
                table.AddCell(amountValueCell);

                AddTableRow(table, "Status:", repayment.Status.ToString().ToUpper(), labelFont, valueFont);

                document.Add(table);

                // Footer
                document.Add(new Paragraph("\n"));
                var footerFont = FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.Gray);
                var footer = new Paragraph(
                    "This is a computer-generated receipt. " +
                    "For queries, contact us at support@lendakahle.co.za or +27 11 123 4567",
                    footerFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingBefore = 30f
                };
                document.Add(footer);

                var timestamp = new Paragraph($"Generated on: {DateTime.Now:dd MMMM yyyy HH:mm:ss}", footerFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingBefore = 10f
                };
                document.Add(timestamp);

                document.Close();
                return memoryStream.ToArray();
            });
        }

        public async Task<byte[]> GenerateLoanSummaryReportAsync(IEnumerable<Loan> loans)
        {
            return await Task.Run(() =>
            {
                using var memoryStream = new MemoryStream();
                var document = new Document(PageSize.A4.Rotate(), 50, 50, 50, 50); // Landscape
                var writer = PdfWriter.GetInstance(document, memoryStream);
                
                document.Open();

                // Header
                var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DarkGray);
                var title = new Paragraph("LendaKahle Financial Services - Loan Summary Report", headerFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 20f
                };
                document.Add(title);

                var reportDate = new Paragraph($"Generated on: {DateTime.Now:dd MMMM yyyy HH:mm:ss}", 
                    FontFactory.GetFont(FontFactory.HELVETICA, 12))
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 30f
                };
                document.Add(reportDate);

                // Summary Statistics
                var summaryTable = new PdfPTable(4) { WidthPercentage = 100 };
                summaryTable.SetWidths(new float[] { 1f, 1f, 1f, 1f });

                var headerFont2 = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.White);
                var totalLoans = loans.Count();
                var activeLoans = loans.Count(l => l.Status == LoanStatus.Active);
                var totalPrincipal = loans.Sum(l => l.PrincipalAmount);
                var totalRepayable = loans.Sum(l => l.TotalRepayable);

                AddHeaderCell(summaryTable, "Total Loans", headerFont2);
                AddHeaderCell(summaryTable, "Active Loans", headerFont2);
                AddHeaderCell(summaryTable, "Total Principal", headerFont2);
                AddHeaderCell(summaryTable, "Total Repayable", headerFont2);

                var valueFont = FontFactory.GetFont(FontFactory.HELVETICA, 12);
                summaryTable.AddCell(new PdfPCell(new Phrase(totalLoans.ToString(), valueFont)) { Padding = 8f });
                summaryTable.AddCell(new PdfPCell(new Phrase(activeLoans.ToString(), valueFont)) { Padding = 8f });
                summaryTable.AddCell(new PdfPCell(new Phrase($"R{totalPrincipal:N2}", valueFont)) { Padding = 8f });
                summaryTable.AddCell(new PdfPCell(new Phrase($"R{totalRepayable:N2}", valueFont)) { Padding = 8f });

                document.Add(summaryTable);
                document.Add(new Paragraph("\n"));

                // Detailed Loans Table
                var detailFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14);
                var detailTitle = new Paragraph("Detailed Loan Information", detailFont) { SpacingAfter = 15f };
                document.Add(detailTitle);

                var loansTable = new PdfPTable(8) { WidthPercentage = 100 };
                loansTable.SetWidths(new float[] { 0.5f, 1.5f, 1f, 1f, 1f, 1f, 1f, 1.5f });

                // Headers
                AddHeaderCell(loansTable, "ID", headerFont2);
                AddHeaderCell(loansTable, "Borrower", headerFont2);
                AddHeaderCell(loansTable, "Principal", headerFont2);
                AddHeaderCell(loansTable, "Status", headerFont2);
                AddHeaderCell(loansTable, "Term", headerFont2);
                AddHeaderCell(loansTable, "Start Date", headerFont2);
                AddHeaderCell(loansTable, "End Date", headerFont2);
                AddHeaderCell(loansTable, "Purpose", headerFont2);

                // Data rows
                foreach (var loan in loans.OrderBy(l => l.Id))
                {
                    loansTable.AddCell(CreateCell(loan.Id.ToString(), valueFont));
                    loansTable.AddCell(CreateCell(loan.Borrower?.FirstName + " " + loan.Borrower?.LastName ?? "N/A", valueFont));
                    loansTable.AddCell(CreateCell($"R{loan.PrincipalAmount:N2}", valueFont));
                    loansTable.AddCell(CreateCell(loan.Status.ToString(), valueFont));
                    loansTable.AddCell(CreateCell($"{loan.TermMonths}m", valueFont));
                    loansTable.AddCell(CreateCell(loan.StartDate?.ToString("dd/MM/yyyy") ?? "N/A", valueFont));
                    loansTable.AddCell(CreateCell(loan.EndDate?.ToString("dd/MM/yyyy") ?? "N/A", valueFont));
                    loansTable.AddCell(CreateCell(loan.Purpose.Length > 30 ? loan.Purpose.Substring(0, 30) + "..." : loan.Purpose, valueFont));
                }

                document.Add(loansTable);

                document.Close();
                return memoryStream.ToArray();
            });
        }

        private void AddTableRow(PdfPTable table, string label, string value, Font labelFont, Font valueFont)
        {
            table.AddCell(new PdfPCell(new Phrase(label, labelFont)) { Border = Rectangle.NO_BORDER, Padding = 5f });
            table.AddCell(new PdfPCell(new Phrase(value, valueFont)) { Border = Rectangle.NO_BORDER, Padding = 5f });
        }

        private void AddHeaderCell(PdfPTable table, string text, Font font)
        {
            var cell = new PdfPCell(new Phrase(text, font))
            {
                BackgroundColor = BaseColor.DarkGray,
                Padding = 8f,
                HorizontalAlignment = Element.ALIGN_CENTER
            };
            table.AddCell(cell);
        }

        private PdfPCell CreateCell(string text, Font font)
        {
            return new PdfPCell(new Phrase(text, font)) { Padding = 5f };
        }
    }
}