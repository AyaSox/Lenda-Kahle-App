import React, { useState, useEffect } from 'react'
import { TextField, Button, Paper, Typography, Box, Alert } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(formData)
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
    } catch (error) {
      alert('Registration failed')
    }
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
    </Box>
  )
}

export default Register