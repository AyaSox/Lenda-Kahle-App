using LendaKahleApp.Server.Models;
using Microsoft.AspNetCore.Identity;

namespace LendaKahleApp.Server.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();

            // Seed Roles
            await SeedRolesAsync(roleManager);

            // Seed Default Users
            await SeedUsersAsync(userManager);

            // Seed Sample Loans and Repayments
            await SeedLoansAndRepaymentsAsync(context, userManager);
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            string[] roles = { "Borrower", "Admin" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }

        private static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager)
        {
            // Seed Admin User
            await SeedAdminUser(userManager);

            // Seed Sample Borrower User
            await SeedBorrowerUser(userManager);
        }

        private static async Task SeedAdminUser(UserManager<ApplicationUser> userManager)
        {
            string adminEmail = "admin@lendakahle.co.za";

            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "Thabo",
                    LastName = "Mokoena",
                    IDNumber = "9001015009087",
                    DateOfBirth = new DateTime(1990, 1, 1),
                    PhoneNumber = "+27 11 123 4567",
                    Address = "123 Nelson Mandela Drive, Johannesburg, 2001",
                    CreatedDate = DateTime.UtcNow.AddMonths(-6) // Created 6 months ago
                };

                var result = await userManager.CreateAsync(adminUser, "Admin123!");

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }

        private static async Task SeedBorrowerUser(UserManager<ApplicationUser> userManager)
        {
            string borrowerEmail = "borrower@lendakahle.co.za";

            if (await userManager.FindByEmailAsync(borrowerEmail) == null)
            {
                var borrowerUser = new ApplicationUser
                {
                    UserName = borrowerEmail,
                    Email = borrowerEmail,
                    EmailConfirmed = true,
                    FirstName = "Zanele",
                    LastName = "Ndlovu",
                    IDNumber = "9512314567089",
                    DateOfBirth = new DateTime(1995, 12, 31),
                    PhoneNumber = "+27 31 789 0123",
                    Address = "78 Florida Road, Durban, 4001",
                    CreatedDate = DateTime.UtcNow.AddMonths(-8) // Created 8 months ago
                };

                var result = await userManager.CreateAsync(borrowerUser, "Borrower123!");

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(borrowerUser, "Borrower");
                }
            }
        }

        public static async Task SeedLoansAndRepaymentsAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            // Only seed if no loans exist
            if (context.Loans.Any())
            {
                return;
            }

            var borrower = await userManager.FindByEmailAsync("borrower@lendakahle.co.za");
            var admin = await userManager.FindByEmailAsync("admin@lendakahle.co.za");

            if (borrower == null || admin == null) return;

            // Loan 1: NEARING TERM END - Only 2 payments left!
            var loan1 = new Models.Loan
            {
                BorrowerId = borrower.Id,
                PrincipalAmount = 30000,
                InterestRate = 15,
                TermMonths = 12,
                TotalRepayable = 34500, // 30000 + (30000 * 0.15)
                MonthlyInstallment = 2875.00m,
                Purpose = "Small business equipment",
                Status = Models.LoanStatus.Active,
                ApplicationDate = DateTime.UtcNow.AddMonths(-12),
                ApprovalDate = DateTime.UtcNow.AddMonths(-12).AddDays(2),
                StartDate = DateTime.UtcNow.AddMonths(-12).AddDays(3),
                EndDate = DateTime.UtcNow.AddMonths(2), // Ends in 2 months!
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan1);
            await context.SaveChangesAsync();

            // Add 10 repayments for loan 1 (only 2 payments left!)
            var repayments1 = new List<Models.Repayment>();
            for (int i = 0; i < 10; i++)
            {
                repayments1.Add(new Models.Repayment
                {
                    LoanId = loan1.Id,
                    Amount = 2875.00m,
                    PaymentDate = DateTime.UtcNow.AddMonths(-11 + i),
                    TransactionReference = $"TXN-NE{i + 1:D2}-{DateTime.UtcNow.Ticks}",
                    Status = Models.RepaymentStatus.Completed
                });
            }
            context.Repayments.AddRange(repayments1);

            // Loan 2: ALMOST DONE - Only 1 payment left!
            var loan2 = new Models.Loan
            {
                BorrowerId = admin.Id,
                PrincipalAmount = 15000,
                InterestRate = 15,
                TermMonths = 6,
                TotalRepayable = 17250,
                MonthlyInstallment = 2875.00m,
                Purpose = "Home improvement project",
                Status = Models.LoanStatus.Active,
                ApplicationDate = DateTime.UtcNow.AddMonths(-6),
                ApprovalDate = DateTime.UtcNow.AddMonths(-6).AddDays(1),
                StartDate = DateTime.UtcNow.AddMonths(-6).AddDays(2),
                EndDate = DateTime.UtcNow.AddDays(15), // Ends in 15 days!
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan2);
            await context.SaveChangesAsync();

            // Add 5 repayments for loan 2 (1 payment left!)
            var repayments2 = new List<Models.Repayment>();
            for (int i = 0; i < 5; i++)
            {
                repayments2.Add(new Models.Repayment
                {
                    LoanId = loan2.Id,
                    Amount = 2875.00m,
                    PaymentDate = DateTime.UtcNow.AddMonths(-5 + i),
                    TransactionReference = $"TXN-AD{i + 1:D2}-{DateTime.UtcNow.Ticks}",
                    Status = Models.RepaymentStatus.Completed
                });
            }
            context.Repayments.AddRange(repayments2);

            // Loan 3: JUST STARTED - Early stage
            var loan3 = new Models.Loan
            {
                BorrowerId = borrower.Id,
                PrincipalAmount = 50000,
                InterestRate = 15,
                TermMonths = 18,
                TotalRepayable = 57500,
                MonthlyInstallment = 3194.44m,
                Purpose = "Business expansion",
                Status = Models.LoanStatus.Active,
                ApplicationDate = DateTime.UtcNow.AddMonths(-2),
                ApprovalDate = DateTime.UtcNow.AddMonths(-2).AddDays(3),
                StartDate = DateTime.UtcNow.AddMonths(-2).AddDays(5),
                EndDate = DateTime.UtcNow.AddMonths(16),
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan3);
            await context.SaveChangesAsync();

            // Add 2 repayments for loan 3
            var repayments3 = new[]
            {
                new Models.Repayment
                {
                    LoanId = loan3.Id,
                    Amount = 3194.44m,
                    PaymentDate = DateTime.UtcNow.AddMonths(-1),
                    TransactionReference = $"TXN-JS1-{DateTime.UtcNow.Ticks}",
                    Status = Models.RepaymentStatus.Completed
                },
                new Models.Repayment
                {
                    LoanId = loan3.Id,
                    Amount = 3194.44m,
                    PaymentDate = DateTime.UtcNow.AddDays(-5),
                    TransactionReference = $"TXN-JS2-{DateTime.UtcNow.Ticks}",
                    Status = Models.RepaymentStatus.Completed
                }
            };
            context.Repayments.AddRange(repayments3);

            // Loan 4: COMPLETED - Success story
            var loan4 = new Models.Loan
            {
                BorrowerId = borrower.Id,
                PrincipalAmount = 25000,
                InterestRate = 15,
                TermMonths = 12,
                TotalRepayable = 28750,
                MonthlyInstallment = 2395.83m,
                Purpose = "Emergency medical expenses",
                Status = Models.LoanStatus.Completed,
                ApplicationDate = DateTime.UtcNow.AddMonths(-15),
                ApprovalDate = DateTime.UtcNow.AddMonths(-15).AddDays(1),
                StartDate = DateTime.UtcNow.AddMonths(-15).AddDays(2),
                EndDate = DateTime.UtcNow.AddMonths(-3),
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan4);
            await context.SaveChangesAsync();

            // Add all 12 repayments for completed loan
            var repayments4 = new List<Models.Repayment>();
            for (int i = 0; i < 12; i++)
            {
                repayments4.Add(new Models.Repayment
                {
                    LoanId = loan4.Id,
                    Amount = 2395.83m,
                    PaymentDate = DateTime.UtcNow.AddMonths(-14 + i),
                    TransactionReference = $"TXN-COMP{i + 1:D2}-{DateTime.UtcNow.Ticks}",
                    Status = Models.RepaymentStatus.Completed
                });
            }
            context.Repayments.AddRange(repayments4);

            // Loan 5: OVERDUE - Past term end with missed payments!
            var loan5 = new Models.Loan
            {
                BorrowerId = admin.Id,
                PrincipalAmount = 20000,
                InterestRate = 15,
                TermMonths = 6,
                TotalRepayable = 23000,
                MonthlyInstallment = 3833.33m,
                Purpose = "Vehicle repair",
                Status = Models.LoanStatus.Active,
                ApplicationDate = DateTime.UtcNow.AddMonths(-8),
                ApprovalDate = DateTime.UtcNow.AddMonths(-8).AddDays(2),
                StartDate = DateTime.UtcNow.AddMonths(-8).AddDays(3),
                EndDate = DateTime.UtcNow.AddMonths(-2),
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan5);
            await context.SaveChangesAsync();

            // Add only 4 repayments (missing 2 payments - overdue!)
            var repayments5 = new List<Models.Repayment>();
            for (int i = 0; i < 4; i++)
            {
                repayments5.Add(new Models.Repayment
                {
                    LoanId = loan5.Id,
                    Amount = 3833.33m,
                    PaymentDate = DateTime.UtcNow.AddMonths(-7 + i),
                    TransactionReference = $"TXN-OVR{i + 1:D2}-{DateTime.UtcNow.Ticks}",
                    Status = Models.RepaymentStatus.Completed
                });
            }
            context.Repayments.AddRange(repayments5);

            // Loan 6: PENDING APPROVAL - Recent application
            var loan6 = new Models.Loan
            {
                BorrowerId = borrower.Id,
                PrincipalAmount = 100000,
                InterestRate = 15,
                TermMonths = 24,
                TotalRepayable = 115000,
                MonthlyInstallment = 4791.67m,
                Purpose = "Business premises rental deposit",
                Status = Models.LoanStatus.Pending,
                ApplicationDate = DateTime.UtcNow.AddDays(-3),
                ApprovalDate = null,
                StartDate = null,
                EndDate = null,
                ApprovedBy = null
            };

            context.Loans.Add(loan6);

            // Loan 7: RECENTLY APPROVED - Ready to start
            var loan7 = new Models.Loan
            {
                BorrowerId = admin.Id,
                PrincipalAmount = 75000,
                InterestRate = 15,
                TermMonths = 18,
                TotalRepayable = 86250,
                MonthlyInstallment = 4791.67m,
                Purpose = "Stock purchase for retail business",
                Status = Models.LoanStatus.Approved,
                ApplicationDate = DateTime.UtcNow.AddDays(-10),
                ApprovalDate = DateTime.UtcNow.AddDays(-2),
                StartDate = null,
                EndDate = null,
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan7);

            // Loan 8: REJECTED - High risk application
            var loan8 = new Models.Loan
            {
                BorrowerId = borrower.Id,
                PrincipalAmount = 500000,
                InterestRate = 15,
                TermMonths = 36,
                TotalRepayable = 575000,
                MonthlyInstallment = 15972.22m,
                Purpose = "Real estate investment",
                Status = Models.LoanStatus.Rejected,
                ApplicationDate = DateTime.UtcNow.AddMonths(-1),
                ApprovalDate = DateTime.UtcNow.AddMonths(-1).AddDays(5),
                StartDate = null,
                EndDate = null,
                ApprovedBy = admin.Id
            };

            context.Loans.Add(loan8);

            await context.SaveChangesAsync();
        }
    }
}