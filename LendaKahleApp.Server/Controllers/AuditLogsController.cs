using LendaKahleApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditLogsController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var logs = await _auditService.GetAuditLogsAsync(skip, take);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetAuditLogsByUser(string userId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var logs = await _auditService.GetAuditLogsByUserAsync(userId, skip, take);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("entity/{entityType}/{entityId}")]
        public async Task<IActionResult> GetAuditLogsByEntity(string entityType, string entityId)
        {
            try
            {
                var logs = await _auditService.GetAuditLogsByEntityAsync(entityType, entityId);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
