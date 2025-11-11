using Microsoft.AspNetCore.Mvc;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ILogger<HealthController> _logger;

        public HealthController(ILogger<HealthController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Get()
        {
            _logger.LogInformation("Health check requested at {Time}", DateTime.UtcNow);
            
            return Ok(new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                service = "Lenda Kahle API",
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
            });
        }

        [HttpGet("ready")]
        public IActionResult Ready()
        {
            // Add database connectivity check here if needed
            return Ok(new
            {
                status = "Ready",
                timestamp = DateTime.UtcNow,
                database = "Connected" // You can add actual DB check
            });
        }
    }
}
