import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { formatAmount } from '../utils/loanUtils'
import { CheckCircleIcon, HourglassEmpty } from '../components/AppIcons'

interface PendingLoan {
  id: number
  borrowerName: string
  principalAmount: number
  termMonths: number
  monthlyInstallment: number
  totalRepayable: number
  purpose: string
  applicationDate: string
  status: number
}

// Format SA time (Johannesburg) for consistency with notifications
const formatSADate = (value: string) => {
  try {
    if (!value) return ''
    const hasTz = /([zZ]|[+\-]\d{2}:?\d{2})$/.test(value)
    const iso = hasTz ? value : `${value}Z`
    return new Date(iso).toLocaleDateString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return value
  }
}

// Derive the term from totals if the API value looks off
const getDisplayedTermMonths = (loan: PendingLoan) => {
  const { termMonths, totalRepayable, monthlyInstallment } = loan
  if (monthlyInstallment > 0 && totalRepayable > 0) {
    const derived = Math.round(totalRepayable / monthlyInstallment)
    // If API term is missing or differs by >= 1 month, prefer derived
    if (!termMonths || Math.abs(derived - termMonths) >= 1) {
      return derived
    }
  }
  return termMonths
}

const getStatusLabel = (status: number) => {
  return status === 0 ? 'Pending' : 'Pre-Approved'
}

const getStatusColor = (status: number): 'warning' | 'info' => {
  return status === 0 ? 'warning' : 'info'
}

const PendingLoans: React.FC = () => {
  const navigate = useNavigate()
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPendingLoans()
  }, [])

  const fetchPendingLoans = async () => {
    try {
      const response = await axios.get('/api/loans/all')
      // Filter for pending and pre-approved loans (status = 0 or 1)
      // Pending = 0, PreApproved = 1
      const pending = response.data.filter((loan: any) => 
        loan.status === 0 || loan.status === 1
      )
      setPendingLoans(pending)
    } catch (error: any) {
      console.error('Failed to fetch pending loans', error)
      if (error.response?.status === 403) {
        setError('Access denied. Please login as Admin or Loan Officer.')
      } else {
        setError('Failed to load pending loans. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Typography>Loading pending loans...</Typography>

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pending Loan Applications
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Review and approve or reject loan applications awaiting decision.
      </Typography>

      {pendingLoans.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <Typography variant="h6">All Caught Up!</Typography>
          <Typography>No pending loan applications at this time.</Typography>
        </Alert>
      ) : (
        <>
          {/* Summary Card */}
          <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HourglassEmpty sx={{ fontSize: 48, color: '#f57c00' }} />
                <Box>
                  <Typography variant="h4" color="#f57c00">
                    {pendingLoans.length}
                  </Typography>
                  <Typography variant="body1">
                    Loan Application{pendingLoans.length !== 1 ? 's' : ''} Awaiting Review
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Action Required:</strong> Please review these applications promptly. 
              Pre-approved loans need document verification before final approval.
            </Typography>
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Loan ID</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Applicant</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Term</strong></TableCell>
                  <TableCell><strong>Monthly Payment</strong></TableCell>
                  <TableCell><strong>Purpose</strong></TableCell>
                  <TableCell><strong>Applied</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingLoans.map((loan) => (
                  <TableRow 
                    key={loan.id}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: loan.status === 1 ? '#e3f2fd' : '#fff9e6',
                      '&:hover': {
                        backgroundColor: loan.status === 1 ? '#bbdefb' : '#fff3cc'
                      }
                    }}
                  >
                    <TableCell>{loan.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(loan.status)}
                        color={getStatusColor(loan.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {loan.borrowerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        R{formatAmount(loan.principalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{getDisplayedTermMonths(loan)} months</TableCell>
                    <TableCell>R{formatAmount(loan.monthlyInstallment)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {loan.purpose.length > 30 ? loan.purpose.substring(0, 30) + '...' : loan.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatSADate(loan.applicationDate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => navigate(`/loans/${loan.id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Review Guidelines:
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>Verify applicant's identity and creditworthiness</li>
                <li>Assess loan purpose and repayment capacity</li>
                <li>Check for any existing overdue loans</li>
                <li>Ensure loan terms align with company policies</li>
                <li>Click "Review" to see full details and approve/reject</li>
              </ul>
            </Typography>
          </Box>
        </>
      )}
    </Box>
  )
}

export default PendingLoans
