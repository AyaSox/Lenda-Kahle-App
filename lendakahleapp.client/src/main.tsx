import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'
import './index.css'

// Augment the MUI Theme interface to include custom iconColors
declare module '@mui/material/styles' {
  interface Theme {
    iconColors: {
      success: string
      error: string
      warning: string
      info: string
      default: string
    }
  }
  interface ThemeOptions {
    iconColors?: {
      success: string
      error: string
      warning: string
      info: string
      default: string
    }
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      // Keep navy blue for app-wide consistency
      main: '#001f3f',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      // light silver / gray background that pairs well with navy
      default: '#eef2f6',
      paper: '#f8fafc' // very light silver for paper/cards
    },
    text: {
      primary: '#0f1724',
      secondary: '#475569'
    }
  },
  components: {
    MuiIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '18px',
          backgroundColor: '#f8fafc',
          boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
          border: '1px solid rgba(2,6,23,0.04)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none'
        }
      }
    }
  },
  iconColors: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    default: '#6b7280',
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)