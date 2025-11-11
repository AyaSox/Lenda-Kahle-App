// Loan Status Utilities for LendaKahleApp (South African Micro-Lending)

export enum LoanStatus {
  Pending = 0,
  PreApproved = 1,
  Approved = 2,
  Active = 3,
  Rejected = 4,
  Completed = 5
}

export const getLoanStatusName = (status: number): string => {
  const statusNames: { [key: number]: string } = {
    0: 'Pending',
    1: 'Pre-Approved',
    2: 'Approved',
    3: 'Active',
    4: 'Rejected',
    5: 'Completed'
  }
  return statusNames[status] || 'Unknown'
}

export const getLoanStatusColor = (status: number): string => {
  const colors: { [key: number]: string } = {
    0: '#f59e0b', // Pending - Orange
    1: '#06b6d4', // Pre-Approved - Cyan
    2: '#10b981', // Approved - Green
    3: '#3b82f6', // Active - Blue
    4: '#ef4444', // Rejected - Red
    5: '#6b7280', // Completed - Gray
  }
  return colors[status] || '#6b7280'
}

// Safe numeric coercion
const coerceNumber = (v: any): number => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

// Currency formatter for South African Rand
export const formatCurrency = (amount?: number | null): string => {
  const n = coerceNumber(amount)
  return n.toLocaleString('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Format currency without symbol (safe)
export const formatAmount = (amount?: number | null): string => {
  const n = coerceNumber(amount)
  return n.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}