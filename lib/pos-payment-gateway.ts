import {
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { PosPaymentMethod } from './pos-state';

export type PosGatewayMethodKey =
  | 'cash'
  | 'bankTransfer'
  | 'card'
  | 'jazzCash'
  | 'easyPaisa';

export type PosGatewayMethodSettings = {
  enabled: boolean;
  merchantId: string;
  apiKey: string;
  sandbox: boolean;
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string;
  tillNumber?: string;
  storeId?: string;
};

export type PosGatewaySettings = Record<PosGatewayMethodKey, PosGatewayMethodSettings>;

export type PosPaymentMethodMeta = {
  method: PosPaymentMethod;
  key: PosGatewayMethodKey;
  title: string;
  description: string;
  tone: 'green' | 'blue' | 'purple' | 'orange' | 'sky';
  icon: LucideIcon;
  requiresAmount: boolean;
  requiresMobile: boolean;
  requiresBankRef: boolean;
  requiresCardRef: boolean;
};

export const POS_PAYMENT_METHODS: PosPaymentMethodMeta[] = [
  {
    method: 'Cash',
    key: 'cash',
    title: 'Cash',
    description: 'Collect cash and give change.',
    tone: 'green',
    icon: Banknote,
    requiresAmount: true,
    requiresMobile: false,
    requiresBankRef: false,
    requiresCardRef: false,
  },
  {
    method: 'Bank Transfer',
    key: 'bankTransfer',
    title: 'Bank Transfer',
    description: 'Record bank transfer with reference.',
    tone: 'blue',
    icon: Building2,
    requiresAmount: false,
    requiresMobile: false,
    requiresBankRef: true,
    requiresCardRef: false,
  },
  {
    method: 'Card',
    key: 'card',
    title: 'Card',
    description: 'Debit or credit card payment.',
    tone: 'purple',
    icon: CreditCard,
    requiresAmount: false,
    requiresMobile: false,
    requiresBankRef: false,
    requiresCardRef: true,
  },
  {
    method: 'JazzCash',
    key: 'jazzCash',
    title: 'JazzCash',
    description: 'Mobile wallet via JazzCash.',
    tone: 'orange',
    icon: Smartphone,
    requiresAmount: false,
    requiresMobile: true,
    requiresBankRef: false,
    requiresCardRef: false,
  },
  {
    method: 'EasyPaisa',
    key: 'easyPaisa',
    title: 'EasyPaisa',
    description: 'Mobile wallet via EasyPaisa.',
    tone: 'sky',
    icon: Wallet,
    requiresAmount: false,
    requiresMobile: true,
    requiresBankRef: false,
    requiresCardRef: false,
  },
];

export const DEFAULT_GATEWAY_SETTINGS: PosGatewaySettings = {
  cash: { enabled: true, merchantId: '', apiKey: '', sandbox: false },
  bankTransfer: {
    enabled: true,
    merchantId: '',
    apiKey: '',
    sandbox: false,
    accountTitle: 'MC Medical Store',
    accountNumber: '01234567890123',
    bankName: 'HBL',
  },
  card: { enabled: true, merchantId: '', apiKey: '', sandbox: true },
  jazzCash: {
    enabled: true,
    merchantId: '',
    apiKey: '',
    sandbox: true,
    tillNumber: '03001234567',
  },
  easyPaisa: {
    enabled: true,
    merchantId: '',
    apiKey: '',
    sandbox: true,
    storeId: 'EP-STORE-001',
  },
};

export function getPaymentMethodMeta(method: PosPaymentMethod) {
  return POS_PAYMENT_METHODS.find((entry) => entry.method === method) ?? POS_PAYMENT_METHODS[0];
}

export function getEnabledPaymentMethods(settings: PosGatewaySettings) {
  return POS_PAYMENT_METHODS.filter((entry) => settings[entry.key]?.enabled !== false);
}

export function mapLegacyPaymentMethod(value: unknown, fallback: PosPaymentMethod = 'Cash'): PosPaymentMethod {
  if (value === 'Cash' || value === 'Bank Transfer' || value === 'Card' || value === 'JazzCash' || value === 'EasyPaisa') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes('cash')) return 'Cash';
    if (normalized.includes('bank')) return 'Bank Transfer';
    if (normalized.includes('card')) return 'Card';
    if (normalized.includes('jazz')) return 'JazzCash';
    if (normalized.includes('easy')) return 'EasyPaisa';
    if (normalized.includes('mobile') || normalized.includes('wallet')) return 'JazzCash';
    if (normalized.includes('other')) return 'Bank Transfer';
  }

  return fallback;
}

export function createGatewayTransactionId(method: PosPaymentMethod) {
  const prefix =
    method === 'Cash'
      ? 'CSH'
      : method === 'Bank Transfer'
        ? 'BNK'
        : method === 'Card'
          ? 'CRD'
          : method === 'JazzCash'
            ? 'JAZ'
            : 'EPS';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function createPaymentReference(method: PosPaymentMethod, input?: string) {
  if (input?.trim()) {
    return input.trim();
  }

  return createGatewayTransactionId(method);
}

export function sanitizeGatewaySettings(raw: unknown): PosGatewaySettings {
  const candidate = raw && typeof raw === 'object' ? (raw as Partial<PosGatewaySettings>) : {};

  return (Object.keys(DEFAULT_GATEWAY_SETTINGS) as PosGatewayMethodKey[]).reduce<PosGatewaySettings>((acc, key) => {
    const fallback = DEFAULT_GATEWAY_SETTINGS[key];
    const value = candidate[key];

    acc[key] = {
      enabled: value?.enabled !== false,
      merchantId: typeof value?.merchantId === 'string' ? value.merchantId : fallback.merchantId,
      apiKey: typeof value?.apiKey === 'string' ? value.apiKey : fallback.apiKey,
      sandbox: value?.sandbox === true,
      accountTitle: typeof value?.accountTitle === 'string' ? value.accountTitle : fallback.accountTitle,
      accountNumber: typeof value?.accountNumber === 'string' ? value.accountNumber : fallback.accountNumber,
      bankName: typeof value?.bankName === 'string' ? value.bankName : fallback.bankName,
      tillNumber: typeof value?.tillNumber === 'string' ? value.tillNumber : fallback.tillNumber,
      storeId: typeof value?.storeId === 'string' ? value.storeId : fallback.storeId,
    };

    return acc;
  }, {} as PosGatewaySettings);
}

export type ProcessPaymentInput = {
  method: PosPaymentMethod;
  total: number;
  amountReceived: number;
  payerMobile?: string;
  bankReference?: string;
  cardReference?: string;
  gateway: PosGatewaySettings;
};

export type ProcessPaymentResult = {
  ok: boolean;
  message: string;
  paymentReference: string;
  gatewayTransactionId: string;
  change: number;
};

export function processGatewayPayment(input: ProcessPaymentInput): ProcessPaymentResult {
  const meta = getPaymentMethodMeta(input.method);
  const config = input.gateway[meta.key];

  if (!config?.enabled) {
    return {
      ok: false,
      message: `${meta.title} is disabled in gateway settings.`,
      paymentReference: '',
      gatewayTransactionId: '',
      change: 0,
    };
  }

  if (meta.requiresAmount && input.amountReceived < input.total) {
    return {
      ok: false,
      message: 'Amount received must be equal to or greater than total.',
      paymentReference: '',
      gatewayTransactionId: '',
      change: 0,
    };
  }

  if (meta.requiresMobile && !input.payerMobile?.trim()) {
    return {
      ok: false,
      message: 'Customer mobile number is required for wallet payment.',
      paymentReference: '',
      gatewayTransactionId: '',
      change: 0,
    };
  }

  if (meta.requiresBankRef && !input.bankReference?.trim()) {
    return {
      ok: false,
      message: 'Bank transfer reference is required.',
      paymentReference: '',
      gatewayTransactionId: '',
      change: 0,
    };
  }

  if (meta.requiresCardRef && !input.cardReference?.trim()) {
    return {
      ok: false,
      message: 'Card approval / reference code is required.',
      paymentReference: '',
      gatewayTransactionId: '',
      change: 0,
    };
  }

  const gatewayTransactionId = createGatewayTransactionId(input.method);
  const paymentReference = createPaymentReference(
    input.method,
    input.bankReference || input.cardReference || input.payerMobile,
  );

  return {
    ok: true,
    message: `${meta.title} payment accepted.`,
    paymentReference,
    gatewayTransactionId,
    change: Math.max(0, input.amountReceived - input.total),
  };
}
