export type ApiList<T> = {
  data: T[];
};

export type ApiProduct = {
  id: number;
  sku: string;
  name: string;
  reorderLevel: number;
  category?: {
    name: string;
  } | null;
};

export type ApiBatch = {
  id: number;
  batchNumber: string;
  productId: number;
  expiryDate: string;
  sellingPrice: string;
  quantityOnHand: number;
  product?: ApiProduct | null;
  supplier?: {
    name: string;
  } | null;
};

export type ApiMovement = {
  id: number;
  movementType: 'RECEIVE' | 'DISPENSE' | 'ADJUSTMENT';
  quantity: number;
  reference?: string | null;
  createdAt: string;
  batch?: {
    batchNumber: string;
    product?: {
      name: string;
    } | null;
  } | null;
};

export type ApiSummary = {
  online: boolean;
  databaseOnline: boolean;
  categories: number;
  suppliers: number;
  products: number;
  batches: number;
  movements: number;
  activeModules: number;
  lowStock: number;
  expiringSoon: number;
  totalStock: number;
  recentMovements: ApiMovement[];
};

const apiBaseUrl = process.env.PHARMA_API_BASE_URL ?? 'http://localhost:4000';

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getApiSummary(): Promise<ApiSummary> {
  const defaultSummary: ApiSummary = {
    online: false,
    databaseOnline: false,
    categories: 0,
    suppliers: 0,
    products: 0,
    batches: 0,
    movements: 0,
    activeModules: 7,
    lowStock: 0,
    expiringSoon: 0,
    totalStock: 0,
    recentMovements: [],
  };

  return getJson<ApiSummary>('/api/dashboard/summary', defaultSummary);
}

export function backendUrl(path: string) {
  return `/backend-api${path}`;
}
