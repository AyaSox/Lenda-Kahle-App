using LendaKahleApp.Server.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LendaKahleApp.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Loan> Loans { get; set; }
        public DbSet<Repayment> Repayments { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<LoanDocument> LoanDocuments { get; set; }
        public DbSet<AffordabilityAssessment> AffordabilityAssessments { get; set; }
        public DbSet<CreditCheck> CreditChecks { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SystemSettings> SystemSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<SystemSettings>(e =>
            {
                e.HasKey(s => s.Id);
                e.Property(s => s.MaxLoanAmount).HasPrecision(18,2);
                e.HasData(new SystemSettings { Id = 1, MaxLoanAmount = 100000m, MaxLoanTermMonths = 60, UpdatedAt = DateTime.UtcNow });
            });

            // AspNetUsers configuration
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.CreatedDate)
                      .HasColumnName("CreatedDate");

                entity.Property(u => u.IsDeleted)
                      .HasDefaultValue(false);

                // Global query filter to exclude soft-deleted users
                entity.HasQueryFilter(u => !u.IsDeleted);
            });

            // Configure decimal precision for financial data
            builder.Entity<Loan>(entity =>
            {
                entity.Property(l => l.PrincipalAmount).HasPrecision(18, 2);
                entity.Property(l => l.InterestRate).HasPrecision(5, 2);
                entity.Property(l => l.TotalRepayable).HasPrecision(18, 2);
                entity.Property(l => l.MonthlyInstallment).HasPrecision(18, 2);
                entity.Property(l => l.InitiationFee).HasPrecision(18, 2);
                entity.Property(l => l.MonthlyServiceFee).HasPrecision(18, 2);
                entity.Property(l => l.MonthlyCreditLifePremium).HasPrecision(18, 2);
                entity.Property(l => l.TotalInterest).HasPrecision(18, 2);
                entity.Property(l => l.TotalFees).HasPrecision(18, 2);

                // Composite index for common queries
                entity.HasIndex(e => new { e.BorrowerId, e.Status })
                    .HasDatabaseName("IX_Loans_BorrowerId_Status");
            });

            builder.Entity<Repayment>(entity =>
            {
                entity.Property(r => r.Amount).HasPrecision(18, 2);

                // Composite index for reporting
                entity.HasIndex(r => new { r.LoanId, r.PaymentDate })
                    .HasDatabaseName("IX_Repayments_LoanId_PaymentDate");
            });

            // LoanDocuments indexes
            builder.Entity<LoanDocument>(entity =>
            {
                entity.HasIndex(d => new { d.LoanId, d.DocumentType })
                    .HasDatabaseName("IX_LoanDocuments_LoanId_DocumentType");
            });

            // AuditLogs indexes
            builder.Entity<AuditLog>(entity =>
            {
                entity.HasIndex(a => new { a.Timestamp, a.Action })
                    .HasDatabaseName("IX_AuditLogs_Timestamp_Action");
            });

            // Notifications indexes
            builder.Entity<Notification>(entity =>
            {
                entity.HasIndex(n => new { n.UserId, n.IsRead })
                    .HasDatabaseName("IX_Notifications_UserId_IsRead");
            });

            // AffordabilityAssessment
            builder.Entity<AffordabilityAssessment>(entity =>
            {
                entity.Property(a => a.MonthlyGrossIncome).HasPrecision(18, 2);
                entity.Property(a => a.MonthlyNetIncome).HasPrecision(18, 2);
                entity.Property(a => a.MonthlyRentOrBond).HasPrecision(18, 2);
                entity.Property(a => a.MonthlyLivingExpenses).HasPrecision(18, 2);
                entity.Property(a => a.MonthlyDebtObligations).HasPrecision(18, 2);
                entity.Property(a => a.MonthlyInsurance).HasPrecision(18, 2);
                entity.Property(a => a.OtherExpenses).HasPrecision(18, 2);
                entity.Property(a => a.TotalMonthlyExpenses).HasPrecision(18, 2);

                entity.HasIndex(a => a.LoanId)
                    .HasDatabaseName("IX_AffordabilityAssessments_LoanId");
            });

            // CreditCheck
            builder.Entity<CreditCheck>(entity =>
            {
                entity.HasIndex(c => c.LoanId)
                    .HasDatabaseName("IX_CreditChecks_LoanId");
            });
        }
    }
}