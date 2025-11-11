import React, { useState } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import { Link } from 'react-router-dom'
import axios from '../api/axios'

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const steps = ['Request Reset', 'Enter Token', 'New Password']

  const handleRequestReset = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await axios.post('/api/auth/forgot-password', { email })
      setMessage('If the email exists, a password reset token has been generated. Check console for the token (in production, this would be sent via email).')
      setStep(1)
    } catch (err: any) {
      setError(err.response?.data || 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await axios.post('/api/auth/reset-password', {
        email,
        token,
        newPassword
      })
      setMessage('Password reset successfully! You can now login with your new password.')
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Reset Password
          </Typography>

          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" noValidate sx={{ mt: 1 }}>
            {step === 0 && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  onClick={handleRequestReset}
                  disabled={loading || !email}
                >
                  {loading ? 'Sending...' : 'Send Reset Token'}
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Demo Mode:</strong> Check the browser console or server logs for the password reset token.
                    In production, this would be sent to your email.
                  </Typography>
                </Alert>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="token"
                  label="Reset Token"
                  name="token"
                  autoFocus
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter the token from console/email"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="newPassword"
                  label="New Password"
                  type="password"
                  id="newPassword"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  onClick={handleResetPassword}
                  disabled={loading || !token || !newPassword || !confirmPassword}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}

            {step === 2 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Password Reset Complete!
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  Go to Login
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button component={Link} to="/login" variant="text">
                Back to Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default ForgotPassword