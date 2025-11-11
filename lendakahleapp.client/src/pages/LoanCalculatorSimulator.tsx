import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Button,
  Grid,
  Paper,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  InfoIcon,
  TrendingUpIcon,
  BankIcon,
  CalculateIcon,
  CheckCircleIcon,
  WarningIcon,
  ArrowForwardIcon
} from '../components/AppIcons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from '../api/axios'

interface LoanCalculation {
  loanAmount: number
  termMonths: number
  interestRate: number
  monthlyInstallment: number
  totalInterest: number
  initiationFee: number
  monthlyServiceFee: number
  monthlyCreditLife: number
  totalFees: number
  totalRepayable: number
  isQualified: boolean
  qualificationNotes: string[]
}

interface LendingRulesCache {
  smallLoanBase: number
  mediumLoanBase: number
  largeLoanBase: number
  minRate: number
  maxRate: number
  initiationFeeBase: number
  initiationFeePercent: number
  initiationFeeMax: number
  monthlyServiceFee: number
  creditLifeThreshold: number
  creditLifeRate: number
}

const LoanCalculatorSimulator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState(15000)
  const [termMonths, setTermMonths] = useState(12)
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null)
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<LendingRulesCache | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch lending rules on mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        // Try cached version first (5 min TTL)
        const cached = localStorage.getItem('lendingRulesCache')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.fetchedAt && (Date.now() - parsed.fetchedAt < 5 * 60 * 1000)) {
            setRules(parsed.data)
            return
          }
        }
        // Fetch fresh from public summary endpoint (no auth required)
        const resp = await axios.get('/api/settings/lendingrules/summary')
        const data = resp.data
        const rulesCache: LendingRulesCache = {
          smallLoanBase: data.InterestRates?.BaseRates?.SmallLoanBase ?? 27.5,
          mediumLoanBase: data.InterestRates?.BaseRates?.MediumLoanBase ?? 24.0,
          largeLoanBase: data.InterestRates?.BaseRates?.LargeLoanBase ?? 22.0,
          minRate: data.InterestRates?.Limits?.MinimumRate ?? 18.0,
          maxRate: data.InterestRates?.Limits?.MaximumRate ?? 27.5,
          initiationFeeBase: data.Fees?.InitiationFee?.BaseAmount ?? 1140,
          initiationFeePercent: data.Fees?.InitiationFee?.PercentageAbove1000 ?? 10.0,
          initiationFeeMax: data.Fees?.InitiationFee?.MaximumFee ?? 2190,
          monthlyServiceFee: data.Fees?.MonthlyServiceFee ?? 60,
          creditLifeThreshold: data.Fees?.CreditLife?.RequiredAboveAmount ?? 10000,
          creditLifeRate: data.Fees?.CreditLife?.MonthlyRatePercentage ?? 0.8
        }
        setRules(rulesCache)
        localStorage.setItem('lendingRulesCache', JSON.stringify({ data: rulesCache, fetchedAt: Date.now() }))
      } catch (err) {
        console.error('Failed to fetch lending rules, using defaults', err)
        // Fallback to hardcoded defaults
        setRules({
          smallLoanBase: 27.5,
          mediumLoanBase: 24.0,
          largeLoanBase: 22.0,
          minRate: 18.0,
          maxRate: 27.5,
          initiationFeeBase: 1140,
          initiationFeePercent: 10.0,
          initiationFeeMax: 2190,
          monthlyServiceFee: 60,
          creditLifeThreshold: 10000,
          creditLifeRate: 0.8
        })
      }
    }
    fetchRules()
  }, [])

  // Calculate loan when amount/term or rules change
  useEffect(() => {
    if (rules) calculateLoan()
  }, [loanAmount, termMonths, rules])

  const calculateLoan = () => {
    if (!rules) return
    setLoading(true)
    
    setTimeout(() => {
      // Use dynamic rules from system configuration
      const baseRate = loanAmount <= 8000 ? rules.smallLoanBase : loanAmount <= 30000 ? rules.mediumLoanBase : rules.largeLoanBase
      
      // Risk adjustment (simplified for public calculator)
      const riskAdjustment = loanAmount > 25000 ? 2.0 : loanAmount > 15000 ? 0 : -2.0
      const interestRate = Math.min(Math.max(baseRate + riskAdjustment, rules.minRate), rules.maxRate)
      
      // Fee calculations using dynamic rules
      const initiationFee = Math.min(rules.initiationFeeBase + Math.max(0, loanAmount - 1000) * (rules.initiationFeePercent / 100), rules.initiationFeeMax)
      const monthlyServiceFee = rules.monthlyServiceFee
      const monthlyCreditLife = loanAmount > rules.creditLifeThreshold ? loanAmount * (rules.creditLifeRate / 100) : 0
      
      // Total calculations
      const totalInterest = loanAmount * (interestRate / 100) * (termMonths / 12)
      const totalServiceFees = monthlyServiceFee * termMonths
      const totalCreditLifeFees = monthlyCreditLife * termMonths
      const totalFees = initiationFee + totalServiceFees + totalCreditLifeFees
      const totalRepayable = loanAmount + totalInterest + totalFees
      const monthlyInstallment = totalRepayable / termMonths
      
      // Basic qualification check
      const estimatedMinIncome = monthlyInstallment * 2.5
      const isQualified = monthlyInstallment <= 5000 && loanAmount >= 1000 && loanAmount <= 50000
      
      const qualificationNotes: string[] = []
      if (monthlyInstallment > 5000) qualificationNotes.push("Monthly payment may be too high for most applicants")
      if (loanAmount < 1000) qualificationNotes.push("Minimum loan amount is R1,000")
      if (loanAmount > 50000) qualificationNotes.push("Maximum loan amount is R50,000")
      if (isQualified) qualificationNotes.push(`Estimated minimum monthly income required: R${estimatedMinIncome.toLocaleString()}`)
      
      setCalculation({
        loanAmount,
        termMonths,
        interestRate,
        monthlyInstallment,
        totalInterest,
        initiationFee,
        monthlyServiceFee,
        monthlyCreditLife,
        totalFees,
        totalRepayable,
        isQualified,
        qualificationNotes
      })
      
      setLoading(false)
    }, 500)
  }

  const handleApplyNow = () => {
    if (user) {
      // User is logged in, go directly to application
      navigate('/loans/apply')
    } else {
      // User not logged in, go to registration with pre-filled amount
      navigate('/register', { state: { suggestedLoanAmount: loanAmount, suggestedTerm: termMonths } })
    }
  }

  const getTermOptions = () => {
    if (loanAmount <= 8000) return { min: 3, max: 6, marks: [3, 4, 5, 6] }
    if (loanAmount <= 30000) return { min: 6, max: 12, marks: [6, 9, 12] }
    return { min: 12, max: 24, marks: [12, 18, 24] }
  }

  const termOptions = getTermOptions()
  const validTerm = Math.max(termOptions.min, Math.min(termOptions.max, termMonths))

  // Update term if outside valid range
  useEffect(() => {
    if (termMonths < termOptions.min || termMonths > termOptions.max) {
      setTermMonths(termOptions.min)
    }
  }, [loanAmount])

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #01263f 0%, #003a5a 50%, #001f3f 100%)', color: 'white', borderRadius: 2, position: 'relative', overflow: 'hidden', backgroundSize: '300% 300%', animation: 'headerGradient 10s ease infinite' }}>
        {/* Decorative SVG shapes responsive to screen size */}
        <Box component="svg" viewBox="0 0 600 200" preserveAspectRatio="none" sx={{ position: 'absolute', left: -40, top: -20, width: { xs: 180, sm: 260, md: 360 }, height: { xs: 120, sm: 160, md: 200 }, opacity: 0.08 }}>
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M0,100 C150,10 350,190 600,100 L600,0 L0,0 Z" fill="url(#g1)" />
        </Box>

        <Box sx={{ position: 'absolute', right: -80, top: -40, width: 220, height: 220, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06), transparent 40%)', transform: 'rotate(25deg)', opacity: 0.9 }} />
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'normal', fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>
              <CalculateIcon sx={{ mr: 2, fontSize: 'inherit', color: 'white' }} />
              Loan Calculator
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.95, mb: 2 }}>
              See what you could qualify for with our NCA-compliant loan calculator
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Get instant estimates with risk-based pricing and transparent fee disclosure
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 72, opacity: 0.95, color: 'rgba(255,255,255,0.95)' }} />
          </Grid>
        </Grid>

        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent 30%)', mixBlendMode: 'overlay' }} />

        <style>{`
          @keyframes headerGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Panel - Controls */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative', transition: 'transform 180ms ease, box-shadow 180ms ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 18px 40px rgba(2,6,23,0.12)' } }}>
            {/* glass overlay effect */}
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))', pointerEvents: 'none', backdropFilter: 'blur(6px)' }} />
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BankIcon sx={{ mr: 1, color: 'primary.main' }} />
                Loan Details
              </Typography>

              {/* Loan Amount Slider */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Loan amount
                  </Typography>
                  <Tooltip title="Drag to adjust loan amount">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'normal', mb: 2, fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                  R{loanAmount.toLocaleString()}
                </Typography>
                
                <Slider
                  value={loanAmount}
                  onChange={(_, value) => setLoanAmount(value as number)}
                  min={1000}
                  max={50000}
                  step={1000}
                  marks={[
                    { value: 1000, label: 'R1K' },
                    { value: 10000, label: 'R10K' },
                    { value: 25000, label: 'R25K' },
                    { value: 50000, label: 'R50K' }
                  ]}
                  sx={{
                    '& .MuiSlider-thumb': {
                      width: 24,
                      height: 24,
                      '&:before': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                      },
                    },
                    '& .MuiSlider-track': {
                      height: 6,
                      background: 'linear-gradient(90deg, #ff9800, #ff5722)'
                    },
                    '& .MuiSlider-rail': {
                      height: 6,
                      opacity: 0.2,
                    },
                  }}
                />
              </Box>

              {/* Term Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Loan term
                </Typography>
                
                <Grid container spacing={1}>
                  {termOptions.marks.map((term) => (
                    <Grid item key={term}>
                      <Button
                        variant={validTerm === term ? 'contained' : 'outlined'}
                        onClick={() => setTermMonths(term)}
                        sx={{ minWidth: 80, transition: 'transform 140ms', '&:active': { transform: 'scale(0.98)' } }}
                      >
                        {term} Month{term > 1 ? 's' : ''}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Available terms depend on loan amount
                </Typography>
              </Box>

              {/* Qualification Indicator */}
              {calculation && (
                <Alert 
                  severity={calculation.isQualified ? 'success' : 'warning'} 
                  icon={calculation.isQualified ? <CheckCircleIcon /> : <WarningIcon />}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {calculation.isQualified ? 'Potentially Qualified' : 'May Require Review'}
                  </Typography>
                  {calculation.qualificationNotes.map((note, index) => (
                    <Typography key={index} variant="caption" display="block">
                      • {note}
                    </Typography>
                  ))}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Results */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Calculating...
                  </Typography>
                </Box>
              ) : calculation ? (
                <>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    Monthly Instalment
                  </Typography>

                  <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'normal', mb: 1, fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>
                    R{calculation.monthlyInstallment.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    The amount we can lend you depends on your credit application and affordability assessment.
                    <Tooltip title="Subject to NCA affordability assessment">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  {/* Fee Breakdown */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Interest, Fees & Credit Life
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        R{(calculation.totalInterest + calculation.totalFees).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total to Repay
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        R{calculation.totalRepayable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Detailed Breakdown */}
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50', mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Fee Breakdown:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption">Interest Rate ({calculation.interestRate.toFixed(1)}% PA):</Typography>
                          <Typography variant="caption">R{calculation.totalInterest.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption">Initiation Fee:</Typography>
                          <Typography variant="caption">R{calculation.initiationFee.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption">Service Fee (R{calculation.monthlyServiceFee}/month):</Typography>
                          <Typography variant="caption">R{(calculation.monthlyServiceFee * calculation.termMonths).toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      {calculation.monthlyCreditLife > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">Credit Life Insurance:</Typography>
                            <Typography variant="caption">R{(calculation.monthlyCreditLife * calculation.termMonths).toLocaleString()}</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>

                  {/* Interest Rate Badge */}
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      label={`${calculation.interestRate.toFixed(1)}% Annual Interest Rate`}
                      color="info"
                      variant="filled"
                      icon={<TrendingUpIcon />}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Risk-based pricing • NCA compliant
                    </Typography>
                  </Box>

                  {/* Apply Button */}
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleApplyNow}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #ff9800 30%, #ff5722 90%)',
                      transition: 'transform 160ms ease, box-shadow 160ms ease',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #f57c00 30%, #d84315 90%)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 30px rgba(216,67,21,0.18)'
                      },
                      '&:active': { transform: 'translateY(-1px)' }
                    }}
                  >
                    {user ? 'APPLY NOW' : 'REGISTER & APPLY'}
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                    {user 
                      ? "Continue with your existing account"
                      : "Create account and pre-fill application with these details"
                    }
                  </Typography>
                </>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Disclaimer */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Important:</strong> This is an estimate only. Final loan approval and terms depend on a comprehensive 
          NCA-compliant affordability assessment, credit check, and document verification. Interest rates are risk-based 
          and may vary based on your individual circumstances.
        </Typography>
      </Alert>
    </Box>
  )
}

export default LoanCalculatorSimulator