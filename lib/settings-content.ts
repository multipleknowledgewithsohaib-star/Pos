import {
  Bell,
  Boxes,
  CalendarClock,
  CreditCard,
  CloudUpload,
  DatabaseBackup,
  FileText,
  History,
  Package,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from 'lucide-react';

export const systemSettingsFields = {
  systemName: 'MC Medical Store',
  systemEmail: 'admin@mcmedical.demo',
  systemPhone: '0300-0000000',
  currency: 'PKR (Pakistani Rupee)',
  dateFormat: 'DD MMM YYYY',
  timeFormat: '12 Hour (hh:mm AM/PM)',
  fiscalYearStart: 'July',
  taxLabel: 'GST',
  creditLimit: '50000',
  itemsPerPage: '50',
  ownerName: 'Admin User',
  ntn: '1234567-8',
  address: 'Main Boulevard, Lahore',
  phone: '042-0000000',
  email: 'store@mcmedical.demo',
};

export const inventorySettingsToggles = [
  { label: 'Negative Stock', checked: false },
  { label: 'Batch Tracking', checked: true },
  { label: 'Expiry Tracking', checked: true },
  { label: 'Low Stock Alert', checked: true },
  { label: 'Stock Adjustment Approval', checked: true },
  { label: 'Auto Reorder', checked: false },
] as const;

export const inventorySettingsFields = {
  lowStockLevel: '25',
  expiryAlertDays: '60',
  defaultMarkup: '18',
  defaultTax: '2',
};

export const notificationToggles = [
  { label: 'Email Notifications', checked: true },
  { label: 'SMS Notifications', checked: true },
  { label: 'Low Stock Alerts', checked: true },
  { label: 'Expiry Alerts', checked: true },
  { label: 'Purchase Reminders', checked: false },
] as const;

export const notificationServerSettings = {
  smtpServer: 'smtp.mcmedical.demo',
  smtpPort: '587',
  email: 'notifications@mcmedical.demo',
  password: '********',
};

export const paymentMethods = [
  { label: 'Cash', checked: true },
  { label: 'Bank Transfer', checked: true },
  { label: 'Card', checked: true },
  { label: 'JazzCash', checked: true },
  { label: 'EasyPaisa', checked: true },
] as const;

export const paymentSettings = {
  defaultMethod: 'Cash',
  rounding: 'Nearest 1 PKR',
  salesDiscount: '5',
  maximumDiscount: '20',
  footerMessage: 'Thank you for your purchase.',
};

export const securityToggles = [
  { label: 'Two Factor Authentication', checked: false },
  { label: 'Strong Password Policy', checked: true },
] as const;

export const securitySettings = {
  sessionTimeout: '30',
  loginAttempts: '5',
  passwordExpiry: '90',
};

export type RoleManagementRow = {
  id: number;
  initials: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  actionTone: 'danger';
};

export const roleManagementRows: RoleManagementRow[] = [];

export const roleManagementCards = [
  { title: 'Admin', description: 'Full access to all modules and settings.', icon: ShieldCheck },
  { title: 'Manager', description: 'Manage inventory, users and reports.', icon: Users },
  { title: 'Pharmacist', description: 'Manage medicines and prescriptions.', icon: PackageCheck },
  { title: 'Cashier', description: 'Access to POS and sales only.', icon: ReceiptText },
  { title: 'Store Keeper', description: 'Manage stock and purchases.', icon: Boxes },
] as const;

export const settingsQuickActions = [
  { href: '/modules/settings', label: 'System Settings', description: 'General system information and branding.', icon: Settings, tone: 'purple' },
  { href: '/modules/settings/inventory', label: 'Inventory Settings', description: 'Stock rules, alerts, and costing.', icon: Package, tone: 'green' },
  { href: '/modules/settings/notifications', label: 'Notification Settings', description: 'Email, SMS, and SMTP preferences.', icon: Bell, tone: 'blue' },
  { href: '/modules/settings/payment', label: 'Payment Settings', description: 'Payment methods and rounding rules.', icon: CreditCard, tone: 'orange' },
  { href: '/modules/settings/security', label: 'Security Settings', description: 'Login, password and session policies.', icon: ShieldCheck, tone: 'red' },
  { href: '/modules/settings/roles', label: 'Role Management', description: 'Users and permissions overview.', icon: UsersRound, tone: 'purple' },
] as const;

export const backupDashboardStats = [
  { label: 'Total Backups', value: '0', link: { href: '/modules/backup-restore/list', label: 'View All' }, tone: 'purple' },
  { label: 'Last Backup', value: 'N/A', helper: 'No backups yet', tone: 'blue' },
  { label: 'Backup Size', value: '0 MB', link: { href: '/modules/backup-restore/list', label: 'View List' }, tone: 'green' },
  { label: 'Status', value: 'No Backups', helper: 'Waiting for first backup', tone: 'green' },
] as const;

export const backupActionCards = [
  {
    href: '/modules/backup-restore/create',
    title: 'Create New Backup',
    description: 'Create a complete backup of your system data.',
    buttonLabel: 'Create Backup',
    icon: CloudUpload,
    tone: 'purple',
    buttonVariant: 'primary',
  },
  {
    href: '/modules/backup-restore/restore',
    title: 'Restore Backup',
    description: 'Restore your system data from existing backup.',
    buttonLabel: 'Restore Backup',
    icon: RotateCcw,
    tone: 'green',
    buttonVariant: 'success',
  },
] as const;

export const backupScheduleCard = {
  href: '/modules/backup-restore/schedule',
  title: 'Backup Schedule',
  description: 'Automatic backup is available.',
  detail: 'No scheduled backup configured yet.',
  buttonLabel: 'Manage Schedule',
  icon: CalendarClock,
  tone: 'purple',
  buttonVariant: 'outline',
} as const;

export const backupQuickActions = [
  { href: '/modules/backup-restore/create', title: 'Create Backup', icon: CloudUpload, tone: 'purple' },
  { href: '/modules/backup-restore/restore', title: 'Restore Backup', icon: RotateCcw, tone: 'green' },
  { href: '/modules/backup-restore/list', title: 'Backup List', icon: FileText, tone: 'blue' },
  { href: '/modules/backup-restore/schedule', title: 'Backup Schedule', icon: CalendarClock, tone: 'orange' },
  { href: '/modules/backup-restore/activity', title: 'Activity Log', icon: History, tone: 'red' },
  { href: '/modules/backup-restore/settings', title: 'Backup Settings', icon: DatabaseBackup, tone: 'purple' },
] as const;

export type BackupActivityRow = {
  id: number;
  action: string;
  name: string;
  datetime: string;
  status: 'Success' | 'Failed';
  performedBy: string;
};

export const backupActivityRows: BackupActivityRow[] = [];

export type BackupListRow = {
  id: number;
  name: string;
  datetime: string;
  size: string;
  type: string;
  status: 'Success' | 'Failed';
};

export const backupListRows: BackupListRow[] = [];

export const backupDetailInfo = {
  name: 'No backup selected',
  datetime: 'N/A',
  size: '0 MB',
  type: 'N/A',
  compression: 'N/A',
  encryption: 'N/A',
  status: 'No Backup',
  createdBy: 'N/A',
  description: 'Backup records have been reset.',
  dataSummary: [
    { label: 'Products', value: '0' },
    { label: 'Stock Entries', value: '0' },
    { label: 'Customers', value: '0' },
    { label: 'Suppliers', value: '0' },
    { label: 'Purchase Records', value: '0' },
    { label: 'Sales Records', value: '0' },
    { label: 'Users', value: '0' },
    { label: 'Settings', value: '0' },
  ],
} as const;

export type BackupRestoreChoice = {
  label: string;
  value: string;
};

export const backupRestoreChoices: BackupRestoreChoice[] = [
  { label: 'No backups available', value: 'no-backups-available' },
];

export const backupScheduleSettings = {
  frequency: '',
  time: '',
  retention: '',
  enabled: false,
} as const;
