import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material'
import { Assessment, People, AccountBalance, TrendingUp } from '@mui/icons-material'
import axios from '../api/axios'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { PersonAdd, Edit, Delete, Settings } from '../components/AppIcons'

const AlertComponent = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  dateCreated: string
  isActive: boolean
}

interface SystemSettings {
  defaultInterestRate: number
  maxLoanAmount: number
  maxLoanTerm: number
  autoApprovalThreshold: number
  latePaymentFeeRate: number
  emailNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
}

interface PersistedSystemSettings {
  id: number
  maxLoanAmount: number
  maxLoanTermMonths: number
  smallLoanBaseRate?: number
  mediumLoanBaseRate?: number
  largeLoanBaseRate?: number
  minimumInterestRate?: number
  maximumInterestRate?: number
  updatedAt: string
  updatedByEmail?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const EnhancedAdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<SystemSettings>({
    defaultInterestRate: 15,
    maxLoanAmount: 1000000,
    maxLoanTerm: 60,
    autoApprovalThreshold: 50000,
    latePaymentFeeRate: 2.5,
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false
  })
  const [lendingRules, setLendingRules] = useState<any>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userPendingDelete, setUserPendingDelete] = useState<User | null>(null)
  const [persistedSettingsMeta, setPersistedSettingsMeta] = useState<{ updatedAt?: string; updatedByEmail?: string }>({})
  const [maxLoanAmountInput, setMaxLoanAmountInput] = useState<string>('')
  const [maxLoanTermInput, setMaxLoanTermInput] = useState<string>('')

  const [smallLoanBaseRateInput, setSmallLoanBaseRateInput] = useState<string>('')
  const [mediumLoanBaseRateInput, setMediumLoanBaseRateInput] = useState<string>('')
  const [largeLoanBaseRateInput, setLargeLoanBaseRateInput] = useState<string>('')
  const [minInterestRateInput, setMinInterestRateInput] = useState<string>('')
  const [maxInterestRateInput, setMaxInterestRateInput] = useState<string>('')

  const [analytics, setAnalytics] = useState<{
    totalLoans: number
    activeLoans: number
    pendingLoans: number
    totalRevenue: number
  } | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchSettings()
    fetchPersistedSystemSettings()
    fetchAnalytics()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      const userData = response.data
      
      // Handle different response formats
      let usersArray: User[] = []
      if (Array.isArray(userData)) {
        usersArray = userData
      } else if (userData && Array.isArray(userData.items)) {
        usersArray = userData.items
      } else if (userData && typeof userData === 'object') {
        // Try to extract users from object values
        const possibleUsers = Object.values(userData).filter(item => 
          item && typeof item === 'object' && 'id' in item && 'email' in item
        )
        usersArray = possibleUsers as User[]
      }

      // Ensure all users have required properties
      const normalizedUsers = usersArray.map(user => ({
        id: user.id || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roles: Array.isArray(user.roles) ? user.roles : (user.roles ? [String(user.roles)] : ['Borrower']),
        dateCreated: user.dateCreated || new Date().toISOString(),
        isActive: user.isActive !== undefined ? user.isActive : true
      }))

      setUsers(normalizedUsers)
    } catch (error: any) {
      console.error('Failed to fetch users', error)
      setSnackbar({
        open: true,
        message: `Failed to load users: ${error.response?.data?.error || error.message || 'Unknown error'}`,
        severity: 'error'
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const resp = await axios.get('/api/settings/lendingrules')
      const r = resp.data || {}
      setLendingRules(r)

      const defaultInterestRate = r?.interestRates?.baseRates?.mediumLoanBase ?? settings.defaultInterestRate
      const autoApprovalThreshold = r?.autoApproval?.maxAutoApprovalAmount ?? settings.autoApprovalThreshold
      const latePaymentFeeRate = r?.fees?.monthlyServiceFee ?? settings.latePaymentFeeRate

      setSettings(prev => ({
        ...prev,
        defaultInterestRate: Number(defaultInterestRate) || prev.defaultInterestRate,
        autoApprovalThreshold: Number(autoApprovalThreshold) || prev.autoApprovalThreshold,
        latePaymentFeeRate: Number(latePaymentFeeRate) || prev.latePaymentFeeRate
      }))
    } catch (error) {
      console.error('Failed to fetch lending rules', error)
    }
  }

  const fetchPersistedSystemSettings = async () => {
    try {
      const resp = await axios.get('/api/systemsettings')
      const data: PersistedSystemSettings = resp.data
      setSettings(prev => ({
        ...prev,
        maxLoanAmount: data.maxLoanAmount || prev.maxLoanAmount,
        maxLoanTerm: data.maxLoanTermMonths || prev.maxLoanTerm
      }))
      setMaxLoanAmountInput(String(data.maxLoanAmount || 1000000))
      setMaxLoanTermInput(String(data.maxLoanTermMonths || 60))
      setSmallLoanBaseRateInput(String(data.smallLoanBaseRate || 27.5))
      setMediumLoanBaseRateInput(String(data.mediumLoanBaseRate || 24.0))
      setLargeLoanBaseRateInput(String(data.largeLoanBaseRate || 22.0))
      setMinInterestRateInput(String(data.minimumInterestRate || 18.0))
      setMaxInterestRateInput(String(data.maximumInterestRate || 27.5))
      setPersistedSettingsMeta({ 
        updatedAt: data.updatedAt, 
        updatedByEmail: data.updatedByEmail 
      })
    } catch (e) {
      console.error('Failed to load persisted system settings', e)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const resp = await axios.get('/api/reports/dashboard')
      const dashboardData = resp.data || {}
      
      setAnalytics({
        totalLoans: dashboardData.totalLoans || 0,
        activeLoans: dashboardData.activeLoans || 0,
        pendingLoans: 0,
        totalRevenue: dashboardData.totalRepayments || 0
      })
      
      try {
        const loansResp = await axios.get('/api/loans/all')
        const loansData = loansResp.data
        let loans: any[] = []
        
        if (Array.isArray(loansData)) {
          loans = loansData
        } else if (loansData && Array.isArray(loansData.items)) {
          loans = loansData.items
        }
        
        const awaitingReviewCount = loans.filter((loan: any) => 
          loan && (loan.status === 0 || loan.status === 1)
        ).length
        
        setAnalytics(prev => prev ? { ...prev, pendingLoans: awaitingReviewCount } : null)
      } catch (loansError) {
        console.warn('Could not fetch loans for pending count:', loansError)
      }
    } catch (error) {
      console.error('Failed to fetch analytics', error)
      setAnalytics({
        totalLoans: 0,
        activeLoans: 0,
        pendingLoans: 0,
        totalRevenue: 0
      })
    }
  }

  const handleUserSave = async () => {
    try {
      const isNewUser = !selectedUser.id
      
      if (!selectedUser.email || !selectedUser.firstName || !selectedUser.lastName || !selectedUser.roles || selectedUser.roles.length === 0) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        })
        return
      }

      if (isNewUser) {
        await axios.post('/api/users', {
          email: selectedUser.email,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          password: 'DefaultPassword123!',
          role: selectedUser.roles[0]
        })
      } else {
        await axios.put(`/api/users/${selectedUser.id}`, {
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          email: selectedUser.email,
          role: selectedUser.roles[0]
        })
      }
      
      setUserDialogOpen(false)
      setSnackbar({
        open: true,
        message: isNewUser ? `User ${selectedUser.firstName} ${selectedUser.lastName} created successfully!` : `User ${selectedUser.firstName} ${selectedUser.lastName} updated successfully!`,
        severity: 'success'
      })
      setSelectedUser({})
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to save user', error)
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.message || 'Failed to save user. Please try again.',
        severity: 'error'
      })
    }
  }

  const confirmDeleteUser = (user: User) => {
    setUserPendingDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handlePerformDelete = async () => {
    if (!userPendingDelete) return
    try {
      await axios.delete(`/api/users/${userPendingDelete.id}`)
      setSnackbar({
        open: true,
        message: `User ${userPendingDelete.firstName} ${userPendingDelete.lastName} deleted successfully`,
        severity: 'warning'
      })
      setDeleteConfirmOpen(false)
      setUserPendingDelete(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user', error)
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.message || 'Failed to delete user. Please try again.',
        severity: 'error'
      })
    }
  }

  const handleSettingsSave = async () => {
    try {
      const amountNum = Number((maxLoanAmountInput || '').toString().replace(/[^0-9.]/g, ''))
      const termNum = Number((maxLoanTermInput || '').toString().replace(/[^0-9]/g, ''))
      const smallRate = Number((smallLoanBaseRateInput || '').toString().replace(/[^0-9.]/g, ''))
      const mediumRate = Number((mediumLoanBaseRateInput || '').toString().replace(/[^0-9.]/g, ''))
      const largeRate = Number((largeLoanBaseRateInput || '').toString().replace(/[^0-9.]/g, ''))
      const minRate = Number((minInterestRateInput || '').toString().replace(/[^0-9.]/g, ''))
      const maxRate = Number((maxInterestRateInput || '').toString().replace(/[^0-9.]/g, ''))

      const payload = {
        maxLoanAmount: isNaN(amountNum) ? settings.maxLoanAmount : amountNum,
        maxLoanTermMonths: isNaN(termNum) ? settings.maxLoanTerm : termNum,
        smallLoanBaseRate: isNaN(smallRate) ? 27.5 : smallRate,
        mediumLoanBaseRate: isNaN(mediumRate) ? 24.0 : mediumRate,
        largeLoanBaseRate: isNaN(largeRate) ? 22.0 : largeRate,
        minimumInterestRate: isNaN(minRate) ? 18.0 : minRate,
        maximumInterestRate: isNaN(maxRate) ? 27.5 : maxRate
      }

      const resp = await axios.put('/api/systemsettings', payload)
      const saved = resp.data as PersistedSystemSettings
      setPersistedSettingsMeta({ 
        updatedAt: saved.updatedAt, 
        updatedByEmail: saved.updatedByEmail 
      })
      setSettings(prev => ({ 
        ...prev, 
        maxLoanAmount: saved.maxLoanAmount || prev.maxLoanAmount, 
        maxLoanTerm: saved.maxLoanTermMonths || prev.maxLoanTerm 
      }))
      setMaxLoanAmountInput(String(saved.maxLoanAmount))
      setMaxLoanTermInput(String(saved.maxLoanTermMonths))
      setSmallLoanBaseRateInput(String(saved.smallLoanBaseRate))
      setMediumLoanBaseRateInput(String(saved.mediumLoanBaseRate))
      setLargeLoanBaseRateInput(String(saved.largeLoanBaseRate))
      setMinInterestRateInput(String(saved.minimumInterestRate))
      setMaxInterestRateInput(String(saved.maximumInterestRate))
      setSnackbar({ 
        open: true, 
        message: 'Settings saved successfully! Interest rates updated.', 
        severity: 'success' 
      })
    } catch (error:any) {
      console.error('Failed to save settings', error)
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || error.message || 'Failed to save settings. Please try again.',
        severity: 'error' 
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'error'
      case 'Borrower': return 'info'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading admin panel...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Enhanced Admin Panel
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<Assessment />} label="Dashboard" />
          <Tab icon={<People />} label="User Management" />
          <Tab icon={<Settings />} label="System Settings" />
          <Tab icon={<AccountBalance />} label="Lending Rules" />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Total Users</Typography>
                </Box>
                <Typography variant="h4">{users.length}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Active system users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Active Loans</Typography>
                </Box>
                <Typography variant="h4">{analytics?.activeLoans || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Currently active loans
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Pending Review</Typography>
                </Box>
                <Typography variant="h4">{analytics?.pendingLoans || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Applications awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Total Revenue</Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  R{analytics?.totalRevenue ? analytics.totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total repayments collected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6">System Status</Typography>
            <Typography>
              {analytics?.totalLoans || 0} total loans processed | {analytics?.activeLoans || 0} currently active | {analytics?.pendingLoans || 0} awaiting review
            </Typography>
          </Alert>
        </Box>
      </TabPanel>

      {/* User Management Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {
              setSelectedUser({})
              setUserDialogOpen(true)
            }}
          >
            Add New User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Roles</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {user.firstName} {user.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles && user.roles.map((role) => (
                      <Chip
                        key={role}
                        label={role}
                        color={getRoleColor(role)}
                        size="small"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {user.dateCreated ? new Date(user.dateCreated).toLocaleDateString() : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton
                        onClick={() => {
                          setSelectedUser(user)
                          setUserDialogOpen(true)
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton 
                        color="error"
                        onClick={() => confirmDeleteUser(user)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No users found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Add users to manage system access
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* System Settings Tab - rest remains the same but with safer property access */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" gutterBottom>System Settings</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Notification Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotificationsEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        emailNotificationsEnabled: e.target.checked
                      })}
                    />
                  }
                  label="Enable Email Notifications"
                />
                <br />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotificationsEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        smsNotificationsEnabled: e.target.checked
                      })}
                    />
                  }
                  label="Enable SMS Notifications"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>System Limits</Typography>
                <TextField
                  fullWidth
                  label="Maximum Loan Amount (R)"
                  type="text"
                  value={maxLoanAmountInput}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^\d*$/.test(v)) {
                      setMaxLoanAmountInput(v)
                      if (v !== '') setSettings(prev => ({ ...prev, maxLoanAmount: Number(v) }))
                    }
                  }}
                  onBlur={() => {
                    if (maxLoanAmountInput === '') {
                      setMaxLoanAmountInput(String(settings.maxLoanAmount))
                    } else {
                      setMaxLoanAmountInput(String(Number(maxLoanAmountInput)))
                    }
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Maximum Loan Term (months)"
                  type="text"
                  value={maxLoanTermInput}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^\d*$/.test(v)) {
                      setMaxLoanTermInput(v)
                      if (v !== '') setSettings(prev => ({ ...prev, maxLoanTerm: Number(v) }))
                    }
                  }}
                  onBlur={() => {
                    if (maxLoanTermInput === '') {
                      setMaxLoanTermInput(String(settings.maxLoanTerm))
                    } else {
                      setMaxLoanTermInput(String(Number(maxLoanTermInput)))
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Base Interest Rates (% per annum)</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  These base rates are used for loan calculations. Changes will apply to new loan applications immediately.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Small Loan Base Rate (%)"
                      type="text"
                      value={smallLoanBaseRateInput}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^\d*\.?\d*$/.test(v)) setSmallLoanBaseRateInput(v)
                      }}
                      onBlur={() => {
                        if (smallLoanBaseRateInput === '') setSmallLoanBaseRateInput('27.5')
                      }}
                      helperText="For loans ? R8,000"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Medium Loan Base Rate (%)"
                      type="text"
                      value={mediumLoanBaseRateInput}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^\d*\.?\d*$/.test(v)) setMediumLoanBaseRateInput(v)
                      }}
                      onBlur={() => {
                        if (mediumLoanBaseRateInput === '') setMediumLoanBaseRateInput('24.0')
                      }}
                      helperText="For loans R8,001 - R30,000"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Large Loan Base Rate (%)"
                      type="text"
                      value={largeLoanBaseRateInput}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^\d*\.?\d*$/.test(v)) setLargeLoanBaseRateInput(v)
                      }}
                      onBlur={() => {
                        if (largeLoanBaseRateInput === '') setLargeLoanBaseRateInput('22.0')
                      }}
                      helperText="For loans > R30,000"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>Interest Rate Limits</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Minimum Interest Rate (%)"
                      type="text"
                      value={minInterestRateInput}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^\d*\.?\d*$/.test(v)) setMinInterestRateInput(v)
                      }}
                      onBlur={() => {
                        if (minInterestRateInput === '') setMinInterestRateInput('18.0')
                      }}
                      helperText="Floor rate after adjustments"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Maximum Interest Rate (%)"
                      type="text"
                      value={maxInterestRateInput}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^\d*\.?\d*$/.test(v)) setMaxInterestRateInput(v)
                      }}
                      onBlur={() => {
                        if (maxInterestRateInput === '') setMaxInterestRateInput('27.5')
                      }}
                      helperText="Cap rate (NCA compliant max)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          {persistedSettingsMeta.updatedAt && (
            <Alert severity="info" sx={{ mb:2 }}>
              Last updated: {new Date(persistedSettingsMeta.updatedAt).toLocaleString()} by {persistedSettingsMeta.updatedByEmail || 'Unknown'}
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSettingsSave}
            size="large"
          >
            Save Settings
          </Button>
        </Box>
      </TabPanel>

      {/* Lending Rules Tab - with safer property access */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" gutterBottom>Lending Rules & Interest Rates (Read Only)</Typography>

        {!lendingRules && (
          <Alert severity="warning">Lending rules not loaded. Try refreshing the page.</Alert>
        )}

        {lendingRules && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Auto-Approval</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Enabled" secondary={String(lendingRules.autoApproval?.enabled ?? 'N/A')} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Max Auto-Approval Amount" secondary={`R${lendingRules.autoApproval?.maxAutoApprovalAmount ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Min Gross Income" secondary={`R${lendingRules.autoApproval?.minimumMonthlyGrossIncome ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Min Net Income" secondary={`R${lendingRules.autoApproval?.minimumMonthlyNetIncome ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Max DTI (%)" secondary={lendingRules.autoApproval?.maxDebtToIncomeRatio ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Require Document Verification" secondary={String(lendingRules.autoApproval?.requireDocumentVerification ?? 'N/A')} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ height: 16 }} />

              <Card>
                <CardContent>
                  <Typography variant="h6">Fees</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Initiation Fee Enabled" secondary={String(lendingRules.fees?.initiationFee?.enabled ?? 'N/A')} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Initiation Base Amount" secondary={`R${lendingRules.fees?.initiationFee?.baseAmount ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Initiation Percentage Above 1000 (%)" secondary={lendingRules.fees?.initiationFee?.percentageAbove1000 ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Monthly Service Fee (R)" secondary={`R${lendingRules.fees?.monthlyServiceFee ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Credit Life Enabled" secondary={String(lendingRules.fees?.creditLife?.enabled ?? 'N/A')} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Credit Life Monthly Rate (%)" secondary={lendingRules.fees?.creditLife?.monthlyRatePercentage ?? 'N/A'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ height: 16 }} />

              <Card>
                <CardContent>
                  <Typography variant="h6">Deposits</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Require Deposit" secondary={String(lendingRules.deposits?.requireDeposit ?? 'N/A')} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Minimum Deposit (%)" secondary={lendingRules.deposits?.minimumDepositPercent ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Deposit Reduces Principal" secondary={String(lendingRules.deposits?.depositReducesPrincipal ?? 'N/A')} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Interest Rates</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Small Loan Base (%)" secondary={lendingRules.interestRates?.baseRates?.smallLoanBase ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Medium Loan Base (%)" secondary={lendingRules.interestRates?.baseRates?.mediumLoanBase ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Large Loan Base (%)" secondary={lendingRules.interestRates?.baseRates?.largeLoanBase ?? 'N/A'} />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1">Risk Adjustments</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Excellent (DTI, MinDisposable)" secondary={`${lendingRules.interestRates?.riskAdjustments?.excellentAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.excellentAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.excellentAffordability?.rateAdjustment ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Good" secondary={`${lendingRules.interestRates?.riskAdjustments?.goodAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.goodAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.goodAffordability?.rateAdjustment ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Average" secondary={`${lendingRules.interestRates?.riskAdjustments?.averageAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.averageAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.averageAffordability?.rateAdjustment ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Below Average" secondary={`${lendingRules.interestRules?.riskAdjustments?.belowAverageAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.belowAverageAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.belowAverageAffordability?.rateAdjustment ?? 'N/A'}`} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ height: 16 }} />

              <Card>
                <CardContent>
                  <Typography variant="h6">Loan Terms</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Small Loans (months)" secondary={`${lendingRules.loanTerms?.smallLoans?.minTermMonths ?? 'N/A'} - ${lendingRules.loanTerms?.smallLoans?.maxTermMonths ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Medium Loans (months)" secondary={`${lendingRules.loanTerms?.mediumLoans?.minTermMonths ?? 'N/A'} - ${lendingRules.loanTerms?.mediumLoans?.maxTermMonths ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Large Loans (months)" secondary={`${lendingRules.loanTerms?.largeLoans?.minTermMonths ?? 'N/A'} - ${lendingRules.loanTerms?.largeLoans?.maxTermMonths ?? 'N/A'}`} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ height: 16 }} />

              <Card>
                <CardContent>
                  <Typography variant="h6">Affordability</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Max DTI (%)" secondary={lendingRules.affordability?.maxDebtToIncomeRatio ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Min Disposable After Loan (R)" secondary={lendingRules.affordability?.minimumDisposableIncomeAfterLoan ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Min Residual Amount (R)" secondary={lendingRules.affordability?.minimumResidualAmount ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Min Reserve Percent (%)" secondary={lendingRules.affordability?.minimumReservePercent ?? 'N/A'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => setJsonDialogOpen(true)}>View raw rules JSON</Button>
              </Box>
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3 }}>
          <Alert severity="info">This page is read-only. Lending rules are defined in the server configuration and code. To change the rules, update the server configuration and restart the application (or use the server-side settings API if implemented).</Alert>
        </Box>

        <Dialog open={jsonDialogOpen} onClose={() => setJsonDialogOpen(false)} fullWidth maxWidth="lg">
          <DialogTitle>Raw Lending Rules JSON</DialogTitle>
          <DialogContent>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(lendingRules, null, 2)}</pre>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setJsonDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser.id ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            value={selectedUser.firstName || ''}
            onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={selectedUser.lastName || ''}
            onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={selectedUser.email || ''}
            onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Role"
            value={selectedUser.roles?.[0] || ''}
            onChange={(e) => setSelectedUser({...selectedUser, roles: [e.target.value]})}
          >
            <MenuItem value="Borrower">Borrower</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUserSave} variant="contained">
            {selectedUser.id ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setUserPendingDelete(null) }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb:2 }}>
            This action is permanent. Audit logs will record this deletion.
          </Alert>
          <Typography>
            Are you sure you want to delete user <strong>{userPendingDelete?.firstName} {userPendingDelete?.lastName}</strong>?<br/>
            Email: {userPendingDelete?.email}<br/>
            Role(s): {userPendingDelete?.roles?.join(', ')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteConfirmOpen(false); setUserPendingDelete(null) }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handlePerformDelete}>Delete User</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <AlertComponent 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            boxShadow: 3
          }}
        >
          {snackbar.message}
        </AlertComponent>
      </Snackbar>
    </Box>
  )
}

export default EnhancedAdminPanel
