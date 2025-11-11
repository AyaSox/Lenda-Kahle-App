# ?? Email Notification Implementation Guide

## Overview

This guide shows how to add email notifications to the LendaKahle loan approval system.

---

## Step 1: Install Required Package

```bash
cd LendaKahleApp.Server
dotnet add package MailKit
dotnet add package MimeKit
```

---

## Step 2: Add Email Configuration

Add to `appsettings.json`:

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "noreply@lendakahle.co.za",
    "SenderName": "LendaKahle Microfinance",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "EnableSsl": true
  },
  "AdminEmails": [
    "admin@lendakahle.co.za",
    "officer@lendakahle.co.za"
  ]
}
```

### Gmail Setup:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Create a new app password for "Mail"
5. Use this password in `appsettings.json`

---

## Step 3: Create Email Service Interface

Create `LendaKahleApp.Server/Interfaces/IEmailService.cs`:

```csharp
namespace LendaKahleApp.Server.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);
        Task SendLoanApplicationNotificationAsync(int loanId, string borrowerName, decimal amount);
        Task SendLoanApprovalEmailAsync(string borrowerEmail, string borrowerName, decimal amount, int loanId);
        Task SendLoanRejectionEmailAsync(string borrowerEmail, string borrowerName, int loanId);
        Task SendPaymentReminderAsync(string borrowerEmail, string borrowerName, decimal amount, DateTime dueDate);
        Task SendPaymentReceivedAsync(string borrowerEmail, string borrowerName, decimal amount, int loanId);
    }
}
```

---

## Step 4: Implement Email Service

Create `LendaKahleApp.Server/Services/EmailService.cs`:

```csharp
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using LendaKahleApp.Server.Interfaces;
using Microsoft.Extensions.Configuration;

namespace LendaKahleApp.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                emailSettings["SenderName"], 
                emailSettings["SenderEmail"]
            ));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(
                    emailSettings["SmtpServer"], 
                    int.Parse(emailSettings["SmtpPort"]!), 
                    SecureSocketOptions.StartTls
                );
                
                await client.AuthenticateAsync(
                    emailSettings["Username"], 
                    emailSettings["Password"]
                );
                
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                throw;
            }
        }

        public async Task SendLoanApplicationNotificationAsync(int loanId, string borrowerName, decimal amount)
        {
            var adminEmails = _configuration.GetSection("AdminEmails").Get<string[]>();
            var subject = $"?? New Loan Application #{loanId} - Requires Review";
            
            var htmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                        .content {{ background-color: #f9f9f9; padding: 20px; }}
                        .button {{ background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px; }}
                        .info {{ background-color: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>New Loan Application</h2>
                        </div>
                        <div class='content'>
                            <p>Hello,</p>
                            <p>A new loan application has been submitted and requires your review.</p>
                            
                            <div class='info'>
                                <p><strong>Loan ID:</strong> #{loanId}</p>
                                <p><strong>Applicant:</strong> {borrowerName}</p>
                                <p><strong>Amount Requested:</strong> R{amount:N2}</p>
                            </div>
                            
                            <p>Please review this application as soon as possible.</p>
                            
                            <p style='text-align: center; margin-top: 30px;'>
                                <a href='http://localhost:5173/admin/pending-loans' class='button'>
                                    Review Application
                                </a>
                            </p>
                            
                            <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                                This is an automated notification from LendaKahle Microfinance System.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            foreach (var email in adminEmails ?? Array.Empty<string>())
            {
                try
                {
                    await SendEmailAsync(email, subject, htmlBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send email to {email}: {ex.Message}");
                }
            }
        }

        public async Task SendLoanApprovalEmailAsync(string borrowerEmail, string borrowerName, decimal amount, int loanId)
        {
            var subject = $"? Loan Application Approved - #{loanId}";
            
            var htmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #4caf50; color: white; padding: 20px; text-align: center; }}
                        .content {{ background-color: #f9f9f9; padding: 20px; }}
                        .success {{ background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 15px 0; }}
                        .button {{ background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>?? Congratulations!</h2>
                            <p>Your Loan Has Been Approved</p>
                        </div>
                        <div class='content'>
                            <p>Dear {borrowerName},</p>
                            <p>We are pleased to inform you that your loan application has been <strong>approved</strong>!</p>
                            
                            <div class='success'>
                                <p><strong>Loan ID:</strong> #{loanId}</p>
                                <p><strong>Approved Amount:</strong> R{amount:N2}</p>
                                <p><strong>Status:</strong> Approved ?</p>
                            </div>
                            
                            <p><strong>Next Steps:</strong></p>
                            <ul>
                                <li>Your loan is now active and ready for disbursement</li>
                                <li>You can view your loan details and repayment schedule online</li>
                                <li>First payment will be due in 30 days</li>
                            </ul>
                            
                            <p style='text-align: center; margin-top: 30px;'>
                                <a href='http://localhost:5173/loans/{loanId}' class='button'>
                                    View Loan Details
                                </a>
                            </p>
                            
                            <p style='margin-top: 30px;'>Thank you for choosing LendaKahle!</p>
                            
                            <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                                If you have any questions, please contact us at support@lendakahle.co.za
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(borrowerEmail, subject, htmlBody);
        }

        public async Task SendLoanRejectionEmailAsync(string borrowerEmail, string borrowerName, int loanId)
        {
            var subject = $"Loan Application Update - #{loanId}";
            
            var htmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; }}
                        .content {{ background-color: #f9f9f9; padding: 20px; }}
                        .warning {{ background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Loan Application Update</h2>
                        </div>
                        <div class='content'>
                            <p>Dear {borrowerName},</p>
                            <p>Thank you for your loan application (#{loanId}) with LendaKahle.</p>
                            
                            <div class='warning'>
                                <p>After careful review, we regret to inform you that we are unable to approve your loan application at this time.</p>
                            </div>
                            
                            <p><strong>What you can do:</strong></p>
                            <ul>
                                <li>Review your financial situation and apply again in the future</li>
                                <li>Consider applying for a smaller loan amount</li>
                                <li>Contact us for more information about eligibility criteria</li>
                            </ul>
                            
                            <p style='margin-top: 30px;'>We appreciate your interest in LendaKahle and encourage you to apply again when your circumstances improve.</p>
                            
                            <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                                For questions, contact: support@lendakahle.co.za
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(borrowerEmail, subject, htmlBody);
        }

        public async Task SendPaymentReminderAsync(string borrowerEmail, string borrowerName, decimal amount, DateTime dueDate)
        {
            var subject = "? Payment Reminder - Due Soon";
            
            var htmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #ff9800; color: white; padding: 20px; text-align: center; }}
                        .content {{ background-color: #f9f9f9; padding: 20px; }}
                        .reminder {{ background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0; }}
                        .button {{ background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>? Payment Reminder</h2>
                        </div>
                        <div class='content'>
                            <p>Dear {borrowerName},</p>
                            <p>This is a friendly reminder that your loan payment is due soon.</p>
                            
                            <div class='reminder'>
                                <p><strong>Amount Due:</strong> R{amount:N2}</p>
                                <p><strong>Due Date:</strong> {dueDate:dddd, MMMM dd, yyyy}</p>
                            </div>
                            
                            <p>Please make your payment before the due date to avoid late fees.</p>
                            
                            <p style='text-align: center; margin-top: 30px;'>
                                <a href='http://localhost:5173/repayments/make' class='button'>
                                    Make Payment Now
                                </a>
                            </p>
                            
                            <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                                Thank you for your prompt attention to this matter.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(borrowerEmail, subject, htmlBody);
        }

        public async Task SendPaymentReceivedAsync(string borrowerEmail, string borrowerName, decimal amount, int loanId)
        {
            var subject = "? Payment Received - Thank You!";
            
            var htmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #4caf50; color: white; padding: 20px; text-align: center; }}
                        .content {{ background-color: #f9f9f9; padding: 20px; }}
                        .success {{ background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 15px 0; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>? Payment Received</h2>
                        </div>
                        <div class='content'>
                            <p>Dear {borrowerName},</p>
                            <p>Thank you! We have successfully received your payment.</p>
                            
                            <div class='success'>
                                <p><strong>Amount Paid:</strong> R{amount:N2}</p>
                                <p><strong>Loan ID:</strong> #{loanId}</p>
                                <p><strong>Date:</strong> {DateTime.Now:MMMM dd, yyyy}</p>
                            </div>
                            
                            <p>Your payment has been applied to your loan account.</p>
                            
                            <p style='margin-top: 30px;'>Thank you for your business!</p>
                            
                            <p style='color: #666; font-size: 12px; margin-top: 30px;'>
                                View your receipt and loan details online.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(borrowerEmail, subject, htmlBody);
        }
    }
}
```

---

## Step 5: Register Email Service

In `Program.cs`, add:

```csharp
// Add Email Service
builder.Services.AddScoped<IEmailService, EmailService>();
```

---

## Step 6: Update Loan Service to Send Emails

Modify `LoanService.cs`:

```csharp
private readonly IEmailService _emailService;

public LoanService(
    ApplicationDbContext context, 
    IConfiguration configuration,
    IEmailService emailService) // Add this
{
    _context = context;
    _configuration = configuration;
    _emailService = emailService;
}

public async Task<LoanDto> ApplyForLoanAsync(string borrowerId, LoanApplicationDto applicationDto)
{
    // ... existing code ...
    
    _context.Loans.Add(loan);
    await _context.SaveChangesAsync();

    // Reload with borrower info
    var savedLoan = await _context.Loans
        .Include(l => l.Borrower)
        .Include(l => l.Repayments)
        .FirstOrDefaultAsync(l => l.Id == loan.Id);

    // Send notification to admins
    var borrowerName = $"{savedLoan!.Borrower.FirstName} {savedLoan.Borrower.LastName}";
    await _emailService.SendLoanApplicationNotificationAsync(
        savedLoan.Id, 
        borrowerName, 
        savedLoan.PrincipalAmount
    );

    return MapToLoanDto(savedLoan!);
}

public async Task<bool> ApproveLoanAsync(int loanId, string approvedBy)
{
    var loan = await _context.Loans
        .Include(l => l.Borrower)
        .FirstOrDefaultAsync(l => l.Id == loanId);
        
    if (loan == null || loan.Status != LoanStatus.Pending) return false;

    loan.Status = LoanStatus.Approved;
    loan.ApprovalDate = DateTime.UtcNow;
    loan.ApprovedBy = approvedBy;
    loan.StartDate = DateTime.UtcNow;
    loan.EndDate = DateTime.UtcNow.AddMonths(loan.TermMonths);

    await _context.SaveChangesAsync();
    
    // Send approval email
    var borrowerName = $"{loan.Borrower.FirstName} {loan.Borrower.LastName}";
    await _emailService.SendLoanApprovalEmailAsync(
        loan.Borrower.Email,
        borrowerName,
        loan.PrincipalAmount,
        loan.Id
    );

    return true;
}

public async Task<bool> RejectLoanAsync(int loanId, string rejectedBy)
{
    var loan = await _context.Loans
        .Include(l => l.Borrower)
        .FirstOrDefaultAsync(l => l.Id == loanId);
        
    if (loan == null || loan.Status != LoanStatus.Pending) return false;

    loan.Status = LoanStatus.Rejected;
    loan.ApprovedBy = rejectedBy;

    await _context.SaveChangesAsync();
    
    // Send rejection email
    var borrowerName = $"{loan.Borrower.FirstName} {loan.Borrower.LastName}";
    await _emailService.SendLoanRejectionEmailAsync(
        loan.Borrower.Email,
        borrowerName,
        loan.Id
    );

    return true;
}
```

---

## Step 7: Test Email Functionality

```bash
1. Update appsettings.json with your Gmail credentials
2. Restart the backend
3. Apply for a loan as borrower
4. Check admin email - should receive "New Application" notification
5. Approve the loan as admin
6. Check borrower email - should receive "Loan Approved" email
```

---

## ?? Email Templates Included:

1. ? **Loan Approval** - Green theme, congratulations message
2. ? **Loan Rejection** - Red theme, helpful next steps
3. ?? **New Application** - Blue theme, review button for admins
4. ? **Payment Reminder** - Orange theme, due date warning
5. ? **Payment Received** - Green theme, thank you message

---

## ?? Security Best Practices:

1. Never commit `appsettings.json` with real credentials
2. Use environment variables in production:
   ```bash
   export EmailSettings__Password="your-password"
   ```
3. Use Azure Key Vault or AWS Secrets Manager for production
4. Enable 2FA on email account
5. Use dedicated email service for production (SendGrid, AWS SES)

---

## ?? Email Service Providers:

### Free Tier Options:
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free
- **AWS SES**: 62,000 emails/month free (if hosting on AWS)
- **Gmail**: 500 emails/day (not recommended for production)

### Recommended for Production:
```csharp
// Use SendGrid
builder.Services.AddSendGrid(options =>
{
    options.ApiKey = builder.Configuration["SendGrid:ApiKey"];
});
```

---

## ? Implementation Checklist:

- [ ] Install MailKit package
- [ ] Add EmailSettings to appsettings.json
- [ ] Create IEmailService interface
- [ ] Implement EmailService class
- [ ] Register EmailService in Program.cs
- [ ] Update LoanService to use IEmailService
- [ ] Test with real email account
- [ ] Configure Gmail app password
- [ ] Test all email templates
- [ ] Deploy to production with secure credentials

---

## ?? You're Done!

After completing these steps, your application will send:
- ?? Email to admins when new loan is applied
- ?? Email to borrower when loan is approved
- ?? Email to borrower when loan is rejected
- ?? Payment reminders (can be scheduled with Hangfire)
- ?? Payment confirmations

All emails are professional, mobile-responsive, and include direct links to relevant pages! ???
