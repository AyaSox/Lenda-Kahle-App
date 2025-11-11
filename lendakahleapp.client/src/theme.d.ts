import { ThemeOptions } from '@mui/material/styles'

// Augment the MUI Theme interface to include custom iconColors globally
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
