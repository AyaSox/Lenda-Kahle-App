import React, { useEffect, useState } from 'react'
import { Typography, List, ListItem, ListItemText, Button, Box } from '@mui/material'
import { Link } from 'react-router-dom'
import axios from '../api/axios'

interface Repayment {
  id: number
  loanId: number
  amount: number
  paymentDate: string
  transactionReference: string
  status: string
}

const RepaymentList: React.FC = () => {
  const [repayments, setRepayments] = useState<Repayment[]>([])

  useEffect(() => {
    fetchRepayments()
  }, [])

  const normalizeLoans = (data: any): any[] => {
    if (!data) return []
    const arr = Array.isArray(data) ? data : data.items ?? []
    return arr.map((l: any) => ({
      id: l.id ?? l.Id,
    }))
  }

  const normalizeRepayments = (data: any): Repayment[] => {
    const arr = Array.isArray(data) ? data : data.items ?? []
    return arr.map((r: any) => ({
      id: r.id ?? r.Id,
      loanId: r.loanId ?? r.LoanId,
      amount: r.amount ?? r.Amount,
      paymentDate: r.paymentDate ?? r.PaymentDate,
      transactionReference: r.transactionReference ?? r.TransactionReference,
      status: r.status ?? r.Status
    }))
  }

  const fetchRepayments = async () => {
    try {
      // Fetch user's loans
      const response = await axios.get('/api/loans/my')
      const loans = normalizeLoans(response.data)
      const allRepayments: Repayment[] = []
      for (const loan of loans) {
        if (!loan?.id) continue
        const reps = await axios.get(`/api/loans/${loan.id}/repayments`)
        allRepayments.push(...normalizeRepayments(reps.data))
      }
      setRepayments(allRepayments)
    } catch (error) {
      console.error('Failed to fetch repayments', error)
      setRepayments([])
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Repayments
      </Typography>
      <Button variant="contained" component={Link} to="/repayments/make" sx={{ mb: 2, background: 'linear-gradient(45deg,#0ea5e9 10%, #06b6d4 90%)', '&:hover': { background: 'linear-gradient(45deg,#0891b2 10%, #0284c7 90%)' } }}>
        Make Repayment
      </Button>
      <List>
        {repayments.map((repayment) => (
          <ListItem key={repayment.id} divider sx={{ borderRadius: 1, mb: 1, transition: 'transform 160ms ease, box-shadow 160ms ease', background: 'linear-gradient(180deg, #ffffff, #f8fafc)', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.06)' } }}>
            <ListItemText
              primary={`Loan #${repayment.loanId} - R${repayment.amount}`}
              secondary={`Date: ${repayment.paymentDate} | Ref: ${repayment.transactionReference}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default RepaymentList