import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import {
  UploadIcon,
  CheckCircleIcon,
  WarningIcon,
  DescriptionIcon,
  InfoIcon
} from '../components/AppIcons'

interface LoanDocument {
  id: number
  fileName: string
  documentType: string
  status: string
  isVerified: boolean
  uploadedDate: string
  fileSize: number
}

const UploadDocuments: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<LoanDocument[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType] = useState<number>(99) // CombinedDocuments default
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  })

  useEffect(() => { fetchDocuments() }, [loanId])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/api/documents/loan/${loanId}`)
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setSnackbar({ open: true, message: 'File size cannot exceed 10MB', severity: 'error' })
        return
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({ open: true, message: 'Only PDF, JPG, JPEG, and PNG files are allowed', severity: 'error' })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbar({ open: true, message: 'Please select a file to upload', severity: 'warning' })
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType.toString())
      await axios.post(`/api/documents/upload/${loanId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSnackbar({ open: true, message: 'Document uploaded successfully!', severity: 'success' })
      setSelectedFile(null)
      fetchDocuments()
    } catch (error: any) {
      setSnackbar({ open: true, message: `Upload failed: ${error.response?.data?.error || error.message}`, severity: 'error' })
    } finally { setUploading(false) }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getDocumentTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      SouthAfricanID: 'South African ID',
      Payslips: 'Payslips (3 months)',
      BankStatements: 'Bank Statements (3 months)',
      ProofOfResidence: 'Proof of Residence',
      CombinedDocuments: 'Combined Documents (All in one PDF)'
    }
    return labels[type] || type
  }

  const getStatusColor = (status: string, isVerified: boolean) => {
    if (isVerified) return 'success'
    if (status === 'Rejected') return 'error'
    if (status === 'Pending') return 'warning'
    return 'default'
  }

  const hasAllDocuments = documents.length > 0 && documents.some(d => d.isVerified)

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <UploadIcon sx={{ mr: 2, fontSize: 40 }} />
          Upload Loan Documents
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Loan #{loanId} - Please upload your supporting documents for NCA compliance
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Document Requirements (NCA Compliance)</Typography>
          <Typography variant="body2" paragraph>Upload the following documents:</Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">• South African ID Copy</Typography>
              <Typography variant="body2">• Latest 3 months payslips</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">• Latest 3 months bank statements</Typography>
              <Typography variant="body2">• Proof of residence (? 3 months old)</Typography>
            </Grid>
          </Grid>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>TIP: Scan all documents into ONE PDF file.</Typography>
        </Alert>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Upload Documents</Typography>
            <Box sx={{ mb: 2 }}>
              <input accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} id="file-upload" type="file" onChange={handleFileSelect} />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />} fullWidth sx={{ mb: 1 }}>
                  Select File (PDF, JPG, PNG - Max 10MB)
                </Button>
              </label>
              {/* Verification notice added */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                After upload, documents are reviewed and verified by a loan officer. You will be notified once verification is complete.
              </Typography>
              {selectedFile && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2"><strong>Selected:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})</Typography>
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                startIcon={<UploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </Box>
            {uploading && <LinearProgress sx={{ mt: 2 }} />}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
            {documents.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">No documents uploaded yet. Please upload to proceed with loan approval.</Typography>
              </Alert>
            ) : (
              <List>
                {documents.map((doc, index) => (
                  <React.Fragment key={doc.id}>
                    <ListItem>
                      <ListItemIcon>
                        {doc.isVerified ? <CheckCircleIcon color="success" /> : doc.status === 'Rejected' ? <WarningIcon color="error" /> : <DescriptionIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.fileName}
                        secondary={<>
                          <Typography component="span" variant="body2" color="text.primary">{getDocumentTypeLabel(doc.documentType)}</Typography>
                          {' • '}{formatFileSize(doc.fileSize)}{' • '}Uploaded: {new Date(doc.uploadedDate).toLocaleDateString()}
                        </>}
                      />
                      <Chip label={doc.isVerified ? 'Verified' : doc.status} color={getStatusColor(doc.status, doc.isVerified) as any} size="small" />
                    </ListItem>
                    {index < documents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 3 }}>
          {hasAllDocuments ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body1">Documents uploaded successfully. Awaiting verification.</Typography>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1">Action Required: Upload your documents to proceed.</Typography>
            </Alert>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate('/loans')}>Back to My Loans</Button>
          {hasAllDocuments && <Button variant="contained" color="success" onClick={() => navigate('/loans')}>Continue</Button>}
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default UploadDocuments
