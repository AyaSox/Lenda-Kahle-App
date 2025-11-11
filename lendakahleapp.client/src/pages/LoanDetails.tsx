import React, { useEffect, useState } from 'react'
import {
  Typography, Paper, Box, List, ListItem, ListItemText, Grid, Divider,
  Chip, LinearProgress, Button, Card, CardContent, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { getLoanStatusName, getLoanStatusColor, formatAmount } from '../utils/loanUtils'
import { ErrorIcon, PendingActionsIcon, CancelOutlinedIcon, ReceiptIcon, VisibilityIcon, CloudDownloadIcon, AccountBalanceIcon, TrendingUpIcon, PaymentIcon, ScheduleIcon, InfoIcon, CalendarTodayIcon, CheckCircleIcon, ThumbUpIcon, ThumbDownIcon, AttachFileIcon } from '../components/AppIcons'

interface Loan {
  id: number
  borrowerId: string
  borrowerName: string
  principalAmount: number
  interestRate: number
  termMonths: number
  totalRepayable: number
  monthlyInstallment: number
  purpose: string
  status: number
  applicationDate: string
  approvalDate: string | null
  startDate: string | null
  endDate: string | null
  remainingBalance: number
  totalPaid: number
  paymentsMade: number
  paymentsRemaining: number
}

interface Repayment {
  id: number
  loanId: number
  amount: number
  paymentDate: string
  transactionReference: string
  status: number
}

interface Document {
  id: number
  fileName: string
  documentType: number
  status: number
  isVerified: boolean
  uploadedDate: string
  verifiedDate?: string
  verificationNotes?: string
  fileSize: number
}

const LoanDetails: React.FC = () => {
const { id } = useParams<{ id: string }>()
const navigate = useNavigate()
const { user } = useAuth()
const [loan, setLoan] = useState<Loan | null>(null)
const [repayments, setRepayments] = useState<Repayment[]>([])
const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (id) {
      fetchLoan()
      fetchRepayments()
      fetchDocuments()
    }
  }, [id])

  const fetchLoan = async () => {
    try {
      const response = await axios.get(`/api/loans/${id}`)
      setLoan(response.data)
    } catch (error) {
      console.error('Failed to fetch loan', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRepayments = async () => {
    try {
      const response = await axios.get(`/api/loans/${id}/repayments`)
      setRepayments(response.data)
    } catch (error) {
      console.error('Failed to fetch repayments', error)
    }
  }

  const handleApproveLoan = async () => {
    setActionLoading(true)
    try {
      await axios.post(`/api/loans/${id}/approve`)
      setApproveDialogOpen(false)
      await fetchLoan() // Refresh loan data
      setSnackbar({
        open: true,
        message: 'Loan approved successfully!',
        severity: 'success'
      })
    } catch (error: any) {
      console.error('Failed to approve loan', error)
      setSnackbar({
        open: true,
        message: 'Failed to approve loan: ' + (error.response?.data || error.message),
        severity: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectLoan = async () => {
    setActionLoading(true)
    try {
      await axios.post(`/api/loans/${id}/reject`)
      setRejectDialogOpen(false)
      await fetchLoan() // Refresh loan data
      setSnackbar({
        open: true,
        message: 'Loan rejected successfully',
        severity: 'warning'
      })
    } catch (error: any) {
      console.error('Failed to reject loan', error)
      setSnackbar({
        open: true,
        message: 'Failed to reject loan: ' + (error.response?.data || error.message),
        severity: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const fetchDocuments = async () => {
    try {
      console.log(`Fetching documents for loan ${id}...`)
      const response = await axios.get(`/api/documents/loan/${id}`)
      console.log('Documents response:', response.data)
      setDocuments(response.data)
    } catch (error: any) {
      console.error('Failed to fetch documents', error)
      console.error('Error details:', error.response?.data)
      // Set empty array on error so the section still shows
      setDocuments([])
    }
  }

  const getDocumentTypeName = (type: number) => {
    const types = {
      0: 'South African ID',
      1: 'Payslips',
      2: 'Bank Statements', 
      3: 'Proof of Residence',
      4: 'Employment Letter',
      5: 'Combined Documents'
    }
    return types[type as keyof typeof types] || 'Unknown'
  }

  const getDocumentStatusIcon = (status: number, isVerified: boolean) => {
    if (isVerified) return <CheckCircleIcon sx={{ color: '#10b981' }} />
    if (status === 2) return <CancelOutlinedIcon sx={{ color: '#ef4444' }} />
    return <PendingActionsIcon sx={{ color: '#f59e0b' }} />
  }

  const getDocumentStatusText = (status: number, isVerified: boolean) => {
    if (isVerified) return 'Verified'
    if (status === 2) return 'Rejected'
    return 'Pending'
  }

  const getDocumentStatusColor = (status: number, isVerified: boolean) => {
    if (isVerified) return 'success'
    if (status === 2) return 'error'
    return 'warning'
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await axios.get(`/api/documents/download/${doc.id}`, {
        responseType: 'blob' // Important for file downloads
      })
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Failed to download document', error)
      setSnackbar({
        open: true,
        message: `Failed to download document: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      })
    }
  }

  const canApproveReject = user && (user.roles.includes('Admin') || user.roles.includes('LoanOfficer'))

  if (loading) return <Typography>Loading...</Typography>
  if (!loan) return <Typography>Loan not found</Typography>

  const paymentProgress = (loan.totalPaid / loan.totalRepayable) * 100
  const daysUntilNextPayment = loan.startDate ? 30 - (new Date().getDate() - new Date(loan.startDate).getDate()) : 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Loan #{loan.id} - {loan.purpose}
        </Typography>
        <Box
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            backgroundColor: getLoanStatusColor(loan.status),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        >
          {getLoanStatusName(loan.status)}
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(3,105,161,0.06), rgba(59,130,246,0.06))', borderRadius: 2, transition: 'transform 160ms ease, box-shadow 160ms ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.06)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon sx={{ mr: 1, color: '#3b82f6' }} />
                <Typography variant="caption" color="textSecondary">
                  Principal Amount
                </Typography>
              </Box>
              <Typography variant="h5">R{formatAmount(loan.principalAmount)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(34,197,94,0.04))', borderRadius: 2, transition: 'transform 160ms ease, box-shadow 160ms ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.06)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignments: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: '#10b981' }} />
                <Typography variant="caption" color="textSecondary">
                  Total Paid
                </Typography>
              </Box>
              <Typography variant="h5" color="#10b981">
                R{formatAmount(loan.totalPaid)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(249,115,22,0.04))', borderRadius: 2, transition: 'transform 160ms ease, box-shadow 160ms ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.06)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PaymentIcon sx={{ mr: 1, color: '#f59e0b' }} />
                <Typography variant="caption" color="textSecondary">
                  Remaining Balance
                </Typography>
              </Box>
              <Typography variant="h5" color="#f59e0b">
                R{formatAmount(loan.remainingBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(139,92,246,0.06))', borderRadius: 2, transition: 'transform 160ms ease, box-shadow 160ms ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.06)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: '#8b5cf6' }} />
                <Typography variant="caption" color="textSecondary">
                  Payments Remaining
                </Typography>
              </Box>
              <Typography variant="h5">{loan.paymentsRemaining} / {loan.termMonths}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Progress */}
      {(loan.status === 2 || loan.status === 3) && ( // Approved or Active
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Payment Progress</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <LinearProgress
                variant="determinate"
                value={paymentProgress}
                sx={{
                  height: 12,
                  borderRadius: 1,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: paymentProgress === 100 ? '#10b981' : '#3b82f6'
                  }
                }}
              />
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {paymentProgress.toFixed(1)}%
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary">
            {loan.paymentsMade} of {loan.termMonths} payments made
          </Typography>
        </Paper>
      )}

      {/* Loan Information Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Loan Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Borrower</Typography>
                <Typography fontWeight="bold">{loan.borrowerName}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Purpose</Typography>
                <Typography fontWeight="bold">{loan.purpose}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Interest Rate (Annual)</Typography>
                <Typography fontWeight="bold">{loan.interestRate}%</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Loan Term</Typography>
                <Typography fontWeight="bold">{loan.termMonths} months</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Monthly Installment</Typography>
                <Typography fontWeight="bold" fontSize="1.2rem" color="#3b82f6">
                  R{formatAmount(loan.monthlyInstallment)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Total Repayable</Typography>
                <Typography fontWeight="bold">R{formatAmount(loan.totalRepayable)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <CalendarTodayIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  <CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Application Date
                </Typography>
                <Typography fontWeight="bold">
                  {new Date(loan.applicationDate).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              {loan.approvalDate && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    <CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5, color: '#10b981' }} />
                    Approval Date
                  </Typography>
                  <Typography fontWeight="bold">
                    {new Date(loan.approvalDate).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              )}

              {loan.startDate && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    <ScheduleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5, color: '#3b82f6' }} />
                    Start Date
                  </Typography>
                  <Typography fontWeight="bold">
                    {new Date(loan.startDate).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              )}

              {loan.endDate && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    <CancelOutlinedIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Expected End Date
                  </Typography>
                  <Typography fontWeight="bold">
                    {new Date(loan.endDate).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              )}

              {loan.status === 0 && (
                <>
                  <Alert severity="info" icon={<InfoIcon />}>
                    This loan is pending approval
                  </Alert>
                  
                  {canApproveReject && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUpIcon />}
                        onClick={() => setApproveDialogOpen(true)}
                        fullWidth
                      >
                        Approve Loan
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<ThumbDownIcon />}
                        onClick={() => setRejectDialogOpen(true)}
                        fullWidth
                      >
                        Reject Loan
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {loan.status === 1 && (
                <>
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    This loan has been pre-approved! Document verification is required before final approval and disbursement.
                  </Alert>
                  
                  {canApproveReject && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUpIcon />}
                        onClick={() => setApproveDialogOpen(true)}
                        fullWidth
                      >
                        Final Approval
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<ThumbDownIcon />}
                        onClick={() => setRejectDialogOpen(true)}
                        fullWidth
                      >
                        Reject Loan
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {loan.status === 2 && (
                <>
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    This loan has been approved and is ready for disbursement. Once the first repayment is made, it will become active.
                  </Alert>
                </>
              )}

              {loan.status === 3 && daysUntilNextPayment > 0 && (
                <Alert severity="warning">
                  Next payment due in approximately {daysUntilNextPayment} days
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Documents Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <AttachFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Supporting Documents ({documents?.length || 0} files)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {!documents || documents.length === 0 ? (
          <Alert severity="info">
            No documents uploaded for this loan
            <br />
            <Typography variant="caption">
              Loan ID: {id} | API Status: {documents ? 'Loaded (empty)' : 'Loading...'}
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getDocumentStatusIcon(doc.status, doc.isVerified)}
                    <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {getDocumentTypeName(doc.documentType)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {doc.fileName}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={getDocumentStatusText(doc.status, doc.isVerified)}
                      color={getDocumentStatusColor(doc.status, doc.isVerified)}
                      size="small"
                    />
                    <Typography variant="caption" color="textSecondary">
                      {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                    Uploaded: {new Date(doc.uploadedDate).toLocaleDateString()}
                  </Typography>
                  
                  {doc.verifiedDate && (
                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                      Verified: {new Date(doc.verifiedDate).toLocaleDateString()}
                    </Typography>
                  )}
                  
                  {doc.verificationNotes && (
                    <Typography variant="caption" display="block" sx={{ mb: 1, fontStyle: 'italic' }}>
                      Note: {doc.verificationNotes}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleDownloadDocument(doc)}
                      fullWidth
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownloadIcon />}
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      Download
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}

            {canApproveReject && documents.some(doc => !doc.isVerified && doc.status === 0) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Some documents are pending verification. Review and verify documents before approving the loan.
                </Typography>
              </Alert>
            )}
          </Grid>
        )}

        {canApproveReject && documents.some(doc => !doc.isVerified && doc.status === 0) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Some documents are pending verification. Review and verify documents before approving the loan.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Repayment History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Repayment History ({repayments.length} payments)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {repayments.length === 0 ? (
          <Alert severity="info">No repayments made yet</Alert>
        ) : (
          <List>
            {repayments.map((repayment, index) => (
              <ListItem
                key={repayment.id}
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  mb: 1,
                  background: 'linear-gradient(180deg, #ffffff, #f8fafb)',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.06)' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography fontWeight="bold">
                        Payment #{index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={`R${formatAmount(repayment.amount)}`}
                          color="success"
                          size="small"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReceiptIcon />}
                          onClick={() => window.open(`/api/reports/repayment/${repayment.id}/receipt`, '_blank')}
                        >
                          Receipt
                        </Button>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" display="block">
                        <strong>Date:</strong> {new Date(repayment.paymentDate).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Reference:</strong> {repayment.transactionReference}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {(loan.status === 2 || loan.status === 3) && loan.remainingBalance > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/repayments/make')}
              startIcon={<PaymentIcon />}
              sx={{ background: 'linear-gradient(45deg,#0ea5e9 10%, #06b6d4 90%)', '&:hover': { background: 'linear-gradient(45deg,#0891b2 10%, #0284c7 90%)' } }}
            >
              Make a Repayment
            </Button>
          </Box>
        )}
      </Paper>

      {/* Approval Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Loan Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this loan application?
          </Typography>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f9ff', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Borrower:</strong> {loan.borrowerName}</Typography>
            <Typography variant="body2"><strong>Amount:</strong> R{formatAmount(loan.principalAmount)}</Typography>
            <Typography variant="body2"><strong>Purpose:</strong> {loan.purpose}</Typography>
            <Typography variant="body2"><strong>Term:</strong> {loan.termMonths} months</Typography>
            <Typography variant="body2"><strong>Monthly Payment:</strong> R{formatAmount(loan.monthlyInstallment)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApproveLoan} 
            variant="contained" 
            color="success"
            disabled={actionLoading}
          >
            {actionLoading ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Loan Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reject this loan application?
          </Typography>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#fef2f2', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Borrower:</strong> {loan.borrowerName}</Typography>
            <Typography variant="body2"><strong>Amount:</strong> R{formatAmount(loan.principalAmount)}</Typography>
            <Typography variant="body2"><strong>Purpose:</strong> {loan.purpose}</Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The borrower will be notified of the rejection.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectLoan} 
            variant="contained" 
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            boxShadow: 3
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LoanDetails