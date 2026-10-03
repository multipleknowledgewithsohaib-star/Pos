import { buildDemoCustomers } from './demo-seed.mjs';
import {
  BadgePercent,
  Banknote,
  Building2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  Monitor,
  Package,
  PauseCircle,
  RotateCcw,
  Settings,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { POS_PAYMENT_METHODS } from './pos-payment-gateway';

export type PosTone = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'sky';

export type PosReturnReason =
  | 'Defective / Damaged'
  | 'Expired Medicine'
  | 'Expired Item'
  | 'Wrong Item / Customer Mind Change'
  | 'Doctor Prescription Changed'
  | 'Adverse / Allergic Reaction'
  | 'Excess Quantity'
  | 'Other';


export type PosReturnItem = {
  medicineId: number | null;
  name: string;
  barcode: string;
  category: string;
  unit: string;
  price: number;
  soldQty: number;
  alreadyReturnedQty: number;
  returnQty: number;
  lineDiscount: number;
  refundTotal: number;
  reason: PosReturnReason;
  restock: boolean;
};

export type PosExchangeItem = {
  id: string;
  medicineId: number | null;
  name: string;
  barcode: string;
  category: string;
  unit: string;
  price: number;
  qty: number;
  lineDiscount: number;
  stock: number;
};

export type PosReturnExchangeRecord = {
  id: string;
  returnNumber: string;
  type: 'Return' | 'Exchange';
  originalInvoice: string;
  originalSaleDate: string;
  customer: PosCustomer;
  returnedItems: PosReturnItem[];
  exchangeItems: PosExchangeItem[];
  totalReturnAmount: number;
  totalExchangeAmount: number;
  netAmount: number;
  settlementType: 'Refund' | 'Customer Paid' | 'Even Exchange';
  paymentMethod: string;
  notes: string;
  createdAt: string;
  status: 'Completed';
};

export type PosMetric = {
  label: string;
  value: string;
  tone: 'green' | 'blue' | 'purple' | 'orange';
  icon: LucideIcon;
};

export type PosTrendPoint = {
  label: string;
  value: number;
  salesCount?: number;
};

export type PosSegment = {
  label: string;
  value: number;
  tone: PosTone;
};

export type PosTransaction = {
  invoice: string;
  customer: string;
  amount: string;
  method: string;
  time: string;
  status: 'Completed' | 'Pending';
};

export type PosCartItem = {
  id: number;
  medicine: string;
  qty: number;
  price: string;
  discount: string;
  total: string;
};

export type PosHoldItem = {
  id: number;
  invoice: string;
  customer: string;
  items: number;
  amount: string;
  time: string;
};

export type PosCustomer = {
  name: string;
  phone: string;
  address: string;
  email?: string;
  customerId?: number;
  note?: string;
};

export type PosQuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: PosTone;
};

export type PosSettingsNavItem = {
  title: string;
  description: string;
  active?: boolean;
  icon: LucideIcon;
};

export type PosPaymentMethodCard = {
  title: string;
  tone: PosTone;
  active?: boolean;
  icon: LucideIcon;
};

export const posDashboardMetrics: PosMetric[] = [
  { label: 'Total Sales (PKR)', value: '0.00', tone: 'green', icon: CircleDollarSign },
  { label: 'Total Orders', value: '0', tone: 'blue', icon: ShoppingCart },
  { label: 'Avg. Order Value (PKR)', value: '0.00', tone: 'purple', icon: TrendingUp },
  { label: 'Total Items Sold', value: '0', tone: 'orange', icon: Package },
];

export const posSalesTrend: PosTrendPoint[] = [
  { label: '12 AM', value: 0 },
  { label: '02 AM', value: 0 },
  { label: '04 AM', value: 0 },
  { label: '08 AM', value: 0 },
  { label: '12 PM', value: 0 },
  { label: '04 PM', value: 0 },
  { label: '08 PM', value: 0 },
  { label: '10 PM', value: 0 },
  { label: '11 PM', value: 0 },
];

export const posPaymentSegments: PosSegment[] = [];

export const posRecentTransactions: PosTransaction[] = [];

export const posInvoiceItems: PosCartItem[] = [];

export const posHoldItems: PosHoldItem[] = [];

const basePosCustomers: PosCustomer[] = [
  {
    name: 'Walk-in Customer',
    phone: 'N/A',
    address: 'N/A',
    note: 'Walk-in',
  },
  {
    name: '185 Real medical & general store',
    phone: 'N/A',
    address: 'nazimabad',
    note: 'Nazimabad',
  },
  {
    name: '186 Agha mart & pharmacy',
    phone: 'N/A',
    address: 'Nazimabad',
    note: 'Nazimabad',
  },
  {
    name: '185 Kashif medical store',
    phone: 'N/A',
    address: 'aisha manzil',
    note: 'Aisha Manzil',
  },
  {
    name: '181 KAUSER MEDICAL STORE',
    phone: 'N/A',
    address: 'HUSSAINABAD',
    note: 'Hussainabad',
  },
  {
    name: '182 Al Momin Hosp Phar',
    phone: 'N/A',
    address: 'HUSSAINABAD',
    note: 'Hussainabad',
  },
  {
    name: '181 DICOUNT MEDICAL AND GENERAL STORE',
    phone: 'N/A',
    address: 'HUSSAINABAD',
    note: 'Hussainabad',
  },
  {
    name: '104 RAFA E-AM HOSPITAL PHAR',
    phone: 'N/A',
    address: 'ST-10, BLOCK 13 GULBERG TOWN, KARACHI, 78500',
    note: 'Gulberg Town, Karachi',
  },
  {
    name: '101 PAYJEES MEDICAL',
    phone: 'N/A',
    address: 'BLOCK 12 GULBERG TOWN',
    note: 'Gulberg Town',
  },
  {
    name: 'Ayesha Siddiqui',
    phone: '0304-5550101',
    address: 'DHA Phase 2, Karachi',
    note: 'Monthly medicines',
  },
  {
    name: 'Usman Tariq',
    phone: '0305-5550102',
    address: 'Model Town, Lahore',
    note: 'Regular customer',
  },
  {
    name: 'Hina Farooq',
    phone: '0306-5550103',
    address: 'Satellite Town, Rawalpindi',
    note: 'Family account',
  },
  {
    name: 'Kamran Javed',
    phone: '0307-5550104',
    address: 'F-10 Markaz, Islamabad',
    note: 'Blood pressure care',
  },
  {
    name: 'Mariam Raza',
    phone: '0308-5550105',
    address: 'Cantt, Peshawar',
    note: 'Regular customer',
  },
  {
    name: 'Hassan Mehmood',
    phone: '0309-5550106',
    address: 'Gulberg III, Lahore',
    note: 'Diabetic care',
  },
  {
    name: 'Nadia Iqbal',
    phone: '0310-5550107',
    address: 'Latifabad, Hyderabad',
    note: 'Monthly medicines',
  },
  {
    name: 'Zeeshan Malik',
    phone: '0311-5550108',
    address: 'Saddar, Karachi',
    note: 'Regular customer',
  },
  {
    name: 'Sana Qureshi',
    phone: '0312-5550109',
    address: 'Madina Town, Faisalabad',
    note: 'Family account',
  },
  {
    name: 'Bilal Sheikh',
    phone: '0313-5550110',
    address: 'Clifton Block 5, Karachi',
    note: 'Regular customer',
  },
  {
    name: 'Rabia Noor',
    phone: '0314-5550111',
    address: 'Wapda Town, Lahore',
    note: 'Monthly medicines',
  },
  {
    name: 'Danish Ahmed',
    phone: '0315-5550112',
    address: 'University Road, Peshawar',
    note: 'Regular customer',
  },
  {
    name: 'Iqra Shah',
    phone: '0316-5550113',
    address: 'Jinnah Town, Quetta',
    note: 'Family account',
  },
  {
    name: 'Omer Farid',
    phone: '0317-5550114',
    address: 'Bahria Town, Rawalpindi',
    note: 'Card payment preferred',
  },
  {
    name: 'Mehwish Khan',
    phone: '0318-5550115',
    address: 'Nazimabad, Karachi',
    note: 'Regular customer',
  },
  {
    name: 'Saad Hussain',
    phone: '0319-5550116',
    address: 'People Colony, Gujranwala',
    note: 'Monthly medicines',
  },
  {
    name: 'Farah Naeem',
    phone: '0320-5550117',
    address: 'Cantt, Multan',
    note: 'Regular customer',
  },
  {
    name: 'Tahir Abbas',
    phone: '0321-5550118',
    address: 'Gulshan-e-Maymar, Karachi',
    note: 'Family account',
  },
  {
    name: 'Noor Fatima',
    phone: '0322-5550119',
    address: 'Samnabad, Lahore',
    note: 'Regular customer',
  },
  {
    name: 'Imran Yousaf',
    phone: '0323-5550120',
    address: 'Kohinoor City, Faisalabad',
    note: 'Diabetic care',
  },
  {
    name: 'Laiba Rauf',
    phone: '0324-5550121',
    address: 'North Karachi',
    note: 'Monthly medicines',
  },
  {
    name: 'Asim Butt',
    phone: '0325-5550122',
    address: 'Defence Road, Sialkot',
    note: 'Regular customer',
  },
  {
    name: 'Muneeba Tariq',
    phone: '0326-5550123',
    address: 'G-9, Islamabad',
    note: 'Family account',
  },
  {
    name: 'Rashid Ali',
    phone: '0327-5550124',
    address: 'Qasimabad, Hyderabad',
    note: 'Regular customer',
  },
  {
    name: 'Fariha Jamil',
    phone: '0328-5550125',
    address: 'Askari 10, Lahore',
    note: 'Monthly medicines',
  },
  {
    name: 'Waqas Munir',
    phone: '0329-5550126',
    address: 'Gulistan-e-Jauhar, Karachi',
    note: 'Regular customer',
  },
  {
    name: 'Areeba Ilyas',
    phone: '0330-5550127',
    address: 'Saddar, Rawalpindi',
    note: 'Blood pressure care',
  },
  {
    name: 'Salman Rafiq',
    phone: '0331-5550128',
    address: 'Mardan Road, Peshawar',
    note: 'Regular customer',
  },
  {
    name: 'Kiran Zahra',
    phone: '0332-5550129',
    address: 'Garden Town, Lahore',
    note: 'Family account',
  },
  {
    name: 'Noman Akhtar',
    phone: '0333-5550130',
    address: 'Sukkur Township, Sukkur',
    note: 'Regular customer',
  },
  {
    name: 'Sehrish Anwar',
    phone: '0334-5550131',
    address: 'Malir Cantt, Karachi',
    note: 'Monthly medicines',
  },
  {
    name: 'Arslan Waheed',
    phone: '0335-5550132',
    address: 'Chaklala Scheme 3, Rawalpindi',
    note: 'Regular customer',
  },
  {
    name: 'Sidra Masood',
    phone: '0336-5550133',
    address: 'Shah Rukn-e-Alam, Multan',
    note: 'Family account',
  },
  {
    name: 'Kashif Raza',
    phone: '0337-5550134',
    address: 'Johar Town, Lahore',
    note: 'Regular customer',
  },
  {
    name: 'Mahnoor Saeed',
    phone: '0338-5550135',
    address: 'Gulshan-e-Hadeed, Karachi',
    note: 'Monthly medicines',
  },
  {
    name: 'Shahbaz Latif',
    phone: '0339-5550136',
    address: 'Jinnah Colony, Faisalabad',
    note: 'Regular customer',
  },
  {
    name: 'Alina Waseem',
    phone: '0340-5550137',
    address: 'Bahria Town, Lahore',
    note: 'Card payment preferred',
  },
  {
    name: 'Faisal Nadeem',
    phone: '0341-5550138',
    address: 'Blue Area, Islamabad',
    note: 'Regular customer',
  },
  {
    name: 'Zoya Imtiaz',
    phone: '0342-5550139',
    address: 'Airport Road, Quetta',
    note: 'Family account',
  },
  {
    name: 'Adnan Saleem',
    phone: '0343-5550140',
    address: 'Buffer Zone, Karachi',
    note: 'Regular customer',
  },
  {
    name: 'Sumaira Khalid',
    phone: '0344-5550141',
    address: 'Abbottabad City',
    note: 'Monthly medicines',
  },
  {
    name: 'Hamza Nisar',
    phone: '0345-5550142',
    address: 'Railway Road, Gujranwala',
    note: 'Regular customer',
  },
  {
    name: 'Rimsha Aslam',
    phone: '0346-5550143',
    address: 'Tariq Road, Karachi',
    note: 'Family account',
  },
  {
    name: 'Yasir Mahmood',
    phone: '0347-5550144',
    address: 'Samanabad, Faisalabad',
    note: 'Regular customer',
  },
  {
    name: 'Amna Sohail',
    phone: '0348-5550145',
    address: 'Hayatabad, Peshawar',
    note: 'Monthly medicines',
  },
  {
    name: 'Junaid Akram',
    phone: '0349-5550146',
    address: 'Gulshan-e-Ravi, Lahore',
    note: 'Regular customer',
  },
  {
    name: 'Anum Bashir',
    phone: '0300-5550147',
    address: 'Korangi, Karachi',
    note: 'Family account',
  },
  {
    name: 'Rehan Iftikhar',
    phone: '0301-5550148',
    address: 'Satellite Town, Bahawalpur',
    note: 'Regular customer',
  },
  {
    name: 'Hoorain Shafiq',
    phone: '0302-5550149',
    address: 'G-11, Islamabad',
    note: 'Monthly medicines',
  },
  {
    name: 'Talha Zafar',
    phone: '0303-5550150',
    address: 'Shadman, Lahore',
    note: 'Regular customer',
  },
];

export const posCustomers: PosCustomer[] = basePosCustomers;

export const posQuickActions: PosQuickAction[] = [
  {
    title: 'New Sale',
    description: 'Start a fresh invoice.',
    href: '/modules/pos/new-sale',
    icon: ShoppingCart,
    tone: 'green',
  },
  {
    title: 'Hold / Park Sale',
    description: 'Save a cart for later.',
    href: '/modules/pos/hold-sale',
    icon: PauseCircle,
    tone: 'orange',
  },
  {
    title: 'Sales History',
    description: 'Browse completed sales.',
    href: '/modules/pos/sales-history',
    icon: ClipboardList,
    tone: 'blue',
  },
  {
    title: 'Return & Exchange',
    description: 'Process customer returns & replacements.',
    href: '/modules/pos/return-exchange',
    icon: RotateCcw,
    tone: 'red',
  },
  {
    title: 'Payment Transactions',
    description: 'View gateway payment activity.',
    href: '/modules/pos/payment-transactions',
    icon: CreditCard,
    tone: 'purple',
  },
  {
    title: 'Gateway Settings',
    description: 'JazzCash, EasyPaisa, bank, card.',
    href: '/modules/pos/gateway-settings',
    icon: Wallet,
    tone: 'sky',
  },
  {
    title: 'Customers',
    description: 'Pick or add a customer.',
    href: '/modules/pos/customer-selection',
    icon: UsersRound,
    tone: 'purple',
  },
  {
    title: 'Products',
    description: 'Check medicine stock.',
    href: '/modules/inventory',
    icon: Package,
    tone: 'red',
  },
  {
    title: 'Discounts',
    description: 'Adjust pricing rules.',
    href: '/modules/pos/discount-tax',
    icon: BadgePercent,
    tone: 'orange',
  },
  {
    title: 'POS Settings',
    description: 'Configure cashier preferences.',
    href: '/modules/pos/settings',
    icon: Settings,
    tone: 'blue',
  },
  {
    title: 'End of Day Report',
    description: 'View sales performance.',
    href: '/modules/reports',
    icon: TrendingUp,
    tone: 'green',
  },
];

export const posSettingsNav: PosSettingsNavItem[] = [
  { title: 'General Settings', description: 'Enable POS and choose defaults.', active: true, icon: Settings },
  { title: 'Receipt Settings', description: 'Print and footer behavior.', icon: FileText },
  { title: 'Payment Methods', description: 'Cash, card, mobile, and more.', icon: CreditCard },
  { title: 'Gateway Settings', description: 'JazzCash, EasyPaisa, bank, and card.', icon: Wallet },
  { title: 'Taxes', description: 'Tax calculation and labels.', icon: BadgePercent },
  { title: 'POS Devices', description: 'Printers, scanners, and peripherals.', icon: Monitor },
];

export const posPaymentMethodCards: PosPaymentMethodCard[] = POS_PAYMENT_METHODS.map((entry) => ({
  title: entry.title,
  tone: entry.tone,
  active: entry.method === 'Cash',
  icon: entry.icon,
}));

export const posDiscountSummary = [];
