import React, { useEffect, useState } from 'react'
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip,
  Alert,
  Divider,
  Button
} from '@mui/material'
import { ErrorIcon, WarningIcon, ScheduleIcon, CheckCircleIcon } from '../components/AppIcons'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'

interface Analytics {
  totalLoans: number
  totalRepayments: number
  activeLoans: number
  defaultedLoans: number
  outstandingBalance: number
}

interface LoanDto {
  id: number
  borrowerId: string
  borrowerName: string
  principalAmount: number
  interestRate: number
  termMonths: number
  totalRepayable: number
  monthlyInstallment: number
  purpose: string
  status: number
  applicationDate: string
  approvalDate?: string
  startDate?: string
  endDate?: string
  remainingBalance: number
  totalPaid: number
  paymentsMade: number
  paymentsRemaining: number
}

enum LoanStatus {
  Pending = 0,
  PreApproved = 1,
  Approved = 2,
  Active = 3,
  Rejected = 4,
  Completed = 5
}

const AdminDashboard: React.FC = () => {
const navigate = useNavigate()
const [analytics, setAnalytics] = useState<Analytics | null>(null)
const [loans, setLoans] = useState<LoanDto[]>([])
const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const normalizeAnalytics = (data: any): Analytics => ({
    totalLoans: Number(data?.totalLoans ?? data?.TotalLoans ?? 0),
    totalRepayments: Number(data?.totalRepayments ?? data?.TotalRepayments ?? 0),
    activeLoans: Number(data?.activeLoans ?? data?.ActiveLoans ?? 0),
    defaultedLoans: Number(data?.defaultedLoans ?? data?.DefaultedLoans ?? 0),
    outstandingBalance: Number(data?.outstandingBalance ?? data?.OutstandingBalance ?? 0),
  })

  const normalizeLoans = (data: any): LoanDto[] => {
    const arr = Array.isArray(data) ? data : data?.items ?? []
    return arr.map((l: any) => ({
      id: l.id ?? l.Id,
      borrowerId: l.borrowerId ?? l.BorrowerId,
      borrowerName: l.borrowerName ?? l.BorrowerName ?? 'Unknown',
      principalAmount: l.principalAmount ?? l.PrincipalAmount ?? 0,
      interestRate: l.interestRate ?? l.InterestRate ?? 0,
      termMonths: l.termMonths ?? l.TermMonths ?? 0,
      totalRepayable: l.totalRepayable ?? l.TotalRepayable ?? 0,
      monthlyInstallment: l.monthlyInstallment ?? l.MonthlyInstallment ?? 0,
      purpose: l.purpose ?? l.Purpose ?? '',
      status: l.status ?? l.Status ?? 0,
      applicationDate: l.applicationDate ?? l.ApplicationDate ?? '',
      approvalDate: l.approvalDate ?? l.ApprovalDate,
      startDate: l.startDate ?? l.StartDate,
      endDate: l.endDate ?? l.EndDate,
      remainingBalance: l.remainingBalance ?? l.RemainingBalance ?? 0,
      totalPaid: l.totalPaid ?? l.TotalPaid ?? 0,
      paymentsMade: l.paymentsMade ?? l.PaymentsMade ?? 0,
      paymentsRemaining: l.paymentsRemaining ?? l.PaymentsRemaining ?? 0,
    }))
  }

  const fetchData = async () => {
    try {
      const [analyticsResponse, loansResponse] = await Promise.all([
        axios.get('/api/reports/dashboard'),
        axios.get('/api/loans/all')
      ])
      setAnalytics(normalizeAnalytics(analyticsResponse.data))
      setLoans(normalizeLoans(loansResponse.data))
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case LoanStatus.Active: return 'success'
      case LoanStatus.PreApproved: return 'info'
      case LoanStatus.Approved: return 'info'
      case LoanStatus.Pending: return 'warning'
      case LoanStatus.Completed: return 'default'
      case LoanStatus.Rejected: return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: number): string => {
    switch (status) {
      case LoanStatus.Pending: return 'Pending'
      case LoanStatus.PreApproved: return 'Pre-Approved'
      case LoanStatus.Approved: return 'Approved'
      case LoanStatus.Active: return 'Active'
      case LoanStatus.Rejected: return 'Rejected'
      case LoanStatus.Completed: return 'Completed'
      default: return 'Unknown'
    }
  }

  const getDaysUntilExpiry = (endDate: string | undefined): number | null => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getExpiryStatus = (daysUntil: number | null, paymentsRemaining: number) => {
    if (daysUntil === null) return null
    
    if (daysUntil < 0) {
      return { 
        color: 'error' as const, 
        text: `OVERDUE (${Math.abs(daysUntil)} days)`, 
        icon: <ErrorIcon /> 
      }
    } else if (daysUntil <= 30) {
      return { 
        color: 'warning' as const, 
        text: `${daysUntil} days left`, 
        icon: <WarningIcon /> 
      }
    } else if (paymentsRemaining <= 2) {
      return { 
        color: 'info' as const, 
        text: `${paymentsRemaining} payments left`, 
        icon: <ScheduleIcon /> 
      }
    }
    return null
  }

  // Filter loans that need attention (nearing expiry or overdue)
  const criticalLoans = loans.filter(loan => {
    if (loan.status !== LoanStatus.Active) return false
    const daysUntil = getDaysUntilExpiry(loan.endDate)
    return daysUntil !== null && (daysUntil < 0 || daysUntil <= 60 || loan.paymentsRemaining <= 3)
  })

  if (loading) return <Typography>Loading...</Typography>

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Summary Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Loans
                </Typography>
                <Typography variant="h5">
                  {analytics.totalLoans}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Repayments
                </Typography>
                <Typography variant="h5">
                  R{(analytics.totalRepayments ?? 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Loans
                </Typography>
                <Typography variant="h5">
                  {analytics.activeLoans}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Outstanding Balance
                </Typography>
                <Typography variant="h5">
                  R{(analytics.outstandingBalance ?? 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Critical Loans Alert */}
      {criticalLoans.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="h6">Loans Requiring Attention ({criticalLoans.length})</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {criticalLoans.length} loan{criticalLoans.length !== 1 ? 's' : ''} nearing expiry or overdue
          </Typography>
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => navigate('/admin/defaulted-loans')}
            sx={{ mt: 1 }}
          >
            View Defaulted Loans
          </Button>
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Detailed Loans Table */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          All Loans Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.open('/api/reports/loans/export?format=csv', '_blank')}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => window.open('/api/reports/loans/export?format=pdf', '_blank')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Borrower</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Term Progress</strong></TableCell>
              <TableCell><strong>End Date</strong></TableCell>
              <TableCell><strong>Expiry Status</strong></TableCell>
              <TableCell><strong>Purpose</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.map((loan) => {
              const daysUntil = getDaysUntilExpiry(loan.endDate)
              const expiryStatus = getExpiryStatus(daysUntil, loan.paymentsRemaining)
              
              return (
                <TableRow 
                  key={loan.id}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                  sx={{
                    backgroundColor: expiryStatus?.color === 'error' ? '#ffebee' : 
                                   expiryStatus?.color === 'warning' ? '#fff3e0' : 'inherit',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: expiryStatus?.color === 'error' ? '#ffcdd2' : 
                                     expiryStatus?.color === 'warning' ? '#ffe0b2' : '#f5f5f5'
                    }
                  }}
                >
                  <TableCell>{loan.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {loan.borrowerName}
                    </Typography>
                  </TableCell>
                  <TableCell>R{Number(loan.principalAmount ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(loan.status)} 
                      color={getStatusColor(loan.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {loan.status === LoanStatus.Active ? (
                      <Typography variant="body2">
                        {loan.paymentsMade}/{(loan.paymentsMade ?? 0) + (loan.paymentsRemaining ?? 0)}
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {loan.paymentsRemaining} payments left
                        </Typography>
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        {getStatusText(loan.status)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {loan.endDate ? (
                      <Typography variant="body2">
                        {new Date(loan.endDate).toLocaleDateString()}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Not set
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {expiryStatus ? (
                      <Chip
                        icon={expiryStatus.icon}
                        label={expiryStatus.text}
                        color={expiryStatus.color}
                        size="small"
                      />
                    ) : loan.status === LoanStatus.Active ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="On track"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {loan.purpose}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {loans.length === 0 && (
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          No loans found in the system.
        </Typography>
      )}
    </Box>
  )
}

export default AdminDashboard