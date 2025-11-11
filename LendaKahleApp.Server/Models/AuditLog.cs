namespace LendaKahleApp.Server.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty; // Who performed the action
        public string UserEmail { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // e.g., "LoanApproved", "LoanRejected", "UserCreated"
        public string EntityType { get; set; } = string.Empty; // e.g., "Loan", "User", "Repayment"
        public string EntityId { get; set; } = string.Empty; // ID of the affected entity
        public string Details { get; set; } = string.Empty; // JSON or text description
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
    }

    public enum AuditAction
    {
        // Loan actions
        LoanApplicationCreated,
        LoanPreApproved,
        LoanApproved,
        LoanRejected,
        LoanStatusChanged,
        
        // Repayment actions
        RepaymentMade,
        RepaymentReceived,
        
        // User actions
        UserRegistered,
        UserLogin,
        UserLogout,
        UserCreated,
        UserUpdated,
        UserDeleted,
        UserRoleChanged,
        
        // System actions
        SettingsChanged,
        ReportGenerated,
        DataExported
    }
}
