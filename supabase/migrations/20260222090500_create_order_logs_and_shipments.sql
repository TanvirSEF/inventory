-- ==================== PHASE C: ORDER TIMELINE + SHIPMENTS ====================

-- 1) Order status timeline / audit logs
CREATE TABLE IF NOT EXISTS public.order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'merchant', 'customer', 'courier')),
  actor_id UUID,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON public.order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_merchant_id ON public.order_status_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_created_at ON public.order_status_logs(created_at DESC);

-- 2) Courier shipment table (Pathao-ready)
CREATE TABLE IF NOT EXISTS public.courier_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,

  courier_provider TEXT NOT NULL DEFAULT 'manual' CHECK (courier_provider IN ('manual', 'pathao')),
  shipment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    shipment_status IN ('pending', 'requested', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled', 'returned')
  ),

  external_consignment_id TEXT,
  tracking_number TEXT,
  shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cod_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT non_negative_shipping_fee CHECK (shipping_fee >= 0),
  CONSTRAINT non_negative_cod_amount CHECK (cod_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_courier_shipments_order_id ON public.courier_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_merchant_id ON public.courier_shipments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_status ON public.courier_shipments(shipment_status);

-- 3) Updated-at trigger for courier shipments
CREATE OR REPLACE FUNCTION public.update_courier_shipments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_courier_shipments_updated_at ON public.courier_shipments;
CREATE TRIGGER update_courier_shipments_updated_at
BEFORE UPDATE ON public.courier_shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_courier_shipments_updated_at();

-- 4) RLS
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can manage their own order status logs" ON public.order_status_logs;
CREATE POLICY "Merchants can manage their own order status logs"
ON public.order_status_logs
FOR ALL
USING (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Merchants can manage their own courier shipments" ON public.courier_shipments;
CREATE POLICY "Merchants can manage their own courier shipments"
ON public.courier_shipments
FOR ALL
USING (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE owner_id = auth.uid()
  )
);
