// South African validation utilities for NCA compliance

/**
 * Validates South African ID Number (13 digits)
 * Format: YYMMDDGSSSCAZ
 * Where: YY=Year, MM=Month, DD=Day, G=Gender, SSS=Sequence, C=Citizenship, A=Race, Z=Checksum
 */
export const validateSAIDNumber = (idNumber: string): { isValid: boolean; error?: string; dateOfBirth?: Date } => {
  // Remove any spaces or non-numeric characters
  const cleanId = idNumber.replace(/\D/g, '')
  
  if (cleanId.length !== 13) {
    return { isValid: false, error: 'ID number must be exactly 13 digits' }
  }

  // Extract date components
  const year = parseInt(cleanId.substring(0, 2))
  const month = parseInt(cleanId.substring(2, 4))
  const day = parseInt(cleanId.substring(4, 6))
  
  // Determine century (00-21 = 2000s, 22-99 = 1900s)
  const fullYear = year <= 21 ? 2000 + year : 1900 + year
  
  // Validate date
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month in ID number' }
  }
  
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Invalid day in ID number' }
  }
  
  // Create date and validate it exists
  const dateOfBirth = new Date(fullYear, month - 1, day)
  if (dateOfBirth.getMonth() !== month - 1 || dateOfBirth.getDate() !== day) {
    return { isValid: false, error: 'Invalid date in ID number' }
  }
  
  // Check age (must be 18+)
  const today = new Date()
  const age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate()) ? age - 1 : age
  
  if (actualAge < 18) {
    return { isValid: false, error: 'Applicant must be at least 18 years old' }
  }
  
  // Validate checksum (Luhn algorithm)
  const digits = cleanId.split('').map(Number)
  let sum = 0
  
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i]
    } else {
      const doubled = digits[i] * 2
      sum += doubled > 9 ? doubled - 9 : doubled
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  
  if (checkDigit !== digits[12]) {
    return { isValid: false, error: 'Invalid ID number checksum' }
  }
  
  return { isValid: true, dateOfBirth }
}

/**
 * Validates South African phone number
 */
export const validateSAPhoneNumber = (phone: string): { isValid: boolean; error?: string; formatted?: string } => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Check various SA phone number formats
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Local format: 0123456789
    return { 
      isValid: true, 
      formatted: `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}` 
    }
  } else if (cleaned.length === 11 && cleaned.startsWith('27')) {
    // International format: 27123456789
    return { 
      isValid: true, 
      formatted: `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}` 
    }
  } else if (cleaned.length === 9) {
    // Without leading 0: 123456789
    return { 
      isValid: true, 
      formatted: `0${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}` 
    }
  }
  
  return { isValid: false, error: 'Invalid South African phone number format' }
}

/**
 * South African provinces
 */
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape'
]

/**
 * South African banks
 */
export const SA_BANKS = [
  'ABSA Bank',
  'African Bank',
  'Bidvest Bank',
  'Capitec Bank',
  'Discovery Bank',
  'First National Bank (FNB)',
  'Investec Bank',
  'Nedbank',
  'Standard Bank',
  'TymeBank',
  'Other'
]

/**
 * Account types
 */
export const ACCOUNT_TYPES = [
  'Savings Account',
  'Cheque Account',
  'Current Account',
  'Transmission Account'
]

/**
 * Employment statuses
 */
export const EMPLOYMENT_STATUSES = [
  'Permanently Employed',
  'Contract Employee',
  'Self-Employed',
  'Pensioner',
  'Student',
  'Unemployed'
]

/**
 * Marital statuses
 */
export const MARITAL_STATUSES = [
  'Single',
  'Married in Community of Property',
  'Married out of Community of Property',
  'Divorced',
  'Widowed',
  'Life Partner'
]

/**
 * Residential statuses
 */
export const RESIDENTIAL_STATUSES = [
  'Own Property',
  'Paying Mortgage',
  'Renting',
  'Living with Family',
  'Company Accommodation',
  'Other'
]

/**
 * Relationship types for next of kin
 */
export const RELATIONSHIP_TYPES = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Extended Family',
  'Friend',
  'Other'
]

/**
 * Format ID number for display
 */
export const formatIDNumber = (idNumber: string): string => {
  const cleaned = idNumber.replace(/\D/g, '')
  if (cleaned.length === 13) {
    return `${cleaned.substring(0, 6)} ${cleaned.substring(6, 10)} ${cleaned.substring(10)}`
  }
  return idNumber
}

/**
 * Extract gender from SA ID number
 */
export const getGenderFromID = (idNumber: string): 'Male' | 'Female' | 'Unknown' => {
  const cleaned = idNumber.replace(/\D/g, '')
  if (cleaned.length === 13) {
    const genderDigit = parseInt(cleaned.substring(6, 7))
    return genderDigit < 5 ? 'Female' : 'Male'
  }
  return 'Unknown'
}

/**
 * Validate postal code (4 digits)
 */
export const validatePostalCode = (postalCode: string): boolean => {
  const cleaned = postalCode.replace(/\D/g, '')
  return cleaned.length === 4
}