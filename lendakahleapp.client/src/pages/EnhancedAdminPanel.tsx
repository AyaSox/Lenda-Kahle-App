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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, settingsRes, lendingRulesRes, persistedSettingsRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/system-settings'),
          axios.get('/api/admin/lending-rules'),
          axios.get('/api/admin/system-settings/meta')
        ])

        setUsers(usersRes.data || [])
        setSettings(settingsRes.data || settings)

        const rules = lendingRulesRes.data
        setLendingRules(rules)

        const meta: PersistedSystemSettings | null = persistedSettingsRes.data || null
        if (meta) {
          setPersistedSettingsMeta({
            updatedAt: meta.updatedAt,
            updatedByEmail: meta.updatedByEmail
          })
          setMaxLoanAmountInput(meta.maxLoanAmount?.toString() ?? '')
          setMaxLoanTermInput(meta.maxLoanTermMonths?.toString() ?? '')
          setSmallLoanBaseRateInput(meta.smallLoanBaseRate?.toString() ?? '')
          setMediumLoanBaseRateInput(meta.mediumLoanBaseRate?.toString() ?? '')
          setLargeLoanBaseRateInput(meta.largeLoanBaseRate?.toString() ?? '')
          setMinInterestRateInput(meta.minimumInterestRate?.toString() ?? '')
          setMaxInterestRateInput(meta.maximumInterestRate?.toString() ?? '')
        }

        setLoading(false)
      } catch (error) {
        console.error('Failed to load admin data', error)
        setSnackbar({
          open: true,
          message: 'Failed to load admin data',
          severity: 'error'
        })
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const handleUserDialogOpen = (user?: User) => {
    if (user) {
      setSelectedUser(user)
    } else {
      setSelectedUser({})
    }
    setUserDialogOpen(true)
  }

  const handleUserDialogClose = () => {
    setUserDialogOpen(false)
  }

  const handleUserSave = async () => {
    try {
      if (selectedUser.id) {
        await axios.put(`/api/admin/users/${selectedUser.id}`, selectedUser)
        setSnackbar({
          open: true,
          message: 'User updated successfully',
          severity: 'success'
        })
      } else {
        await axios.post('/api/admin/users', selectedUser)
        setSnackbar({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        })
      }

      const res = await axios.get('/api/admin/users')
      setUsers(res.data || [])
      setUserDialogOpen(false)
    } catch (error) {
      console.error('Failed to save user', error)
      setSnackbar({
        open: true,
        message: 'Failed to save user',
        severity: 'error'
      })
    }
  }

  const handleUserDeleteClick = (user: User) => {
    setUserPendingDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handleUserDeleteConfirm = async () => {
    if (!userPendingDelete) return
    try {
      await axios.delete(`/api/admin/users/${userPendingDelete.id}`)
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      })
      setUsers(prev => prev.filter(u => u.id !== userPendingDelete.id))
    } catch (error) {
      console.error('Failed to delete user', error)
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      })
    } finally {
      setDeleteConfirmOpen(false)
      setUserPendingDelete(null)
    }
  }

  const handleSettingsChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSettingsSave = async () => {
    try {
      await axios.post('/api/admin/system-settings', settings)
      setSnackbar({
        open: true,
        message: 'System settings saved',
        severity: 'success'
      })
    } catch (error) {
      console.error('Failed to save system settings', error)
      setSnackbar({
        open: true,
        message: 'Failed to save system settings',
        severity: 'error'
      })
    }
  }

  const handleLendingRulesSave = async () => {
    try {
      const payload = {
        maxLoanAmount: parseFloat(maxLoanAmountInput || '0'),
        maxLoanTermMonths: parseInt(maxLoanTermInput || '0', 10),
        smallLoanBaseRate: parseFloat(smallLoanBaseRateInput || '0'),
        mediumLoanBaseRate: parseFloat(mediumLoanBaseRateInput || '0'),
        largeLoanBaseRate: parseFloat(largeLoanBaseRateInput || '0'),
        minimumInterestRate: parseFloat(minInterestRateInput || '0'),
        maximumInterestRate: parseFloat(maxInterestRateInput || '0')
      }

      await axios.post('/api/admin/lending-rules', payload)

      setSnackbar({
        open: true,
        message: 'Lending rules saved',
        severity: 'success'
      })

      const lendingRulesRes = await axios.get('/api/admin/lending-rules')
      setLendingRules(lendingRulesRes.data)
    } catch (error) {
      console.error('Failed to save lending rules', error)
      setSnackbar({
        open: true,
        message: 'Failed to save lending rules',
        severity: 'error'
      })
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
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
                  Active user accounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Default Interest Rate</Typography>
                </Box>
                <Typography variant="h4">{settings.defaultInterestRate}%</Typography>
                <Typography variant="body2" color="textSecondary">
                  Applied when no risk adjustments
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Max Loan Amount</Typography>
                </Box>
                <Typography variant="h4">R{settings.maxLoanAmount.toLocaleString()}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Current system-wide limit
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Max Loan Term</Typography>
                </Box>
                <Typography variant="h4">{settings.maxLoanTerm} months</Typography>
                <Typography variant="body2" color="textSecondary">
                  Longest repayment period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* User Management Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => handleUserDialogOpen()}
          >
            Add User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Date Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>
                    {user.roles.map(role => (
                      <Chip
                        key={role}
                        label={role}
                        size="small"
                        color={role === 'Admin' ? 'primary' : 'default'}
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>{new Date(user.dateCreated).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit User">
                      <IconButton onClick={() => handleUserDialogOpen(user)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton color="error" onClick={() => handleUserDeleteClick(user)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* System Settings Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">General Settings</Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Default Interest Rate (%)"
                    type="number"
                    value={settings.defaultInterestRate}
                    onChange={(e) => handleSettingsChange('defaultInterestRate', Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Max Loan Amount"
                    type="number"
                    value={settings.maxLoanAmount}
                    onChange={(e) => handleSettingsChange('maxLoanAmount', Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Max Loan Term (months)"
                    type="number"
                    value={settings.maxLoanTerm}
                    onChange={(e) => handleSettingsChange('maxLoanTerm', Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Auto-Approval Threshold (R)"
                    type="number"
                    value={settings.autoApprovalThreshold}
                    onChange={(e) => handleSettingsChange('autoApprovalThreshold', Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Late Payment Fee Rate (%)"
                    type="number"
                    value={settings.latePaymentFeeRate}
                    onChange={(e) => handleSettingsChange('latePaymentFeeRate', Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Notifications</Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotificationsEnabled}
                        onChange={(e) => handleSettingsChange('emailNotificationsEnabled', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.smsNotificationsEnabled}
                        onChange={(e) => handleSettingsChange('smsNotificationsEnabled', e.target.checked)}
                      />
                    }
                    label="SMS Notifications"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSettingsSave}>
            Save Settings
          </Button>
        </Box>
      </TabPanel>

      {/* Lending Rules Tab */}
      <TabPanel value={tabValue} index={3}>
        {lendingRules == null ? (
          <Typography>Loading lending rules...</Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Lending Rules & Interest Rates (Read Only). For now, only basic limits & base rates
                  can be adjusted below. Advanced rules are loaded from server configuration.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Auto Approval Rules</Typography>
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
                    <ListItem>
                      <ListItemText primary="Require Credit Check" secondary={String(lendingRules.autoApproval?.requireCreditCheck ?? 'N/A')} />
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
                      <ListItemText primary="Credit Life Required Above Amount" secondary={`R${lendingRules.fees?.creditLife?.requiredAboveAmount ?? 'N/A'}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Credit Life Monthly Rate (%)" secondary={lendingRules.fees?.creditLife?.monthlyRatePercentage ?? 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Minimum Life Cover Percent (%)" secondary={lendingRules.fees?.creditLife?.minimumCoverPercent ?? 'N/A'} />
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
                      <ListItemText
                        primary="Excellent (DTI, MinDisposable)"
                        secondary={`${lendingRules.interestRates?.riskAdjustments?.excellentAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.excellentAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.excellentAffordability?.rateAdjustment ?? 'N/A'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Good"
                        secondary={`${lendingRules.interestRates?.riskAdjustments?.goodAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.goodAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.goodAffordability?.rateAdjustment ?? 'N/A'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Average"
                        secondary={`${lendingRules.interestRates?.riskAdjustments?.averageAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.averageAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.averageAffordability?.rateAdjustment ?? 'N/A'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Below Average"
                        secondary={`${lendingRules.interestRates?.riskAdjustments?.belowAverageAffordability?.maxDTI ?? 'N/A'} / ${lendingRules.interestRates?.riskAdjustments?.belowAverageAffordability?.minDisposableIncome ?? 'N/A'} -> ${lendingRules.interestRates?.riskAdjustments?.belowAverageAffordability?.rateAdjustment ?? 'N/A'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Poor (Rate Adjustment Only)"
                        secondary={`${lendingRules.interestRates?.riskAdjustments?.poorAffordability?.rateAdjustment ?? 'N/A'}`}
                      />
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
                      <ListItemText
                        primary="Small Loans (months)"
                        secondary={`${lendingRules.loanTerms?.smallLoans?.minTermMonths ?? 'N/A'} - ${lendingRules.loanTerms?.smallLoans?.maxTermMonths ?? 'N/A'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Medium Loans (months)"
                        secondary={`${lendingRules.loanTerms?.mediumLoans?.minTermMonths ?? 'N/A'} - ${lendingRules.loanTerms?.mediumLoans?.maxTermMonths ?? 'N/A'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Large Loans (months)"
                        secondary={`${lendingRules.loanTerms?.largeLoans?.minTermMonths ?? 'N/A'} - ${lendingRules.loanTerms?.largeLoans?.maxTermMonths ?? 'N/A'}`}
                      />
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
                      <ListItemText
                        primary="Max DTI (%)"
                        secondary={lendingRules.affordability?.maxDebtToIncomeRatio ?? 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Min Disposable After Loan (R)"
                        secondary={lendingRules.affordability?.minimumDisposableIncomeAfterLoan ?? 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Min Residual Amount (R)"
                        secondary={lendingRules.affordability?.minimumResidualAmount ?? 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Min Reserve Percent (%)"
                        secondary={lendingRules.affordability?.minimumReservePercent ?? 'N/A'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => setJsonDialogOpen(true)}>
                  View raw rules JSON
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Editable Lending Limits & Base Rates
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                These settings control high-level lending limits and base rates. Detailed risk rules
                remain configured on the server.
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Loan Amount (R)"
                    type="text"
                    value={maxLoanAmountInput}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^\d*$/.test(v)) setMaxLoanAmountInput(v)
                    }}
                    onBlur={() => {
                      if (maxLoanAmountInput === '') setMaxLoanAmountInput((persistedSettingsMeta as any).maxLoanAmount?.toString() ?? '')
                    }}
                    helperText="System-wide hard cap"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Max Loan Term (months)"
                    type="text"
                    value={maxLoanTermInput}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^\d*$/.test(v)) setMaxLoanTermInput(v)
                    }}
                    onBlur={() => {
                      if (maxLoanTermInput === '') setMaxLoanTermInput((persistedSettingsMeta as any).maxLoanTermMonths?.toString() ?? '')
                    }}
                    helperText="System-wide max term"
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Base Interest Rates (per Category)
                  </Typography>
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
                        helperText="For loans ≤ R8,000"
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

                  <Typography variant="subtitle1" gutterBottom>
                    Interest Rate Limits
                  </Typography>
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
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                {persistedSettingsMeta.updatedAt && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Last updated: {new Date(persistedSettingsMeta.updatedAt).toLocaleString()} by{' '}
                      {persistedSettingsMeta.updatedByEmail || 'system'}
                    </Typography>
                  </Alert>
                )}

                <Button variant="contained" color="primary" onClick={handleLendingRulesSave}>
                  Save Lending Rules
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={handleUserDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{selectedUser.id ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            value={selectedUser.firstName || ''}
            onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={selectedUser.lastName || ''}
            onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={selectedUser.email || ''}
            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Role"
            value={selectedUser.roles?.[0] || ''}
            onChange={(e) => setSelectedUser({ ...selectedUser, roles: [e.target.value] })}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="User">User</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUserDialogClose}>Cancel</Button>
          <Button onClick={handleUserSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete user {userPendingDelete?.email}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleUserDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* JSON View Dialog */}
      <Dialog open={jsonDialogOpen} onClose={() => setJsonDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Raw Lending Rules JSON</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(lendingRules, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJsonDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <AlertComponent onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </AlertComponent>
      </Snackbar>
    </Box>
  )
}

export default EnhancedAdminPanel
