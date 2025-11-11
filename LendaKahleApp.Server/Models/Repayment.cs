namespace LendaKahleApp.Server.Models
{
    public class Repayment
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        public decimal Amount { get; set; } // In ZAR
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public string TransactionReference { get; set; } = string.Empty; // Mock transaction ref
        public RepaymentStatus Status { get; set; } = RepaymentStatus.Completed;
    }

    public enum RepaymentStatus
    {
        Pending,
        Completed,
        Failed
    }
}