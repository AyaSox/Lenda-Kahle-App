using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.DTOs;
using LendaKahleApp.Server.Interfaces;
using LendaKahleApp.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LendaKahleApp.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public AuthService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration, ApplicationDbContext context, INotificationService notificationService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            var user = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                IDNumber = registerDto.IDNumber,
                DateOfBirth = registerDto.DateOfBirth,
                PhoneNumber = registerDto.PhoneNumber,
                Address = registerDto.Address
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            // Assign default role, e.g., Borrower
            await _userManager.AddToRoleAsync(user, "Borrower");

            // Clean welcome notification (remove garbled emoji placeholders)
            await _notificationService.CreateAsync(
                user.Id,
                "Welcome to LendaKahle!",
                $"Welcome {user.FirstName}! Your account has been created successfully. You can now apply for loans and manage your finances with us.",
                NotificationType.General,
                null
            );

            return await GenerateAuthResponse(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
            {
                throw new Exception("Invalid login attempt.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            if (!result.Succeeded)
            {
                throw new Exception("Invalid login attempt.");
            }

            return await GenerateAuthResponse(user);
        }

        public async Task<ApplicationUserDto> GetUserProfileAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new Exception("User not found.");

            var roles = await _userManager.GetRolesAsync(user);
            return new ApplicationUserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IDNumber = user.IDNumber,
                PhoneNumber = user.PhoneNumber!,
                Roles = roles
            };
        }

        public async Task<bool> UpdateUserProfileAsync(string userId, ApplicationUserDto userDto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            user.FirstName = userDto.FirstName;
            user.LastName = userDto.LastName;
            user.IDNumber = userDto.IDNumber;
            user.PhoneNumber = userDto.PhoneNumber;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        public async Task<bool> RequestPasswordResetAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) return false; // Don't reveal if user exists

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            
            // In a real application, you would send this via email
            // For demo purposes, we'll log it (in production, implement proper email service)
            Console.WriteLine($"Password reset token for {email}: {token}");
            
            return true;
        }

        public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) return false;

            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            return result.Succeeded;
        }

        private async Task<AuthResponseDto> GenerateAuthResponse(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
            };
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(7);

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: expires,
                signingCredentials: creds
            );

            return new AuthResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = expires,
                User = await GetUserProfileAsync(user.Id)
            };
        }
    }
}