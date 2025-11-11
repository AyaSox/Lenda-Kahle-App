# LendaKahleApp - Testing Guide

## ?? Testing Overview

This document describes the comprehensive test suite for LendaKahleApp, covering API, database, and frontend testing.

---

## ?? Test Suites

### 1. **API Functionality Tests** (`test-system-functionality.ps1`)

Tests all backend API endpoints and system functionality.

**Tests Include:**
- ? Server health check
- ? Authentication (login/profile)
- ? Loans API (CRUD operations)
- ? Repayments tracking
- ? Dashboard analytics
- ? Notifications system
- ? Document management
- ? Audit logging
- ? Lending rules configuration
- ? Database connectivity

**Run Command:**
```powershell
.\test-system-functionality.ps1
```

**Sample Output:**
```
[?] Server Health Check
[?] Admin Login
[?] Get User Profile
[?] Get All Loans - Found 8 loans
[?] Dashboard Analytics - Total Loans: 8, Active: 3
```

---

### 2. **Database Integrity Tests** (`test-database-integrity.ps1`)

Validates database schema, relationships, and data integrity.

**Tests Include:**
- ? Table existence verification
- ? Data counts and integrity
- ? Foreign key relationships
- ? Business rule validation
- ? Status distribution analysis

**Run Command:**
```powershell
.\test-database-integrity.ps1
```

**Sample Output:**
```
[?] Users Table Exists : 1
[?] Loans Table Exists : 1
[?] Total Users Count : 3
[?] Loans with Valid Borrowers : 8
```

---

### 3. **Frontend Component Tests** (`test-frontend-components.ps1`)

Tests React components and UI functionality using Vitest.

**Tests Include:**
- ? Component rendering
- ? User interactions
- ? Form validation
- ? API mocking
- ? State management

**Run Command:**
```powershell
.\test-frontend-components.ps1
```

**Alternative Commands:**
```powershell
# Run with UI
cd lendakahleapp.client
npm run test:ui

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## ?? Quick Start

### Run All Tests

Execute the complete test suite with one command:

```powershell
.\run-all-tests.ps1
```

This will run:
1. API Functionality Tests
2. Database Integrity Tests
3. Frontend Component Tests

### Prerequisites

**Before running tests:**

1. **Start the application:**
   ```powershell
   .\start-app.bat
   ```

2. **Ensure database is seeded:**
   ```powershell
   cd LendaKahleApp.Server
   dotnet ef database update
   ```

3. **Install frontend dependencies:**
   ```powershell
   cd lendakahleapp.client
   npm install
   ```

---

## ?? Test Results

### Result Files

Test results are saved to:
- **API Tests:** `test-results-yyyyMMdd-HHmmss.json`
- **Frontend Tests:** `lendakahleapp.client/coverage/`
- **Database Tests:** Console output only

### Interpreting Results

**Pass Rates:**
- ?? **100%** - Excellent! All systems operational
- ?? **80-99%** - Good, minor issues to address
- ?? **50-79%** - Moderate issues, needs attention
- ?? **<50%** - Critical failures, immediate action required

---

## ?? Test Configuration

### API Test Configuration

Edit `test-system-functionality.ps1`:

```powershell
$baseUrl = "https://localhost:7290"  # Change if using different port

# Test credentials
$loginBody = @{
    email = "admin@lendakahle.co.za"
    password = "Admin@123!"
}
```

### Frontend Test Configuration

Edit `lendakahleapp.client/vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Database Test Configuration

Edit `test-database-integrity.ps1`:

```powershell
$connectionString = "Server=(localdb)\MSSQLLocalDB;Database=LendaKahleDb;Trusted_Connection=True;"
```

---

## ?? Writing New Tests

### API Test Example

```powershell
function Test-NewFeature {
    $result = Invoke-ApiTest -Endpoint "/api/newfeature" -Headers $authHeaders
    
    if ($result.Success) {
        Log-TestResult -TestName "New Feature Test" -Passed $true -Details "Working correctly"
    }
    else {
        Log-TestResult -TestName "New Feature Test" -Passed $false -Details $result.Error
    }
}
```

### Frontend Test Example

Create `lendakahleapp.client/src/components/__tests__/MyComponent.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Database Test Example

```powershell
Test-DatabaseQuery -TestName "Check New Table" -Query "SELECT COUNT(*) FROM NewTable"
```

---

## ?? Troubleshooting

### Common Issues

**1. Server Not Running**
```
Error: Server is not accessible
Solution: Run .\start-app.bat first
```

**2. Authentication Fails**
```
Error: Admin Login failed
Solution: Check credentials in test script or reset with .\reset-database.ps1
```

**3. Database Connection Error**
```
Error: Cannot open database
Solution: Ensure SQL Server LocalDB is installed and running
```

**4. Frontend Tests Fail**
```
Error: Module not found
Solution: Run 'npm install' in lendakahleapp.client directory
```

---

## ?? Continuous Integration

### GitHub Actions Example

Create `.github/workflows/tests.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 8.0.x
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Restore dependencies
      run: dotnet restore
    
    - name: Build
      run: dotnet build
    
    - name: Run API tests
      run: |
        dotnet run --project LendaKahleApp.Server &
        Start-Sleep -Seconds 10
        .\test-system-functionality.ps1
    
    - name: Run frontend tests
      run: |
        cd lendakahleapp.client
        npm install
        npm test
```

---

## ?? Test Checklist

Use this checklist before deploying:

### Pre-Deployment Tests
- [ ] All API endpoints returning expected responses
- [ ] Authentication working correctly
- [ ] Database tables and relationships intact
- [ ] Loan creation and approval flow working
- [ ] Repayment processing functional
- [ ] Notifications being sent correctly
- [ ] Documents uploading successfully
- [ ] Audit logs capturing actions
- [ ] Frontend components rendering
- [ ] No console errors in browser
- [ ] Mobile responsive design working

### Performance Tests
- [ ] API response times < 500ms
- [ ] Page load times < 3s
- [ ] Database queries optimized
- [ ] No memory leaks in frontend

### Security Tests
- [ ] JWT tokens expiring correctly
- [ ] Authorization rules enforced
- [ ] SQL injection prevention
- [ ] XSS protection active
- [ ] HTTPS enabled in production

---

## ?? Support

If tests fail consistently:

1. Check the error messages in test output
2. Review logs in `LendaKahleApp.Server/logs/`
3. Verify all prerequisites are met
4. Check database connection strings
5. Ensure all migrations are applied

---

## ?? Best Practices

1. **Run tests before committing code**
2. **Keep test data isolated from production**
3. **Update tests when adding features**
4. **Fix failing tests immediately**
5. **Maintain >80% test coverage**
6. **Document test scenarios**
7. **Use meaningful test names**
8. **Clean up test data after runs**

---

## ?? Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [PowerShell Testing](https://pester.dev/)
- [ASP.NET Core Testing](https://docs.microsoft.com/en-us/aspnet/core/test/)

---

**Happy Testing! ???**

Your comprehensive test suite ensures LendaKahleApp maintains high quality and reliability.
