namespace LendaKahleApp.Server.Models
{
    public class LoanDocument
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        
        // Document details
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty; // Path to stored file
        public string FileType { get; set; } = string.Empty; // PDF, JPG, etc.
        public long FileSize { get; set; } // In bytes
        
        // Document metadata
        public DocumentType DocumentType { get; set; }
        public DocumentStatus Status { get; set; } = DocumentStatus.Pending;
        public DateTime UploadedDate { get; set; } = DateTime.UtcNow;
        public string? UploadedBy { get; set; } // UserId
        
        // Verification
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedDate { get; set; }
        public string? VerifiedBy { get; set; } // UserId of admin
        public string? VerificationNotes { get; set; }
    }

    public enum DocumentType
    {
        // Identity Documents
        SouthAfricanID = 1,              // RSA ID or Smart ID Card
        Passport = 2,                     // For foreign nationals
        
        // Proof of Income
        Payslips = 10,                    // Latest 3 months payslips (Required)
        BankStatements = 11,              // Latest 3 months bank statements (Required)
        ProofOfIncome = 12,               // Tax returns, salary advice, etc.
        
        // Proof of Residence
        ProofOfResidence = 20,            // Utility bill, lease agreement, rates notice (not older than 3 months)
        
        // Employment Documents
        EmploymentLetter = 30,            // Letter of employment
        EmploymentContract = 31,          // Employment contract
        
        // Additional Documents
        Affidavit = 40,                   // Affidavit if required
        MarriageContract = 41,            // ANC/Marriage certificate
        DebtReviewLetter = 42,            // If under debt review
        
        // Combined Document (for online applications)
        CombinedDocuments = 99            // All documents scanned into one PDF
    }

    public enum DocumentStatus
    {
        Pending = 0,          // Awaiting review
        Approved = 1,         // Document verified and approved
        Rejected = 2,         // Document rejected (poor quality, expired, etc.)
        RequiresResubmission = 3  // Needs to be uploaded again
    }

    public class AffordabilityAssessment
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        
        // Applicant Financial Details (as per NCA)
        public decimal MonthlyGrossIncome { get; set; }
        public decimal MonthlyNetIncome { get; set; }
        
        // Monthly Expenses
        public decimal MonthlyRentOrBond { get; set; }
        public decimal MonthlyLivingExpenses { get; set; }
        public decimal MonthlyDebtObligations { get; set; } // Other loans, credit cards, etc.
        public decimal MonthlyInsurance { get; set; }
        public decimal OtherExpenses { get; set; }
        
        // Calculated Fields
        public decimal TotalMonthlyExpenses { get; set; }
        public decimal DisposableIncome { get; set; } // Net income - Total expenses
        public decimal DebtToIncomeRatio { get; set; } // Total debt / Gross income (%)
        
        // Affordability Decision
        public bool CanAffordLoan { get; set; }
        public string? AffordabilityNotes { get; set; }
        
        // Assessment Details
        public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
        public string? AssessedBy { get; set; } // UserId
    }

    public class CreditCheck
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public Loan Loan { get; set; } = null!;
        
        // Credit Bureau Information
        public string? CreditBureau { get; set; } // TransUnion, Experian, etc.
        public int? CreditScore { get; set; }
        public string? CreditScoreRating { get; set; } // Excellent, Good, Fair, Poor
        
        // Credit History
        public bool HasAdverseListings { get; set; } // Judgements, defaults
        public bool IsUnderDebtReview { get; set; }
        public bool HasPreviousDefaults { get; set; }
        public int NumberOfCreditAccounts { get; set; }
        
        // Decision
        public CreditCheckStatus Status { get; set; }
        public string? Notes { get; set; }
        
        // Check Details
        public DateTime CheckDate { get; set; } = DateTime.UtcNow;
        public string? CheckedBy { get; set; } // UserId
    }

    public enum CreditCheckStatus
    {
        NotChecked = 0,
        Pass = 1,
        PassWithConditions = 2,
        Fail = 3
    }
}
