// Server-side payment placeholder.
// TODO: implement YooKassa API calls here with YOOKASSA_SECRET_KEY stored as a
// Supabase Edge Function secret. Never expose this value as VITE_* or bundle it
// into the browser. The frontend should call this function with a safe payment
// request and receive only a public confirmation/payment URL.

Deno.serve(async (_request) => {
  return new Response(
    JSON.stringify({
      error: 'YooKassa server endpoint is not configured yet',
      code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
