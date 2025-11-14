import React, { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Avatar
} from '@mui/material'
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon
} from '@mui/icons-material'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface LendaKahleChatbotProps {
  open: boolean
  onClose: () => void
}

const LendaKahleChatbot: React.FC<LendaKahleChatbotProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text:
        "Sawubona! Welcome to Lenda Kahle. I'm here to help you with loan applications, requirements, and general questions. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickReplies = [
    'How do I apply for a loan?',
    'What documents do I need?',
    'Calculate loan repayments',
    'Check application status',
    'NCA compliance info'
  ]

  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase()

    // Loan Application
    if (msg.includes('apply') || msg.includes('application')) {
      return (
        'To apply for a loan:\n\n' +
        '1. Click "My Loans" in the menu\n' +
        '2. Click "Apply for New Loan"\n' +
        '3. Fill in your personal details\n' +
        '4. Provide income and expense information\n' +
        '5. Submit for review\n\n' +
        'Our team will review your application within 24-48 hours. Would you like to start an application now?'
      )
    }

    // Documents
    if (msg.includes('document') || msg.includes('upload') || msg.includes('need')) {
      return (
        'Required documents for loan application:\n\n' +
        '- Valid South African ID\n' +
        '- Proof of income (payslip/bank statement)\n' +
        '- Proof of residence (utility bill)\n' +
        '- Bank account details\n\n' +
        'You can upload these after submitting your application. Is there a specific document you have questions about?'
      )
    }

    // Calculator
    if (msg.includes('calculat') || msg.includes('repayment') || msg.includes('afford')) {
      return (
        'Use our NCA-compliant loan calculator to estimate:\n\n' +
        '- Monthly repayments\n' +
        '- Total interest\n' +
        '- Affordability assessment\n\n' +
        'Click "Calculator" in the menu to try it out. You can adjust loan amount and term to see what works for your budget!'
      )
    }

    // Status Check
    if (msg.includes('status') || msg.includes('track') || msg.includes('progress')) {
      return (
        'To check your application status:\n\n' +
        '1. Go to "My Loans"\n' +
        '2. View your loan list\n' +
        '3. Click on any loan for details\n\n' +
        "You'll also receive notifications when your status changes. Would you like me to explain our loan approval process?"
      )
    }

    // NCA Compliance
    if (
      msg.includes('nca') ||
      msg.includes('complia') ||
      msg.includes('legal') ||
      msg.includes('regulation')
    ) {
      return (
        'Lenda Kahle is fully NCA-compliant:\n\n' +
        '- Transparent fee disclosure\n' +
        '- Affordability assessments\n' +
        '- Fair interest rates\n' +
        '- Clear loan agreements\n' +
        '- Responsible lending practices\n\n' +
        'Your financial wellbeing is our priority. Do you have specific questions about our terms?'
      )
    }

    // Requirements
    if (msg.includes('requir') || msg.includes('eligib') || msg.includes('qualify')) {
      return (
        'Loan eligibility requirements:\n\n' +
        '- Be 18+ years old\n' +
        '- South African citizen/resident\n' +
        '- Valid ID number\n' +
        '- Proof of income\n' +
        '- Active bank account\n' +
        '- Meet affordability criteria\n\n' +
        'Would you like to check if you qualify using our calculator?'
      )
    }

    // Interest rates
    if (msg.includes('interest') || msg.includes('rate') || msg.includes('cost')) {
      return (
        'Our interest rates are:\n\n' +
        '- Risk-based (personalized)\n' +
        '- NCA-compliant\n' +
        '- Transparent with no hidden fees\n\n' +
        'Rates depend on:\n' +
        '- Loan amount\n' +
        '- Loan term\n' +
        '- Credit profile\n' +
        '- Income vs expenses\n\n' +
        'Use our calculator for your specific rate!'
      )
    }

    // Repayment
    if (msg.includes('pay') || msg.includes('repay') || msg.includes('instalment')) {
      return (
        'Making repayments is easy:\n\n' +
        '1. Go to "Repayments" menu\n' +
        '2. Select your active loan\n' +
        '3. Enter payment amount\n' +
        '4. Confirm payment\n\n' +
        'You can make:\n' +
        '- Full monthly payments\n' +
        '- Partial payments\n' +
        '- Early settlement (no penalty)\n\n' +
        'Need help with a specific payment?'
      )
    }

    // Approval time
    if (msg.includes('how long') || msg.includes('approval time') || msg.includes('wait')) {
      return (
        'Application timeline:\n\n' +
        '- Auto-approval: Instant (for qualifying loans)\n' +
        '- Manual review: 24-48 hours\n' +
        '- Document verification: 1-2 days\n\n' +
        "You'll get notifications at each step. Smaller loans with good affordability may be approved instantly!"
      )
    }

    // Contact/Help
    if (msg.includes('help') || msg.includes('support') || msg.includes('contact')) {
      return (
        'Need more help?\n\n' +
        'Email: support@lendakahle.com\n' +
        'Phone: 0800 LENDA (available soon)\n' +
        'Chat: I am here to help!\n\n' +
        'You can also visit our FAQ section or speak to an admin if you are logged in. What can I help you with?'
      )
    }

    // Default response
    return (
      "I'm here to help with:\n\n" +
      '- Loan applications\n' +
      '- Document requirements\n' +
      '- Repayment calculations\n' +
      '- Application status\n' +
      '- NCA compliance\n' +
      '- General questions\n\n' +
      'Please click a quick reply below or ask me anything about Lenda Kahle loans!'
    )
  }

  const sendMessage = (text: string) => {
    const newUserMessage: Message = {
      id: messages.length + 1,
      text,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setInput('')

    setTimeout(() => {
      const botMessage: Message = {
        id: newUserMessage.id + 1,
        text: getBotResponse(text),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    }, 500)
  }

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '600px',
          maxHeight: '80vh',
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #01263f 0%, #003a5a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: '#d4af37' }}>
            <BotIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Lenda Kahle Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Your Loan Assistant
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {messages.map(message => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  maxWidth: '75%',
                  bgcolor: message.sender === 'user' ? '#01263f' : 'white',
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  whiteSpace: 'pre-line'
                }}
              >
                <Typography variant="body2">{message.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '0.7rem'
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Replies */}
        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Quick replies:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {quickReplies.map((reply, index) => (
              <Chip
                key={index}
                label={reply}
                onClick={() => handleQuickReply(reply)}
                size="small"
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#01263f', color: 'white' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              sx={{ bgcolor: '#f5f5f5', borderRadius: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!input.trim()}
              sx={{
                minWidth: 'auto',
                px: 2,
                background: 'linear-gradient(135deg, #01263f 0%, #003a5a 100%)'
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default LendaKahleChatbot
