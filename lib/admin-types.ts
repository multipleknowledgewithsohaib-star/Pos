export type AdminStatus = 'Active' | 'Inactive';

export type RoleTone = 'admin' | 'manager' | 'pharmacist' | 'cashier' | 'viewer';

export type AdminClient = {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: AdminStatus;
  branch: string;
  modules: number;
  createdOn: string;
  contactName?: string;
  email?: string;
  phone?: string;
};

export type AdminUser = {
  id: number;
  initials: string;
  name: string;
  role: string;
  roleTone: RoleTone;
  branch: string;
  status: AdminStatus;
  email: string;
  phone: string;
  password?: string;
};

export type AdminBranch = {
  id: number;
  name: string;
  city: string;
  manager: string;
  initials: string;
  status: AdminStatus;
  createdOn: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  users: number;
  modules: number;
  status: AdminStatus;
};

export type AdminData = {
  clients: AdminClient[];
  users: AdminUser[];
  branches: AdminBranch[];
  roles: AdminRole[];
};
