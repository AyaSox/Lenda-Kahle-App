import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
  Pagination,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import {
  HistoryIcon,
  PaymentIcon,
  PersonAddIcon,
  SettingsIcon,
  CheckCircleIcon,
  CancelIcon
} from '../components/AppIcons'
import axios from '../api/axios'

interface AuditLog {
  id: number
  userId: string
  userEmail: string
  action: string
  entityType: string
  entityId: string
  details: string
  timestamp: string
  ipAddress: string
  userAgent: string
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get('/api/auditlogs')
      const raw = Array.isArray(response.data) ? response.data : (response.data?.items ?? [])
      const normalized = raw.map((log: any) => ({
        id: log.id ?? log.Id ?? 0,
        userId: log.userId ?? log.UserId ?? '',
        userEmail: log.userEmail ?? log.UserEmail ?? 'Unknown',
        action: log.action ?? log.Action ?? 'Unknown Action',
        entityType: log.entityType ?? log.EntityType ?? 'Unknown',
        entityId: log.entityId ?? log.EntityId ?? '',
        details: log.details ?? log.Details ?? '',
        timestamp: log.timestamp ?? log.Timestamp ?? new Date().toISOString(),
        ipAddress: log.ipAddress ?? log.IpAddress ?? '',
        userAgent: log.userAgent ?? log.UserAgent ?? ''
      }))
      setLogs(normalized)
    } catch (error: any) {
      console.error('Failed to fetch audit logs', error)
      setError('Failed to load audit logs. Please try again later.')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    const actionStr = action || ''
    if (actionStr.includes('Approved')) return <CheckCircleIcon sx={{ color: '#10b981' }} />
    if (actionStr.includes('Rejected')) return <CancelIcon sx={{ color: '#ef4444' }} />
    if (actionStr.includes('Repayment')) return <PaymentIcon sx={{ color: '#3b82f6' }} />
    if (actionStr.includes('User')) return <PersonAddIcon sx={{ color: '#8b5cf6' }} />
    if (actionStr.includes('Settings')) return <SettingsIcon sx={{ color: '#f59e0b' }} />
    return <HistoryIcon sx={{ color: '#6b7280' }} />
  }

  const getActionColor = (action: string): 'success' | 'error' | 'info' | 'warning' | 'default' => {
    const actionStr = action || ''
    if (actionStr.includes('Approved') || actionStr.includes('Created')) return 'success'
    if (actionStr.includes('Rejected') || actionStr.includes('Deleted')) return 'error'
    if (actionStr.includes('Repayment') || actionStr.includes('Login')) return 'info'
    if (actionStr.includes('Changed') || actionStr.includes('Updated')) return 'warning'
    return 'default'
  }

  // Safe filtering with null checks
  const filteredLogs = logs.filter(log => {
    if (!log) return false
    
    const action = log.action || ''
    const email = log.userEmail || ''
    const entityType = log.entityType || ''
    const matchesFilter = filter === 'All' || action.includes(filter)
    const term = (searchTerm || '').toLowerCase()
    const matchesSearch = 
      email.toLowerCase().includes(term) ||
      action.toLowerCase().includes(term) ||
      entityType.toLowerCase().includes(term)
    return matchesFilter && matchesSearch
  })

  const actionCounts = {
    total: logs.length,
    loanActions: logs.filter(l => l && (l.action || '').includes('Loan')).length,
    repayments: logs.filter(l => l && (l.action || '').includes('Repayment')).length,
    userActions: logs.filter(l => l && (l.action || '').includes('User')).length
  }

  // Pagination helpers
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage))
  const paginatedLogs = filteredLogs.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage)

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HistoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Audit Logs
        </Typography>
      </Box>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Complete audit trail of all system activities and user actions.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(3,105,161,0.06), rgba(59,130,246,0.06))', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="primary">Total Events</Typography>
              <Typography variant="h4">{actionCounts.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(34,197,94,0.04))', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="success.main">Loan Actions</Typography>
              <Typography variant="h4">{actionCounts.loanActions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(6,182,212,0.04))', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="info.main">Repayments</Typography>
              <Typography variant="h4">{actionCounts.repayments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(3,105,161,0.04), rgba(16,185,129,0.04))', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">User Actions</Typography>
              <Typography variant="h4">{actionCounts.userActions}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by user, action, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Filter by Action Type"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="All">All Actions</MenuItem>
              <MenuItem value="Loan">Loan Actions</MenuItem>
              <MenuItem value="Repayment">Repayments</MenuItem>
              <MenuItem value="User">User Actions</MenuItem>
              <MenuItem value="Settings">Settings Changes</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Logs Table */}
      {filteredLogs.length > 0 ? (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Timestamp</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Entity</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={`audit-${log.id}`} hover>
                  <TableCell>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }) : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="normal">
                      {log.userEmail || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ID: {log.userId ? log.userId.substring(0, 8) + '...' : 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActionIcon(log.action)}
                      <Chip
                        label={log.action || 'Unknown Action'}
                        color={getActionColor(log.action)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'normal' }}>
                      <strong>{log.entityType || 'Unknown'}</strong> #{log.entityId || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.details || 'No details'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredLogs.length)} of {filteredLogs.length}
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
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No audit logs found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {error 
              ? 'There was an error loading audit logs'
              : searchTerm || filter !== 'All' 
                ? 'Try adjusting your filters or search term'
                : 'Audit logs will appear here as actions are performed'
            }
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default AuditLogs
