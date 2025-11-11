namespace LendaKahleApp.Server.Configuration
{
    public class LendingRules
    {
        public AutoApprovalSettings AutoApproval { get; set; } = new AutoApprovalSettings();
        public FeeSettings Fees { get; set; } = new FeeSettings();
        public InterestRateSettings InterestRates { get; set; } = new InterestRateSettings();
        public LoanTermSettings LoanTerms { get; set; } = new LoanTermSettings();

        // New: additional affordability and policy settings
        public AffordabilitySettings Affordability { get; set; } = new AffordabilitySettings();
        public DepositSettings Deposits { get; set; } = new DepositSettings();
        public LifeCoverSettings LifeCover { get; set; } = new LifeCoverSettings();

        public class AutoApprovalSettings
        {
            public bool Enabled { get; set; } = true;
            public decimal MaxAutoApprovalAmount { get; set; } = 30000m;
            public decimal MinimumMonthlyGrossIncome { get; set; } = 5000m;
            public decimal MinimumMonthlyNetIncome { get; set; } = 3500m;
            public decimal MaxDebtToIncomeRatio { get; set; } = 40m;
            public decimal MinimumDisposableIncomeAfterLoan { get; set; } = 2500m;
            public bool RequireDocumentVerification { get; set; } = true;
            public bool RequireCreditCheck { get; set; } = false;
        }

        public class FeeSettings
        {
            public InitiationFeeSettings InitiationFee { get; set; } = new InitiationFeeSettings();
            public decimal MonthlyServiceFee { get; set; } = 60m;
            public CreditLifeSettings CreditLife { get; set; } = new CreditLifeSettings();

            public class InitiationFeeSettings
            {
                public bool Enabled { get; set; } = true;
                public decimal BaseAmount { get; set; } = 1140m;
                public decimal PercentageAbove1000 { get; set; } = 10.0m; // percent
                public decimal MaximumFee { get; set; } = 2190m;
            }

            public class CreditLifeSettings
            {
                public bool Enabled { get; set; } = true;
                public decimal RequiredAboveAmount { get; set; } = 10000m;
                public decimal MonthlyRatePercentage { get; set; } = 0.8m;
                // New: minimum life cover percent of outstanding balance (for business rules)
                public decimal MinimumCoverPercent { get; set; } = 100m;
            }
        }

        public class InterestRateSettings
        {
            public BaseRatesSettings BaseRates { get; set; } = new BaseRatesSettings();
            public RiskAdjustmentsSettings RiskAdjustments { get; set; } = new RiskAdjustmentsSettings();
            public LimitsSettings Limits { get; set; } = new LimitsSettings();

            public class BaseRatesSettings
            {
                public decimal SmallLoanBase { get; set; } = 27.5m;
                public decimal MediumLoanBase { get; set; } = 24.0m;
                public decimal LargeLoanBase { get; set; } = 22.0m;
            }

            public class RiskAdjustmentsSettings
            {
                public CategorySettings ExcellentAffordability { get; set; } = new CategorySettings { MaxDTI = 25m, MinDisposableIncome = 5000m, RateAdjustment = -6.0m };
                public CategorySettings GoodAffordability { get; set; } = new CategorySettings { MaxDTI = 30m, MinDisposableIncome = 3500m, RateAdjustment = -3.0m };
                public CategorySettings AverageAffordability { get; set; } = new CategorySettings { MaxDTI = 35m, MinDisposableIncome = 2500m, RateAdjustment = 0m };
                public CategorySettings BelowAverageAffordability { get; set; } = new CategorySettings { MaxDTI = 40m, MinDisposableIncome = 2000m, RateAdjustment = 2.0m };
                public CategorySettings PoorAffordability { get; set; } = new CategorySettings { RateAdjustment = 3.5m };

                public class CategorySettings
                {
                    public decimal MaxDTI { get; set; }
                    public decimal MinDisposableIncome { get; set; }
                    public decimal RateAdjustment { get; set; }
                }
            }

            public class LimitsSettings
            {
                public decimal MinimumRate { get; set; } = 15.0m;
                public decimal MaximumRate { get; set; } = 27.5m;
            }
        }

        public class LoanTermSettings
        {
            public TermCategory SmallLoans { get; set; } = new TermCategory { MinTermMonths = 3, MaxTermMonths = 6 };
            public TermCategory MediumLoans { get; set; } = new TermCategory { MinTermMonths = 6, MaxTermMonths = 12 };
            public TermCategory LargeLoans { get; set; } = new TermCategory { MinTermMonths = 12, MaxTermMonths = 24 };

            public class TermCategory
            {
                public int MinTermMonths { get; set; }
                public int MaxTermMonths { get; set; }
            }
        }

        public class AffordabilitySettings
        {
            // Additional DTI and disposable income rules
            public decimal MaxDebtToIncomeRatio { get; set; } = 40m;
            public decimal MinimumDisposableIncomeAfterLoan { get; set; } = 2500m;
            // Residual minimum cushion required after loan payment
            public decimal MinimumResidualAmount { get; set; } = 1500m;
            // Minimum percentage of household income that must remain as reserve (e.g., 10%)
            public decimal MinimumReservePercent { get; set; } = 10m;
        }

        public class DepositSettings
        {
            // Require a deposit or upfront payment as a percentage of principal (0-100)
            public bool RequireDeposit { get; set; } = false;
            public decimal MinimumDepositPercent { get; set; } = 0m;
            // If true, deposits reduce total principal used for affordability checks
            public bool DepositReducesPrincipal { get; set; } = true;
        }

        public class LifeCoverSettings
        {
            // Global life cover requirement settings
            public bool RequireLifeCoverForLargeLoans { get; set; } = true;
            public decimal ThresholdAmount { get; set; } = 10000m; // above this life cover is required
            public decimal MinimumCoverPercent { get; set; } = 100m; // percent of outstanding balance
        }
    }
}
