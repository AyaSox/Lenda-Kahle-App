using LendaKahleApp.Server.Models;

namespace LendaKahleApp.Server.DTOs
{
    public class LoanApplicationDto
    {
        public decimal PrincipalAmount { get; set; }
        public int TermMonths { get; set; }
        public string Purpose { get; set; } = string.Empty;
        
        // Application Method
        public ApplicationMethod ApplicationMethod { get; set; } = ApplicationMethod.Online;
        
        // NCA REQUIRED: Borrower Personal Information
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty; // SA ID Number (NCA Mandatory)
        public DateTime DateOfBirth { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        
        // NCA REQUIRED: Residential Information
        public string ResidentialAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public int ResidentialYears { get; set; } // Years at current address
        public string ResidentialStatus { get; set; } = string.Empty; // Own, Rent, Live with family, etc.
        
        // NCA REQUIRED: Marital Status (affects affordability)
        public string MaritalStatus { get; set; } = string.Empty; // Single, Married, Divorced, etc.
        public int Dependents { get; set; } = 0; // Number of financial dependents
        
        // Affordability Assessment (Required for NCA compliance)
        public decimal MonthlyGrossIncome { get; set; }
        public decimal MonthlyNetIncome { get; set; }
        public decimal MonthlyRentOrBond { get; set; }
        public decimal MonthlyLivingExpenses { get; set; }
        public decimal MonthlyDebtObligations { get; set; }
        public decimal MonthlyInsurance { get; set; }
        public decimal OtherExpenses { get; set; }
        
        // NCA REQUIRED: Employment Information (Enhanced)
        public string EmploymentStatus { get; set; } = string.Empty; // Employed, Self-Employed, etc.
        public string Employer { get; set; } = string.Empty;
        public string EmployerAddress { get; set; } = string.Empty; // NCA requires employer details
        public string EmployerPhone { get; set; } = string.Empty;
        public int YearsEmployed { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        
        // NCA REQUIRED: Banking Information
        public string BankName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty; // Savings, Cheque, etc.
        public int BankingYears { get; set; } // Years with current bank
        
        // NCA REQUIRED: Credit Information
        public bool IsUnderDebtReview { get; set; } = false;
        public bool HasBeenBlacklisted { get; set; } = false;
        public bool ConsentToCreditCheck { get; set; } = false; // Explicit consent required
        
        // NCA REQUIRED: Spouse Information (if married)
        public string? SpouseFirstName { get; set; }
        public string? SpouseLastName { get; set; }
        public string? SpouseIdNumber { get; set; }
        public decimal SpouseMonthlyIncome { get; set; } = 0;
        public string? SpouseEmployer { get; set; }
        
        // NCA REQUIRED: Next of Kin (Emergency Contact)
        public string NextOfKinName { get; set; } = string.Empty;
        public string NextOfKinRelationship { get; set; } = string.Empty;
        public string NextOfKinPhone { get; set; } = string.Empty;
        public string NextOfKinAddress { get; set; } = string.Empty;
        
        // NCA COMPLIANCE: Acknowledgments
        public bool AcknowledgeNCADisclosure { get; set; } = false;
        public bool AcknowledgeFeeDisclosure { get; set; } = false;
        public bool AcknowledgeRightToCancellation { get; set; } = false; // 5-day cooling off period
        public bool ConsentToDataProcessing { get; set; } = false; // POPIA compliance
        
        // New: consent to life cover (used by LoanService rules)
        public bool ConsentToLifeCover { get; set; } = false;
    }

    public class LoanDto
    {
        public int Id { get; set; }
        public string BorrowerId { get; set; } = string.Empty;
        public string BorrowerName { get; set; } = string.Empty;
        public decimal PrincipalAmount { get; set; }
        public decimal InterestRate { get; set; }
        public int TermMonths { get; set; }
        public decimal TotalRepayable { get; set; }
        public decimal MonthlyInstallment { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public LoanStatus Status { get; set; }
        public DateTime ApplicationDate { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal RemainingBalance { get; set; }
        public decimal TotalPaid { get; set; }
        public int PaymentsMade { get; set; }
        public int PaymentsRemaining { get; set; }
    }

    public class RepaymentDto
    {
        public int Id { get; set; }
        public int LoanId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string TransactionReference { get; set; } = string.Empty;
        public RepaymentStatus Status { get; set; }
    }

    public class MakeRepaymentDto
    {
        public int LoanId { get; set; }
        public decimal Amount { get; set; }
    }
}