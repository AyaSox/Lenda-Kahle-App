# ?? DATABASE SEEDING - COMPLETE GUIDE

## ? **SEEDING IS NOW CONFIGURED!**

Your LendaKahleApp now **automatically seeds** the database with default users and roles on startup!

---

## ?? **What Gets Seeded Automatically:**

### 1. **Roles** (3 roles)
- ? **Borrower** - Can apply for loans and make repayments
- ? **LoanOfficer** - Can approve/reject loans + all Borrower features
- ? **Admin** - Full access to everything + analytics dashboard

### 2. **Default Users** (3 users - one for each role)

#### ?? **Admin User**
```
Email:      admin@lendakahle.co.za
Password:   Admin@123!
Role:       Admin
Name:       Thabo Mokoena
ID Number:  9001015009087
Phone:      +27 11 123 4567
Address:    Johannesburg
```

#### ?? **Loan Officer User**
```
Email:      officer@lendakahle.co.za
Password:   Officer@123!
Role:       LoanOfficer
Name:       Sipho Dlamini
ID Number:  8506205123088
Phone:      +27 21 456 7890
Address:    Cape Town
```

#### ?? **Borrower User**
```
Email:      borrower@lendakahle.co.za
Password:   Borrower@123!
Role:       Borrower
Name:       Zanele Ndlovu
ID Number:  9512314567089
Phone:      +27 31 789 0123
Address:    Durban
```

---

## ?? **How to Use the Seeded Data:**

### Method 1: Login Immediately!

**NO REGISTRATION NEEDED!** Just login with any of the seeded accounts:

1. Go to: **http://localhost:50354/login**
2. Use any of the credentials above
3. Start testing immediately!

### Method 2: Test Different Roles

#### **As Admin:**
```
Login: admin@lendakahle.co.za / Admin@123!
```
- View dashboard analytics
- Approve/reject loans
- View all users and loans
- Access Hangfire dashboard

#### **As Loan Officer:**
```
Login: officer@lendakahle.co.za / Officer@123!
```
- Approve/reject loan applications
- View all loans
- Cannot access admin dashboard

#### **As Borrower:**
```
Login: borrower@lendakahle.co.za / Borrower@123!
```
- Apply for loans
- Make repayments
- View own loans only

---

## ?? **How It Works:**

### Seeding Happens Automatically On Startup

**File:** `LendaKahleApp.Server\Data\DatabaseSeeder.cs`

The seeder:
1. ? Checks if roles exist ? Creates them if missing
2. ? Checks if users exist ? Creates them if missing
3. ? Assigns roles to users automatically
4. ? Runs every time the app starts (safe - won't duplicate)

**File:** `LendaKahleApp.Server\Program.cs`

```csharp
// Seeding code in Program.cs
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await DatabaseSeeder.SeedAsync(services);
}
```

---

## ?? **Migrations Applied:**

### Current Migrations:
1. ? **InitialCreate** - Created database schema
2. ? **UpdateDecimalPrecision** - Fixed decimal precision for financial data

### Migration Status:
```powershell
# Check migrations
cd LendaKahleApp.Server
dotnet ef migrations list
```

---

## ?? **Quick Start Testing:**

### Step 1: Restart the Application
```powershell
# Stop current instances (Ctrl+C in both terminals)
# Then restart:
.\start-app.bat
```

### Step 2: Login as Admin
1. Go to: http://localhost:50354/login
2. Email: `admin@lendakahle.co.za`
3. Password: `Admin@123!`
4. Click **Login**
5. ? You're now logged in as Admin!

### Step 3: Test the Features

#### Test Admin Dashboard:
1. Click **"Admin"** in the navbar
2. View analytics (currently all zeros - no data yet)

#### Create a Loan Application:
1. Logout
2. Login as: `borrower@lendakahle.co.za` / `Borrower@123!`
3. Go to **"My Loans"** ? **"Apply for Loan"**
4. Fill in:
   ```
   Amount: 10000
   Term: 12 months
   Purpose: Business expansion
   ```
5. Click **Apply**
6. Loan status: **Pending**

#### Approve the Loan:
1. Logout
2. Login as: `officer@lendakahle.co.za` / `Officer@123!`
3. Go to **"My Loans"** (shows all loans for officers)
4. Find the pending loan
5. **Approve** it
6. Status changes to **Approved/Active**

#### Make a Repayment:
1. Logout
2. Login as: `borrower@lendakahle.co.za` / `Borrower@123!`
3. Go to **"Repayments"** ? **"Make Repayment"**
4. Select the approved loan
5. Enter amount: `958.33` (monthly installment)
6. Submit
7. Balance updates!

---

## ??? **Database Management:**

### Reset Database (Start Fresh):
```powershell
cd LendaKahleApp.Server

# Drop database
dotnet ef database drop --force

# Recreate with all migrations
dotnet ef database update

# Restart app - seeding happens automatically!
```

### Add New Migration:
```powershell
cd LendaKahleApp.Server

# After changing models
dotnet ef migrations add YourMigrationName

# Apply migration
dotnet ef database update
```

### View Database:
**Using Visual Studio:**
1. **View** ? **SQL Server Object Explorer**
2. Expand **(localdb)\mssqllocaldb** ? **Databases** ? **LendaKahleAppDb**
3. Expand **Tables** to see:
   - AspNetUsers (seeded users)
   - AspNetRoles (seeded roles)
   - AspNetUserRoles (role assignments)
   - Loans (empty initially)
   - Repayments (empty initially)

---

## ?? **Password Requirements:**

All seeded passwords follow ASP.NET Identity default rules:
- ? Minimum 6 characters
- ? At least one uppercase letter
- ? At least one lowercase letter
- ? At least one digit
- ? At least one special character

**Format:** `RoleName@123!`

---

## ? **Customize Seeding:**

### Add Your Own Default User:

**Edit:** `LendaKahleApp.Server\Data\DatabaseSeeder.cs`

```csharp
private static async Task SeedCustomUser(UserManager<ApplicationUser> userManager)
{
    string email = "custom@lendakahle.co.za";

    if (await userManager.FindByEmailAsync(email) == null)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = "Your",
            LastName = "Name",
            IDNumber = "9001015009087",
            DateOfBirth = new DateTime(1990, 1, 1),
            PhoneNumber = "+27 12 345 6789",
            Address = "Your Address"
        };

        var result = await userManager.CreateAsync(user, "YourPassword@123!");

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, "Admin"); // or Borrower, LoanOfficer
        }
    }
}

// Call it in SeedUsersAsync:
await SeedCustomUser(userManager);
```

### Change Default Passwords:

**Edit:** `LendaKahleApp.Server\Data\DatabaseSeeder.cs`

Change the password in the `CreateAsync` calls:
```csharp
await userManager.CreateAsync(adminUser, "YourNewPassword@123!");
```

Then drop and recreate the database.

---

## ?? **Verify Seeding:**

### Check Users Were Created:

**Using SQL:**
```sql
-- View all users
SELECT Id, Email, UserName, EmailConfirmed, FirstName, LastName 
FROM AspNetUsers;

-- View user roles
SELECT u.Email, r.Name as Role
FROM AspNetUsers u
JOIN AspNetUserRoles ur ON u.Id = ur.UserId
JOIN AspNetRoles r ON ur.RoleId = r.Id;
```

**Using Application:**
1. Try logging in with each seeded account
2. Verify role-specific features work

---

## ?? **SUCCESS INDICATORS:**

You'll know seeding worked if:
- ? Can login with `admin@lendakahle.co.za` / `Admin@123!`
- ? Can login with `officer@lendakahle.co.za` / `Officer@123!`
- ? Can login with `borrower@lendakahle.co.za` / `Borrower@123!`
- ? Admin sees "Admin" menu option
- ? Officer can view all loans
- ? Borrower can only view own loans
- ? No database errors on startup

---

## ?? **Related Files:**

| File | Purpose |
|------|---------|
| `Data/DatabaseSeeder.cs` | ? Seeding logic |
| `Program.cs` | ? Calls seeder on startup |
| `Migrations/` | ? Database schema versions |
| `appsettings.json` | ? Connection string |

---

## ?? **Troubleshooting:**

### Issue: "User already exists" error
**Solution:** This is normal - seeder checks before creating. No duplicates will be made.

### Issue: Can't login with seeded accounts
**Solution:**
1. Check backend logs for errors
2. Verify database was created: `dotnet ef database update`
3. Try dropping and recreating database

### Issue: Migrations pending
**Solution:**
```powershell
cd LendaKahleApp.Server
dotnet ef database update
```

### Issue: Need to reset everything
**Solution:**
```powershell
cd LendaKahleApp.Server
dotnet ef database drop --force
dotnet ef database update
# Restart app
```

---

## ?? **QUICK REFERENCE:**

**Default Admin Login:**
- Email: `admin@lendakahle.co.za`
- Password: `Admin@123!`

**Test the app NOW:**
```
1. Go to: http://localhost:50354/login
2. Login as admin
3. Start testing!
```

**NO REGISTRATION NEEDED - JUST LOGIN!** ??