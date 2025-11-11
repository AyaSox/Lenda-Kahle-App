import React, { useState, useEffect } from 'react'
import { TextField, Button, Paper, Typography, Box, Link, Grid, Snackbar, Alert as MuiAlert } from '@mui/material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AlertComponent = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
    { open: false, message: '', severity: 'success' }
  )

  useEffect(() => {
    // Show session ended message if user just logged out
    try {
      const flag = localStorage.getItem('sessionEndedMessage')
      if (flag === 'true') {
        setSnackbar({ open: true, message: 'Your session has ended — Thank you for using LendaKahleApp', severity: 'info' })
        // Do NOT remove the flag here so message persists across refreshes until user dismisses it
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      // Clear any session-ended message on successful login
      try { localStorage.removeItem('sessionEndedMessage') } catch {}
      navigate('/')
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || 'Login failed', severity: 'error' })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
    // Remove the persisted flag only when user explicitly closes the snackbar
    try { localStorage.removeItem('sessionEndedMessage') } catch {}
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={6} sx={{ width: '100%', maxWidth: 480, p: 4, borderRadius: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Log in to access your loans, repayments and account details.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            variant="outlined"
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            variant="outlined"
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, borderRadius: 2, py: 1.2 }}>
            Login
          </Button>

          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot password?</Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">Don't have an account? Sign Up</Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'info' ? null : 6000}
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

export default Login