import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Pagination,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  FilterList,
  Download
} from '@mui/icons-material'
import axios from '../api/axios'
import { AccountBalanceIcon, PaymentIcon, CheckCircleIcon, CancelIcon, ScheduleIcon } from '../components/AppIcons'

// ===== FRONTEND COPY OF BACKEND ENUM (LoanStatus) =====
// Keep in sync with Server Models\Loan.cs
const LoanStatus = {
  Pending: 0,
  PreApproved: 1,
  Approved: 2,
  Active: 3,
  Rejected: 4,
  Completed: 5
} as const

// Label mapping used across filter, table and export
const typeLabels: Record<string, string> = {
  loan_application: 'Application',
  loan_approval: 'Approval',
  loan_rejection: 'Rejection',
  repayment: 'Repayment',
  loan_completion: 'Completion'
}

// Order to display types in filter
const typeOrder = ['loan_application', 'loan_approval', 'loan_rejection', 'repayment', 'loan_completion']

interface Transaction {
  id: string
  type: 'loan_application' | 'loan_approval' | 'loan_rejection' | 'repayment' | 'loan_completion'
  description: string
  amount?: number
  date: string
  loanId: number
  borrowerName: string
  status: string
  reference?: string
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Export format
  const [exportFormat, setExportFormat] = useState<string>('csv')

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
    setPage(1)
  }, [transactions, filterType, dateFrom, dateTo, searchTerm])

  const fetchTransactions = async () => {
    try {
      const loansResponse = await axios.get('/api/loans/my')
      const loans = loansResponse.data
      const allTransactions: Transaction[] = []

      // Fetch all repayments first
      const repaymentPromises = loans.map((loan: any) =>
        axios.get(`/api/loans/${loan.id}/repayments`)
          .then(response => ({ loanId: loan.id, repayments: response.data, loan }))
          .catch(err => ({ loanId: loan.id, repayments: [], loan }))
      )

      const allRepayments = await Promise.all(repaymentPromises)

      loans.forEach((loan: any) => {
        // Application
        allTransactions.push({
          id: `app-${loan.id}`,
          type: 'loan_application',
          description: `Loan application submitted for ${loan.purpose}`,
          date: loan.applicationDate,
          loanId: loan.id,
          borrowerName: loan.borrowerName,
          status: 'completed',
          amount: loan.principalAmount
        })

        // Approval (show once loan has progressed beyond pending OR pre-approved)
        // We show approval event for statuses: PreApproved, Approved, Active, Completed
        if ([LoanStatus.PreApproved, LoanStatus.Approved, LoanStatus.Active, LoanStatus.Completed].includes(loan.status)) {
          allTransactions.push({
            id: `appr-${loan.id}`,
            type: 'loan_approval',
            description: loan.status === LoanStatus.PreApproved
              ? `Loan pre-approved for ${loan.purpose}`
              : `Loan approved for ${loan.purpose}`,
            date: loan.approvalDate || loan.startDate || loan.applicationDate,
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            status: 'completed'
          })
        }

        // Rejection
        if (loan.status === LoanStatus.Rejected) {
          allTransactions.push({
            id: `rej-${loan.id}`,
            type: 'loan_rejection',
            description: `Loan application rejected for ${loan.purpose}`,
            date: loan.approvalDate || loan.applicationDate,
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            status: 'completed'
          })
        }

        // Completion (status Completed)
        if (loan.status === LoanStatus.Completed) {
          allTransactions.push({
            id: `comp-${loan.id}`,
            type: 'loan_completion',
            description: `Loan fully repaid - ${loan.purpose}`,
            date: loan.endDate || loan.approvalDate || new Date().toISOString(),
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            status: 'completed'
          })
        }

        // Real repayments
        const loanRepayments = allRepayments.find(r => r.loanId === loan.id)
        if (loanRepayments && loanRepayments.repayments.length > 0) {
          loanRepayments.repayments.forEach((repayment: any) => {
            allTransactions.push({
              id: `pay-${repayment.id}`,
              type: 'repayment',
              description: `Repayment for ${loan.purpose}`,
              amount: repayment.amount,
              date: repayment.paymentDate,
              loanId: repayment.loanId,
              borrowerName: loan.borrowerName,
              status: 'completed',
              reference: repayment.transactionReference || `TXN-${repayment.id}`
            })
          })
        }
      })

      setTransactions(allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (error) {
      console.error('Failed to fetch transactions', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType)
    if (dateFrom) filtered = filtered.filter(t => new Date(t.date) >= dateFrom)
    if (dateTo) filtered = filtered.filter(t => new Date(t.date) <= dateTo)
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredTransactions(filtered)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'loan_application': return <AccountBalanceIcon color="info" />
      case 'loan_approval': return <CheckCircleIcon color="success" />
      case 'loan_rejection': return <CancelIcon color="error" />
      case 'repayment': return <PaymentIcon color="primary" />
      case 'loan_completion': return <CheckCircleIcon color="success" />
      default: return <ScheduleIcon />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const getTypeLabel = (type: string) => typeLabels[type] ?? type

  const transactionSummary = {
    total: filteredTransactions.length,
    repayments: filteredTransactions.filter(t => t.type === 'repayment').length,
    applications: filteredTransactions.filter(t => t.type === 'loan_application').length,
    totalRepayments: filteredTransactions.filter(t => t.type === 'repayment').reduce((sum, t) => sum + (t.amount || 0), 0)
  }

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / rowsPerPage))
  const paginatedTransactions = filteredTransactions.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage)

  const buildExportQuery = () => {
    const params: Record<string, any> = {}
    if (filterType && filterType !== 'all') params.type = filterType
    if (dateFrom) params.dateFrom = dateFrom.toISOString()
    if (dateTo) params.dateTo = dateTo.toISOString()
    if (searchTerm) params.search = searchTerm
    params.page = page
    params.pageSize = rowsPerPage
    params.format = exportFormat
    return Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
  }

  const exportTransactions = () => {
    const qs = buildExportQuery()
    const url = `/api/reports/transactions/export?${qs}`
    window.open(url, '_blank')
  }

  if (loading) return <Typography>Loading transactions...</Typography>

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Complete history of all loan-related transactions and events.
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(3,105,161,0.06), rgba(59,130,246,0.06))', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Total Transactions
                </Typography>
                <Typography variant="h4">{transactionSummary.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(34,197,94,0.04))', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Repayments
                </Typography>
                <Typography variant="h4">{transactionSummary.repayments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(6,182,212,0.04))', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  Applications
                </Typography>
                <Typography variant="h4">{transactionSummary.applications}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(3,105,161,0.04), rgba(16,185,129,0.04))', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Total Repayments
                </Typography>
                <Typography variant="h4">R{transactionSummary.totalRepayments.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Transaction Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {typeOrder.map(t => (
                  <MenuItem key={t} value={t}>{typeLabels[t]}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                type="date"
                fullWidth
                label="Date From"
                value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                type="date"
                fullWidth
                label="Date To"
                value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search (Borrower, Description, Reference)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth>
                <InputLabel id="export-format-label">Format</InputLabel>
                <Select
                  labelId="export-format-label"
                  value={exportFormat}
                  label="Format"
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="xlsx">XLSX</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <Tooltip title={`Export Transactions as ${exportFormat.toUpperCase()} (current filters & page)`}>
                <IconButton
                  color="primary"
                  onClick={exportTransactions}
                  sx={{ mt: 1 }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Transactions Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Borrower</strong></TableCell>
                <TableCell><strong>Loan ID</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Reference</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {getTypeLabel(transaction.type)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="normal">
                      {transaction.borrowerName}
                    </Typography>
                  </TableCell>
                  <TableCell>#{transaction.loanId}</TableCell>
                  <TableCell>
                    {transaction.amount ? (
                      <Typography variant="body2" fontWeight="normal" color="success.main">
                        R{transaction.amount.toFixed(2)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status.toUpperCase()}
                      color={getStatusColor(transaction.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {transaction.reference || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredTransactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No transactions found matching your criteria
            </Typography>
          </Box>
        )}

        {/* Pagination controls */}
        {filteredTransactions.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="rows-per-page-label">Rows</InputLabel>
                <Select
                  labelId="rows-per-page-label"
                  value={rowsPerPage}
                  label="Rows"
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>

              <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" />
            </Box>
          </Box>
        )}
      </Box>
  )
}

export default TransactionHistory;