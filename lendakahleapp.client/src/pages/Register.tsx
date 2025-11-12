import React, { useState, useEffect } from 'react'
import { TextField, Button, Paper, Typography, Box, Alert, Snackbar, Alert as MuiAlert } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AlertComponent = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const Register: React.FC = () => {
  const location = useLocation()
  const state = location.state as { suggestedLoanAmount?: number; suggestedTerm?: number } | null

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    idNumber: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
  })
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' }
  )
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(formData)
      
      // Show success message
      setSnackbar({ 
        open: true, 
        message: 'Registration successful! Welcome to Lenda Kahle.', 
        severity: 'success' 
      })
      
      // Navigate after a short delay to show the success message
      setTimeout(() => {
        if (state?.suggestedLoanAmount) {
          navigate('/loans/apply', {
            state: {
              suggestedAmount: state.suggestedLoanAmount,
              suggestedTerm: state.suggestedTerm,
            },
          })
        } else {
          navigate('/')
        }
      }, 1500)
    } catch (error: any) {
      // ✅ FIX: Display the clean error message from AuthContext
      const errorMessage = error?.message || 'Registration failed. Please try again.'
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper elevation={6} sx={{ width: '100%', maxWidth: 480, p: 4, borderRadius: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
          Welcome to Lenda Kahle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Create an account to apply for loans and manage your finances.
        </Typography>

        {state?.suggestedLoanAmount && (
          <Alert severity="info" sx={{ mb: 2 }}>
            🎯 <strong>From Calculator:</strong> R{state.suggestedLoanAmount.toLocaleString()} over {state.suggestedTerm} months. Complete registration to apply!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} required InputProps={{ sx: { borderRadius: 2 } }} />

          <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
            <Button type="submit" fullWidth variant="contained" sx={{ py: 1.2, borderRadius: 2 }}>
              Register
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <AlertComponent onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </AlertComponent>
      </Snackbar>
    </Box>
  )
}

export default Register
