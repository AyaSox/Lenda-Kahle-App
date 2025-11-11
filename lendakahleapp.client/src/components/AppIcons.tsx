import React from 'react'
import * as MuiIcons from '@mui/icons-material'
import { SvgIconProps, useTheme } from '@mui/material'

// Centralized icon mapping to ensure consistent sizes and colors across the app
// Export semantic icon components (wrap MUI icons and apply consistent props)

export const useDefaultIconProps = (): Partial<SvgIconProps> => {
  const theme = useTheme()
  return {
    fontSize: 'medium',
    sx: {
      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'inherit'
    }
  }
}

const wrap = (name: string) => {
  // Return a React component that renders the requested MUI icon with default props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    // @ts-ignore dynamic access
    const Icon = MuiIcons[name]
    if (!Icon) return null
    return React.createElement(Icon, { ...useDefaultIconProps(), ...props })
  }
}

export const InfoIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Info {...useDefaultIconProps()} {...props} />
export const TrendingUpIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.TrendingUp {...useDefaultIconProps()} {...props} />
export const BankIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.AccountBalance {...useDefaultIconProps()} {...props} />
export const AccountBalanceIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.AccountBalance {...useDefaultIconProps()} {...props} />
export const CalculateIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Calculate {...useDefaultIconProps()} {...props} />
export const CheckCircleIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.CheckCircle {...useDefaultIconProps()} {...props} />
export const WarningIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Warning {...useDefaultIconProps()} {...props} />
export const ArrowForwardIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.ArrowForward {...useDefaultIconProps()} {...props} />
export const UploadIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.CloudUpload {...useDefaultIconProps()} {...props} />
export const FileUploadIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.FileUpload {...useDefaultIconProps()} {...props} />
export const DescriptionIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Description {...useDefaultIconProps()} {...props} />
export const PersonIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Person {...useDefaultIconProps()} {...props} />
export const HomeIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Home {...useDefaultIconProps()} {...props} />
export const WorkIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Work {...useDefaultIconProps()} {...props} />
export const CreditCardIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.CreditCard {...useDefaultIconProps()} {...props} />
export const PeopleIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.People {...useDefaultIconProps()} {...props} />
export const ContactPhoneIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.ContactPhone {...useDefaultIconProps()} {...props} />
export const GavelIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Gavel {...useDefaultIconProps()} {...props} />
export const ExpandMoreIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.ExpandMore {...useDefaultIconProps()} {...props} />
export const ExpandLessIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.ExpandLess {...useDefaultIconProps()} {...props} />

// Notifications
export const NotificationsIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Notifications {...useDefaultIconProps()} {...props} />
export const EmailIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Email {...useDefaultIconProps()} {...props} />
export const PaymentIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Payment {...useDefaultIconProps()} {...props} />
export const ScheduleIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Schedule {...useDefaultIconProps()} {...props} />
export const CloseIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Close {...useDefaultIconProps()} {...props} />
export const MarkEmailReadIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.MarkEmailRead {...useDefaultIconProps()} {...props} />
export const HistoryIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.History {...useDefaultIconProps()} {...props} />
export const PersonAddIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.PersonAdd {...useDefaultIconProps()} {...props} />
export const SettingsIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Settings {...useDefaultIconProps()} {...props} />
export const CancelIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Cancel {...useDefaultIconProps()} {...props} />
export const AssessmentIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Assessment {...useDefaultIconProps()} {...props} />
export const ErrorIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Error {...useDefaultIconProps()} {...props} />

// Wrapped dynamic icons exposed as named exports for migration
export const CancelOutlinedIcon = wrap('CancelOutlined')
export const PendingActionsIcon = wrap('PendingActions')
export const CalendarTodayIcon = wrap('CalendarToday')
export const CheckCircleOutlineIcon = wrap('CheckCircleOutline')
export const ThumbUpIcon = wrap('ThumbUp')
export const ThumbDownIcon = wrap('ThumbDown')
export const AttachFileIcon = wrap('AttachFile')
export const VisibilityIcon = wrap('Visibility')
export const CloudDownloadIcon = wrap('CloudDownload')
export const ReceiptIcon = wrap('Receipt')
export const ContactMailIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.ContactMail {...useDefaultIconProps()} {...props} />
export const PhoneIcon: React.FC<SvgIconProps> = (props) => <MuiIcons.Phone {...useDefaultIconProps()} {...props} />

// Alias exports for common icon names used across the app (without 'Icon' suffix)
export const Edit = wrap('Edit') as React.FC<SvgIconProps>
export const Delete = wrap('Delete') as React.FC<SvgIconProps>
export const HourglassEmpty = wrap('HourglassEmpty') as React.FC<SvgIconProps>
export const PersonAdd = PersonAddIcon
export const Settings = SettingsIcon
export const AccountBalance = AccountBalanceIcon
export const CheckCircle = CheckCircleIcon
export const Warning = WarningIcon
export const Payment = PaymentIcon
export const AttachFile = AttachFileIcon
export const CalendarToday = CalendarTodayIcon

// Provide aggregated AppIcons object for backward compatibility with older code that expects AppIcons.<Name>
export const AppIcons: { [key: string]: React.FC<SvgIconProps> } = {
  // Common mappings (use wrappers or direct exports)
  Info: InfoIcon,
  InfoIcon: InfoIcon,
  TrendingUp: TrendingUpIcon,
  TrendingUpIcon: TrendingUpIcon,
  AccountBalance: BankIcon,
  AccountBalanceIcon: BankIcon,
  BankIcon: BankIcon,
  Calculate: CalculateIcon,
  CheckCircle: CheckCircleIcon,
  CheckCircleIcon: CheckCircleIcon,
  Warning: WarningIcon,
  WarningIcon: WarningIcon,
  ArrowForward: ArrowForwardIcon,
  UploadFile: UploadIcon,
  CloudUpload: UploadIcon,
  UploadIcon: UploadIcon,
  FileUpload: FileUploadIcon,
  Description: DescriptionIcon,
  DescriptionIcon: DescriptionIcon,
  Person: PersonIcon,
  PersonIcon: PersonIcon,
  Home: HomeIcon,
  HomeIcon: HomeIcon,
  Work: WorkIcon,
  WorkIcon: WorkIcon,
  CreditCard: CreditCardIcon,
  CreditCardIcon: CreditCardIcon,
  People: PeopleIcon,
  PeopleIcon: PeopleIcon,
  ContactPhone: ContactPhoneIcon,
  ContactPhoneIcon: ContactPhoneIcon,
  Gavel: GavelIcon,
  GavelIcon: GavelIcon,
  ExpandMore: ExpandMoreIcon,
  ExpandLess: ExpandLessIcon,
  Notifications: NotificationsIcon,
  Email: EmailIcon,
  Payment: PaymentIcon,
  Schedule: ScheduleIcon,
  Close: CloseIcon,
  MarkEmailRead: MarkEmailReadIcon,
  History: HistoryIcon,
  PersonAdd: PersonAddIcon,
  Settings: SettingsIcon,
  Cancel: CancelIcon,
  Assessment: AssessmentIcon,
  // Additional icons mapped dynamically if needed
  CancelOutlined: wrap('CancelOutlined'),
  PendingActions: wrap('PendingActions'),
  CalendarToday: wrap('CalendarToday'),
  CheckCircleOutlined: wrap('CheckCircleOutline'),
  CheckCircleOutlinedAlt: wrap('CheckCircleOutline'),
  ThumbUp: wrap('ThumbUp'),
  ThumbDown: wrap('ThumbDown'),
  AttachFile: wrap('AttachFile'),
  Visibility: wrap('Visibility'),
  CloudDownload: wrap('CloudDownload'),
  Receipt: wrap('Receipt'),
  Error: ErrorIcon,
  ErrorIcon: ErrorIcon,
  ContactMail: ContactMailIcon,
  ContactMailIcon: ContactMailIcon,
  Phone: PhoneIcon,
  PhoneIcon: PhoneIcon,
  Edit: Edit,
  Delete: Delete,
  HourglassEmpty: HourglassEmpty
}
