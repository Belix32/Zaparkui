export type PaymentMethod = 'card' | 'sbp' | 'sberpay' | 'tinkoffpay' | 'qiwi';

export interface PaymentAmount {
  value: number;
  currency: string;
}

export interface CreatePaymentParams {
  amount: PaymentAmount;
  paymentMethod?: PaymentMethod;
  description?: string;
  bookingId: string;
  userId: string;
  returnUrl?: string;
}

export interface Payment {
  id: string;
  status: 'pending' | 'succeeded' | 'canceled';
  amount: PaymentAmount;
  paymentMethod?: PaymentMethod;
  description: string;
  createdAt: string;
  paidAt?: string;
  confirmationUrl?: string;
}

export interface PaymentUrlParams {
  paymentId: string;
  redirectUrl?: string;
}

export interface CheckPaymentResult {
  status: 'pending' | 'succeeded' | 'canceled';
  paymentId: string;
}

export const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string }[] = [
  { id: 'card', name: 'Банковская карта', icon: 'credit-card' },
  { id: 'sbp', name: 'СБП', icon: 'link' },
  { id: 'sberpay', name: 'SberPay', icon: 'sber' },
  { id: 'tinkoffpay', name: 'Tinkoff Pay', icon: 'tinkoff' },
  { id: 'qiwi', name: 'QIWI', icon: 'qiwi' },
];

const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  card: 'bank_card',
  sbp: 'sbp',
  sberpay: 'sberpay',
  tinkoffpay: 'tinkoff_bank',
  qiwi: 'qiwi',
};

function isRealMode(): boolean {
  return Boolean(
    import.meta.env.VITE_YOOKASSA_SHOP_ID &&
    import.meta.env.VITE_YOOKASSA_SECRET_KEY
  );
}

function idempotencyKey(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
}

function basicAuth(): string {
  const shopId = import.meta.env.VITE_YOOKASSA_SHOP_ID as string;
  const secretKey = import.meta.env.VITE_YOOKASSA_SECRET_KEY as string;
  return 'Basic ' + btoa(`${shopId}:${secretKey}`);
}

function mapYookassaStatus(status: string): 'pending' | 'succeeded' | 'canceled' {
  if (status === 'succeeded') return 'succeeded';
  if (status === 'canceled') return 'canceled';
  return 'pending';
}

// -------- Mock implementation --------

async function mockCreatePayment(params: CreatePaymentParams): Promise<Payment> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status: 'succeeded',
    amount: params.amount,
    paymentMethod: params.paymentMethod || 'card',
    description: params.description || `Бронирование #${params.bookingId}`,
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };
  console.log('[YooKassa Mock] Created payment:', payment.id);
  return payment;
}

async function mockCheckPayment(paymentId: string): Promise<CheckPaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log('[YooKassa Mock] Checking payment:', paymentId);
  return { status: 'succeeded', paymentId };
}

function mockGetPaymentUrl(params: PaymentUrlParams): string {
  const url = new URL('https://payment.yookassa.ru');
  url.searchParams.set('paymentId', params.paymentId);
  if (params.redirectUrl) {
    url.searchParams.set('redirectUrl', params.redirectUrl);
  }
  return url.toString();
}

// -------- Real YooKassa v3 API implementation --------

interface YooKassaAmount {
  value: string;
  currency: string;
}

interface YooKassaPaymentResponse {
  id: string;
  status: string;
  amount: YooKassaAmount;
  description?: string;
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  created_at: string;
  paid: boolean;
  test: boolean;
  metadata?: Record<string, string>;
}

async function realCreatePayment(params: CreatePaymentParams): Promise<Payment> {
  const requestBody: Record<string, unknown> = {
    amount: {
      value: params.amount.value.toFixed(2),
      currency: params.amount.currency,
    },
    confirmation: {
      type: 'redirect',
      return_url:
        params.returnUrl ||
        `${window.location.origin}/payment-soon?bookingId=${params.bookingId}`,
    },
    description: params.description || `Бронирование #${params.bookingId}`,
    metadata: {
      booking_id: params.bookingId,
      user_id: params.userId,
    },
    capture: true,
  };

  if (params.paymentMethod && params.paymentMethod !== 'card') {
    requestBody.payment_method_data = {
      type: PAYMENT_METHOD_MAP[params.paymentMethod],
    };
  }

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuth(),
      'Idempotence-Key': idempotencyKey(),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`YooKassa API error ${response.status}: ${errorBody}`);
  }

  const data: YooKassaPaymentResponse = await response.json();

  return {
    id: data.id,
    status: mapYookassaStatus(data.status),
    amount: {
      value: parseFloat(data.amount.value),
      currency: data.amount.currency,
    },
    paymentMethod: params.paymentMethod,
    description: data.description || '',
    createdAt: data.created_at,
    paidAt: data.paid ? new Date().toISOString() : undefined,
    confirmationUrl: data.confirmation?.confirmation_url,
  };
}

async function realCheckPayment(paymentId: string): Promise<CheckPaymentResult> {
  const response = await fetch(
    `https://api.yookassa.ru/v3/payments/${paymentId}`,
    {
      headers: {
        Authorization: basicAuth(),
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`YooKassa API error ${response.status}: ${errorBody}`);
  }

  const data: YooKassaPaymentResponse = await response.json();

  return {
    status: mapYookassaStatus(data.status),
    paymentId: data.id,
  };
}

function realGetPaymentUrl(params: PaymentUrlParams): string {
  const url = new URL(`${window.location.origin}/payment-check`);
  url.searchParams.set('paymentId', params.paymentId);
  if (params.redirectUrl) {
    url.searchParams.set('redirectUrl', params.redirectUrl);
  }
  return url.toString();
}

// -------- Public API --------

export async function createPayment(params: CreatePaymentParams): Promise<Payment> {
  if (isRealMode()) {
    return realCreatePayment(params);
  }
  console.warn(
    '[YooKassa] Using mock mode — set VITE_YOOKASSA_SHOP_ID and VITE_YOOKASSA_SECRET_KEY for real payments'
  );
  return mockCreatePayment(params);
}

export async function checkPayment(paymentId: string): Promise<CheckPaymentResult> {
  if (isRealMode()) return realCheckPayment(paymentId);
  return mockCheckPayment(paymentId);
}

export function getPaymentUrl(params: PaymentUrlParams): string {
  if (isRealMode()) return realGetPaymentUrl(params);
  return mockGetPaymentUrl(params);
}

export function getAvailablePaymentMethods(): { id: PaymentMethod; name: string; icon: string }[] {
  return PAYMENT_METHODS;
}

export function formatAmount(amount: PaymentAmount): string {
  return `${amount.value.toLocaleString('ru-RU')} ${amount.currency}`;
}
