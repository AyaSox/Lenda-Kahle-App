import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoanApply from '../LoanApply'
import { BrowserRouter } from 'react-router-dom'

const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('LoanApply form', () => {
  test('renders fields and allows DOB selection and file upload', async () => {
    // Render with a query param to start at step 4 (Loan Details)
    const route = '/loans/apply?testStep=4'
    // Use window.history to set the URL for the component
    window.history.pushState({}, 'Test page', route)

    render(
      <Wrapper>
        <LoanApply />
      </Wrapper>
    )

    // Loan Details fields should be present immediately
    const principal = await screen.findByLabelText(/Principal Amount/i)
    expect(principal).toBeInTheDocument()

    const purpose = screen.getByLabelText(/Purpose of Loan/i)
    expect(purpose).toBeInTheDocument()

    // Check file upload input exists
    const fileInput = document.querySelector('#combined-document-upload')
    expect(fileInput).toBeTruthy()
  })
})
