# ??? PostgreSQL Migration & Deployment Guide

## ? What's Configured

Your `ApplicationDbContext` is now optimized for PostgreSQL with:
- ? Decimal precision (18,2) for all financial fields
- ? Composite indexes for performance
- ? DateTime fields (auto-mapped to `timestamp with time zone`)
- ? Text fields (auto-mapped to `text` type)
- ? All migrations ready for PostgreSQL

---

## ?? Run Migrations (2 Options)

### Option 1: Local PostgreSQL Connection String
```bash
cd LendaKahleApp.Server

# Update connection string in appsettings.json:
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=lendakahle;Username=postgres;Password=yourpassword"
}

# Run migrations
dotnet ef database update
```

### Option 2: Supabase (Production)
```bash
cd LendaKahleApp.Server

# Update connection string in appsettings.json:
"ConnectionStrings": {
  "DefaultConnection": "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
}

# Run migrations
dotnet ef database update
```

---

## ?? Verify Indexes (PostgreSQL)

After running migrations, connect to your PostgreSQL database and run:

```sql
-- Check all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('Loans', 'Repayments', 'LoanDocuments', 'AuditLogs', 'Notifications', 'AffordabilityAssessments', 'CreditChecks')
ORDER BY tablename, indexname;
```

### Expected Indexes:

| Table | Index Name | Columns |
|-------|------------|---------|
| **Loans** | IX_Loans_BorrowerId_Status | (BorrowerId, Status) |
| **Repayments** | IX_Repayments_LoanId_PaymentDate | (LoanId, PaymentDate) |
| **LoanDocuments** | IX_LoanDocuments_LoanId_DocumentType | (LoanId, DocumentType) |
| **AuditLogs** | IX_AuditLogs_Timestamp_Action | (Timestamp, Action) |
| **Notifications** | IX_Notifications_UserId_IsRead | (UserId, IsRead) |
| **AffordabilityAssessments** | IX_AffordabilityAssessments_LoanId | (LoanId) |
| **CreditChecks** | IX_CreditChecks_LoanId | (LoanId) |

---

## ?? Column Type Mappings

### C# ? PostgreSQL Automatic Mappings

| C# Type | PostgreSQL Type | Example Column |
|---------|----------------|----------------|
| `decimal(18,2)` | `numeric(18,2)` | PrincipalAmount, TotalRepayable |
| `decimal(5,2)` | `numeric(5,2)` | InterestRate |
| `DateTime` | `timestamp with time zone` | ApplicationDate, PaymentDate |
| `string` | `text` | Purpose, TransactionReference |
| `int` | `integer` | Id, TermMonths |
| `bool` | `boolean` | IsVerified, IsRead |
| `long` | `bigint` | FileSize |
| `enum` | `integer` | Status, DocumentType |

### All Financial Fields (18,2 precision):
? PrincipalAmount
? InterestRate  
? TotalRepayable
? MonthlyInstallment
? InitiationFee
? MonthlyServiceFee
? MonthlyCreditLifePremium
? TotalInterest
? TotalFees
? MonthlyGrossIncome
? MonthlyNetIncome
? (All affordability assessment amounts)

### All Date/Time Fields (timestamp with time zone):
? ApplicationDate
? ApprovalDate
? StartDate
? EndDate
? PaymentDate
? UploadedDate
? VerifiedDate
? AssessmentDate
? CheckDate
? Timestamp (AuditLog)
? CreatedAt (Notification)
? CreatedDate (ApplicationUser)
? UpdatedAt (SystemSettings)

---

## ?? Test Database Connection

### Test Query
```sql
-- Test connection and verify tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Expected Tables:
```
AffordabilityAssessments
AspNetRoleClaims
AspNetRoles
AspNetUserClaims
AspNetUserLogins
AspNetUserRoles
AspNetUsers
AspNetUserTokens
AuditLogs
CreditChecks
LoanDocuments
Loans
Notifications
Repayments
SystemSettings
__EFMigrationsHistory
```

### Test Data Integrity
```sql
-- Check decimal precision
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'Loans'
AND data_type = 'numeric'
ORDER BY column_name;

-- Check timestamp types
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Loans'
AND data_type LIKE 'timestamp%'
ORDER BY column_name;

-- Check text columns
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'Loans'
AND data_type = 'text'
ORDER BY column_name;
```

---

## ?? Common Issues & Solutions

### Issue 1: Connection String Format
```bash
? Wrong: Server=localhost;Database=lendakahle;...
? Correct: Host=localhost;Database=lendakahle;Username=postgres;Password=xxx

? Wrong: postgresql://postgres:password@...
? Correct: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Issue 2: Timestamp vs DateTime2
**EF Core automatically maps DateTime to PostgreSQL's `timestamp with time zone`**
- No manual configuration needed
- UTC dates handled automatically
- Time zones preserved

### Issue 3: Decimal Precision
**Already configured with `HasPrecision(18,2)`**
- Maps to PostgreSQL `numeric(18,2)`
- Preserves exact decimal values
- No rounding errors

### Issue 4: Text Fields
**EF Core automatically maps `string` to PostgreSQL `text`**
- Unlimited length
- No varchar limits
- Optimal for document notes, JSON data

---

## ?? Deployment Steps

### 1. Local Testing (PostgreSQL)
```bash
# Install PostgreSQL locally
# https://www.postgresql.org/download/

# Create database
createdb lendakahle

# Update appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=lendakahle;Username=postgres;Password=yourpassword"
  }
}

# Run migrations
cd LendaKahleApp.Server
dotnet ef database update

# Verify
psql -d lendakahle -c "\dt"
```

### 2. Supabase Deployment
```bash
# Get connection string from Supabase dashboard
# Settings > Database > Connection string (URI)

# Update appsettings.json or use environment variable
export ConnectionStrings__DefaultConnection="postgresql://postgres.[ref]:[password]@..."

# Run migrations
dotnet ef database update

# Or use Supabase SQL Editor
# Copy migration SQL and run directly
```

### 3. Render.com Deployment
```bash
# Migrations run automatically on first deployment
# OR manually via Render shell:

# In Render dashboard:
# Shell > Run command:
cd /app
dotnet ef database update

# Or set environment variable:
RUN_MIGRATIONS=true
```

---

## ?? Migration SQL Script (Manual Deployment)

If you need to run migrations manually (Supabase SQL Editor):

```bash
# Generate SQL script
cd LendaKahleApp.Server
dotnet ef migrations script --idempotent --output migrations.sql

# Copy migrations.sql content
# Paste into Supabase SQL Editor
# Execute
```

---

## ? Verification Checklist

After migration:

- [ ] All tables created
- [ ] All indexes created
- [ ] Decimal fields have numeric(18,2) type
- [ ] DateTime fields have timestamp with time zone type
- [ ] Text fields have text type
- [ ] Foreign keys established
- [ ] Default values set (IsDeleted, CreatedDate, etc.)
- [ ] SystemSettings has seed data
- [ ] No migration errors in logs

---

## ?? Connection String Formats

### Local PostgreSQL
```
Host=localhost;Port=5432;Database=lendakahle;Username=postgres;Password=yourpassword
```

### Supabase (Transaction Mode - Recommended)
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Supabase (Session Mode)
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Supabase (Direct Connection)
```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Recommended**: Use **Transaction Mode** for EF Core migrations.

---

## ?? Success!

Your database is PostgreSQL-ready with:
- ? Optimized indexes for performance
- ? Correct column types for all fields
- ? NCA-compliant decimal precision
- ? UTC timestamp handling
- ? Production-ready schema

**Next**: Deploy to Render.com and test with Supabase!

---

**Siyabonga!** Your PostgreSQL database is configured! ??????
