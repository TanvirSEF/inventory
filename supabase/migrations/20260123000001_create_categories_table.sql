-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Ensure unique slug per merchant
  UNIQUE(merchant_id, slug)
);

-- Create index on merchant_id for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_merchant_id ON public.categories(merchant_id);

-- Create index on parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view categories of their merchants
CREATE POLICY "Users can view their merchant categories"
  ON public.categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = categories.merchant_id
      AND merchants.owner_id = auth.uid()
    )
  );

-- Policy: Users can insert categories for their merchants
CREATE POLICY "Users can insert categories for their merchants"
  ON public.categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = categories.merchant_id
      AND merchants.owner_id = auth.uid()
    )
  );

-- Policy: Users can update categories of their merchants
CREATE POLICY "Users can update categories of their merchants"
  ON public.categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = categories.merchant_id
      AND merchants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = categories.merchant_id
      AND merchants.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete categories of their merchants
CREATE POLICY "Users can delete categories of their merchants"
  ON public.categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = categories.merchant_id
      AND merchants.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_categories_updated_at();

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(category_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;
