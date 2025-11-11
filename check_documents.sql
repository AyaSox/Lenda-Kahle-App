-- Check what loans exist
SELECT Id, BorrowerId, PrincipalAmount, Purpose, Status, ApplicationDate 
FROM Loans 
ORDER BY Id DESC;

-- Check if any documents exist
SELECT LoanId, FileName, DocumentType, Status, UploadedDate 
FROM LoanDocuments 
ORDER BY LoanId DESC;

-- Check documents for specific loan 1010
SELECT LoanId, FileName, DocumentType, Status, UploadedDate 
FROM LoanDocuments 
WHERE LoanId = 1010;