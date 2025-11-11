import React, { useState, useEffect } from 'react'
import { TextField, Button, Paper, Typography, Box, MenuItem, Snackbar, Alert as MuiAlert, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'

interface Loan {
  id: number
  principalAmount: number
  remainingBalance: number
  status: number
}

const AlertComponent = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const MakeRepayment: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoanId, setSelectedLoanId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLoans()
  }, [])

  const normalizeLoans = (data: any): Loan[] => {
    if (!data) return []
    const arr = Array.isArray(data) ? data : data.items || []
    return arr.map((l: any) => ({
      id: l.id ?? l.Id,
      principalAmount: Number(l.principalAmount ?? l.PrincipalAmount ?? 0),
      remainingBalance: Number(l.remainingBalance ?? l.RemainingBalance ?? 0),
      status: Number(l.status ?? l.Status ?? 0),
    }))
  }

  const fetchLoans = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/loans/my')
      const fetched = normalizeLoans(response.data)
      // LoanStatus enum: Pending=0, PreApproved=1, Approved=2, Active=3, Rejected=4, Completed=5
      // Only show Active (3) loans with remaining balance
      const eligibleLoans = fetched.filter(l => 
        l.status === 3 && l.remainingBalance > 0
      )
      
      if (eligibleLoans.length === 0) {
        // Check if there are loans but none eligible
        if (fetched.length > 0) {
          const pendingCount = fetched.filter(l => l.status === 0 || l.status === 1).length
          const approvedCount = fetched.filter(l => l.status === 2).length
          if (pendingCount > 0) {
            setError(`You have ${pendingCount} loan(s) pending approval. Payments can only be made on active loans.`)
          } else if (approvedCount > 0) {
            setError(`You have ${approvedCount} approved loan(s) that are not yet active. Contact an administrator to activate them.`)
          } else {
            setError('No loans eligible for repayment. Loans must be approved and have a remaining balance.')
          }
        } else {
          setError('No active loans found for repayment.')
        }
        setLoans([])
      } else {
        setLoans(eligibleLoans)
        setSelectedLoanId(String(eligibleLoans[0].id))
      }
    } catch (err: any) {
      console.error('Failed to fetch loans', err)
      if (err.response?.status === 403) {
        setError('Access denied. Please login.')
      } else {
        setError('Failed to load loans. Please try again later.')
      }
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  const getSelectedLoan = () => loans.find(l => String(l.id) === selectedLoanId)

  const validateAmount = (value: number) => {
    setAmountError('')
    if (!selectedLoanId) {
      setAmountError('Please select a loan first')
      return false
    }
    const loan = getSelectedLoan()
    if (!loan) {
      setAmountError('Selected loan not found')
      return false
    }
    if (isNaN(value) || value <= 0) {
      setAmountError('Enter a valid amount greater than 0')
      return false
    }
    if (value > loan.remainingBalance) {
      setAmountError(`Amount exceeds remaining balance of R${loan.remainingBalance.toFixed(2)}`)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAmountError('')
    setError('')

    const amt = parseFloat(amount)
    if (!validateAmount(amt)) return

    try {
      const res = await axios.post('/api/loans/repay', {
        loanId: parseInt(selectedLoanId, 10),
        amount: amt,
      })

      const txRef = res.data?.transactionReference || res.data?.TransactionReference || ''

      // Update UI: reduce remainingBalance locally
      setLoans(prev => prev.map(l => l.id === parseInt(selectedLoanId, 10) ? { ...l, remainingBalance: Math.max(0, l.remainingBalance - amt) } : l))
      setSuccessMessage(`Payment of R${amt.toFixed(2)} received${txRef ? ` • Ref: ${txRef}` : ''}`)
      setSnackbarOpen(true)
      setAmount('')

      // After short delay navigate to repayments list so user can see history
      setTimeout(() => navigate('/repayments'), 3000)
    } catch (err: any) {
      console.error('Repayment failed', err)
      
      // Extract error message properly
      let errorMessage = 'Repayment failed. Please try again.'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (typeof err.response.data === 'object') {
          // If it's an object, try to stringify it nicely
          errorMessage = JSON.stringify(err.response.data)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  const handleCloseSnackbar = () => setSnackbarOpen(false)

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Make Repayment
      </Typography>

      {loading ? (
        <Typography>Loading loans...</Typography>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && loans.length === 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                No Eligible Loans for Repayment
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Note:</strong> You can only make payments on loans that have been approved by an administrator.
              </Typography>
            </Alert>
          )}

          <TextField
            select
            fullWidth
            label="Select Loan"
            value={selectedLoanId}
            onChange={(e) => { setSelectedLoanId(e.target.value); setAmountError(''); setError('') }}
            margin="normal"
            required
            disabled={loans.length === 0}
            helperText={loans.length > 0 ? `${loans.length} eligible loan(s) available for payment` : error || 'No eligible loans'}
          >
            {loans.map((loan) => {
              const statusText = 
                loan.status === 0 ? 'Pending' :
                loan.status === 1 ? 'Pre-Approved' :
                loan.status === 2 ? 'Approved' :
                loan.status === 3 ? 'Active' :
                loan.status === 4 ? 'Rejected' :
                loan.status === 5 ? 'Completed' : 'Unknown'
              
              return (
                <MenuItem key={loan.id} value={String(loan.id)}>
                  {`Loan #${loan.id} - ${statusText} - Balance: R${loan.remainingBalance.toFixed(2)}`}
                </MenuItem>
              )
            })}
          </TextField>

          <TextField
            fullWidth
            label="Amount (ZAR)"
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setAmountError('') }}
            margin="normal"
            required
            disabled={loans.length === 0}
            inputProps={{ min: 0, step: '0.01' }}
            error={!!amountError}
            helperText={amountError || (getSelectedLoan() ? `Max: R${getSelectedLoan()!.remainingBalance.toFixed(2)}` : '')}
          />

          {error && loans.length > 0 && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loans.length === 0}>
            Make Repayment
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <AlertComponent onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: 3 }}>
          {successMessage}
        </AlertComponent>
      </Snackbar>
    </Paper>
  )
}

export default MakeRepayment