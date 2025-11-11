import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem, IconButton, Tooltip, ListItemText, Divider } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NotificationBell } from './NotificationsCenter'

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleCloseMenu()
    // Perform logout (clears token/state)
    logout()
    // Persist a flag so login page can show the thank-you message after navigation
    try { localStorage.setItem('sessionEndedMessage', 'true') } catch { }
    navigate('/login')
  }

  const getInitials = (name?: string) => {
    if (!name) return ''
    const parts = name.split(' ').filter(Boolean)
    return parts.length === 1 ? parts[0].charAt(0).toUpperCase() : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(90deg, #01263f 0%, #003a5a 50%, #001f3f 100%)',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 6px 18px rgba(2,6,23,0.15)',
        backgroundSize: '200% 200%',
        animation: 'gradientSlide 12s ease infinite',
        '@keyframes gradientSlide': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }}
    >
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>
          Lenda Kahle
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            component={Link}
            to="/calculator"
            sx={{
              color: 'rgba(255,255,255,0.95)',
              borderRadius: 2,
              textTransform: 'none',
              transition: 'transform 200ms, box-shadow 200ms',
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 18px rgba(2,6,23,0.12)'
              }
            }}
          >
            Calculator
          </Button>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/loans" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                My Loans
              </Button>
              <Button color="inherit" component={Link} to="/repayments" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                Repayments
              </Button>
              <Button color="inherit" component={Link} to="/transactions" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                History
              </Button>
              {(user?.roles?.includes('Admin') || user?.roles?.includes('LoanOfficer')) && (
                <>
                  <Button color="inherit" component={Link} to="/admin" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                    Admin
                  </Button>
                  <Button color="inherit" component={Link} to="/admin/pending-loans" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                    Pending
                  </Button>
                  <Button color="inherit" component={Link} to="/admin/enhanced" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                    Panel
                  </Button>
                  <Button color="inherit" component={Link} to="/admin/defaulted-loans" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                    Defaults
                  </Button>
                  {user?.roles?.includes('Admin') && (
                    <Button color="inherit" component={Link} to="/admin/audit-logs" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                      Audit
                    </Button>
                  )}
                </>
              )}

              <NotificationBell />

              {/* Avatar + menu for profile and logout */}
              <Tooltip title={user ? `${user.firstName} ${user.lastName}` : 'Profile'}>
                <IconButton onClick={handleAvatarClick} sx={{ ml: 1 }} size="small">
                  <Avatar sx={{ width: 36, height: 36 }}>{getInitials(user ? `${user.firstName} ${user.lastName}` : '')}</Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                sx={{ mt: 1.5 }}
                MenuListProps={{ sx: { background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', backdropFilter: 'blur(6px)' } }}
              >
                <MenuItem component={Link} to="/profile">
                  <ListItemText primary={user ? `${user.firstName} ${user.lastName}` : 'Profile'} secondary={user?.email} />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register" sx={{ color: 'rgba(255,255,255,0.95)', textTransform: 'none', borderRadius: 2, transition: 'transform 200ms, box-shadow 200ms', '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(2,6,23,0.12)' } }}>
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar