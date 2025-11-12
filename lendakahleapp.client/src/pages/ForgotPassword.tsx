import React, { useState } from 'react'
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Link as MuiLink
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://lenda-kahle-app.onrender.com'

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const steps = ['Verify Identity', 'Reset Password', 'Complete']

  const handleVerifyAccount = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post('/api/auth/verify-account', {
        email,
        firstName
      })

      setMessage(response.data.message || 'Account verified successfully!')
      setToken(response.data.token)
      setStep(1)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Account verification failed. Please check your information.'
      setError(errorMessage)
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
      const response = await axios.post('/api/auth/reset-password', {
        email,
        token,
        newPassword
      })

      setMessage(response.data.message || 'Password reset successfully!')
      setStep(2)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Password reset failed. Please try again.'
      setError(errorMessage)
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
        <Paper elevation={6} sx={{ padding: 4, width: '100%', borderRadius: 4 }}>
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
            {/* Step 0: Verify Account with Email + First Name */}
            {step === 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  To reset your password, please enter your email address and first name to verify your identity.
                </Typography>
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
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, borderRadius: 2, py: 1.2 }}
                  onClick={handleVerifyAccount}
                  disabled={loading || !email || !firstName}
                >
                  {loading ? 'Verifying...' : 'Verify Identity'}
                </Button>
              </>
            )}

            {/* Step 1: Set New Password */}
            {step === 1 && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold">
                    ✅ Identity Verified!
                  </Typography>
                  <Typography variant="body2">
                    You can now set a new password for your account.
                  </Typography>
                </Alert>

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="newPassword"
                  label="New Password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Password must be at least 6 characters"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="confirmPassword"
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, borderRadius: 2, py: 1.2 }}
                  onClick={handleResetPassword}
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </>
            )}

            {/* Step 2: Success */}
            {step === 2 && (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    🎉 Password Reset Successfully!
                  </Typography>
                  <Typography variant="body2">
                    Your password has been changed. You can now login with your new password.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Redirecting to login page in 3 seconds...
                  </Typography>
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: 2, py: 1.2 }}
                  onClick={() => navigate('/login')}
                >
                  Go to Login Now
                </Button>
              </>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <MuiLink component={Link} to="/login" variant="body2">
                Remember your password? Login here
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default ForgotPassword
