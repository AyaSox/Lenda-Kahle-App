import React, { useEffect, useState } from 'react'
import { Typography, Box, Grid, Card, CardContent, List, ListItem, ListItemText, Button, Alert, Chip, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import { WarningIcon, CheckCircleIcon, ContactMailIcon, PhoneIcon } from '../components/AppIcons'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'

interface DefaultedLoan {
  id: number
  borrowerName: string
  principalAmount: number
  endDate: string
  daysOverdue: number
  purpose: string
  totalPaid: number
  remainingBalance: number
}

const DefaultedLoans: React.FC = () => {
  const navigate = useNavigate()
  const [defaultedLoans, setDefaultedLoans] = useState<DefaultedLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDefaultedLoans()
  }, [])

  const fetchDefaultedLoans = async () => {
    try {
      const response = await axios.get('/api/reports/defaulted-loans')
      setDefaultedLoans(response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch defaulted loans', error)
      if (error.response?.status === 403) {
        setError('Access denied. Please login as Admin or Loan Officer.')
      } else {
        setError('Failed to load defaulted loans. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (daysOverdue: number): 'warning' | 'error' => {
    return daysOverdue > 30 ? 'error' : 'warning'
  }

  if (loading) return <Typography>Loading defaulted loans...</Typography>

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
        Defaulted Loans Management
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Loans that have passed their end date and require immediate attention.
      </Typography>

      {defaultedLoans.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <Typography variant="h6">Great News!</Typography>
          <Typography>No loans are currently in default. All borrowers are up to date with their payments.</Typography>
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="error">
                  Total Defaulted
                </Typography>
                <Typography variant="h4">
                  {defaultedLoans.length}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  Total Outstanding
                </Typography>
                <Typography variant="h4">
                  R{defaultedLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" color="error">
                  Critically Overdue (&gt;30 days)
                </Typography>
                <Typography variant="h4">
                  {defaultedLoans.filter(l => l.daysOverdue > 30).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6">Urgent Action Required</Typography>
            <Typography>
              These loans require immediate attention. Consider contacting borrowers or initiating recovery procedures.
            </Typography>
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Loan ID</strong></TableCell>
                  <TableCell><strong>Borrower</strong></TableCell>
                  <TableCell><strong>Principal</strong></TableCell>
                  <TableCell><strong>Days Overdue</strong></TableCell>
                  <TableCell><strong>End Date</strong></TableCell>
                  <TableCell><strong>Outstanding</strong></TableCell>
                  <TableCell><strong>Purpose</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defaultedLoans.map((loan) => (
                  <TableRow 
                    key={loan.id}
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: loan.daysOverdue > 30 ? '#ffebee' : '#fff3e0',
                      '&:hover': {
                        backgroundColor: loan.daysOverdue > 30 ? '#ffcdd2' : '#ffe0b2'
                      }
                    }}
                  >
                    <TableCell>{loan.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {loan.borrowerName}
                      </Typography>
                    </TableCell>
                    <TableCell>R{loan.principalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<WarningIcon />}
                        label={`${loan.daysOverdue} days`}
                        color={getSeverityColor(loan.daysOverdue)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(loan.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="error">
                        R{loan.remainingBalance.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {loan.purpose.length > 25 ? loan.purpose.substring(0, 25) + '...' : loan.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContactMailIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            // In a real app, this would open email client or send notification
                            alert(`Contact feature would send reminder to ${loan.borrowerName}`)
                          }}
                        >
                          Email
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PhoneIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            // In a real app, this would initiate call or show phone number
                            alert(`Call feature would contact ${loan.borrowerName}`)
                          }}
                        >
                          Call
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Recommended Actions:
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>Contact borrowers immediately for loans overdue more than 7 days</li>
                <li>Initiate formal recovery procedures for loans overdue more than 30 days</li>
                <li>Review payment history to understand borrower patterns</li>
                <li>Consider restructuring payment plans for cooperative borrowers</li>
              </ul>
            </Typography>
          </Box>
        </>
      )}
    </Box>
  )
}

export default DefaultedLoans