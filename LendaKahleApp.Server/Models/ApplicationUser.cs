using Microsoft.AspNetCore.Identity;

namespace LendaKahleApp.Server.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string IDNumber { get; set; } = string.Empty; // South African ID Number
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Soft delete flags
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        
        public ICollection<Loan> Loans { get; set; } = new List<Loan>();
    }
}