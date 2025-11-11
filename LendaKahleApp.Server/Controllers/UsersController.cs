using LendaKahleApp.Server.Models;
using LendaKahleApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditService _auditService;

        public UsersController(UserManager<ApplicationUser> userManager, IAuditService auditService)
        {
            _userManager = userManager;
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _userManager.Users.ToListAsync();
                
                var userDtos = new List<object>();
                
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDtos.Add(new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        roles = roles,
                        dateCreated = user.CreatedDate,
                        isActive = !user.IsDeleted && (!user.LockoutEnd.HasValue || user.LockoutEnd.Value <= DateTimeOffset.UtcNow),
                        isDeleted = user.IsDeleted
                    });
                }
                
                return Ok(userDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            try
            {
                // Include deleted user fetch if needed
                var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
                if (user == null) return NotFound();

                var roles = await _userManager.GetRolesAsync(user);
                
                return Ok(new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    idNumber = user.IDNumber,
                    dateOfBirth = user.DateOfBirth,
                    phoneNumber = user.PhoneNumber,
                    address = user.Address,
                    roles = roles,
                    isActive = !user.IsDeleted && !user.LockoutEnabled,
                    isDeleted = user.IsDeleted,
                    deletedAt = user.DeletedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
                if (currentUserId == id)
                {
                    return BadRequest("You cannot delete your own account.");
                }

                // Fetch ignoring filter to allow deleting even if already deleted
                var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
                if (user == null) return NotFound("User not found");

                if (user.IsDeleted)
                {
                    return BadRequest("User already deleted.");
                }

                // Soft delete
                user.IsDeleted = true;
                user.DeletedAt = DateTime.UtcNow;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                    return BadRequest(errors);
                }

                var roles = await _userManager.GetRolesAsync(user);
                var details = new
                {
                    TargetUserId = user.Id,
                    TargetEmail = user.Email,
                    TargetName = $"{user.FirstName} {user.LastName}",
                    Roles = roles,
                    DeletedAt = user.DeletedAt
                };

                await _auditService.LogAsync(
                    currentUserId ?? string.Empty,
                    currentUserEmail,
                    AuditAction.UserDeleted,
                    entityType: "User",
                    entityId: id,
                    details: details,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty,
                    userAgent: Request.Headers["User-Agent"].ToString()
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
