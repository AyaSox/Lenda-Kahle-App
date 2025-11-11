using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace LendaKahleApp.Server.Services
{
    public interface IAuditService
    {
        Task LogAsync(string userId, string userEmail, AuditAction action, string entityType, string entityId, object? details = null, string ipAddress = "", string userAgent = "");
        Task<IEnumerable<AuditLog>> GetAuditLogsAsync(int skip = 0, int take = 50);
        Task<IEnumerable<AuditLog>> GetAuditLogsByUserAsync(string userId, int skip = 0, int take = 50);
        Task<IEnumerable<AuditLog>> GetAuditLogsByEntityAsync(string entityType, string entityId);
    }

    public class AuditService : IAuditService
    {
        private readonly ApplicationDbContext _context;

        public AuditService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            string userId, 
            string userEmail, 
            AuditAction action, 
            string entityType, 
            string entityId, 
            object? details = null, 
            string ipAddress = "", 
            string userAgent = "")
        {
            try
            {
                var auditLog = new AuditLog
                {
                    UserId = userId,
                    UserEmail = userEmail,
                    Action = action.ToString(),
                    EntityType = entityType,
                    EntityId = entityId,
                    Details = details != null ? JsonSerializer.Serialize(details) : string.Empty,
                    Timestamp = DateTime.UtcNow,
                    IpAddress = ipAddress,
                    UserAgent = userAgent
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log to console/file but don't throw - audit failures shouldn't break app functionality
                Console.WriteLine($"Audit logging failed: {ex.Message}");
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsAsync(int skip = 0, int take = 50)
        {
            return await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByUserAsync(string userId, int skip = 0, int take = 50)
        {
            return await _context.AuditLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByEntityAsync(string entityType, string entityId)
        {
            return await _context.AuditLogs
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();
        }
    }
}
