using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using LendaKahleApp.Server.Hubs;
using System.Net;
using System.Text.RegularExpressions;

namespace LendaKahleApp.Server.Services
{
    public interface INotificationService
    {
        Task<Notification> CreateAsync(string userId, string title, string message, NotificationType type, int? relatedLoanId = null);
        Task<IEnumerable<Notification>> GetForUserAsync(string userId);
        Task<int> GetUnreadCountAsync(string userId);
        Task MarkAsReadAsync(string userId, int id);
        Task MarkAllAsReadAsync(string userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationsHub> _hubContext;

        public NotificationService(ApplicationDbContext context, IHubContext<NotificationsHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private static string NormalizeText(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            // Decode any HTML entities (e.g., &#10060;)
            var text = WebUtility.HtmlDecode(input);
            // Remove runs of question marks produced by unsupported emoji
            text = Regex.Replace(text, @"\?{2,}", string.Empty);
            // Collapse whitespace
            text = Regex.Replace(text, @"\s{2,}", " ");
            return text.Trim();
        }

        public async Task<Notification> CreateAsync(string userId, string title, string message, NotificationType type, int? relatedLoanId = null)
        {
            // Normalize before persistence
            var normalizedTitle = NormalizeText(title);
            var normalizedMessage = NormalizeText(message);

            var notification = new Notification
            {
                UserId = userId,
                Title = normalizedTitle,
                Message = normalizedMessage,
                Type = type,
                RelatedLoanId = relatedLoanId
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Push to the specific user via SignalR group (best effort - don't fail if hub unavailable)
            try
            {
                await _hubContext.Clients.Group($"user:{userId}").SendAsync("notification", new
                {
                    id = notification.Id,
                    title = normalizedTitle,
                    message = normalizedMessage,
                    type,
                    date = notification.CreatedAt,
                    read = false,
                    loanId = relatedLoanId
                });
            }
            catch (Exception ex)
            {
                // Log but don't fail - notification is saved in DB regardless
                Console.WriteLine($"SignalR push failed for user {userId}: {ex.Message}");
            }

            return notification;
        }

        public async Task<IEnumerable<Notification>> GetForUserAsync(string userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(string userId, int id)
        {
            var n = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (n != null)
            {
                n.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            var items = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            foreach (var n in items) n.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }
}
