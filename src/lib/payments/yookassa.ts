/**
 * YooKassa Mock - Заглушка для интеграции с ЮKassa
 * Симулирует платежи с различными методами оплаты
 */

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
}

export interface Payment {
  id: string;
  status: 'pending' | 'success' | 'failed';
  amount: PaymentAmount;
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentUrlParams {
  paymentId: string;
  redirectUrl?: string;
}

export interface CheckPaymentResult {
  status: 'pending' | 'success' | 'failed';
  paymentId: string;
}

// Список поддерживаемых методов оплаты с метаданными
export const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string }[] = [
  { id: 'card', name: 'Банковская карта', icon: 'credit-card' },
  { id: 'sbp', name: 'СБП', icon: 'link' },
  { id: 'sberpay', name: 'SberPay', icon: 'sber' },
  { id: 'tinkoffpay', name: 'Tinkoff Pay', icon: 'tinkoff' },
  { id: 'qiwi', name: 'QIWI', icon: 'qiwi' },
];

/**
 * Создать платеж в ЮKassa
 * @param params - Параметры платежа
 * @returns Объект платежа с идентификатором
 */
export async function createPayment(params: CreatePaymentParams): Promise<Payment> {
  // Симуляция задержки сети
  await new Promise((resolve) => setTimeout(resolve, 500));

  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status: 'success', // Заглушка всегда возвращает успех
    amount: params.amount,
    paymentMethod: params.paymentMethod || 'card',
    description: params.description || `Бронирование #${params.bookingId}`,
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };

  console.log('[YooKassa Mock] Создан платеж:', payment.id);
  return payment;
}

/**
 * Проверить статус платежа
 * @param paymentId - Идентификатор платежа
 * @returns Результат проверки статуса
 */
export async function checkPayment(paymentId: string): Promise<CheckPaymentResult> {
  // Симуляция задержки сети
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log('[YooKassa Mock] Проверка платежа:', paymentId);

  return {
    status: 'success', // Заглушка всегда возвращает успех
    paymentId,
  };
}

/**
 * Получить URL для оплаты (редирект на платежную форму)
 * @param params - Параметры URL
 * @returns URL для оплаты
 */
export function getPaymentUrl(params: PaymentUrlParams): string {
  // В реальной реализации здесь был бы URL ЮKassa
  // Для заглушки возвращаем моковый URL
  const baseUrl = 'https://payment.yookassa.ru';
  
  const url = new URL(baseUrl);
  url.searchParams.set('paymentId', params.paymentId);
  if (params.redirectUrl) {
    url.searchParams.set('redirectUrl', params.redirectUrl);
  }

  console.log('[YooKassa Mock] URL оплаты:', url.toString());
  return url.toString();
}

/**
 * Получить список доступных методов оплаты
 * @returns Список методов оплаты
 */
export function getAvailablePaymentMethods(): { id: PaymentMethod; name: string; icon: string }[] {
  return PAYMENT_METHODS;
}

/**
 * Форматировать сумму для отображения
 * @param amount - Сумма
 * @returns Отформатированная строка
 */
export function formatAmount(amount: PaymentAmount): string {
  return `${amount.value.toLocaleString('ru-RU')} ${amount.currency}`;
}