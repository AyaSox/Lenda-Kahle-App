import React, { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme, Fab, Badge, Tooltip, Container } from '@mui/material'
import { SmartToy as BotIcon } from '@mui/icons-material'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LendaKahleChatbot from './components/LendaKahleChatbot'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import LoanList from './pages/LoanList'
import LoanApply from './pages/LoanApply'
import LoanDetails from './pages/LoanDetails'
import LoanCalculatorSimulator from './pages/LoanCalculatorSimulator'
import UploadDocuments from './pages/UploadDocuments'
import RepaymentList from './pages/RepaymentList'
import MakeRepayment from './pages/MakeRepayment'
import AdminDashboard from './pages/AdminDashboard'
import DefaultedLoans from './pages/DefaultedLoans'
import PendingLoans from './pages/PendingLoans'
import TransactionHistory from './pages/TransactionHistory'
import EnhancedAdminPanel from './pages/EnhancedAdminPanel'
import AuditLogs from './pages/AuditLogs'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const [chatbotOpen, setChatbotOpen] = useState(false)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <>
          <Navbar />
          <Container 
            maxWidth="xl" 
            sx={{ 
              mt: 11,
              mb: 4, 
              px: { xs: 2, sm: 3, md: 4 },
              minHeight: 'calc(100vh - 200px)'
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/calculator" element={<LoanCalculatorSimulator />} />
              <Route path="/loans" element={<ProtectedRoute><LoanList /></ProtectedRoute>} />
              <Route path="/loans/apply" element={<ProtectedRoute><LoanApply /></ProtectedRoute>} />
              <Route path="/loans/:id" element={<ProtectedRoute><LoanDetails /></ProtectedRoute>} />
              <Route path="/loans/:loanId/upload-documents" element={<ProtectedRoute><UploadDocuments /></ProtectedRoute>} />
              <Route path="/repayments" element={<ProtectedRoute><RepaymentList /></ProtectedRoute>} />
              <Route path="/repayments/make" element={<ProtectedRoute><MakeRepayment /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/enhanced" element={<ProtectedRoute roles={['Admin']}><EnhancedAdminPanel /></ProtectedRoute>} />
              <Route path="/admin/pending-loans" element={<ProtectedRoute roles={['Admin']}><PendingLoans /></ProtectedRoute>} />
              <Route path="/admin/defaulted-loans" element={<ProtectedRoute roles={['Admin']}><DefaultedLoans /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['Admin']}><AuditLogs /></ProtectedRoute>} />
              <Route path="/" element={<LoanCalculatorSimulator />} />
            </Routes>
          </Container>

          {/* AI Chatbot Floating Button */}
          <Tooltip title="Ask Lenda Kahle AI" placement="left">
            <Fab
              color="primary"
              onClick={() => setChatbotOpen(!chatbotOpen)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                background: 'linear-gradient(135deg, #01263f 0%, #003a5a 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #003a5a 0%, #01263f 100%)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s',
                zIndex: 1200,
                boxShadow: '0 4px 20px rgba(1,38,63,0.4)'
              }}
            >
              <Badge badgeContent="AI" color="secondary" sx={{ '& .MuiBadge-badge': { bgcolor: '#d4af37', color: '#01263f', fontWeight: 'bold' } }}>
                <BotIcon sx={{ fontSize: 28 }} />
              </Badge>
            </Fab>
          </Tooltip>

          {/* AI Chatbot Component */}
          <LendaKahleChatbot open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
        </>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
