import {
  Activity,
  Banknote,
  Bell,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  FileClock,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type Client = {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: 'Active' | 'Inactive';
  branch: string;
  modules: number;
  createdOn: string;
};

export type User = {
  id: number;
  initials: string;
  name: string;
  role: string;
  roleTone: 'admin' | 'manager' | 'pharmacist' | 'cashier' | 'viewer';
  branch: string;
  status: 'Active' | 'Inactive';
  email: string;
  phone: string;
};

// Branch data type
// Branches represent the different locations or outlets of the pharmacy business On the branch management page, users can view a list of all branches, along with details such as branches represent the different locations or outlets of the pharmacy business. On the branches management page, users can view a list of all branches, along with details such as branch name, city, manager, status, and creation date. Users with appropriate permissions can add new branches, edit existing branch details, or deactivate/reactivate branches as needed. This helps in organizing and managing the varibu
export type Branch = {
  id: number;
  name: string;
  city: string;
  manager: string;
  initials: string;
  status: 'Active' | 'Inactive';
  createdOn: string;
};

export type RolePermission = {
  module: string;
  icon: ComponentType<{ className?: string }>;
  superAdmin: boolean;
  admin: boolean;
  manager: boolean;
  pharmacist: boolean;
  cashier: boolean;
  viewer: boolean;
};

export type ModuleAccess = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  status: 'Active' | 'Inactive';
  access: boolean;
};

export type RoleSummary = {
  name: string;
  description: string;
  users: number;
  modules: number;
  status: 'Active' | 'Inactive';
};

export type RecentActivityItem = {
  icon: ComponentType<{ className?: string }>;
  text: string;
  time: string;
  tone: 'green' | 'blue' | 'orange' | 'red' | 'purple';
};

export type UsageLimitItem = {
  label: string;
  used: number;
  total: number;
  suffix: string;
};

export type BillingHistoryItem = {
  invoice: string;
  date: string;
  amount: string;
  status: string;
};

export type PlanDetails = {
  name: string;
  status: 'Active' | 'Inactive';
  duration: string;
  autoRenew: string;
  nextRenewal: string;
  totalModules: number;
  activeModules: number;
  remainingModules: number;
  usersAllowed: number;
  storage: string;
};

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/roles', label: 'Roles', icon: ShieldCheck },
  { href: '/branches', label: 'Branches', icon: Store },
  { href: '/settings/plan', label: 'Modules / Plans', icon: Boxes },
];

export const clients: Client[] = [
];

export const users: User[] = [
];

export const branches: Branch[] = [
];

export const rolePermissions: RolePermission[] = [
  { module: 'Dashboard', icon: LayoutDashboard, superAdmin: true, admin: true, manager: true, pharmacist: true, cashier: true, viewer: true },
  { module: 'Clients', icon: Building2, superAdmin: true, admin: true, manager: true, pharmacist: true, cashier: true, viewer: false },
  { module: 'Users', icon: Users, superAdmin: true, admin: true, manager: false, pharmacist: false, cashier: false, viewer: false },
  { module: 'Roles', icon: ShieldCheck, superAdmin: true, admin: true, manager: false, pharmacist: false, cashier: false, viewer: false },
  { module: 'Branches', icon: Store, superAdmin: true, admin: true, manager: true, pharmacist: false, cashier: false, viewer: false },
  { module: 'Inventory', icon: Package, superAdmin: true, admin: true, manager: true, pharmacist: true, cashier: false, viewer: false },
  { module: 'Purchases', icon: ShoppingCart, superAdmin: true, admin: true, manager: true, pharmacist: false, cashier: false, viewer: false },
  { module: 'Sales', icon: Banknote, superAdmin: true, admin: true, manager: true, pharmacist: true, cashier: true, viewer: false },
  { module: 'Payments', icon: CreditCard, superAdmin: true, admin: true, manager: true, pharmacist: true, cashier: true, viewer: false },
  { module: 'Settings', icon: Settings, superAdmin: true, admin: true, manager: false, pharmacist: false, cashier: false, viewer: false },
  { module: 'Audit Logs', icon: FileClock, superAdmin: true, admin: true, manager: false, pharmacist: false, cashier: false, viewer: false },
];

export const rolesList: RoleSummary[] = [
];

export const moduleAccess: ModuleAccess[] = [
  { name: 'Dashboard', icon: LayoutDashboard, status: 'Active', access: true },
  { name: 'Inventory', icon: Package, status: 'Active', access: true },
  { name: 'POS', icon: Store, status: 'Active', access: true },
  { name: 'Purchases', icon: ShoppingCart, status: 'Active', access: true },
  { name: 'Sales', icon: Banknote, status: 'Active', access: true },
  { name: 'HR', icon: Users, status: 'Inactive', access: false },
  { name: 'Accounts', icon: CreditCard, status: 'Inactive', access: false },
  { name: 'Audit Logs', icon: FileClock, status: 'Active', access: true },
  { name: 'Settings', icon: Settings, status: 'Active', access: true },
];

export const recentActivity: RecentActivityItem[] = [];

export const overviewSeries = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const planDetails: PlanDetails = {
  name: 'No Active Plan',
  status: 'Inactive',
  duration: 'N/A',
  autoRenew: 'Off',
  nextRenewal: 'N/A',
  totalModules: 0,
  activeModules: 0,
  remainingModules: 0,
  usersAllowed: 0,
  storage: '0 GB',
};

export const usageLimits: UsageLimitItem[] = [];

export const billingHistory: BillingHistoryItem[] = [];
