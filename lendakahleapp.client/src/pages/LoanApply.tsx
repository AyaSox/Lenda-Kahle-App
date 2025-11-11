import React, { useState, useEffect, useRef } from 'react'
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import LockIcon from '@mui/icons-material/Lock'

import {
  InfoIcon,
  UploadIcon,
  PersonIcon,
  HomeIcon,
  WorkIcon,
  CreditCardIcon,
  PeopleIcon,
  ContactPhoneIcon,
  GavelIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  BankIcon,
  CheckCircleIcon,
  DescriptionIcon,
  WarningIcon,
  CalculateIcon
} from '../components/AppIcons'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../api/axios'
import { 
  validateSAIDNumber, 
  validateSAPhoneNumber, 
  SA_PROVINCES, 
  SA_BANKS, 
  ACCOUNT_TYPES,
  EMPLOYMENT_STATUSES,
  MARITAL_STATUSES,
  RESIDENTIAL_STATUSES,
  RELATIONSHIP_TYPES,
  formatIDNumber,
  getGenderFromID,
  validatePostalCode
} from '../utils/saValidation'

const AlertComponent = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

interface LoanApplicationForm {
  // Loan details
  principalAmount: string
  termMonths: string
  purpose: string
  applicationMethod: 'Online' | 'InPerson'
  
  // Personal Information (Required by law)
  firstName: string
  lastName: string
  idNumber: string
  dateOfBirth: string
  phoneNumber: string
  emailAddress: string
  
  // Residential Information (Required by law)
  residentialAddress: string
  city: string
  province: string
  postalCode: string
  residentialYears: string
  residentialStatus: string
  
  // Marital Status & Dependents (Required by law)
  maritalStatus: string
  dependents: string
  
  // Financial details (Required by law)
  monthlyGrossIncome: string
  monthlyNetIncome: string
  monthlyRentOrBond: string
  monthlyLivingExpenses: string
  monthlyDebtObligations: string
  monthlyInsurance: string
  otherExpenses: string
  
  // Employment details (Enhanced compliance)
  employmentStatus: string
  employer: string
  employerAddress: string
  employerPhone: string
  yearsEmployed: string
  jobTitle: string
  
  // Banking Information (Required by law)
  bankName: string
  accountType: string
  bankingYears: string
  
  // Credit Information (Required by law)
  isUnderDebtReview: boolean
  hasBeenBlacklisted: boolean
  consentToCreditCheck: boolean
  
  // Spouse Information (if married)
  spouseFirstName: string
  spouseLastName: string
  spouseIdNumber: string
  spouseMonthlyIncome: string
  spouseEmployer: string
  
  // Next of Kin (Required by law)
  nextOfKinName: string
  nextOfKinRelationship: string
  nextOfKinPhone: string
  nextOfKinAddress: string
  
  // NCA Compliance Acknowledgments
  acknowledgeNCADisclosure: boolean
  acknowledgeFeeDisclosure: boolean
  acknowledgeRightToCancellation: boolean
  consentToDataProcessing: boolean
}

interface AffordabilityResult {
  totalExpenses: number
  disposableIncome: number
  debtToIncomeRatio: number
  canAfford: boolean
  monthlyInstallment: number
  dependentCost: number
}

// Simple reusable debounce hook
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

const CACHE_KEY = 'systemSettingsCache'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const LoanApply: React.FC = () => {
  const location = useLocation()
  const initialStepFromQuery = (() => {
    try {
      const params = new URLSearchParams(location.search)
      const s = params.get('testStep')
      if (s) {
        const n = parseInt(s, 10)
        if (!isNaN(n)) return n
      }
    } catch (e) {
      // ignore
    }
    return 0
  })()
  const [activeStep, setActiveStep] = useState<number>(initialStepFromQuery)
  const [loading, setLoading] = useState(false)
  const [showNCADisclosure, setShowNCADisclosure] = useState(false)
  const [showFeeDisclosure, setShowFeeDisclosure] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})
  
  // ADD: system settings state used for validation and labels
  const [systemSettings, setSystemSettings] = useState<{ maxLoanAmount: number; maxLoanTermMonths: number } | null>(null)

  const [formData, setFormData] = useState<LoanApplicationForm>({
    principalAmount: '',
    termMonths: '',
    purpose: '',
    applicationMethod: 'Online',
    
    // Personal Information
    firstName: '',
    lastName: '',
    idNumber: '',
    dateOfBirth: '',
    phoneNumber: '',
    emailAddress: '',
    
    // Residential Information
    residentialAddress: '',
    city: '',
    province: '',
    postalCode: '',
    residentialYears: '',
    residentialStatus: '',
    
    // Marital Status & Dependents
    maritalStatus: '',
    dependents: '0',
    
    // Financial Information
    monthlyGrossIncome: '',
    monthlyNetIncome: '',
    monthlyRentOrBond: '',
    monthlyLivingExpenses: '',
    monthlyDebtObligations: '',
    monthlyInsurance: '',
    otherExpenses: '',
    
    // Employment Information
    employmentStatus: '',
    employer: '',
    employerAddress: '',
    employerPhone: '',
    yearsEmployed: '',
    jobTitle: '',
    
    // Banking Information
    bankName: '',
    accountType: '',
    bankingYears: '',
    
    // Credit Information
    isUnderDebtReview: false,
    hasBeenBlacklisted: false,
    consentToCreditCheck: false,
    
    // Spouse Information
    spouseFirstName: '',
    spouseLastName: '',
    spouseIdNumber: '',
    spouseMonthlyIncome: '',
    spouseEmployer: '',
    
    // Next of Kin
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinAddress: '',
    
    // NCA Compliance
    acknowledgeNCADisclosure: false,
    acknowledgeFeeDisclosure: false,
    acknowledgeRightToCancellation: false,
    consentToDataProcessing: false
  })
  
  const [affordability, setAffordability] = useState<AffordabilityResult | null>(null)
  const [idValidation, setIdValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true })
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string; formatted?: string }>({ isValid: true })
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })
  
  const navigate = useNavigate()

  const steps = [
    'Personal Information', 
    'Residential & Family', 
    'Employment & Banking', 
    'Financial Assessment', 
    'Loan Details', 
    'Compliance & Submit'
  ]
  
  // Document upload state
  const [combinedDocument, setCombinedDocument] = useState<File | null>(null)

  // Validate ID number and auto-fill date of birth
  useEffect(() => {
    if (formData.idNumber.length === 13) {
      const validation = validateSAIDNumber(formData.idNumber)
      setIdValidation(validation)
      
      if (validation.isValid && validation.dateOfBirth) {
        setFormData(prev => ({
          ...prev,
          dateOfBirth: validation.dateOfBirth!.toISOString().split('T')[0]
        }))
      }
    } else {
      setIdValidation({ isValid: true })
    }
  }, [formData.idNumber])

  // Validate phone number
  useEffect(() => {
    if (formData.phoneNumber.length > 0) {
      const validation = validateSAPhoneNumber(formData.phoneNumber)
      setPhoneValidation(validation)
    } else {
      setPhoneValidation({ isValid: true })
    }
  }, [formData.phoneNumber])

  // Load system settings with caching
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (parsed && parsed.data && parsed.fetchedAt && (Date.now() - parsed.fetchedAt < CACHE_TTL_MS)) {
              setSystemSettings(parsed.data)
              return // use cache
            }
          } catch { /* ignore parse errors */ }
        }
        // Use public endpoint (no auth required)
        const resp = await axios.get('/api/systemsettings/public')
        const d = resp.data || {}
        const settings = {
          maxLoanAmount: Number(d.maxLoanAmount ?? d.MaxLoanAmount ?? 0),
          maxLoanTermMonths: Number(d.maxLoanTermMonths ?? d.MaxLoanTermMonths ?? 0)
        }
        setSystemSettings(settings)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: settings, fetchedAt: Date.now() }))
      } catch (e) {
        console.error('Failed to load system settings', e)
      }
    }
    loadSettings()
  }, [])

  // Debounced values for intensive recalculation
  const debouncedPrincipal = useDebounced(formData.principalAmount, 300)
  const debouncedTerm = useDebounced(formData.termMonths, 300)
  const debouncedGross = useDebounced(formData.monthlyGrossIncome, 300)
  const debouncedNet = useDebounced(formData.monthlyNetIncome, 300)
  const debouncedDebt = useDebounced(formData.monthlyDebtObligations, 300)

  // Recalculate affordability when debounced values change (reduces churn while typing)
  useEffect(() => {
    calculateAffordability()
  }, [debouncedPrincipal, debouncedTerm, debouncedGross, debouncedNet, debouncedDebt, formData.monthlyRentOrBond, formData.monthlyLivingExpenses, formData.monthlyInsurance, formData.otherExpenses, formData.dependents, formData.spouseMonthlyIncome])

  const calculateAffordability = () => {
    const principal = parseFloat(debouncedPrincipal) || 0
    const term = parseInt(debouncedTerm) || 1
    const grossIncome = parseFloat(debouncedGross) || 0
    const netIncome = parseFloat(debouncedNet) || 0
    const spouseIncome = parseFloat(formData.spouseMonthlyIncome) || 0
    const dependents = parseInt(formData.dependents) || 0
    
    if (principal === 0 || term === 0 || grossIncome === 0) {
      setAffordability(null)
      return
    }

    // Calculate loan details (using enhanced rate calculation)
    const baseRate = principal <= 8000 ? 0.275 : principal <= 30000 ? 0.24 : 0.22
    const riskAdjustment = principal > 25000 ? 2.0 : principal > 15000 ? 0 : -2.0
    const interestRate = Math.min(Math.max(baseRate + riskAdjustment, 18.0), 27.5)
    
    // Fee calculations (matches your backend)
    const initiationFee = Math.min(1140 + (principal - 1000) * 0.1, 2190)
    const monthlyServiceFee = 60
    const monthlyCreditLife = principal > 10000 ? principal * 0.008 : 0
    
    // Total calculations
    const totalInterest = principal * (interestRate / 100) * (term / 12)
    const totalServiceFees = monthlyServiceFee * term
    const totalCreditLifeFees = monthlyCreditLife * term
    const totalFees = initiationFee + totalServiceFees + totalCreditLifeFees
    const totalRepayable = principal + totalInterest + totalFees
    const monthlyInstallment = totalRepayable / term

    // Calculate expenses including dependent costs
    const dependentCost = dependents * 1500 // R1,500 per dependent
    const totalExpenses = 
      (parseFloat(formData.monthlyRentOrBond) || 0) +
      (parseFloat(formData.monthlyLivingExpenses) || 0) +
      (parseFloat(formData.monthlyDebtObligations) || 0) +
      (parseFloat(formData.monthlyInsurance) || 0) +
      (parseFloat(formData.otherExpenses) || 0) +
      dependentCost

    const totalHouseholdIncome = netIncome + spouseIncome
    const disposableIncome = totalHouseholdIncome - totalExpenses
    const debtToIncomeRatio = ((parseFloat(formData.monthlyDebtObligations) || 0) + monthlyInstallment) / (grossIncome + spouseIncome) * 100
    const canAfford = disposableIncome >= monthlyInstallment && debtToIncomeRatio < 40

    setAffordability({
      totalExpenses,
      disposableIncome,
      debtToIncomeRatio,
      canAfford,
      monthlyInstallment,
      dependentCost
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle combined document upload for online applications
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCombinedDocument(e.target.files[0])
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    // Client-side hard block if exceeds limits
    const principal = parseFloat(formData.principalAmount) || 0
    const term = parseInt(formData.termMonths) || 0
    if (systemSettings) {
      if (principal > systemSettings.maxLoanAmount) {
        setSnackbar({ open: true, severity: 'error', message: `Requested amount R${principal.toLocaleString()} exceeds system maximum R${systemSettings.maxLoanAmount.toLocaleString()}.` })
        return
      }
      if (term > systemSettings.maxLoanTermMonths) {
        setSnackbar({ open: true, severity: 'error', message: `Requested term ${term} months exceeds system maximum ${systemSettings.maxLoanTermMonths} months.` })
        return
      }
    }

    setLoading(true)
    try {
      // Convert form data to match backend DTO
      const safeNumber = (v: any, fallback = 0) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : fallback
      }

      const applicationData = {
        principalAmount: safeNumber(formData.principalAmount),
        termMonths: Math.max(1, safeNumber(formData.termMonths)),
        purpose: formData.purpose,
        applicationMethod: formData.applicationMethod === 'Online' ? 1 : 2,
        
        // Personal Information
        firstName: formData.firstName,
        lastName: formData.lastName,
        idNumber: formData.idNumber,
        dateOfBirth: formData.dateOfBirth || null,
        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        
        // Residential Information
        residentialAddress: formData.residentialAddress,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        residentialYears: safeNumber(formData.residentialYears),
        residentialStatus: formData.residentialStatus,
        
        // Marital Status & Dependents
        maritalStatus: formData.maritalStatus,
        dependents: Math.max(0, safeNumber(formData.dependents)),
        
        // Financial Information
        monthlyGrossIncome: safeNumber(formData.monthlyGrossIncome),
        monthlyNetIncome: safeNumber(formData.monthlyNetIncome),
        monthlyRentOrBond: safeNumber(formData.monthlyRentOrBond),
        monthlyLivingExpenses: safeNumber(formData.monthlyLivingExpenses),
        monthlyDebtObligations: safeNumber(formData.monthlyDebtObligations),
        monthlyInsurance: safeNumber(formData.monthlyInsurance),
        otherExpenses: safeNumber(formData.otherExpenses),
        
        // Employment Information
        employmentStatus: formData.employmentStatus,
        employer: formData.employer,
        employerAddress: formData.employerAddress,
        employerPhone: formData.employerPhone,
        yearsEmployed: safeNumber(formData.yearsEmployed),
        jobTitle: formData.jobTitle,
        
        // Banking Information
        bankName: formData.bankName,
        accountType: formData.accountType,
        bankingYears: safeNumber(formData.bankingYears),
        
        // Credit Information
        isUnderDebtReview: formData.isUnderDebtReview,
        hasBeenBlacklisted: formData.hasBeenBlacklisted,
        consentToCreditCheck: formData.consentToCreditCheck,
        
        // Spouse Information
        spouseFirstName: formData.spouseFirstName || null,
        spouseLastName: formData.spouseLastName || null,
        spouseIdNumber: formData.spouseIdNumber || null,
        spouseMonthlyIncome: safeNumber(formData.spouseMonthlyIncome),
        spouseEmployer: formData.spouseEmployer || null,
        
        // Next of Kin
        nextOfKinName: formData.nextOfKinName,
        nextOfKinRelationship: formData.nextOfKinRelationship,
        nextOfKinPhone: formData.nextOfKinPhone,
        nextOfKinAddress: formData.nextOfKinAddress,
        
        // NCA Compliance
        acknowledgeNCADisclosure: formData.acknowledgeNCADisclosure,
        acknowledgeFeeDisclosure: formData.acknowledgeFeeDisclosure,
        acknowledgeRightToCancellation: formData.acknowledgeRightToCancellation,
        consentToDataProcessing: formData.consentToDataProcessing
      }

      const response = await axios.post('/api/loans/apply', applicationData)
      const loanId = response.data.id
      
      let documentUploadSuccess = true
      let documentErrors: string[] = []
      
      // Upload documents if online application
      if (formData.applicationMethod === 'Online' && combinedDocument) {
        try {
          const docFormData = new FormData()
          docFormData.append('file', combinedDocument)
          docFormData.append('documentType', '99') // CombinedDocuments = 99
          
          await axios.post(`/api/documents/upload/${loanId}`, docFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch (docError: any) {
          documentUploadSuccess = false
          documentErrors.push(`Document upload failed: ${docError.response?.data?.error || docError.message}`)
        }
      }
      
      // Show success message
      if (documentUploadSuccess || formData.applicationMethod === 'InPerson') {
        setSnackbar({
          open: true,
          message: 'NCA-compliant loan application submitted successfully! You will be notified of the decision.',
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: `Application submitted! Some documents failed to upload: ${documentErrors.join(', ')}`,
          severity: 'warning'
        })
      }
      
      setTimeout(() => navigate('/loans'), 3000)
    } catch (error: any) {
      console.error('Application failed', error)
      
      let errorMessage = 'Unknown error occurred'

      // Better extraction of server error information for debugging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('API response data:', error.response.data)
        console.error('API response status:', error.response.status)
        const data = error.response.data
        if (typeof data === 'string') {
          errorMessage = data
        } else if (data && (data.error || data.message)) {
          errorMessage = data.error ?? data.message
        } else {
          try {
            errorMessage = JSON.stringify(data)
          } catch (ex) {
            errorMessage = `Server returned status ${error.response.status}`
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request)
        errorMessage = 'No response from server. Please check your network or try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSnackbar({
        open: true,
        message: `Application failed: ${errorMessage}`,
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.firstName && formData.lastName && idValidation.isValid && 
               formData.idNumber.length === 13 && formData.phoneNumber && 
               phoneValidation.isValid && formData.emailAddress
      case 1:
        return formData.residentialAddress && formData.city && formData.province && 
               formData.postalCode && formData.residentialYears && formData.residentialStatus &&
               formData.maritalStatus
      case 2:
        return formData.employmentStatus && formData.employer && formData.jobTitle &&
               formData.bankName && formData.accountType
      case 3:
        return formData.monthlyGrossIncome && formData.monthlyNetIncome
      case 4: {
        const principal = parseFloat(formData.principalAmount) || 0
        const term = parseInt(formData.termMonths) || 0
        const basicValid = formData.principalAmount && formData.termMonths && formData.purpose &&
               (formData.applicationMethod === 'InPerson' || combinedDocument !== null)
        if (!systemSettings) return basicValid // if settings unavailable, don't block here (server will)
        if (principal > systemSettings.maxLoanAmount) return false
        if (term > systemSettings.maxLoanTermMonths) return false
        return basicValid
      }
      case 5:
        return formData.acknowledgeNCADisclosure && formData.acknowledgeFeeDisclosure &&
               formData.acknowledgeRightToCancellation && formData.consentToDataProcessing &&
               formData.consentToCreditCheck && formData.nextOfKinName && formData.nextOfKinPhone
      default:
        return true
    }
  }

  const isMarried = formData.maritalStatus.includes('Married') || formData.maritalStatus === 'Life Partner'

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Personal Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Personal Information (Required by law)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <DescriptionIcon sx={{ mr: 1, fontSize: 'small' }} />
                This information must match your South African ID document exactly.
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="As per ID document"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="As per ID document"
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="SA ID Number"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                required
                placeholder="1234567890123"
                error={!idValidation.isValid}
                helperText={idValidation.error || `Format: ${formatIDNumber(formData.idNumber)} ${formData.idNumber.length === 13 ? `(${getGenderFromID(formData.idNumber)})` : ''}`}
                inputProps={{ maxLength: 13 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Auto-filled from ID"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="0123456789"
                error={!phoneValidation.isValid}
                helperText={phoneValidation.error || phoneValidation.formatted || "SA mobile or landline"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </Grid>
          </Grid>
        )

      case 1: // Residential & Family Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 1 }} />
                Residential & Family Information
              </Typography>
            </Grid>
            
            {/* Residential Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Current Residential Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="residentialAddress"
                value={formData.residentialAddress}
                onChange={handleChange}
                required
                placeholder="123 Main Street, Suburb"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Johannesburg"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Province</InputLabel>
                <Select
                  value={formData.province}
                  onChange={(e) => handleSelectChange('province', e.target.value)}
                  label="Province"
                >
                  {SA_PROVINCES.map((province) => (
                    <MenuItem key={province} value={province}>{province}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                placeholder="1234"
                inputProps={{ maxLength: 4 }}
                error={formData.postalCode.length > 0 && !validatePostalCode(formData.postalCode)}
                helperText={formData.postalCode.length > 0 && !validatePostalCode(formData.postalCode) ? "Must be 4 digits" : ""}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years at Current Address"
                name="residentialYears"
                type="number"
                value={formData.residentialYears}
                onChange={handleChange}
                required
                placeholder="3"
                helperText="How long have you lived here?"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Residential Status</InputLabel>
                <Select
                  value={formData.residentialStatus}
                  onChange={(e) => handleSelectChange('residentialStatus', e.target.value)}
                  label="Residential Status"
                >
                  {RESIDENTIAL_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Marital Status & Dependents */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2 }}>
                Family Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  value={formData.maritalStatus}
                  onChange={(e) => handleSelectChange('maritalStatus', e.target.value)}
                  label="Marital Status"
                >
                  {MARITAL_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Dependents"
                name="dependents"
                type="number"
                value={formData.dependents}
                onChange={handleChange}
                required
                placeholder="0"
                helperText="Children or others financially dependent on you"
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            
            {/* Spouse Information (conditional) */}
            {isMarried && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2 }}>
                    <PeopleIcon sx={{ mr: 1 }} />
                    Spouse Information (Required for married applicants)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Spouse First Name"
                    name="spouseFirstName"
                    value={formData.spouseFirstName}
                    onChange={handleChange}
                    required={isMarried}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Spouse Last Name"
                    name="spouseLastName"
                    value={formData.spouseLastName}
                    onChange={handleChange}
                    required={isMarried}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Spouse SA ID Number"
                    name="spouseIdNumber"
                    value={formData.spouseIdNumber}
                    onChange={handleChange}
                    placeholder="1234567890123"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Spouse Monthly Income (ZAR)"
                    name="spouseMonthlyIncome"
                    type="number"
                    value={formData.spouseMonthlyIncome}
                    onChange={handleChange}
                    placeholder="15000"
                    helperText="Enter 0 if unemployed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Spouse Employer"
                    name="spouseEmployer"
                    value={formData.spouseEmployer}
                    onChange={handleChange}
                    placeholder="Company name or 'Unemployed'"
                  />
                </Grid>
              </>
            )}
          </Grid>
        )

      case 2: // Employment & Banking
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WorkIcon sx={{ mr: 1 }} />
                Employment & Banking Information
              </Typography>
            </Grid>

            {/* Employment Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Employment Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Employment Status</InputLabel>
                <Select
                  value={formData.employmentStatus}
                  onChange={(e) => handleSelectChange('employmentStatus', e.target.value)}
                  label="Employment Status"
                >
                  {EMPLOYMENT_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title / Position"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                required
                placeholder="Manager, Developer, etc."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employer Name"
                name="employer"
                value={formData.employer}
                onChange={handleChange}
                required
                placeholder="ABC Company (Pty) Ltd"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years with Current Employer"
                name="yearsEmployed"
                type="number"
                value={formData.yearsEmployed}
                onChange={handleChange}
                required
                placeholder="3"
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Employer Address"
                name="employerAddress"
                value={formData.employerAddress}
                onChange={handleChange}
                placeholder="123 Business Park, City"
                multiline
                rows={2}
                helperText="Full address for verification purposes"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employer Phone Number"
                name="employerPhone"
                value={formData.employerPhone}
                onChange={handleChange}
                placeholder="0112345678"
                helperText="For employment verification"
              />
            </Grid>

            {/* Banking Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2 }}>
                <CreditCardIcon sx={{ mr: 1 }} />
                Banking Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Bank Name</InputLabel>
                <Select
                  value={formData.bankName}
                  onChange={(e) => handleSelectChange('bankName', e.target.value)}
                  label="Bank Name"
                >
                  {SA_BANKS.map((bank) => (
                    <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={formData.accountType}
                  onChange={(e) => handleSelectChange('accountType', e.target.value)}
                  label="Account Type"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years with Current Bank"
                name="bankingYears"
                type="number"
                value={formData.bankingYears}
                onChange={handleChange}
                placeholder="5"
                helperText="How long have you banked with them?"
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>
          </Grid>
        )

      case 3: // Financial Assessment
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Financial Assessment (Required by law)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <DescriptionIcon sx={{ mr: 1, fontSize: 'small' }} />
                Please provide accurate financial information to assess loan eligibility.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Gross Income (ZAR)"
                name="monthlyGrossIncome"
                type="number"
                value={formData.monthlyGrossIncome}
                onChange={handleChange}
                required
                placeholder="e.g. 30000"
                helperText="Before tax and deductions"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Net Income (ZAR)"
                name="monthlyNetIncome"
                type="number"
                value={formData.monthlyNetIncome}
                onChange={handleChange}
                required
                placeholder="e.g. 22000"
                helperText="After tax and deductions"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Rent or Bond (ZAR)"
                name="monthlyRentOrBond"
                type="number"
                value={formData.monthlyRentOrBond}
                onChange={handleChange}
                required
                placeholder="e.g. 8000"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Living Expenses (ZAR)"
                name="monthlyLivingExpenses"
                type="number"
                value={formData.monthlyLivingExpenses}
                onChange={handleChange}
                required
                placeholder="e.g. 6000"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Other Monthly Expenses (ZAR)"
                name="otherExpenses"
                type="number"
                value={formData.otherExpenses}
                onChange={handleChange}
                placeholder="e.g. 1500"
                helperText="Insurance, school fees, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Debt Obligations (ZAR)"
                name="monthlyDebtObligations"
                type="number"
                value={formData.monthlyDebtObligations}
                onChange={handleChange}
                required
                placeholder="e.g. 2000"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Insurance (ZAR)"
                name="monthlyInsurance"
                type="number"
                value={formData.monthlyInsurance}
                onChange={handleChange}
                placeholder="e.g. 800"
                helperText="e.g. Life, health, car insurance"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Dependents Information</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                {formData.dependents === '0' ? 
                  "You're indicating no dependents. Ensure this is correct." : 
                  `You have indicated ${formData.dependents} dependents.`
                }
              </Alert>
              <TextField
                fullWidth
                label="Additional Dependents (if any)"
                name="additionalDependents"
                value={formData.dependents}
                onChange={handleChange}
                placeholder="e.g. 1 child"
                helperText="Declare all persons financially dependent on you"
              />
            </Grid>

            {/* Spouse Income */}
            {isMarried && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Spouse Monthly Income (ZAR)"
                  name="spouseMonthlyIncome"
                  type="number"
                  value={formData.spouseMonthlyIncome}
                  onChange={handleChange}
                  placeholder="e.g. 15000"
                  helperText="Enter 0 if unemployed"
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Combined Monthly Income (ZAR)"
                value={(parseFloat(formData.monthlyNetIncome) + parseFloat(formData.spouseMonthlyIncome)).toString()}
                InputProps={{ readOnly: true }}
                helperText="Auto-calculated"
              />
            </Grid>

            {/* Real-time Affordability Feedback */}
            {affordability && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mt: 2, backgroundColor: affordability.canAfford ? 'success.light' : 'warning.light' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      {affordability.canAfford ? <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} /> : <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />}
                      Affordability Assessment
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Total Monthly Expenses:</strong> R{affordability.totalExpenses.toLocaleString()}</Typography>
                        <Typography><strong>Disposable Income:</strong> R{affordability.disposableIncome.toLocaleString()}</Typography>
                        <Typography><strong>Debt-to-Income Ratio:</strong> {affordability.debtToIncomeRatio.toFixed(1)}%</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Estimated Monthly Payment:</strong> R{affordability.monthlyInstallment.toLocaleString()}</Typography>
                        <Typography><strong>Dependent Costs:</strong> R{affordability.dependentCost.toLocaleString()}</Typography>
                        <Chip
                          label={affordability.canAfford ? 'MEETS CRITERIA' : 'REQUIRES REVIEW'}
                          color={affordability.canAfford ? 'success' : 'warning'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                    {!affordability.canAfford && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Suggestions:</strong>
                          {affordability.debtToIncomeRatio >= 40 && " Consider reducing existing debt or increasing income."}
                          {affordability.disposableIncome < affordability.monthlyInstallment && " Your disposable income may not cover the monthly payment."}
                          {" Try a smaller loan amount or longer term to improve affordability."}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )

      case 4: // Loan Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Principal Amount (ZAR)${systemSettings ? ` (max R${systemSettings.maxLoanAmount.toLocaleString()})` : ''}`}
                name="principalAmount"
                type="number"
                value={formData.principalAmount}
                onChange={handleChange}
                required
                placeholder="e.g. 15000"
                inputProps={systemSettings ? { min: 1, max: systemSettings.maxLoanAmount } : { min: 1 }}
                error={systemSettings ? (parseFloat(formData.principalAmount || '0') > systemSettings.maxLoanAmount) : false}
                helperText={systemSettings && parseFloat(formData.principalAmount || '0') > systemSettings.maxLoanAmount ? `Amount exceeds max R${systemSettings.maxLoanAmount.toLocaleString()}` : ''}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Term (months)${systemSettings ? ` (max ${systemSettings.maxLoanTermMonths})` : ''}`}
                name="termMonths"
                type="number"
                value={formData.termMonths}
                onChange={handleChange}
                required
                placeholder="e.g. 12"
                inputProps={systemSettings ? { min: 1, max: systemSettings.maxLoanTermMonths } : { min: 1 }}
                error={systemSettings ? (parseInt(formData.termMonths || '0') > systemSettings.maxLoanTermMonths) : false}
                helperText={systemSettings && (parseInt(formData.termMonths || '0') > systemSettings.maxLoanTermMonths) ? `Term exceeds max ${systemSettings.maxLoanTermMonths} months` : ''}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Application Method</InputLabel>
                <Select
                  value={formData.applicationMethod}
                  onChange={(e) => handleSelectChange('applicationMethod', e.target.value)}
                  label="Application Method"
                >
                  <MenuItem value={'Online'}>Online (Upload combined documents)</MenuItem>
                  <MenuItem value={'InPerson'}>In-Person (Upload at branch)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose of Loan"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                multiline
                rows={3}
                placeholder="Describe how the funds will be used"
              />
            </Grid>

            {/* Enhanced Mini-Calculator */}
            {formData.principalAmount && formData.termMonths && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ backgroundColor: 'primary.light' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ mr: 1 }} />
                      Loan Estimate Calculator
                    </Typography>
                    {(() => {
                      const principal = parseFloat(formData.principalAmount) || 0
                      const term = parseInt(formData.termMonths) || 1
                      const baseRate = principal <= 8000 ? 0.275 : principal <= 30000 ? 0.24 : 0.22
                      const riskAdjustment = principal > 25000 ? 2.0 : principal > 15000 ? 0 : -2.0
                      const interestRate = Math.min(Math.max(baseRate + riskAdjustment, 18.0), 27.5)
                      
                      const initiationFee = Math.min(1140 + (principal - 1000) * 0.1, 2190)
                      const monthlyServiceFee = 60
                      const monthlyCreditLife = principal > 10000 ? principal * 0.008 : 0
                      
                      const totalInterest = principal * (interestRate / 100) * (term / 12)
                      const totalFees = initiationFee + (monthlyServiceFee * term) + (monthlyCreditLife * term)
                      const totalRepayable = principal + totalInterest + totalFees
                      const monthlyInstallment = totalRepayable / term
                      
                      return (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography><strong>Interest Rate:</strong> {interestRate.toFixed(1)}% PA</Typography>
                            <Typography><strong>Monthly Installment:</strong> R{monthlyInstallment.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</Typography>
                            <Typography><strong>Total Interest:</strong> R{totalInterest.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography><strong>Initiation Fee:</strong> R{initiationFee.toLocaleString()}</Typography>
                            <Typography><strong>Monthly Service Fee:</strong> R{monthlyServiceFee}</Typography>
                            <Typography><strong>Credit Life (if applicable):</strong> R{monthlyCreditLife.toFixed(2)}/month</Typography>
                            <Typography><strong>Total Repayable:</strong> R{totalRepayable.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                This is an estimate. Final terms depend on your full affordability assessment and NCA compliance check.
                                {affordability && !affordability.canAfford && " Based on your financial details, this loan may require manual review."}
                              </Typography>
                            </Alert>
                          </Grid>
                        </Grid>
                      )
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Supporting Documents</Typography>
              <input
                accept="application/pdf,image/*"
                id="combined-document-upload"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label htmlFor="combined-document-upload">
                <Button variant="outlined" component="span">
                  {combinedDocument ? `Selected: ${combinedDocument.name}` : 'Upload Combined Document (PDF/JPG/PNG)'}
                </Button>
              </label>
            </Grid>
          </Grid>
        )

      case 5: // Compliance & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <GavelIcon sx={{ mr: 1 }} />
                Compliance & Final Review
              </Typography>
            </Grid>

            {/* Next of Kin */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                <ContactPhoneIcon sx={{ mr: 1 }} />
                Emergency Contact (Next of Kin)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next of Kin Full Name"
                name="nextOfKinName"
                value={formData.nextOfKinName}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={formData.nextOfKinRelationship}
                  onChange={(e) => handleSelectChange('nextOfKinRelationship', e.target.value)}
                  label="Relationship"
                >
                  {RELATIONSHIP_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next of Kin Phone"
                name="nextOfKinPhone"
                value={formData.nextOfKinPhone}
                onChange={handleChange}
                required
                placeholder="0123456789"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Next of Kin Address"
                name="nextOfKinAddress"
                value={formData.nextOfKinAddress}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="123 Street Name, City"
              />
            </Grid>

            {/* NCA Mandatory Disclosures */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2 }}>
                NCA Mandatory Acknowledgments
              </Typography>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <GavelIcon sx={{ mr: 1, fontSize: 'small' }} />
                These acknowledgments are required by the National Credit Act (NCA) and must be completed before loan approval.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <List disablePadding sx={{ mt: 2 }}>
                {/* Credit Check Consent - use lock icon */}
                <ListItem disableGutters sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LockIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2"><strong>Credit Check Consent:</strong> I consent to a credit bureau check and understand that this may affect my credit score.</Typography>}
                    secondary={
                      <Collapse in={!formData.consentToCreditCheck} timeout={200}>
                        <Typography variant="caption" color="error">Required</Typography>
                      </Collapse>
                    }
                  />
                  <Box sx={{ ml: 'auto', transition: 'transform 180ms', transform: formData.consentToCreditCheck ? 'scale(1.05)' : 'scale(1)' }}>
                    <Checkbox
                      edge="end"
                      checked={formData.consentToCreditCheck}
                      onChange={(e) => setFormData(prev => ({ ...prev, consentToCreditCheck: e.target.checked }))}
                      inputProps={{ 'aria-label': 'Consent to credit check' }}
                    />
                  </Box>
                </ListItem>

                {/* NCA Disclosure - gavel icon */}
                <ListItem disableGutters sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <GavelIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2"><strong>NCA Disclosure:</strong> I acknowledge that I have been informed of my rights under the National Credit Act.</Typography>
                        <Button size="small" onClick={() => setShowNCADisclosure(true)}>View Details</Button>
                      </Box>
                    }
                    secondary={
                      <Collapse in={!formData.acknowledgeNCADisclosure} timeout={200}>
                        <Typography variant="caption" color="error">Required</Typography>
                      </Collapse>
                    }
                  />
                  <Box sx={{ ml: 'auto', transition: 'transform 180ms', transform: formData.acknowledgeNCADisclosure ? 'scale(1.05)' : 'scale(1)' }}>
                    <Checkbox
                      edge="end"
                      checked={formData.acknowledgeNCADisclosure}
                      onChange={(e) => setFormData(prev => ({ ...prev, acknowledgeNCADisclosure: e.target.checked }))}
                      inputProps={{ 'aria-label': 'Acknowledge NCA disclosure' }}
                    />
                  </Box>
                </ListItem>

                {/* Fee Disclosure - receipt icon */}
                <ListItem disableGutters sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DescriptionIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2"><strong>Fee Disclosure:</strong> I understand all fees and charges associated with this loan.</Typography>
                        <Button size="small" onClick={() => setShowFeeDisclosure(true)}>View Fees</Button>
                      </Box>
                    }
                    secondary={
                      <Collapse in={!formData.acknowledgeFeeDisclosure} timeout={200}>
                        <Typography variant="caption" color="error">Required</Typography>
                      </Collapse>
                    }
                  />
                  <Box sx={{ ml: 'auto', transition: 'transform 180ms', transform: formData.acknowledgeFeeDisclosure ? 'scale(1.05)' : 'scale(1)' }}>
                    <Checkbox
                      edge="end"
                      checked={formData.acknowledgeFeeDisclosure}
                      onChange={(e) => setFormData(prev => ({ ...prev, acknowledgeFeeDisclosure: e.target.checked }))}
                      inputProps={{ 'aria-label': 'Acknowledge fee disclosure' }}
                    />
                  </Box>
                </ListItem>

                {/* Right to cancellation - info icon */}
                <ListItem disableGutters sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2"><strong>Right to Cancellation:</strong> I understand that I have 5 business days to cancel this agreement without penalty.</Typography>}
                    secondary={
                      <Collapse in={!formData.acknowledgeRightToCancellation} timeout={200}>
                        <Typography variant="caption" color="error">Required</Typography>
                      </Collapse>
                    }
                  />
                  <Box sx={{ ml: 'auto', transition: 'transform 180ms', transform: formData.acknowledgeRightToCancellation ? 'scale(1.05)' : 'scale(1)' }}>
                    <Checkbox
                      edge="end"
                      checked={formData.acknowledgeRightToCancellation}
                      onChange={(e) => setFormData(prev => ({ ...prev, acknowledgeRightToCancellation: e.target.checked }))}
                      inputProps={{ 'aria-label': 'Acknowledge right to cancellation' }}
                    />
                  </Box>
                </ListItem>

                {/* Data processing (POPIA) - people icon */}
                <ListItem disableGutters sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PeopleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2"><strong>Data Processing (POPIA):</strong> I consent to the processing of my personal information for credit assessment purposes.</Typography>}
                    secondary={
                      <Collapse in={!formData.consentToDataProcessing} timeout={200}>
                        <Typography variant="caption" color="error">Required</Typography>
                      </Collapse>
                    }
                  />
                  <Box sx={{ ml: 'auto', transition: 'transform 180ms', transform: formData.consentToDataProcessing ? 'scale(1.05)' : 'scale(1)' }}>
                    <Checkbox
                      edge="end"
                      checked={formData.consentToDataProcessing}
                      onChange={(e) => setFormData(prev => ({ ...prev, consentToDataProcessing: e.target.checked }))}
                      inputProps={{ 'aria-label': 'Consent to data processing' }}
                    />
                  </Box>
                </ListItem>
              </List>
            </Grid>
          </Grid>
        )

      default:
        return null
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 2, fontSize: 40 }} />
          Loan Application
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Complete loan application with full National Credit Act compliance and affordability assessment.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading || !isStepValid(activeStep)}
                sx={{ minWidth: 120 }}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Submit Application'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!isStepValid(activeStep)}
                size="large"
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* NCA Disclosure Dialog */}
      <Dialog open={showNCADisclosure} onClose={() => setShowNCADisclosure(false)} maxWidth="md" fullWidth>
        <DialogTitle>National Credit Act (NCA) Rights Disclosure</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            <strong>Your Rights Under the National Credit Act:</strong>
          </Typography>
          <ul>
            <li>Right to receive documents in an official language you understand</li>
            <li>Right to receive a copy of your credit record</li>
            <li>Right to challenge any incorrect information</li>
            <li>Right to receive reasons if credit is refused</li>
            <li>Right to cancel this agreement within 5 business days</li>
            <li>Protection against reckless lending</li>
            <li>Right to lodge complaints with the National Credit Regulator</li>
          </ul>
          <Typography>
            <strong>Contact NCR:</strong> 0860 627 627 or www.ncr.org.za
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNCADisclosure(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Fee Disclosure Dialog */}
      <Dialog open={showFeeDisclosure} onClose={() => setShowFeeDisclosure(false)} maxWidth="md" fullWidth>
        <DialogTitle>Fee Structure Disclosure</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            <strong>Loan Fees and Charges:</strong>
          </Typography>
          <ul>
            <li><strong>Initiation Fee:</strong> R1,140 + 10% of amount above R1,000 (max R2,190)</li>
            <li><strong>Monthly Service Fee:</strong> R60 per month</li>
            <li><strong>Credit Life Insurance:</strong> 0.8% per month (mandatory for loans above R10,000)</li>
            <li><strong>Interest Rate:</strong> Risk-based pricing between 18% - 27.5% per annum</li>
          </ul>
          <Typography>
            All fees are inclusive of VAT where applicable and comply with NCA regulations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeeDisclosure(false)}>Close</Button>
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

export default LoanApply