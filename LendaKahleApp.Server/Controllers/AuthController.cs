using LendaKahleApp.Server.DTOs;
using LendaKahleApp.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LendaKahleApp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            try
            {
                // Validate model
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    _logger.LogWarning("Registration validation failed for {Email}. Errors: {Errors}", 
                        model.Email, string.Join(", ", errors));

                    return BadRequest(new { 
                        success = false,
                        message = "Please check your registration details.",
                        errors = errors
                    });
                }

                // Check if email already exists
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning("Registration attempt with existing email: {Email}", model.Email);
                    
                    return BadRequest(new { 
                        success = false,
                        message = $"An account with email '{model.Email}' already exists. Please login instead.",
                        errors = new[] { "Email already registered" }
                    });
                }

                // Create user
                var user = new ApplicationUser
                {
                    UserName = model.Email,
                    Email = model.Email,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    IDNumber = model.IDNumber,
                    DateOfBirth = DateTime.SpecifyKind(model.DateOfBirth, DateTimeKind.Utc),
                    Address = model.Address,
                    PhoneNumber = model.PhoneNumber,
                    CreatedDate = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description).ToList();
                    
                    _logger.LogWarning("User creation failed for {Email}. Errors: {Errors}", 
                        model.Email, string.Join(", ", errors));

                    return BadRequest(new { 
                        success = false,
                        message = "Registration failed. Please check the requirements below:",
                        errors = errors
                    });
                }

                // Add default "User" role
                var roleResult = await _userManager.AddToRoleAsync(user, "User");
                
                if (!roleResult.Succeeded)
                {
                    _logger.LogError("Failed to assign User role to {Email}", model.Email);
                    // Don't fail registration, just log the error
                }

                _logger.LogInformation("User {Email} registered successfully", model.Email);

                // Generate JWT token for immediate login
                var token = await GenerateJwtToken(user);
                var roles = await _userManager.GetRolesAsync(user);

                return Ok(new { 
                    success = true,
                    message = $"Welcome aboard, {user.FirstName}! Your account has been created successfully.",
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        roles = roles
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during registration for {Email}", model?.Email ?? "unknown");
                
                return StatusCode(500, new { 
                    success = false,
                    message = "An unexpected error occurred. Please try again later.",
                    error = ex.Message
                });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            try
            {
                // Validate model
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return BadRequest(new { 
                        success = false,
                        message = "Please provide both email and password.",
                        errors = errors
                    });
                }

                // Check if user exists
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    _logger.LogWarning("Login attempt with non-existent email: {Email}", model.Email);
                    
                    return Unauthorized(new { 
                        success = false,
                        message = "No account found with this email address. Please check your email or register for a new account.",
                        error = "Invalid credentials"
                    });
                }

                // Check if account is locked
                if (await _userManager.IsLockedOutAsync(user))
                {
                    _logger.LogWarning("Login attempt on locked account: {Email}", model.Email);
                    
                    return Unauthorized(new { 
                        success = false,
                        message = "Your account has been locked due to multiple failed login attempts. Please try again later or contact support.",
                        error = "Account locked"
                    });
                }

                // Verify password
                var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
                
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed login attempt for {Email} - incorrect password", model.Email);
                    
                    if (result.IsLockedOut)
                    {
                        return Unauthorized(new { 
                            success = false,
                            message = "Your account has been locked due to multiple failed login attempts.",
                            error = "Account locked"
                        });
                    }

                    if (result.IsNotAllowed)
                    {
                        return Unauthorized(new { 
                            success = false,
                            message = "Your account is not allowed to sign in. Please confirm your email address.",
                            error = "Sign in not allowed"
                        });
                    }

                    if (result.RequiresTwoFactor)
                    {
                        return Unauthorized(new { 
                            success = false,
                            message = "Two-factor authentication is required.",
                            error = "2FA required"
                        });
                    }

                    // Generic password failure
                    return Unauthorized(new { 
                        success = false,
                        message = "Incorrect password. Please try again or use 'Forgot Password' if you can't remember it.",
                        error = "Invalid credentials"
                    });
                }

                // Generate JWT token
                var token = await GenerateJwtToken(user);
                var roles = await _userManager.GetRolesAsync(user);

                _logger.LogInformation("User {Email} logged in successfully", model.Email);

                return Ok(new
                {
                    success = true,
                    message = $"Welcome back, {user.FirstName}!",
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        roles = roles
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during login for {Email}", model?.Email ?? "unknown");
                
                return StatusCode(500, new { 
                    success = false,
                    message = "An unexpected error occurred during login. Please try again later.",
                    error = ex.Message
                });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { 
                        success = false,
                        message = "You are not logged in. Please login to continue.",
                        error = "Unauthorized"
                    });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User profile requested for non-existent user ID: {UserId}", userId);
                    
                    return NotFound(new { 
                        success = false,
                        message = "User account not found. Please login again.",
                        error = "User not found"
                    });
                }

                var roles = await _userManager.GetRolesAsync(user);

                return Ok(new
                {
                    success = true,
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    phoneNumber = user.PhoneNumber,
                    idNumber = user.IDNumber,
                    dateOfBirth = user.DateOfBirth,
                    address = user.Address,
                    roles = roles
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                
                return StatusCode(500, new { 
                    success = false,
                    message = "Failed to retrieve user profile.",
                    error = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userEmail = User.FindFirstValue(ClaimTypes.Email);
                
                await _signInManager.SignOutAsync();
                
                _logger.LogInformation("User {Email} logged out successfully", userEmail);
                
                return Ok(new { 
                    success = true,
                    message = "You have been logged out successfully. See you next time!"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                
                return StatusCode(500, new { 
                    success = false,
                    message = "An error occurred during logout.",
                    error = ex.Message
                });
            }
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddDays(7);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
