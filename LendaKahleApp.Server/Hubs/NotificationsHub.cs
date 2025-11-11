using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LendaKahleApp.Server.Hubs
{
    [Authorize]
    public class NotificationsHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            // Use User.FindFirst to get userId from claims
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
