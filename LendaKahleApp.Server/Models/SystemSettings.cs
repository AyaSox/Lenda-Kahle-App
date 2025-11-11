namespace LendaKahleApp.Server.Models
{
    public class SystemSettings
    {
        public int Id { get; set; } // Single row table (Id = 1)
        public decimal MaxLoanAmount { get; set; } = 100000m;
        public int MaxLoanTermMonths { get; set; } = 60;
        
        // Interest Rate Base Settings (editable)
        public decimal SmallLoanBaseRate { get; set; } = 27.5m;
        public decimal MediumLoanBaseRate { get; set; } = 24.0m;
        public decimal LargeLoanBaseRate { get; set; } = 22.0m;
        public decimal MinimumInterestRate { get; set; } = 18.0m;
        public decimal MaximumInterestRate { get; set; } = 27.5m;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? UpdatedByUserId { get; set; }
        public string? UpdatedByEmail { get; set; }
    }
}
