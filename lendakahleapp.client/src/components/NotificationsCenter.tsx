import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Badge,
  Drawer,
  Divider,
  Button,
  Alert
} from '@mui/material'
import {
  NotificationsIcon,
  EmailIcon,
  PaymentIcon,
  CheckCircleIcon,
  WarningIcon,
  ScheduleIcon,
  CloseIcon,
  MarkEmailReadIcon
} from './AppIcons'
import axios from '../api/axios'

interface Notification {
  id: string
  type:
    | 'loan_preapproved'
    | 'loan_approval'
    | 'loan_rejected'
    | 'payment_due'
    | 'payment_received'
    | 'loan_overdue'
    | 'application_submitted'
    | 'document_verified'
    | 'document_rejected'
    | 'loan_completed'
    | 'general'
  title: string
  message: string
  date: string
  read: boolean
  loanId?: number
}

interface NotificationsCenterProps {
  open: boolean
  onClose: () => void
}

// Decode HTML entities (e.g. "&#9989;"). If unsupported, leave plain text.
const decodeHtml = (html: string) => {
  if (!html) return html
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

// Normalize text: decode entities; remove stray multiple question marks used as broken emoji
const normalizeText = (input: string) => {
  if (!input) return ''
  let text = decodeHtml(input)
  // remove runs of 2+ question marks (often from unsupported emoji)
  text = text.replace(/\?{2,}/g, '')
  // collapse whitespace
  text = text.replace(/\s{2,}/g, ' ')
  return text.trim()
}

// Simple SA date-time formatter (handles ISO strings with/without Z and Date objects)
const formatSADateTime = (value: string | Date) => {
  if (!value) return ''
  let date: Date

  if (value instanceof Date) {
    date = value
  } else {
    let s = value.trim()
    // If it already looks like it has a timezone, don't append Z
    if (!s.endsWith('Z') && !s.includes('+')) {
      // handle "YYYY-MM-DD HH:mm:ss" by converting space to T
      s = s.replace(' ', 'T')
      s += 'Z'
    }
    date = new Date(s)
  }

  if (isNaN(date.getTime())) return ''

  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch notifications whenever the drawer is opened
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/notifications')
      const list = Array.isArray(response.data) ? response.data : (response.data?.items ?? [])
      const apiNotifications = list.map((n: any) => {
        const id = (n.id ?? n.Id ?? '').toString()
        const type = n.type ?? n.Type
        const title = normalizeText(n.title ?? n.Title ?? '')
        const message = normalizeText(n.message ?? n.Message ?? '')
        const date = n.createdAt ?? n.CreatedAt ?? ''
        const read = n.isRead ?? n.IsRead ?? false
        const loanId = n.relatedLoanId ?? n.RelatedLoanId
        return {
          id,
          type: mapNotificationType(Number(type)),
          title,
          message,
          date,
          read,
          loanId
        } as Notification
      })
      setNotifications(
        apiNotifications.sort((a: Notification, b: Notification) =>
          new Date((b.date?.endsWith('Z') ? b.date : (b.date ? b.date + 'Z' : ''))).getTime() -
          new Date((a.date?.endsWith('Z') ? a.date : (a.date ? a.date + 'Z' : ''))).getTime()
        )
      )
    } catch (error) {
      console.error('Failed to fetch notifications', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const mapNotificationType = (type: number): Notification['type'] => {
    switch (type) {
      case 1: return 'loan_preapproved'
      case 2: return 'loan_approval'
      case 3: return 'loan_rejected'
      case 4: return 'payment_received'
      case 5: return 'payment_due'
      case 6: return 'loan_overdue'
      case 7: return 'application_submitted'
      case 8: return 'document_verified'
      case 9: return 'document_rejected'
      case 10: return 'loan_completed'
      default: return 'general'
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment_due':
        return <ScheduleIcon color="warning" />
      case 'payment_received':
        return <PaymentIcon color="success" />
      case 'loan_approval':
      case 'loan_preapproved':
      case 'loan_completed':
        return <CheckCircleIcon color="success" />
      case 'loan_overdue':
      case 'loan_rejected':
        return <WarningIcon color="error" />
      case 'document_verified':
      case 'document_rejected':
      case 'application_submitted':
        return <EmailIcon color="info" />
      default:
        return <NotificationsIcon color="action" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'payment_due': return 'warning'
      case 'payment_received': return 'success'
      case 'loan_approval':
      case 'loan_preapproved':
      case 'loan_completed': return 'success'
      case 'loan_overdue':
      case 'loan_rejected': return 'error'
      case 'document_verified':
      case 'application_submitted': return 'info'
      case 'document_rejected': return 'warning'
      case 'general': return 'default'
      default: return 'default'
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await axios.post(`/api/notifications/mark-read/${id}`)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification as read', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all notifications as read', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6">
            Notifications
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
            )}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {unreadCount > 0 && (
          <Button
            startIcon={<MarkEmailReadIcon />}
            onClick={markAllAsRead}
            size="small"
            sx={{ mb: 2 }}
          >
            Mark All as Read
          </Button>
        )}

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Typography>Loading notifications...</Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map(n => (
              <ListItem
                key={n.id}
                sx={{
                  backgroundColor: n.read ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer'
                }}
                onClick={() => markAsRead(n.id)}
              >
                <ListItemIcon>{getNotificationIcon(n.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={n.read ? 'normal' : 'bold'}
                      >
                        {n.title}
                      </Typography>
                      <Chip
                        label={n.type.replace(/_/g, ' ').toUpperCase()}
                        size="small"
                        color={getNotificationColor(n.type) as any}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatSADateTime(n.date)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {notifications.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant="h6" color="textSecondary">
              No notifications yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You will see loan updates and reminders here
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Email Notifications:</strong> Configure in System Settings.
          </Typography>
        </Alert>
      </Box>
    </Drawer>
  )
}

export const NotificationBell: React.FC = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications/unread-count')
      const count = res.data?.count ?? res.data?.Count ?? 0
      setUnreadCount(Number(count) || 0)
    } catch (error) {
      console.error('Failed to fetch unread count', error)
    }
  }

  return (
    <>
      <IconButton color="inherit" onClick={() => setNotificationsOpen(true)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <NotificationsCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  )
}
