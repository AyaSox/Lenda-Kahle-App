using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.Models;
using LendaKahleApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public SystemSettingsController(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        // Public, read-only endpoint for clients to get enforcement limits
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublic()
        {
            var settings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
            if (settings == null)
            {
                settings = new SystemSettings { Id = 1 };
                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return Ok(new { 
                maxLoanAmount = settings.MaxLoanAmount, 
                maxLoanTermMonths = settings.MaxLoanTermMonths,
                interestRates = new {
                    smallLoanBase = settings.SmallLoanBaseRate,
                    mediumLoanBase = settings.MediumLoanBaseRate,
                    largeLoanBase = settings.LargeLoanBaseRate,
                    minimumRate = settings.MinimumInterestRate,
                    maximumRate = settings.MaximumInterestRate
                }
            });
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var settings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
            if (settings == null)
            {
                settings = new SystemSettings { Id = 1 };
                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return Ok(settings);
        }

        public class UpdateSystemSettingsDto
        {
            public decimal MaxLoanAmount { get; set; }
            public int MaxLoanTermMonths { get; set; }
            public decimal SmallLoanBaseRate { get; set; }
            public decimal MediumLoanBaseRate { get; set; }
            public decimal LargeLoanBaseRate { get; set; }
            public decimal MinimumInterestRate { get; set; }
            public decimal MaximumInterestRate { get; set; }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateSystemSettingsDto dto)
        {
            if (dto.MaxLoanAmount <= 0 || dto.MaxLoanTermMonths <= 0)
                return BadRequest("Invalid loan amount or term values");
            
            if (dto.SmallLoanBaseRate < 0 || dto.MediumLoanBaseRate < 0 || dto.LargeLoanBaseRate < 0)
                return BadRequest("Interest rates cannot be negative");
            
            if (dto.MinimumInterestRate > dto.MaximumInterestRate)
                return BadRequest("Minimum interest rate cannot exceed maximum interest rate");

            var settings = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Id == 1);
            if (settings == null)
            {
                settings = new SystemSettings { Id = 1 };
                _context.SystemSettings.Add(settings);
            }

            settings.MaxLoanAmount = dto.MaxLoanAmount;
            settings.MaxLoanTermMonths = dto.MaxLoanTermMonths;
            settings.SmallLoanBaseRate = dto.SmallLoanBaseRate;
            settings.MediumLoanBaseRate = dto.MediumLoanBaseRate;
            settings.LargeLoanBaseRate = dto.LargeLoanBaseRate;
            settings.MinimumInterestRate = dto.MinimumInterestRate;
            settings.MaximumInterestRate = dto.MaximumInterestRate;
            settings.UpdatedAt = DateTime.UtcNow;
            settings.UpdatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            settings.UpdatedByEmail = User.FindFirstValue(ClaimTypes.Email);

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                settings.UpdatedByUserId ?? string.Empty,
                settings.UpdatedByEmail ?? string.Empty,
                AuditAction.SettingsChanged,
                entityType: "SystemSettings",
                entityId: "1",
                details: new { 
                    settings.MaxLoanAmount, 
                    settings.MaxLoanTermMonths,
                    settings.SmallLoanBaseRate,
                    settings.MediumLoanBaseRate,
                    settings.LargeLoanBaseRate,
                    settings.MinimumInterestRate,
                    settings.MaximumInterestRate
                }
            );

            return Ok(settings);
        }
    }
}
