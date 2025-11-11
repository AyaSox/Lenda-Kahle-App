import React, { useEffect, useState } from 'react'
import { Typography, List, ListItem, ListItemText, Button, Box } from '@mui/material'
import { Link } from 'react-router-dom'
import axios from '../api/axios'
import { getLoanStatusName, getLoanStatusColor, formatAmount } from '../utils/loanUtils'

interface Loan {
  id: number
  borrowerName: string
  principalAmount: number
  interestRate: number
  termMonths: number
  totalRepayable: number
  monthlyInstallment: number
  purpose: string
  status: number
  remainingBalance: number
}

const LoanList: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([])

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const response = await axios.get('/api/loans/my')
      const arr = Array.isArray(response.data) ? response.data : (response.data?.items ?? [])
      const normalized = arr.map((l: any) => ({
        id: l.id ?? l.Id ?? 0,
        borrowerName: l.borrowerName ?? l.BorrowerName ?? 'Unknown',
        principalAmount: Number(l.principalAmount ?? l.PrincipalAmount ?? 0),
        interestRate: Number(l.interestRate ?? l.InterestRate ?? 0),
        termMonths: Number(l.termMonths ?? l.TermMonths ?? 0),
        totalRepayable: Number(l.totalRepayable ?? l.TotalRepayable ?? 0),
        monthlyInstallment: Number(l.monthlyInstallment ?? l.MonthlyInstallment ?? 0),
        purpose: l.purpose ?? l.Purpose ?? 'Loan',
        status: Number(l.status ?? l.Status ?? 0),
        remainingBalance: Number(l.remainingBalance ?? l.RemainingBalance ?? 0)
      }))
      setLoans(normalized)
    } catch (error) {
      console.error('Failed to fetch loans', error)
      setLoans([])
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Loans
      </Typography>
      <Button variant="contained" component={Link} to="/loans/apply" sx={{ mb: 2 }}>
        Apply for Loan
      </Button>
      <List>
        {loans.map((loan) => (
          <ListItem key={loan.id} divider sx={{ py: 2 }}>
            <ListItemText
              primary={
                <Typography variant="h6">
                  Loan #{loan.id} - {loan.purpose}
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography component="span" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Amount:</strong> R{formatAmount(loan.principalAmount)} | 
                    <strong> Remaining:</strong> R{formatAmount(loan.remainingBalance)}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: getLoanStatusColor(loan.status),
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getLoanStatusName(loan.status)}
                  </Box>
                </Box>
              }
            />
            <Button variant="contained" component={Link} to={`/loans/${loan.id}`}>
              View Details
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default LoanList