import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Fab,
  Fade,
  Chip,
  CircularProgress
} from '@mui/material'
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon
} from '@mui/icons-material'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatbotProps {
  open: boolean
  onClose: () => void
}

const LendaKahleChatbot: React.FC<ChatbotProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Sawubona! ?? Welcome to Lenda Kahle. I\'m here to help you with loan applications, requirements, and general questions. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Quick action suggestions
  const quickActions = [
    'How do I apply for a loan?',
    'What documents do I need?',
    'Calculate loan repayments',
    'Check application status',
    'NCA compliance info'
  ]

  // AI Response Logic (Rule-based for now - can integrate OpenAI later)
  const generateResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase()

    // Greetings
    if (lowerMsg.match(/^(hi|hello|hey|sawubona|greetings)/)) {
      return 'Sawubona! ?? I\'m your Lenda Kahle assistant. I can help you with:\n\n• Loan applications\n• Required documents\n• Loan calculator\n• NCA compliance\n• Application status\n\nWhat would you like to know?'
    }

    // Loan application
    if (lowerMsg.includes('apply') || lowerMsg.includes('application')) {
      return '?? To apply for a loan:\n\n1. Click "Apply for Loan" in the menu\n2. Fill in your details:\n   • Loan amount (R1,000 - R100,000)\n   • Loan term (3-60 months)\n   • Purpose of loan\n   • Income information\n\n3. Upload required documents\n4. Submit for review\n\nYour application will be reviewed within 24-48 hours! ??'
    }

    // Documents
    if (lowerMsg.includes('document') || lowerMsg.includes('upload') || lowerMsg.includes('need')) {
      return '?? Required documents for loan application:\n\n? South African ID (or Passport)\n? Latest 3 months payslips\n? Latest 3 months bank statements\n? Proof of residence (not older than 3 months)\n\nYou can upload these as:\n• Individual PDFs\n• Combined PDF (all documents in one)\n• Images (JPG, PNG)\n\nMax file size: 30MB per upload'
    }

    // Calculator
    if (lowerMsg.includes('calculat') || lowerMsg.includes('repayment') || lowerMsg.includes('afford')) {
      return '?? Use our Loan Calculator:\n\n1. Go to "Calculator" in the menu\n2. Enter:\n   • Desired loan amount\n   • Loan term (months)\n   • Your monthly income\n   • Monthly expenses\n\n3. See instant results:\n   • Monthly repayment\n   • Total interest\n   • Affordability assessment\n\nThe calculator helps you find the right loan for your budget! ??'
    }

    // Interest rates
    if (lowerMsg.includes('interest') || lowerMsg.includes('rate') || lowerMsg.includes('apr')) {
      return '?? Lenda Kahle Interest Rates:\n\n• Small loans (? R8,000): 27.5% p.a.\n• Medium loans (R8,001 - R30,000): 24.0% p.a.\n• Large loans (> R30,000): 22.0% p.a.\n\n? Better credit = Lower rates!\nRates may be adjusted based on:\n• Your affordability assessment\n• Debt-to-income ratio\n• Credit history\n\nAll rates are NCA compliant (max 27.5%)'
    }

    // NCA Compliance
    if (lowerMsg.includes('nca') || lowerMsg.includes('complian') || lowerMsg.includes('legal')) {
      return '?? NCA Compliance at Lenda Kahle:\n\n? Maximum interest: 27.5% p.a.\n? Initiation fee: R1,140 max\n? Monthly service fee: R60\n? Full affordability assessment\n? Credit life insurance included\n? Clear cost breakdown\n\nWe are fully compliant with the National Credit Act to protect you! ???'
    }

    // Status check
    if (lowerMsg.includes('status') || lowerMsg.includes('approved') || lowerMsg.includes('pending')) {
      return '?? Check your loan status:\n\n1. Go to "My Loans" in the menu\n2. View all your applications\n3. Status indicators:\n   ?? Pending - Under review\n   ?? Pre-Approved - Initial approval\n   ?? Active - Loan disbursed\n   ? Completed - Fully repaid\n\nYou\'ll also receive email notifications when your status changes!'
    }

    // Eligibility
    if (lowerMsg.includes('eligib') || lowerMsg.includes('qualify') || lowerMsg.includes('requirements')) {
      return '? Eligibility Requirements:\n\n• 18+ years old\n• South African citizen/resident\n• Valid SA ID or passport\n• Employed with regular income\n• Bank account in your name\n• Good credit history (preferred)\n• Debt-to-income ratio < 40%\n\nEven if you don\'t meet all criteria, apply! We review each case individually. ??'
    }

    // Repayment
    if (lowerMsg.includes('pay') || lowerMsg.includes('repay') || lowerMsg.includes('install')) {
      return '?? Making Repayments:\n\n1. Go to "Make Repayment"\n2. Select your active loan\n3. Enter amount (minimum = monthly installment)\n4. Submit payment\n\n?? Payment Schedule:\n• Monthly installments\n• Auto-debit available\n• Early repayment allowed\n• No penalties for early payment\n\nView your payment history in "Repayments" menu!'
    }

    // Help/Support
    if (lowerMsg.includes('help') || lowerMsg.includes('support') || lowerMsg.includes('contact')) {
      return '?? Need more help?\n\n?? Email: support@lendakahle.co.za\n?? Phone: +27 11 123 4567\n? Hours: Mon-Fri, 8AM-5PM SAST\n\nOr use quick actions below for common questions!\n\nI\'m here 24/7 for instant answers. ??'
    }

    // Admin/Approval
    if (lowerMsg.includes('admin') || lowerMsg.includes('approve') || lowerMsg.includes('review')) {
      return '????? Loan Review Process:\n\n1. Application submitted ?\n2. Documents verified (1-2 days)\n3. Affordability assessed\n4. Credit check performed\n5. Admin approval (24-48 hours)\n6. Loan disbursed! ??\n\nYou\'ll be notified at each step via email and in-app notifications.'
    }

    // Thanks/Goodbye
    if (lowerMsg.match(/(thank|thanks|bye|goodbye|siyabonga)/)) {
      return 'Siyabonga! (Thank you!) ??\n\nGlad I could help! Feel free to ask anytime you need assistance with Lenda Kahle.\n\nHamba kahle! (Go well!) ????'
    }

    // Default response
    return 'I\'m here to help with:\n\n• ?? Loan applications\n• ?? Required documents\n• ?? Loan calculator\n• ?? Repayments\n• ?? NCA compliance\n• ?? Application status\n\nTry asking: "How do I apply?" or "What documents do I need?"\n\nOr click a quick action below! ??'
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(input),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setLoading(false)
    }, 500)
  }

  const handleQuickAction = (action: string) => {
    setInput(action)
    // Auto-send after a brief moment
    setTimeout(() => handleSend(), 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) return null

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 24,
          width: { xs: 'calc(100% - 48px)', sm: 380 },
          maxWidth: 380,
          height: 500,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #01263f 0%, #003a5a 100%)',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#d4af37' }}>
              <BotIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Lenda Kahle AI
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Your Loan Assistant ????
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              {msg.sender === 'bot' && (
                <Avatar sx={{ bgcolor: '#d4af37', width: 32, height: 32 }}>
                  <BotIcon fontSize="small" />
                </Avatar>
              )}
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '75%',
                  bgcolor: msg.sender === 'user' ? '#01263f' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  whiteSpace: 'pre-line'
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '0.65rem'
                  }}
                >
                  {msg.timestamp.toLocaleTimeString('en-ZA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Paper>
              {msg.sender === 'user' && (
                <Avatar sx={{ bgcolor: '#003a5a', width: 32, height: 32 }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#d4af37', width: 32, height: 32 }}>
                <BotIcon fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: 'white',
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5
            }}
          >
            {quickActions.map((action, idx) => (
              <Chip
                key={idx}
                label={action}
                size="small"
                onClick={() => handleQuickAction(action)}
                sx={{
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#01263f', color: 'white' }
                }}
              />
            ))}
          </Box>
        )}

        {/* Input */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'white',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={{ bgcolor: '#f5f5f5', borderRadius: 2 }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || loading}
            sx={{
              bgcolor: '#01263f',
              color: 'white',
              '&:hover': { bgcolor: '#003a5a' },
              '&:disabled': { bgcolor: '#e0e0e0' }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Fade>
  )
}

export default LendaKahleChatbot
