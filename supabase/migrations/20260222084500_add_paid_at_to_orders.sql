-- Add paid_at timestamp for payment reconciliation and reporting
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at DESC);
