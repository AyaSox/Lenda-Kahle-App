using System.ComponentModel.DataAnnotations;

namespace LendaKahleApp.Server.Models
{
    public class Notification
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public NotificationType Type { get; set; } = NotificationType.General;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        public int? RelatedLoanId { get; set; }
    }

    public enum NotificationType
    {
        General = 0,
        LoanPreApproved = 1,
        LoanApproval = 2,
        LoanRejected = 3,
        PaymentReceived = 4,
        PaymentDue = 5,
        LoanOverdue = 6,
        ApplicationSubmitted = 7,
        DocumentVerified = 8,
        DocumentRejected = 9,
        LoanCompleted = 10,
        ApplicationFlagged = 11 // new distinct type for flagged/manual review applications
    }
}
