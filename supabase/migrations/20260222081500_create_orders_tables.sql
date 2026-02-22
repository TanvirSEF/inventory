-- ==================== ORDERS MODULE (PHASE A) ====================

-- 1) Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'storefront' CHECK (source IN ('storefront', 'manual')),

  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,

  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')
  ),

  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'paid', 'failed', 'refunded', 'partially_refunded')
  ),
  transaction_ref TEXT,

  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',

  notes TEXT,
  cancellation_reason TEXT,
  return_reason TEXT,
  return_requested_at TIMESTAMPTZ,

  confirmed_at TIMESTAMPTZ,
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT unique_order_number_per_merchant UNIQUE (merchant_id, order_number),
  CONSTRAINT non_negative_subtotal CHECK (subtotal >= 0),
  CONSTRAINT non_negative_discount CHECK (discount >= 0),
  CONSTRAINT non_negative_delivery_charge CHECK (delivery_charge >= 0),
  CONSTRAINT non_negative_total CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 2) Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),

  product_name_snapshot TEXT NOT NULL,
  product_description_snapshot TEXT,
  product_attributes_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  product_image_urls_snapshot TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT non_negative_unit_price CHECK (unit_price >= 0),
  CONSTRAINT non_negative_line_total CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant_id ON public.order_items(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 3) Updated-at triggers
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_order_items_updated_at();

-- 4) RLS policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can manage their own orders" ON public.orders;
CREATE POLICY "Merchants can manage their own orders"
ON public.orders
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

DROP POLICY IF EXISTS "Merchants can manage their own order items" ON public.order_items;
CREATE POLICY "Merchants can manage their own order items"
ON public.order_items
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
