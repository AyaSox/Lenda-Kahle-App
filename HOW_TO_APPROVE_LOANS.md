# ?? Quick Start: How to Approve Loans

## For Admin/Loan Officers

### Method 1: Via Pending Loans Page (Easiest!)

```
1. Login as Admin or Loan Officer
2. Click "PENDING" in top menu bar
3. See all pending applications
4. Click "REVIEW" on any loan
5. Click "APPROVE LOAN" (green) or "REJECT LOAN" (red)
6. Confirm your decision
7. Done! ?
```

### Method 2: Via Loan Details

```
1. Go to any loan from "My Loans" or Admin dashboard
2. If status is "PENDING", you'll see approval buttons
3. Click "APPROVE LOAN" or "REJECT LOAN"
4. Confirm
5. Done! ?
```

---

## ?? What You'll See

### On Pending Loans Page (`/admin/pending-loans`):
- **Orange summary card** showing number of pending applications
- **Table with all pending loans**:
  - Loan ID
  - Applicant name
  - Requested amount
  - Loan term (months)
  - Monthly payment
  - Purpose
  - Application date
  - "REVIEW" button

### On Loan Details Page (for pending loans):
- **Blue info alert**: "This loan is pending approval"
- **Two large buttons**:
  - ? **Green "Approve Loan"** button
  - ? **Red "Reject Loan"** button

### Approval Dialog:
- Shows loan summary
- Borrower name
- Amount
- Purpose
- Term
- Monthly payment
- "Cancel" or "Approve" buttons

### After Approval:
- Status changes to "APPROVED"
- Approval date is set
- Start date is set to today
- End date is calculated (today + loan term)
- Borrower can start making payments

---

## ?? Notifications

### Current Features:
- **Bell icon** in top right with badge showing unread count
- Click bell to open **Notifications Drawer**
- See notifications for:
  - Loan approvals
  - Payment reminders
  - New applications (for admin)
  - Overdue payments

### Coming Soon:
- ?? Email notifications when:
  - New loan application submitted (to admin/officer)
  - Loan approved/rejected (to borrower)
  - Payment due (to borrower)
  - Payment received (to borrower & admin)

---

## ?? Navigation

**Top Menu Bar** (when logged in as Admin/LoanOfficer):

```
MY LOANS | REPAYMENTS | HISTORY | ADMIN | PENDING | PANEL | DEFAULTS | ?? | LOGOUT
```

- **PENDING** = New shortcut to pending loans page!
- **??** = Notifications (bell icon with badge)
- **DEFAULTS** = Overdue loans
- **ADMIN** = Admin dashboard
- **PANEL** = Enhanced admin panel

---

## ?? Test It Now!

### Quick Test:
```bash
1. Login as borrower@lendakahle.co.za (password: Borrower@123!)
2. Apply for a new loan
3. Logout
4. Login as admin@lendakahle.co.za (password: Admin@123!)
5. Click "PENDING" in top menu
6. See your new loan application!
7. Click "REVIEW"
8. Click "APPROVE LOAN"
9. Success! ?
```

---

## ?? Sample Data

There's already **1 pending loan** in the database:

- **Loan #1002** (or check your actual pending loan ID)
- Borrower: Mosa Shezi
- Amount: R20,000
- Purpose: Personal loan
- Status: **PENDING**

You can approve this right now!

---

## ?? That's It!

The system is **fully functional** and ready to use! 

Approve loans, manage applications, and keep track of everything with the new **Pending Loans** page and approval system! ??
