using System.ComponentModel.DataAnnotations.Schema;

namespace LendaKahleApp.Server.Models
{
    public class Loan
    {
        public int Id { get; set; }
        public string BorrowerId { get; set; } = string.Empty;
        public ApplicationUser Borrower { get; set; } = null!;
        public decimal PrincipalAmount { get; set; } // In ZAR
        public decimal InterestRate { get; set; } // Annual percentage
        public int TermMonths { get; set; }
        public decimal TotalRepayable { get; set; }
        public decimal MonthlyInstallment { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public LoanStatus Status { get; set; } = LoanStatus.Pending;
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        public DateTime? ApprovalDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? ApprovedBy { get; set; } // UserId of Admin
        public ICollection<Repayment> Repayments { get; set; } = new List<Repayment>();
        
        // Fee Breakdown (NCA Compliance)
        public decimal InitiationFee { get; set; } = 0;
        public decimal MonthlyServiceFee { get; set; } = 0;
        public decimal MonthlyCreditLifePremium { get; set; } = 0;
        public decimal TotalInterest { get; set; } = 0;
        public decimal TotalFees { get; set; } = 0; // Initiation + (Service Fee × Months) + (Credit Life × Months)
        
        // Compliance & Documentation
        public ApplicationMethod ApplicationMethod { get; set; } = ApplicationMethod.Online;
        public ICollection<LoanDocument> Documents { get; set; } = new List<LoanDocument>();
        public AffordabilityAssessment? AffordabilityAssessment { get; set; }
        public CreditCheck? CreditCheck { get; set; }
        
        // NCA Compliance
        public bool DocumentsVerified { get; set; } = false;
        public bool AffordabilityAssessed { get; set; } = false;
        public bool CreditCheckCompleted { get; set; } = false;
        public bool NCACompliant { get; set; } = false; // All checks passed
    }

    public enum ApplicationMethod
    {
        Online = 1,    // Borrower applies online with document upload
        InPerson = 2   // Borrower applies in branch, docs verified in person
    }

    public enum LoanStatus
    {
        Pending,
        PreApproved,
        Approved,
        Active,
        Rejected,
        Completed
    }
}