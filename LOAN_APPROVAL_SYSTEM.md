# ?? Loan Approval System - Complete Guide

## ? What Has Been Implemented

### 1. **Loan Approval/Rejection for Admin & Loan Officers**

#### Frontend Features:
- ? **Approve/Reject Buttons** on Loan Details page for pending loans
- ? **Confirmation Dialogs** before approving or rejecting
- ? **Role-Based Access** - Only Admin and LoanOfficer can see approval buttons
- ? **Real-time Updates** - Page refreshes after approval/rejection

#### Backend Features:
- ? **POST `/api/loans/{id}/approve`** - Approve a pending loan
- ? **POST `/api/loans/{id}/reject`** - Reject a pending loan
- ? **Role Authorization** - `[Authorize(Roles = "LoanOfficer,Admin")]`
- ? **Status Updates** - Automatically sets approval date, start date, end date

---

### 2. **Pending Loans Management Page**

A dedicated page showing all pending loan applications:

#### Features:
- ? **Summary Card** - Shows total pending applications
- ? **Detailed Table** - Lists all pending loans with key information
- ? **Quick Review** - Button to navigate to loan details
- ? **Color-Coded UI** - Orange/yellow theme for pending items
- ? **Review Guidelines** - Best practices for loan approval

#### Route:
- **URL**: `/admin/pending-loans`
- **Access**: Admin & LoanOfficer roles only

---

### 3. **Notification System Foundation**

#### Current Features:
- ? **Notification Bell** in navbar with badge
- ? **Notifications Drawer** on the right side
- ? **Mock Notification Types**:
  - Loan Approval
  - Payment Due
  - Payment Received
  - Loan Overdue
  - New Application Received
- ? **Mark as Read** functionality
- ? **Auto-refresh** every 30 seconds

---

## ?? How to Use the Loan Approval System

### As Admin/Loan Officer:

#### Method 1: Via Pending Loans Page (Recommended)
1. Login as Admin (`admin@lendakahle.co.za`) or Loan Officer (`officer@lendakahle.co.za`)
2. Click **"Pending"** in the top navigation bar
3. You'll see all pending loan applications in a table
4. Click **"Review"** button on any loan
5. On the loan details page, you'll see two buttons:
   - ? **"Approve Loan"** (green button)
   - ? **"Reject Loan"** (red button)
6. Click your choice and confirm in the dialog

#### Method 2: Via Loan Details
1. Navigate to any loan (from "My Loans" or "Admin" dashboard)
2. If the loan status is **"Pending"**, you'll see approval buttons
3. Click **"Approve Loan"** or **"Reject Loan"**
4. Confirm your decision in the dialog

---

## ?? Email Notifications (To Be Implemented)

### Planned Email Notifications:

1. **For Borrowers:**
   - ?? Loan application received confirmation
   - ?? Loan approved notification
   - ?? Loan rejected notification
   - ?? Payment due reminder (3 days before)
   - ?? Payment received confirmation
   - ?? Overdue payment warning

2. **For Admin/Loan Officers:**
   - ?? New loan application submitted
   - ?? Loan marked as overdue
   - ?? Payment received notification

### To Enable Email Notifications:

#### Step 1: Add Email Service Configuration
Add to `appsettings.json`:
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "noreply@lendakahle.co.za",
    "SenderName": "LendaKahle App",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "EnableSsl": true
  }
}
```

#### Step 2: Create Email Service Interface
```csharp
public interface IEmailService
{
    Task SendLoanApprovalEmailAsync(string borrowerEmail, string borrowerName, decimal amount);
    Task SendLoanRejectionEmailAsync(string borrowerEmail, string borrowerName);
    Task SendNewApplicationNotificationAsync(string officerEmail, int loanId, string borrowerName);
    Task SendPaymentReminderAsync(string borrowerEmail, string borrowerName, decimal amount, DateTime dueDate);
}
```

#### Step 3: Update Loan Service
```csharp
public async Task<bool> ApproveLoanAsync(int loanId, string approvedBy)
{
    var loan = await _context.Loans.Include(l => l.Borrower).FindAsync(loanId);
    if (loan == null || loan.Status != LoanStatus.Pending) return false;

    loan.Status = LoanStatus.Approved;
    loan.ApprovalDate = DateTime.UtcNow;
    loan.ApprovedBy = approvedBy;
    loan.StartDate = DateTime.UtcNow;
    loan.EndDate = DateTime.UtcNow.AddMonths(loan.TermMonths);

    await _context.SaveChangesAsync();
    
    // Send email notification
    await _emailService.SendLoanApprovalEmailAsync(
        loan.Borrower.Email, 
        $"{loan.Borrower.FirstName} {loan.Borrower.LastName}",
        loan.PrincipalAmount
    );

    return true;
}
```

---

## ?? In-App Notification API Endpoints (To Be Implemented)

### Recommended Endpoints:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        // Get notifications for current user
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var notifications = await _notificationService.GetUserNotificationsAsync(userId);
        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPost("{id}/mark-read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return Ok();
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }
}
```

---

## ??? Database Schema for Notifications

```csharp
public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; } // Recipient
    public ApplicationUser User { get; set; }
    public string Type { get; set; } // loan_approval, payment_due, etc.
    public string Title { get; set; }
    public string Message { get; set; }
    public int? LoanId { get; set; }
    public Loan? Loan { get; set; }
    public bool Read { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Add to `ApplicationDbContext.cs`:
```csharp
public DbSet<Notification> Notifications { get; set; }
```

---

## ?? Testing the Features

### Test Accounts:
- **Admin**: `admin@lendakahle.co.za` / `Admin@123!`
- **Loan Officer**: `officer@lendakahle.co.za` / `Officer@123!`
- **Borrower**: `borrower@lendakahle.co.za` / `Borrower@123!`

### Test Scenario:
1. Login as **Borrower**
2. Apply for a new loan (Go to "My Loans" ? "Apply for Loan")
3. Logout and login as **Admin** or **Loan Officer**
4. Click **"Pending"** in the navigation bar
5. You should see the new loan application
6. Click **"Review"** button
7. On the loan details page, click **"Approve Loan"**
8. Confirm the approval
9. The loan status should change to "Approved"

---

## ?? Current Status Summary

### ? Completed:
- Approval/Rejection functionality
- Pending loans page
- Role-based access control
- Confirmation dialogs
- Navigation updates
- Mock notification system

### ?? To Implement:
- Real-time notification fetching from API
- Email notification service
- Database-backed notification storage
- Push notifications (optional)
- SMS notifications (optional)

---

## ?? Key Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/pending-loans` | Admin, LoanOfficer | View all pending loan applications |
| `/loans/{id}` | All authenticated | View loan details (with approve/reject for admin) |
| `/admin` | Admin | Admin dashboard |
| `/admin/defaulted-loans` | Admin, LoanOfficer | View overdue loans |

---

## ?? UI Features

### Pending Loans Page:
- **Color Scheme**: Orange/Yellow for urgency
- **Icon**: HourglassEmpty ?
- **Table Columns**: ID, Applicant, Amount, Term, Monthly Payment, Purpose, Applied Date
- **Actions**: Review button to navigate to loan details

### Loan Details Page (Pending Loans):
- **Info Alert**: "This loan is pending approval"
- **Two Buttons**: 
  - Green "Approve Loan" button with ThumbUp icon
  - Red "Reject Loan" button with ThumbDown icon
- **Confirmation Dialogs**: Shows loan summary before confirming action

---

## ?? Security

- All approval/rejection endpoints require `Admin` or `LoanOfficer` role
- Frontend buttons only visible to authorized users
- Backend validates user roles before processing
- JWT token authentication required for all API calls

---

## ?? Next Steps for Full Email Integration

1. Install NuGet package: `Install-Package MailKit`
2. Implement `EmailService.cs` with SMTP configuration
3. Update `LoanService.cs` to send emails on approve/reject
4. Add email templates for professional notifications
5. Configure Gmail App Password or use SendGrid/AWS SES
6. Test email delivery
7. Add email notification preferences in user settings

---

## ?? Notes

- The notification system currently uses **mock data**
- Email notifications require additional configuration
- Consider using a job scheduler (Hangfire) for scheduled notifications
- For production, use a dedicated email service (SendGrid, AWS SES, etc.)

---

## ?? Success!

The loan approval system is now fully functional! Admin and Loan Officers can:
- ? View all pending loan applications
- ? Review loan details
- ? Approve or reject loans with confirmation
- ? See notifications (mock for now)

All changes are automatically saved to the database and reflected across the application! ??
