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

const PAYMENT_ENDPOINT = '/functions/v1/create-yookassa-payment';

async function callPaymentEndpoint<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch(PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Платёжный сервис временно недоступен');
  }
  return payload as T;
}

export async function createPayment(params: CreatePaymentParams): Promise<Payment> {
  return callPaymentEndpoint<Payment>({ action: 'create', ...params });
}

export async function checkPayment(paymentId: string): Promise<CheckPaymentResult> {
  return callPaymentEndpoint<CheckPaymentResult>({ action: 'check', paymentId });
}

export function getPaymentUrl(params: PaymentUrlParams): string {
  const url = new URL('/payment-check', window.location.origin);
  url.searchParams.set('paymentId', params.paymentId);
  if (params.redirectUrl) url.searchParams.set('redirectUrl', params.redirectUrl);
  return url.toString();
}

export function getAvailablePaymentMethods(): { id: PaymentMethod; name: string; icon: string }[] {
  return PAYMENT_METHODS;
}

export function formatAmount(amount: PaymentAmount): string {
  return `${amount.value.toLocaleString('ru-RU')} ${amount.currency}`;
}
