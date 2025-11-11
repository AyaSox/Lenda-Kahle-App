using LendaKahleApp.Server.DTOs;
using LendaKahleApp.Server.Models;

namespace LendaKahleApp.Server.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<ApplicationUserDto> GetUserProfileAsync(string userId);
        Task<bool> UpdateUserProfileAsync(string userId, ApplicationUserDto userDto);
        Task<bool> RequestPasswordResetAsync(string email);
        Task<bool> ResetPasswordAsync(string email, string token, string newPassword);
    }

    public interface ILoanService
    {
        Task<LoanDto> ApplyForLoanAsync(string borrowerId, LoanApplicationDto applicationDto);
        Task<IEnumerable<LoanDto>> GetLoansForBorrowerAsync(string borrowerId);
        Task<IEnumerable<LoanDto>> GetAllLoansAsync();
        Task<LoanDto?> GetLoanByIdAsync(int loanId);
        Task<bool> ApproveLoanAsync(int loanId, string approvedBy);
        Task<bool> RejectLoanAsync(int loanId, string rejectedBy);
        Task<RepaymentDto> MakeRepaymentAsync(string userId, MakeRepaymentDto repaymentDto);
        Task<IEnumerable<RepaymentDto>> GetRepaymentsForLoanAsync(int loanId);
    }

    public interface IReportService
    {
        Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync();
        Task<byte[]> ExportLoansReportAsync(string format = "pdf");
        Task<byte[]> ExportRepaymentsReportAsync(string format = "pdf");
    }

    public interface IPdfService
    {
        Task<byte[]> GenerateRepaymentReceiptAsync(Repayment repayment, Loan loan, ApplicationUser borrower);
        Task<byte[]> GenerateLoanSummaryReportAsync(IEnumerable<Loan> loans);
    }

    public class DashboardAnalyticsDto
    {
        public int TotalLoans { get; set; }
        public decimal TotalRepayments { get; set; }
        public int ActiveLoans { get; set; }
        public int DefaultedLoans { get; set; }
        public decimal OutstandingBalance { get; set; }
    }
}