using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.DTOs;
using LendaKahleApp.Server.Interfaces;
using LendaKahleApp.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using LendaKahleApp.Server.Configuration;
using System.Text;

namespace LendaKahleApp.Server.Services
{
    public class LoanService : ILoanService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> _userManager;
        private readonly IOptionsMonitor<LendingRules> _lendingRulesMonitor;

        public LoanService(ApplicationDbContext context, IConfiguration configuration, IAuditService auditService, INotificationService notificationService, Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> userManager, IOptionsMonitor<LendingRules> lendingRulesMonitor)
        {
            _context = context;
            _configuration = configuration;
            _auditService = auditService;
            _notificationService = notificationService;
            _userManager = userManager;
            _lendingRulesMonitor = lendingRulesMonitor;
        }

        private LendingRules GetRules() => _lendingRulesMonitor.CurrentValue;

        public async Task<LoanDto> ApplyForLoanAsync(string borrowerId, LoanApplicationDto applicationDto)
        {
            var rules = GetRules();

            // Load system settings (soft fail to defaults if missing)
            var systemSettings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
            decimal systemMaxLoanAmount = systemSettings?.MaxLoanAmount ?? decimal.MaxValue;
            int systemMaxLoanTerm = systemSettings?.MaxLoanTermMonths ?? int.MaxValue;

            if (applicationDto.PrincipalAmount > systemMaxLoanAmount)
            {
                throw new Exception($"Requested amount R{applicationDto.PrincipalAmount:N0} exceeds system maximum R{systemMaxLoanAmount:N0}.");
            }
            if (applicationDto.TermMonths > systemMaxLoanTerm)
            {
                throw new Exception($"Requested term {applicationDto.TermMonths} months exceeds system maximum {systemMaxLoanTerm} months.");
            }

            decimal originalPrincipal = applicationDto.PrincipalAmount;

            decimal minGrossIncome = rules.AutoApproval.MinimumMonthlyGrossIncome;
            decimal minNetIncome = rules.AutoApproval.MinimumMonthlyNetIncome;

            if (applicationDto.MonthlyGrossIncome < minGrossIncome || applicationDto.MonthlyNetIncome < minNetIncome)
            {
                throw new Exception($"Application does not meet minimum income requirements. Minimum gross income: R{minGrossIncome:N0}, Minimum net income: R{minNetIncome:N0}");
            }

            if (applicationDto.DateOfBirth != default(DateTime))
            {
                var age = DateTime.Now.Year - applicationDto.DateOfBirth.Year;
                if (DateTime.Now.DayOfYear < applicationDto.DateOfBirth.DayOfYear) age--;
                if (age < 18) throw new Exception("Applicant must be at least 18 years old to apply for credit.");
            }

            decimal depositAmount = 0m;
            decimal principalForCalculations = originalPrincipal;
            if (rules.Deposits.RequireDeposit && rules.Deposits.MinimumDepositPercent > 0)
            {
                depositAmount = Math.Round((rules.Deposits.MinimumDepositPercent / 100m) * originalPrincipal, 2);
                if (rules.Deposits.DepositReducesPrincipal)
                {
                    principalForCalculations = Math.Max(0, originalPrincipal - depositAmount);
                }
            }

            var (minTerm, maxTerm) = GetAllowedTermRange(principalForCalculations);
            // Enforce global system max term
            maxTerm = Math.Min(maxTerm, systemMaxLoanTerm);
            if (applicationDto.TermMonths < minTerm || applicationDto.TermMonths > maxTerm)
            {
                throw new Exception($"Invalid loan term. For R{originalPrincipal:N0}, term must be between {minTerm} and {maxTerm} months.");
            }

            decimal initiationFee = CalculateInitiationFee(principalForCalculations);
            decimal monthlyServiceFee = rules.Fees.MonthlyServiceFee;
            decimal monthlyCreditLife = CalculateMonthlyCreditLife(principalForCalculations);

            decimal totalExpenses = applicationDto.MonthlyRentOrBond +
                                    applicationDto.MonthlyLivingExpenses +
                                    applicationDto.MonthlyDebtObligations +
                                    applicationDto.MonthlyInsurance +
                                    applicationDto.OtherExpenses +
                                    (applicationDto.Dependents * 1500m);

            decimal totalHouseholdIncome = applicationDto.MonthlyNetIncome + applicationDto.SpouseMonthlyIncome;
            decimal disposableIncome = totalHouseholdIncome - totalExpenses;

            decimal preliminaryDTI = 0m;
            var denom = (applicationDto.MonthlyGrossIncome + applicationDto.SpouseMonthlyIncome);
            if (denom > 0) preliminaryDTI = (applicationDto.MonthlyDebtObligations / denom) * 100m;

            decimal interestRatePA = CalculateRiskBasedInterestRate(principalForCalculations, preliminaryDTI, disposableIncome);

            decimal totalInterest = principalForCalculations * (interestRatePA / 100m) * (applicationDto.TermMonths / 12m);
            decimal totalServiceFees = monthlyServiceFee * applicationDto.TermMonths;
            decimal totalCreditLife = monthlyCreditLife * applicationDto.TermMonths;
            decimal totalFees = initiationFee + totalServiceFees + totalCreditLife;

            decimal totalRepayable = principalForCalculations + totalInterest + totalFees;
            decimal monthlyInstallment = applicationDto.TermMonths > 0 ? (totalRepayable / applicationDto.TermMonths) : totalRepayable;

            decimal totalMonthlyPayment = monthlyInstallment;

            decimal totalHouseholdGrossIncome = applicationDto.MonthlyGrossIncome + applicationDto.SpouseMonthlyIncome;
            decimal debtToIncomeRatio = totalHouseholdGrossIncome > 0 ? ((applicationDto.MonthlyDebtObligations + totalMonthlyPayment) / totalHouseholdGrossIncome) * 100m : 100m;
            decimal disposableIncomeAfterLoan = disposableIncome - totalMonthlyPayment;

            var aff = rules.Affordability;
            decimal maxDtiRatio = aff.MaxDebtToIncomeRatio;
            decimal minDisposableIncomeAfterLoan = aff.MinimumDisposableIncomeAfterLoan;

            bool hasMinimumResidual = disposableIncomeAfterLoan >= aff.MinimumResidualAmount;
            bool reservePercentOk = totalHouseholdGrossIncome > 0 ? ((disposableIncomeAfterLoan / totalHouseholdGrossIncome) * 100m) >= aff.MinimumReservePercent : false;

            bool canAfford = disposableIncome >= totalMonthlyPayment &&
                             debtToIncomeRatio < maxDtiRatio &&
                             disposableIncomeAfterLoan >= minDisposableIncomeAfterLoan &&
                             hasMinimumResidual && reservePercentOk;

            bool residualIncomeWarning = disposableIncomeAfterLoan < minDisposableIncomeAfterLoan || !hasMinimumResidual || !reservePercentOk;

            var loan = new Loan
            {
                BorrowerId = borrowerId,
                PrincipalAmount = principalForCalculations,
                InterestRate = interestRatePA,
                TermMonths = applicationDto.TermMonths,
                TotalInterest = totalInterest,
                InitiationFee = initiationFee,
                MonthlyServiceFee = monthlyServiceFee,
                MonthlyCreditLifePremium = monthlyCreditLife,
                TotalFees = totalFees,
                TotalRepayable = totalRepayable,
                MonthlyInstallment = monthlyInstallment,
                Purpose = applicationDto.Purpose,
                Status = LoanStatus.Pending,
                ApplicationMethod = applicationDto.ApplicationMethod
            };

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            var affordabilityAssessment = new AffordabilityAssessment
            {
                LoanId = loan.Id,
                MonthlyGrossIncome = applicationDto.MonthlyGrossIncome,
                MonthlyNetIncome = applicationDto.MonthlyNetIncome,
                MonthlyRentOrBond = applicationDto.MonthlyRentOrBond,
                MonthlyLivingExpenses = applicationDto.MonthlyLivingExpenses,
                MonthlyDebtObligations = applicationDto.MonthlyDebtObligations,
                MonthlyInsurance = applicationDto.MonthlyInsurance,
                OtherExpenses = applicationDto.OtherExpenses,
                TotalMonthlyExpenses = totalExpenses,
                DisposableIncome = disposableIncome,
                DebtToIncomeRatio = debtToIncomeRatio,
                CanAffordLoan = canAfford,
                AffordabilityNotes = GenerateAffordabilityNotes(
                    canAfford,
                    residualIncomeWarning,
                    debtToIncomeRatio,
                    maxDtiRatio,
                    disposableIncome,
                    disposableIncomeAfterLoan,
                    minDisposableIncomeAfterLoan,
                    totalMonthlyPayment,
                    interestRatePA
                )
            };

            _context.AffordabilityAssessments.Add(affordabilityAssessment);
            loan.AffordabilityAssessed = true;
            await _context.SaveChangesAsync();

            var savedLoan = await _context.Loans
                .Include(l => l.Borrower)
                .Include(l => l.Repayments)
                .Include(l => l.Documents)
                .FirstOrDefaultAsync(l => l.Id == loan.Id);

            var auto = rules.AutoApproval;
            bool autoApprovalEnabled = auto.Enabled;
            decimal autoApprovalThreshold = auto.MaxAutoApprovalAmount;
            bool requireDocVerification = auto.RequireDocumentVerification;

            bool documentsVerified = !requireDocVerification || loan.DocumentsVerified;

            var lifeCover = rules.LifeCover;
            bool lifeCoverRequired = lifeCover.RequireLifeCoverForLargeLoans && (originalPrincipal > lifeCover.ThresholdAmount);
            bool lifeCoverProvided = applicationDto.ConsentToLifeCover;
            bool lifeCoverMissing = lifeCoverRequired && !lifeCoverProvided;

            bool isAutoApprovalEligible = autoApprovalEnabled && (originalPrincipal <= autoApprovalThreshold);

            if (isAutoApprovalEligible && canAfford && !residualIncomeWarning && documentsVerified && !lifeCoverMissing)
            {
                loan.Status = LoanStatus.PreApproved;
                loan.ApprovedBy = "SYSTEM_AUTO_PRE_APPROVAL";
                loan.ApprovalDate = DateTime.UtcNow;
                loan.StartDate = DateTime.UtcNow;
                loan.EndDate = DateTime.UtcNow.AddMonths(loan.TermMonths);
                loan.NCACompliant = true;

                await _context.SaveChangesAsync();

                await _auditService.LogAsync(
                    "SYSTEM",
                    "system@lendakahle.co.za",
                    AuditAction.LoanPreApproved,
                    "Loan",
                    loan.Id.ToString(),
                    new {
                        Reason = "Auto-pre-approved - All criteria met, pending document verification",
                        Amount = loan.PrincipalAmount,
                        InterestRate = interestRatePA,
                        DTI = debtToIncomeRatio,
                        DisposableIncomeAfterLoan = disposableIncomeAfterLoan,
                        InitiationFee = initiationFee,
                        MonthlyServiceFee = monthlyServiceFee,
                        CreditLife = monthlyCreditLife,
                        DepositAmount = depositAmount,
                        LifeCoverRequired = lifeCoverRequired,
                        SystemMaxLoanAmount = systemMaxLoanAmount,
                        SystemMaxLoanTerm = systemMaxLoanTerm
                    }
                );
            }
            else
            {
                loan.Status = LoanStatus.Pending;
                await _context.SaveChangesAsync();

                string reason = !autoApprovalEnabled ? "Auto-approval disabled" : (originalPrincipal > autoApprovalThreshold ? $"Loan amount (R{originalPrincipal:N2}) exceeds auto-approval threshold (R{autoApprovalThreshold:N2})" : "Affordability or documentation checks failed");

                await _auditService.LogAsync(
                    borrowerId,
                    savedLoan!.Borrower.Email!,
                    AuditAction.LoanStatusChanged,
                    "Loan",
                    loan.Id.ToString(),
                    new {
                        Status = "Pending - Manual Review",
                        Reason = reason,
                        DTI = debtToIncomeRatio,
                        ResidualIncome = disposableIncomeAfterLoan,
                        DepositAmount = depositAmount,
                        LifeCoverMissing = lifeCoverMissing,
                        SystemMaxLoanAmount = systemMaxLoanAmount,
                        SystemMaxLoanTerm = systemMaxLoanTerm
                    }
                );
            }

            await _auditService.LogAsync(
                borrowerId,
                savedLoan!.Borrower.Email!,
                AuditAction.LoanApplicationCreated,
                "Loan",
                savedLoan.Id.ToString(),
                new {
                    Amount = originalPrincipal,
                    PrincipalUsedForCalculations = principalForCalculations,
                    InterestRate = interestRatePA,
                    InitiationFee = initiationFee,
                    TotalRepayable = totalRepayable,
                    Status = loan.Status.ToString(),
                    ApplicantName = $"{applicationDto.FirstName} {applicationDto.LastName}",
                    IdNumber = applicationDto.IdNumber,
                    MaritalStatus = applicationDto.MaritalStatus,
                    Dependents = applicationDto.Dependents,
                    EmploymentStatus = applicationDto.EmploymentStatus,
                    Employer = applicationDto.Employer,
                    BankName = applicationDto.BankName,
                    Province = applicationDto.Province,
                    ResidentialStatus = applicationDto.ResidentialStatus,
                    TotalHouseholdIncome = totalHouseholdGrossIncome,
                    DebtToIncomeRatio = debtToIncomeRatio,
                    DisposableIncomeAfterLoan = disposableIncomeAfterLoan,
                    SpouseIncome = applicationDto.SpouseMonthlyIncome,
                    NextOfKin = applicationDto.NextOfKinName,
                    ConsentToCreditCheck = applicationDto.ConsentToCreditCheck,
                    AcknowledgeNCADisclosure = applicationDto.AcknowledgeNCADisclosure,
                    IsUnderDebtReview = applicationDto.IsUnderDebtReview,
                    HasBeenBlacklisted = applicationDto.HasBeenBlacklisted,
                    DepositAmount = depositAmount,
                    LifeCoverRequired = lifeCoverRequired,
                    SystemMaxLoanAmount = systemMaxLoanAmount,
                    SystemMaxLoanTerm = systemMaxLoanTerm
                }
            );

            if (loan.Status == LoanStatus.PreApproved)
            {
                await SendAutoPreApprovalNotifications(loan, savedLoan);
            }
            else
            {
                await SendPendingReviewNotifications(loan, savedLoan, auto.MaxAutoApprovalAmount, canAfford, residualIncomeWarning, debtToIncomeRatio, disposableIncomeAfterLoan);
            }

            return MapToLoanDto(savedLoan!);
        }

        public async Task<IEnumerable<LoanDto>> GetLoansForBorrowerAsync(string borrowerId)
        {
            var loans = await _context.Loans
                .Where(l => l.BorrowerId == borrowerId)
                .Include(l => l.Borrower)
                .Include(l => l.Repayments)
                .ToListAsync();

            bool changed = false;
            foreach (var loan in loans)
            {
                if (RecalculateAndRepairStatus(loan)) changed = true;
            }
            if (changed) await _context.SaveChangesAsync();

            return loans.Select(l => MapToLoanDto(l)).ToList();
        }

        public async Task<IEnumerable<LoanDto>> GetAllLoansAsync()
        {
            var loans = await _context.Loans
                .Include(l => l.Borrower)
                .Include(l => l.Repayments)
                .ToListAsync();

            bool changed = false;
            foreach (var loan in loans)
            {
                if (RecalculateAndRepairStatus(loan)) changed = true;
            }
            if (changed) await _context.SaveChangesAsync();

            return loans.Select(l => MapToLoanDto(l)).ToList();
        }

        public async Task<LoanDto?> GetLoanByIdAsync(int loanId)
        {
            var loan = await _context.Loans
                .Include(l => l.Borrower)
                .Include(l => l.Repayments)
                .FirstOrDefaultAsync(l => l.Id == loanId);

            if (loan == null) return null;
            if (RecalculateAndRepairStatus(loan)) await _context.SaveChangesAsync();
            return MapToLoanDto(loan);
        }

        public async Task<bool> ApproveLoanAsync(int loanId, string approvedBy)
        {
            var loan = await _context.Loans.FindAsync(loanId);
            if (loan == null || (loan.Status != LoanStatus.Pending && loan.Status != LoanStatus.PreApproved)) return false;

            // Enforce system settings at approval time (in case limits were lowered after application)
            var systemSettings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
            if (systemSettings != null)
            {
                if (loan.PrincipalAmount > systemSettings.MaxLoanAmount || loan.TermMonths > systemSettings.MaxLoanTermMonths)
                {
                    await _auditService.LogAsync(
                        approvedBy,
                        "unknown@system", // resolved below when we fetch approver
                        AuditAction.LoanStatusChanged,
                        "Loan",
                        loanId.ToString(),
                        new { Blocked = true, Reason = "System settings limits exceeded", MaxLoanAmount = systemSettings.MaxLoanAmount, MaxLoanTermMonths = systemSettings.MaxLoanTermMonths, RequestedAmount = loan.PrincipalAmount, RequestedTerm = loan.TermMonths }
                    );
                    return false; // block approval
                }
            }

            loan.Status = LoanStatus.Active;
            loan.ApprovalDate = DateTime.UtcNow;
            loan.ApprovedBy = approvedBy;
            loan.StartDate = DateTime.UtcNow;
            loan.EndDate = DateTime.UtcNow.AddMonths(loan.TermMonths);

            await _context.SaveChangesAsync();

            var approver = await _context.Users.FindAsync(approvedBy);
            await _auditService.LogAsync(
                approvedBy,
                approver?.Email ?? "Unknown",
                AuditAction.LoanApproved,
                "Loan",
                loanId.ToString(),
                new { BorrowerId = loan.BorrowerId, Amount = loan.PrincipalAmount, ApprovalDate = loan.ApprovalDate }
            );

            // Notify borrower
            await _notificationService.CreateAsync(
                loan.BorrowerId,
                "Loan Approved",
                $"Your loan application #{loan.Id} has been approved for R{loan.PrincipalAmount:N2}. You can now start making repayments.",
                Models.NotificationType.LoanApproval,
                loan.Id
            );

            // Notify all admins about the approval
            var allUsers = await _userManager.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin") && user.Id != approvedBy)
                {
                    try
                    {
                        await _notificationService.CreateAsync(
                            user.Id,
                            "Loan Manually Approved",
                            $"Loan #{loan.Id} for R{loan.PrincipalAmount:N0} was approved by {approver?.FirstName ?? "Admin"} {approver?.LastName ?? ""}.",
                            Models.NotificationType.LoanApproval,
                            loan.Id
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to notify admin {user.Id}: {ex.Message}");
                    }
                }
            }

            return true;
        }

        public async Task<bool> RejectLoanAsync(int loanId, string rejectedBy)
        {
            var loan = await _context.Loans.FindAsync(loanId);
            if (loan == null || (loan.Status != LoanStatus.Pending && loan.Status != LoanStatus.PreApproved)) return false;

            loan.Status = LoanStatus.Rejected;
            loan.ApprovedBy = rejectedBy; // Or add RejectedBy field

            await _context.SaveChangesAsync();

            // Audit log
            var rejecter = await _context.Users.FindAsync(rejectedBy);
            await _auditService.LogAsync(
                rejectedBy,
                rejecter?.Email ?? "Unknown",
                AuditAction.LoanRejected,
                "Loan",
                loanId.ToString(),
                new { BorrowerId = loan.BorrowerId, Amount = loan.PrincipalAmount }
            );

            // In-app notification to borrower
            await _notificationService.CreateAsync(
                loan.BorrowerId,
                "Loan Rejected",
                $"Your loan application #{loan.Id} was rejected.",
                Models.NotificationType.LoanRejected,
                loan.Id
            );

            // Notify all admins about the rejection
            var allUsers = await _userManager.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin") && user.Id != rejectedBy)
                {
                    try
                    {
                        await _notificationService.CreateAsync(
                            user.Id,
                            "Loan Rejected",
                            $"Loan #{loan.Id} for R{loan.PrincipalAmount:N0} was rejected by {rejecter?.FirstName ?? "Admin"} {rejecter?.LastName ?? ""}.",
                            Models.NotificationType.LoanRejected,
                            loan.Id
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to notify admin {user.Id}: {ex.Message}");
                    }
                }
            }

            return true;
        }

        public async Task<RepaymentDto> MakeRepaymentAsync(string userId, MakeRepaymentDto repaymentDto)
        {
            var loan = await _context.Loans
                .Include(l => l.Repayments)
                .FirstOrDefaultAsync(l => l.Id == repaymentDto.LoanId && l.BorrowerId == userId);

            if (loan == null)
                throw new Exception($"Loan #{repaymentDto.LoanId} not found or you don't have permission to make payments on this loan.");

            // Provide specific error messages based on loan status
            if (loan.Status == LoanStatus.Pending)
                throw new Exception($"Cannot make payment on Loan #{loan.Id}. The loan is still pending approval by an administrator. Please wait for approval before making payments.");
            
            if (loan.Status == LoanStatus.PreApproved)
                throw new Exception($"Cannot make payment on Loan #{loan.Id}. The loan is pre-approved but requires final document verification and admin approval before payments can be made.");
            
            if (loan.Status == LoanStatus.Rejected)
                throw new Exception($"Cannot make payment on Loan #{loan.Id}. This loan application was rejected.");
            
            if (loan.Status == LoanStatus.Completed)
                throw new Exception($"Cannot make payment on Loan #{loan.Id}. This loan has already been fully repaid.");

            if (loan.Status != LoanStatus.Active && loan.Status != LoanStatus.Approved)
                throw new Exception($"Cannot make payment on Loan #{loan.Id}. Current status: {loan.Status}. Only active or approved loans can accept payments.");

            // Create repayment
            var repayment = new Repayment
            {
                LoanId = repaymentDto.LoanId,
                Amount = repaymentDto.Amount,
                TransactionReference = Guid.NewGuid().ToString()
            };
            _context.Repayments.Add(repayment);

            // Calculate using existing in-memory collection (before save)
            decimal totalPaidBefore = loan.Repayments.Sum(r => r.Amount);
            decimal tentativeTotalPaid = totalPaidBefore + repaymentDto.Amount;
            decimal tentativeRemaining = loan.TotalRepayable - tentativeTotalPaid;
            bool completionTentativelyReached = tentativeRemaining <= 0.01m;

            // Transition status tentatively
            if (completionTentativelyReached)
            {
                loan.Status = LoanStatus.Completed;
            }
            else if (loan.Status == LoanStatus.Approved)
            {
                loan.Status = LoanStatus.Active;
            }

            await _context.SaveChangesAsync();

            // RELOAD for authoritative totals
            loan = await _context.Loans
                .Include(l => l.Repayments)
                .FirstOrDefaultAsync(l => l.Id == repaymentDto.LoanId);
            decimal verifiedTotalPaid = loan!.Repayments.Sum(r => r.Amount);
            decimal verifiedRemaining = loan.TotalRepayable - verifiedTotalPaid;
            bool isActuallyCompleted = verifiedRemaining <= 0.01m;

            // If we marked completed but still money outstanding, revert
            if (loan.Status == LoanStatus.Completed && !isActuallyCompleted)
            {
                loan.Status = LoanStatus.Active;
                await _context.SaveChangesAsync();
            }

            var currentUser = await _context.Users.FindAsync(userId);

            // Send notifications ONLY if verified completed
            if (loan.Status == LoanStatus.Completed && isActuallyCompleted)
            {
                await _notificationService.CreateAsync(
                    loan.BorrowerId,
                    "Loan Fully Repaid",
                    $"Congratulations! You have successfully completed all payments for loan #{loan.Id}. Total paid: R{verifiedTotalPaid:N2}",
                    Models.NotificationType.LoanCompleted,
                    loan.Id
                );

                var allUsers = await _userManager.Users.ToListAsync();
                foreach (var u in allUsers)
                {
                    var roles = await _userManager.GetRolesAsync(u);
                    if (roles.Contains("Admin"))
                    {
                        try
                        {
                            await _notificationService.CreateAsync(
                                u.Id,
                                "Loan Completed Successfully",
                                $"Loan #{loan.Id} for R{loan.PrincipalAmount:N0} by {currentUser?.Email ?? loan.BorrowerId} has been fully repaid. Total: R{verifiedTotalPaid:N2}",
                                Models.NotificationType.LoanCompleted,
                                loan.Id
                            );
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to notify admin {u.Id}: {ex.Message}");
                        }
                    }
                }
            }

            // Audit log
            await _auditService.LogAsync(
                userId,
                currentUser?.Email ?? "Unknown",
                AuditAction.RepaymentMade,
                "Repayment",
                repayment.Id.ToString(),
                new { LoanId = repaymentDto.LoanId, Amount = repaymentDto.Amount, TotalPaid = verifiedTotalPaid, RemainingBalance = Math.Max(verifiedRemaining, 0) }
            );

            // Always send payment received notification
            await _notificationService.CreateAsync(
                loan.BorrowerId,
                "Payment Received",
                $"Payment of R{repaymentDto.Amount:N2} received for loan #{loan.Id}.",
                Models.NotificationType.PaymentReceived,
                loan.Id
            );

            // Admin repayment notifications
            try
            {
                var allUsers2 = await _userManager.Users.ToListAsync();
                foreach (var u in allUsers2)
                {
                    var roles = await _userManager.GetRolesAsync(u);
                    if (roles.Contains("Admin"))
                    {
                        try
                        {
                            await _notificationService.CreateAsync(
                                u.Id,
                                "Repayment Received",
                                $"A repayment of R{repaymentDto.Amount:N2} was made by {currentUser?.Email ?? loan.BorrowerId} for loan #{loan.Id}. Remaining: R{Math.Max(verifiedRemaining,0):N2}",
                                Models.NotificationType.PaymentReceived,
                                loan.Id
                            );
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to notify admin {u.Id}: {ex.Message}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to create admin repayment notifications: {ex.Message}");
            }

            return new RepaymentDto
            {
                Id = repayment.Id,
                LoanId = repayment.LoanId,
                Amount = repayment.Amount,
                PaymentDate = repayment.PaymentDate,
                TransactionReference = repayment.TransactionReference,
                Status = repayment.Status
            };
        }

        public async Task<IEnumerable<RepaymentDto>> GetRepaymentsForLoanAsync(int loanId)
        {
            var repayments = await _context.Repayments
                .Where(r => r.LoanId == loanId)
                .ToListAsync();

            return repayments.Select(r => new RepaymentDto
            {
                Id = r.Id,
                LoanId = r.LoanId,
                Amount = r.Amount,
                PaymentDate = r.PaymentDate,
                TransactionReference = r.TransactionReference,
                Status = r.Status
            });
        }

        private LoanDto MapToLoanDto(Loan loan)
        {
            string borrowerName = "Unknown";
            if (loan.Borrower != null)
            {
                borrowerName = $"{loan.Borrower.FirstName} {loan.Borrower.LastName}";
            }

            decimal totalPaid = loan.Repayments?.Sum(r => r.Amount) ?? 0;
            decimal remainingBalance = loan.TotalRepayable - totalPaid;
            int paymentsMade = loan.Repayments?.Count ?? 0;
            int paymentsRemaining = loan.TermMonths - paymentsMade;
            if (paymentsRemaining < 0) paymentsRemaining = 0;

            if (loan.Status == LoanStatus.Completed && remainingBalance > 0.01m)
            {
                loan.Status = LoanStatus.Active;
            }

            return new LoanDto
            {
                Id = loan.Id,
                BorrowerId = loan.BorrowerId,
                BorrowerName = borrowerName,
                PrincipalAmount = loan.PrincipalAmount,
                InterestRate = loan.InterestRate,
                TermMonths = loan.TermMonths,
                TotalRepayable = loan.TotalRepayable,
                MonthlyInstallment = loan.MonthlyInstallment,
                Purpose = loan.Purpose,
                Status = loan.Status,
                ApplicationDate = loan.ApplicationDate,
                ApprovalDate = loan.ApprovalDate,
                StartDate = loan.StartDate,
                EndDate = loan.EndDate,
                RemainingBalance = remainingBalance,
                TotalPaid = totalPaid,
                PaymentsMade = paymentsMade,
                PaymentsRemaining = paymentsRemaining
            };
        }

        private (int MinTerm, int MaxTerm) GetAllowedTermRange(decimal loanAmount)
        {
            var rules = GetRules();

            if (loanAmount <= 8000)
            {
                return (
                    rules.LoanTerms.SmallLoans.MinTermMonths,
                    rules.LoanTerms.SmallLoans.MaxTermMonths
                );
            }
            else if (loanAmount <= 30000)
            {
                return (
                    rules.LoanTerms.MediumLoans.MinTermMonths,
                    rules.LoanTerms.MediumLoans.MaxTermMonths
                );
            }
            else
            {
                return (
                    rules.LoanTerms.LargeLoans.MinTermMonths,
                    rules.LoanTerms.LargeLoans.MaxTermMonths
                );
            }
        }

        private decimal CalculateInitiationFee(decimal loanAmount)
        {
            var rules = GetRules();
            var init = rules.Fees.InitiationFee;
            if (!init.Enabled) return 0;

            var baseAmount = init.BaseAmount;
            var percentage = init.PercentageAbove1000;
            var maxFee = init.MaximumFee;

            if (loanAmount <= 1000)
                return baseAmount;

            decimal calculatedFee = baseAmount + ((loanAmount - 1000) * (percentage / 100));
            return Math.Min(calculatedFee, maxFee);
        }

        private decimal CalculateMonthlyCreditLife(decimal loanAmount)
        {
            var rules = GetRules();
            var cl = rules.Fees.CreditLife;
            if (!cl.Enabled) return 0;

            if (loanAmount <= cl.RequiredAboveAmount) return 0;

            decimal rate = cl.MonthlyRatePercentage;
            return loanAmount * (rate / 100);
        }

        private decimal CalculateRiskBasedInterestRate(decimal loanAmount, decimal dtiRatio, decimal disposableIncome)
        {
            var rules = GetRules();

            decimal baseRate;
            if (loanAmount <= 8000)
                baseRate = rules.InterestRates.BaseRates.SmallLoanBase;
            else if (loanAmount <= 30000)
                baseRate = rules.InterestRates.BaseRates.MediumLoanBase;
            else
                baseRate = rules.InterestRates.BaseRates.LargeLoanBase;

            decimal rateAdjustment = 0;
            var ra = rules.InterestRates.RiskAdjustments;

            if (dtiRatio < ra.ExcellentAffordability.MaxDTI && disposableIncome >= ra.ExcellentAffordability.MinDisposableIncome)
            {
                rateAdjustment = ra.ExcellentAffordability.RateAdjustment;
            }
            else if (dtiRatio < ra.GoodAffordability.MaxDTI && disposableIncome >= ra.GoodAffordability.MinDisposableIncome)
            {
                rateAdjustment = ra.GoodAffordability.RateAdjustment;
            }
            else if (dtiRatio < ra.AverageAffordability.MaxDTI && disposableIncome >= ra.AverageAffordability.MinDisposableIncome)
            {
                rateAdjustment = ra.AverageAffordability.RateAdjustment;
            }
            else if (dtiRatio < ra.BelowAverageAffordability.MaxDTI && disposableIncome >= ra.BelowAverageAffordability.MinDisposableIncome)
            {
                rateAdjustment = ra.BelowAverageAffordability.RateAdjustment;
            }
            else
            {
                rateAdjustment = ra.PoorAffordability.RateAdjustment;
            }

            decimal finalRate = baseRate + rateAdjustment;
            decimal minRate = rules.InterestRates.Limits.MinimumRate;
            decimal maxRate = rules.InterestRates.Limits.MaximumRate;

            return Math.Clamp(finalRate, minRate, maxRate);
        }

        private string GenerateAffordabilityNotes(
            bool canAfford,
            bool residualWarning,
            decimal dti,
            decimal maxDti,
            decimal disposableIncome,
            decimal disposableAfterLoan,
            decimal minDisposable,
            decimal monthlyPayment,
            decimal interestRate)
        {
            string notes = "";
            if (canAfford && !residualWarning)
            {
                notes = $"PASSES AFFORDABILITY CHECK\n" +
                       $"Interest Rate: {interestRate:F2}% PA (risk-based)\n" +
                       $"DTI Ratio: {dti:F2}% (limit: {maxDti}%)\n" +
                       $"Disposable Income: R{disposableIncome:N2}\n" +
                       $"After Loan Payment: R{disposableAfterLoan:N2}\n" +
                       $"Monthly Payment: R{monthlyPayment:N2}";
            }
            else if (residualWarning)
            {
                notes = $"RESIDUAL INCOME WARNING\n" +
                       $"Interest Rate: {interestRate:F2}% PA\n" +
                       $"DTI Ratio: {dti:F2}% (limit: {maxDti}%)\n" +
                       $"Disposable Income: R{disposableIncome:N2}\n" +
                       $"After Loan Payment: R{disposableAfterLoan:N2} (recommended min: R{minDisposable:N0})\n" +
                       $"Low financial cushion - manual review recommended";
                if (disposableAfterLoan < 0)
                {
                    notes += $"\nSuggestion: Consider a smaller loan amount or longer term to improve affordability.";
                }
            }
            else
            {
                notes = $"FAILS AFFORDABILITY CHECK\n" +
                       $"Interest Rate: {interestRate:F2}% PA\n" +
                       $"DTI Ratio: {dti:F2}% (limit: {maxDti}%)\n" +
                       $"Disposable Income: R{disposableIncome:N2}\n" +
                       $"After Loan Payment: R{disposableAfterLoan:N2} (min: R{minDisposable:N0})\n" +
                       $"Requires manual review and approval";
                if (dti >= maxDti)
                {
                    notes += $"\nIssue: High debt load ({dti:F2}%) exceeds limit.";
                }
                if (disposableAfterLoan < minDisposable)
                {
                    notes += $"\nIssue: Insufficient disposable income after loan.";
                }
            }
            return notes;
        }

        private async Task SendAutoApprovalNotifications(Loan loan, Loan savedLoan)
        {
            await _notificationService.CreateAsync(
                loan.BorrowerId,
                "Loan Approved",
                $"Your loan of R{loan.PrincipalAmount:N0} has been automatically approved at {loan.InterestRate:F2}% PA. " +
                $"Total repayable: R{loan.TotalRepayable:N0} over {loan.TermMonths} months.",
                Models.NotificationType.LoanApproval,
                loan.Id
            );

            var allUsers = await _userManager.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin"))
                {
                    await _notificationService.CreateAsync(
                        user.Id,
                        "Loan Auto-Approved",
                        $"Loan #{loan.Id} for R{loan.PrincipalAmount:N0} to {savedLoan.Borrower.FirstName} {savedLoan.Borrower.LastName} " +
                        $"was auto-approved at {loan.InterestRate:F2}% PA.",
                        Models.NotificationType.LoanApproval,
                        loan.Id
                    );
                }
            }
        }

        private async Task SendAutoPreApprovalNotifications(Loan loan, Loan savedLoan)
        {
            await _notificationService.CreateAsync(
                loan.BorrowerId,
                "Loan Pre-Approved",
                $"Your loan of R{loan.PrincipalAmount:N0} has been automatically pre-approved at {loan.InterestRate:F2}% PA. " +
                $"Total repayable: R{loan.TotalRepayable:N0} over {loan.TermMonths} months. " +
                $"Please ensure all required documents are uploaded for final approval and disbursement.",
                NotificationType.LoanPreApproved,
                loan.Id
            );

            var allUsers = await _userManager.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin"))
                {
                    await _notificationService.CreateAsync(
                        user.Id,
                        "Loan Auto-Pre-Approved",
                        $"Loan #{loan.Id} for R{loan.PrincipalAmount:N0} to {savedLoan.Borrower.FirstName} {savedLoan.Borrower.LastName} " +
                        $"was auto-pre-approved at {loan.InterestRate:F2}% PA. Document verification required before disbursement.",
                        NotificationType.LoanPreApproved,
                        loan.Id
                    );
                }
            }
        }

        private async Task SendPendingReviewNotifications(
            Loan loan,
            Loan savedLoan,
            decimal threshold,
            bool canAfford,
            bool residualWarning,
            decimal dti,
            decimal disposableAfterLoan)
        {
            if (loan.Status == LoanStatus.Approved) return;

            var rules = GetRules();
            decimal autoApprovalLimit = rules.AutoApproval.MaxAutoApprovalAmount;

            var flagReasons = new List<string>();
            bool amountOnly = false;
            
            if (loan.PrincipalAmount > autoApprovalLimit)
            {
                flagReasons.Add($"Amount R{loan.PrincipalAmount:N0} exceeds auto-approval limit R{autoApprovalLimit:N0}");
                amountOnly = true;
            }
                
            if (!canAfford)
            {
                flagReasons.Add($"Affordability fail (DTI {dti:F1}% / limit {rules.AutoApproval.MaxDebtToIncomeRatio}%)");
                amountOnly = false;
            }
            else if (residualWarning)
            {
                flagReasons.Add($"Low residual income R{disposableAfterLoan:N0} (min R{rules.AutoApproval.MinimumDisposableIncomeAfterLoan:N0})");
                amountOnly = false;
            }

            bool flaggedForAdminReview = flagReasons.Any();
            string dtiCategory = GetDTICategory(dti);
            string riskLevel = GetRiskLevel(flagReasons, canAfford, dti);

            string borrowerTitle = flaggedForAdminReview ? "Application Under Review" : "Loan Application Submitted";
            string borrowerMessage;
            
            if (flaggedForAdminReview)
            {
                if (amountOnly && flagReasons.Count == 1)
                {
                    if (dti < 30)
                    {
                        borrowerMessage = $"Great news! Your R{loan.PrincipalAmount:N0} application shows excellent financials (DTI {dti:F1}% - {dtiCategory}). " +
                                        $"It just needs quick manager sign-off since it exceeds our R{autoApprovalLimit:N0} instant approval limit. " +
                                        $"We'll review and respond within 24 hours.";
                    }
                    else
                    {
                        borrowerMessage = $"Your R{loan.PrincipalAmount:N0} application requires manager approval as it exceeds our R{autoApprovalLimit:N0} instant approval limit. " +
                                        $"Your financial profile (DTI {dti:F1}% - {dtiCategory}) will be reviewed within 24 hours.";
                    }
                }
                else
                {
                    borrowerMessage = $"Your loan application #{loan.Id} for R{loan.PrincipalAmount:N0} requires manual review. " +
                                    $"Our team will carefully assess your application and respond within 48 hours.";
                }
            }
            else
            {
                borrowerMessage = $"Your loan application #{loan.Id} for R{loan.PrincipalAmount:N0} has been submitted and is under review.";
            }

            await _notificationService.CreateAsync(
                loan.BorrowerId,
                borrowerTitle,
                borrowerMessage,
                flaggedForAdminReview ? NotificationType.ApplicationFlagged : NotificationType.ApplicationSubmitted,
                loan.Id
            );

            var allUsers = await _userManager.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin"))
                {
                    string adminTitle;
                    string adminMessage;
                    
                    if (flaggedForAdminReview)
                    {
                        string riskIndicator = riskLevel == "LOW" ? "[LOW RISK]" : (riskLevel == "MEDIUM" ? "[MEDIUM RISK]" : "[HIGH RISK]");
                        adminTitle = $"{riskIndicator} Review Required";
                        
                        var sb = new StringBuilder();
                        sb.Append($"Loan #{loan.Id} R{loan.PrincipalAmount:N0} from {savedLoan.Borrower.FirstName} {savedLoan.Borrower.LastName}. ");
                        
                        if (amountOnly && flagReasons.Count == 1)
                        {
                            sb.Append($"Amount threshold only | DTI {dti:F1}% ({dtiCategory}) | Residual R{disposableAfterLoan:N0}. ");
                            sb.Append(dti < 30 ? "Quick approval candidate." : "Standard review needed.");
                        }
                        else
                        {
                            sb.Append($"Flagged: {string.Join("; ", flagReasons)} | DTI {dti:F1}% ({dtiCategory}) | Residual R{disposableAfterLoan:N0}");
                        }
                        
                        adminMessage = sb.ToString();
                    }
                    else
                    {
                        adminTitle = "New Loan Application";
                        adminMessage = $"Loan #{loan.Id} R{loan.PrincipalAmount:N0} from {savedLoan.Borrower.FirstName} {savedLoan.Borrower.LastName}";
                    }

                    await _notificationService.CreateAsync(
                        user.Id,
                        adminTitle,
                        adminMessage,
                        flaggedForAdminReview ? NotificationType.ApplicationFlagged : NotificationType.ApplicationSubmitted,
                        loan.Id
                    );
                }
            }
        }

        private bool RecalculateAndRepairStatus(Loan loan)
        {
            decimal totalPaid = loan.Repayments?.Sum(r => r.Amount) ?? 0m;
            decimal remaining = loan.TotalRepayable - totalPaid;
            bool changed = false;

            if (remaining <= 0.01m)
            {
                if (loan.Status != LoanStatus.Completed)
                {
                    loan.Status = LoanStatus.Completed;
                    changed = true;
                }
            }
            else
            {
                if (loan.Status == LoanStatus.Completed)
                {
                    loan.Status = loan.Repayments != null && loan.Repayments.Any() ? LoanStatus.Active : loan.Status;
                    changed = true;
                }
            }
            return changed;
        }

        private string GetDTICategory(decimal dti)
        {
            if (dti < 20) return "EXCELLENT";
            if (dti < 30) return "GOOD";
            if (dti < 40) return "FAIR";
            return "POOR";
        }

        private string GetRiskLevel(List<string> flagReasons, bool canAfford, decimal dti)
        {
            if (!canAfford || dti >= 40) return "HIGH";
            if (flagReasons.Count == 1 && flagReasons[0].Contains("Amount") && dti < 30) return "LOW";
            return "MEDIUM";
        }
    }
}
