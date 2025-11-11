using LendaKahleApp.Server.DTOs;
using LendaKahleApp.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;

        public LoansController(ILoanService loanService)
        {
            _loanService = loanService;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyForLoan([FromBody] LoanApplicationDto applicationDto)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) return Unauthorized();

                var loan = await _loanService.ApplyForLoanAsync(userId, applicationDto);
                return Ok(loan);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyLoans()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var loans = await _loanService.GetLoansForBorrowerAsync(userId);
            return Ok(loans);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllLoans()
        {
            var loans = await _loanService.GetAllLoansAsync();
            return Ok(loans);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLoan(int id)
        {
            var loan = await _loanService.GetLoanByIdAsync(id);
            if (loan == null) return NotFound();
            return Ok(loan);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveLoan(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var success = await _loanService.ApproveLoanAsync(id, userId);
            return success ? Ok() : BadRequest("Approval failed");
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectLoan(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var success = await _loanService.RejectLoanAsync(id, userId);
            return success ? Ok() : BadRequest("Rejection failed");
        }

        [HttpPost("repay")]
        public async Task<IActionResult> MakeRepayment([FromBody] MakeRepaymentDto repaymentDto)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) return Unauthorized();

                var repayment = await _loanService.MakeRepaymentAsync(userId, repaymentDto);
                return Ok(repayment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id}/repayments")]
        public async Task<IActionResult> GetRepayments(int id)
        {
            var repayments = await _loanService.GetRepaymentsForLoanAsync(id);
            return Ok(repayments);
        }
    }
}