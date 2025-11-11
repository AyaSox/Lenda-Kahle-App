using LendaKahleApp.Server.Data;
using LendaKahleApp.Server.Models;
using LendaKahleApp.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LendaKahleApp.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly IWebHostEnvironment _environment;
        private readonly Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> _userManager;

        public DocumentsController(ApplicationDbContext context, IAuditService auditService, INotificationService notificationService, IWebHostEnvironment environment, Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _auditService = auditService;
            _notificationService = notificationService;
            _environment = environment;
            _userManager = userManager;
        }

        [HttpPost("upload/{loanId}")]
        [RequestSizeLimit(31457280)] // 30MB limit
        [RequestFormLimits(MultipartBodyLengthLimit = 31457280)]
        public async Task<IActionResult> UploadDocument(int loanId, IFormFile file, [FromForm] DocumentType documentType)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) return Unauthorized();

                // Verify loan exists and belongs to user (or user is admin)
                var loan = await _context.Loans.FindAsync(loanId);
                if (loan == null) return NotFound("Loan not found");

                var isAdmin = User.IsInRole("Admin");
                if (loan.BorrowerId != userId && !isAdmin)
                {
                    return Forbid();
                }

                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                // Validate file size (max 30MB - optimal for performance)
                if (file.Length > 30 * 1024 * 1024)
                {
                    return BadRequest(new 
                    { 
                        error = "File size cannot exceed 30MB",
                        tip = "Please compress your PDF or reduce image quality for faster upload"
                    });
                }

                // Log warning for large files (20MB+)
                if (file.Length > 20 * 1024 * 1024)
                {
                    Console.WriteLine($"WARNING: Large file upload {file.Length / 1024 / 1024}MB from user {userId}");
                }

                // Validate file type
                var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest("Only PDF, JPG, JPEG, and PNG files are allowed");
                }

                // Create uploads directory if it doesn't exist
                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "loan-documents");
                Directory.CreateDirectory(uploadsPath);

                // Generate unique filename
                var fileName = $"{loanId}_{documentType}_{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Create document record
                var document = new LoanDocument
                {
                    LoanId = loanId,
                    FileName = file.FileName,
                    FileUrl = $"/uploads/loan-documents/{fileName}",
                    FileType = fileExtension,
                    FileSize = file.Length,
                    DocumentType = documentType,
                    Status = DocumentStatus.Pending,
                    UploadedBy = userId,
                    UploadedDate = DateTime.UtcNow
                };

                _context.LoanDocuments.Add(document);
                await _context.SaveChangesAsync();

                // Audit log
                var user = await _context.Users.FindAsync(userId);
                await _auditService.LogAsync(
                    userId,
                    user?.Email ?? "Unknown",
                    AuditAction.LoanStatusChanged,
                    "LoanDocument",
                    document.Id.ToString(),
                    new { LoanId = loanId, DocumentType = documentType.ToString(), FileName = file.FileName }
                );

                // Notify borrower about successful upload
                await _notificationService.CreateAsync(
                    loan.BorrowerId,
                    "Document Uploaded Successfully",
                    $"Your {documentType} document for loan #{loanId} has been uploaded and is pending verification.",
                    NotificationType.General,
                    loanId
                );

                // Notify admins about new document to verify
                var allUsers = await _userManager.Users.ToListAsync();
                foreach (var u in allUsers)
                {
                    var roles = await _userManager.GetRolesAsync(u);
                    if (roles.Contains("Admin"))
                    {
                        await _notificationService.CreateAsync(
                            u.Id,
                            "New Document to Verify",
                            $"New {documentType} document uploaded for loan #{loanId} - pending verification.",
                            NotificationType.General,
                            loanId
                        );
                    }
                }

                return Ok(new
                {
                    message = "Document uploaded successfully",
                    documentId = document.Id,
                    fileName = document.FileName,
                    documentType = documentType.ToString(),
                    status = document.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("loan/{loanId}")]
        public async Task<IActionResult> GetLoanDocuments(int loanId)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) return Unauthorized();

                var loan = await _context.Loans.FindAsync(loanId);
                if (loan == null) return NotFound("Loan not found");

                var isAdmin = User.IsInRole("Admin");
                if (loan.BorrowerId != userId && !isAdmin)
                {
                    return Forbid();
                }

                var documents = await _context.LoanDocuments
                    .Where(d => d.LoanId == loanId)
                    .OrderByDescending(d => d.UploadedDate)
                    .Select(d => new
                    {
                        d.Id,
                        d.FileName,
                        d.DocumentType,
                        d.Status,
                        d.IsVerified,
                        d.UploadedDate,
                        d.VerifiedDate,
                        d.VerificationNotes,
                        d.FileSize
                    })
                    .ToListAsync();

                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("verify/{documentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> VerifyDocument(int documentId, [FromBody] VerifyDocumentDto verifyDto)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) return Unauthorized();

                var document = await _context.LoanDocuments.FindAsync(documentId);
                if (document == null) return NotFound("Document not found");

                document.IsVerified = verifyDto.IsApproved;
                document.Status = verifyDto.IsApproved ? DocumentStatus.Approved : DocumentStatus.Rejected;
                document.VerifiedDate = DateTime.UtcNow;
                document.VerifiedBy = userId;
                document.VerificationNotes = verifyDto.Notes;

                await _context.SaveChangesAsync();

                // Check if all required documents are verified
                var loan = await _context.Loans
                    .Include(l => l.Documents)
                    .FirstOrDefaultAsync(l => l.Id == document.LoanId);

                if (loan != null)
                {
                    loan.DocumentsVerified = CheckAllDocumentsVerified(loan);
                    await _context.SaveChangesAsync();
                }

                // Audit log
                var user = await _context.Users.FindAsync(userId);
                await _auditService.LogAsync(
                    userId,
                    user?.Email ?? "Unknown",
                    AuditAction.LoanStatusChanged,
                    "LoanDocument",
                    documentId.ToString(),
                    new { DocumentId = documentId, Status = document.Status.ToString(), Notes = verifyDto.Notes }
                );

                // Notify borrower about document verification status
                if (loan != null)
                {
                    var statusMessage = verifyDto.IsApproved
                        ? $"Your {document.DocumentType} document for loan #{loan.Id} has been verified and approved."
                        : $"Your {document.DocumentType} document for loan #{loan.Id} was rejected. {verifyDto.Notes}";

                    var notificationType = verifyDto.IsApproved ? NotificationType.DocumentVerified : NotificationType.DocumentRejected;

                    await _notificationService.CreateAsync(
                        loan.BorrowerId,
                        verifyDto.IsApproved ? "Document Verified" : "Document Rejected",
                        statusMessage,
                        notificationType,
                        loan.Id
                    );

                    // Notify other admins about document verification
                    var allUsers = await _userManager.Users.ToListAsync();
                    var verifier = await _userManager.FindByIdAsync(userId);
                    
                    foreach (var u in allUsers)
                    {
                        var roles = await _userManager.GetRolesAsync(u);
                        if (roles.Contains("Admin") && u.Id != userId)
                        {
                            try
                            {
                                await _notificationService.CreateAsync(
                                    u.Id,
                                    verifyDto.IsApproved ? "Document Verified" : "Document Rejected",
                                    $"Document for loan #{loan.Id} was {(verifyDto.IsApproved ? "verified" : "rejected")} by {verifier?.FirstName} {verifier?.LastName}.",
                                    notificationType,
                                    loan.Id
                                );
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Failed to notify admin {u.Id}: {ex.Message}");
                            }
                        }
                    }

                    // If all documents are now verified, send additional notification
                    if (loan.DocumentsVerified && verifyDto.IsApproved)
                    {
                        await _notificationService.CreateAsync(
                            loan.BorrowerId,
                            "All Documents Verified!",
                            $"All required documents for loan #{loan.Id} have been verified. Your application is one step closer to approval!",
                            NotificationType.DocumentVerified,
                            loan.Id
                        );

                        // Notify admins that all documents are verified
                        foreach (var u in allUsers)
                        {
                            var roles = await _userManager.GetRolesAsync(u);
                            if (roles.Contains("Admin"))
                            {
                                try
                                {
                                    await _notificationService.CreateAsync(
                                        u.Id,
                                        "All Documents Verified",
                                        $"All documents for loan #{loan.Id} are now verified and ready for final approval.",
                                        NotificationType.DocumentVerified,
                                        loan.Id
                                    );
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Failed to notify admin {u.Id}: {ex.Message}");
                                }
                            }
                        }
                    }
                }

                return Ok(new { message = "Document verification updated", status = document.Status.ToString() });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("download/{documentId}")]
        public async Task<IActionResult> DownloadDocument(int documentId)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) return Unauthorized();

                var document = await _context.LoanDocuments
                    .Include(d => d.Loan)
                    .FirstOrDefaultAsync(d => d.Id == documentId);

                if (document == null) return NotFound("Document not found");

                // Check access permissions
                var isAdmin = User.IsInRole("Admin");
                if (document.Loan.BorrowerId != userId && !isAdmin)
                {
                    return Forbid();
                }

                // Get file path
                var filePath = Path.Combine(_environment.ContentRootPath, "uploads", "loan-documents", Path.GetFileName(document.FileUrl));
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("File not found on disk");
                }

                // Get file info
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = document.FileType switch
                {
                    ".pdf" => "application/pdf",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    _ => "application/octet-stream"
                };

                return File(fileBytes, contentType, document.FileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private bool CheckAllDocumentsVerified(Loan loan)
        {
            if (loan.ApplicationMethod == ApplicationMethod.InPerson)
            {
                // For in-person, admin marks as verified
                return loan.DocumentsVerified;
            }

            // For online, check if required documents are uploaded and verified
            var requiredDocTypes = new[]
            {
                DocumentType.SouthAfricanID,
                DocumentType.Payslips,
                DocumentType.BankStatements,
                DocumentType.ProofOfResidence
            };

            // Check if combined document is uploaded (online applications)
            var hasCombinedDoc = loan.Documents.Any(d => 
                d.DocumentType == DocumentType.CombinedDocuments && 
                d.IsVerified);

            if (hasCombinedDoc) return true;

            // Otherwise check individual documents
            foreach (var docType in requiredDocTypes)
            {
                if (!loan.Documents.Any(d => d.DocumentType == docType && d.IsVerified))
                {
                    return false;
                }
            }

            return true;
        }
    }

    public class VerifyDocumentDto
    {
        public bool IsApproved { get; set; }
        public string? Notes { get; set; }
    }
}
