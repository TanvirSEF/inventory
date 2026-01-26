-- Migration due to: Dynamic Inventory Engine

-- 1. Add attribute_schema to global_categories
ALTER TABLE global_categories 
ADD COLUMN IF NOT EXISTS attribute_schema JSONB DEFAULT '[]'::jsonb;

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES global_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock_level INTEGER NOT NULL DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Merchants can manage (select, insert, update, delete) their own products
-- This assumes the authenticated user (auth.uid()) is the owner of the merchant
CREATE POLICY "Merchants can manage their own products"
ON products
FOR ALL
USING (
  merchant_id IN (
    SELECT id FROM merchants WHERE owner_id = auth.uid()
  )
);
