using LendaKahleApp.Server.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly LendingRules _lendingRules;

        public SettingsController(IOptions<LendingRules> lendingRulesOptions)
        {
            _lendingRules = lendingRulesOptions.Value;
        }

        // Full lending rules (used by admin panel)
        [HttpGet("lendingrules")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetLendingRules()
        {
            // Return full lending rules including all nested objects
            return Ok(_lendingRules);
        }

        // Public summary endpoint for calculators (no auth required)
        [HttpGet("lendingrules/summary")]
        [AllowAnonymous]
        public IActionResult GetLendingRulesSummary()
        {
            var summary = new
            {
                AutoApproval = _lendingRules.AutoApproval,
                Fees = new
                {
                    InitiationFee = _lendingRules.Fees.InitiationFee,
                    MonthlyServiceFee = _lendingRules.Fees.MonthlyServiceFee,
                    CreditLife = _lendingRules.Fees.CreditLife
                },
                InterestRates = new
                {
                    BaseRates = _lendingRules.InterestRates.BaseRates,
                    Limits = _lendingRules.InterestRates.Limits
                },
                LoanTerms = _lendingRules.LoanTerms,
                Affordability = _lendingRules.Affordability,
                Deposits = _lendingRules.Deposits,
                LifeCover = _lendingRules.LifeCover
            };
            return Ok(summary);
        }
    }
}