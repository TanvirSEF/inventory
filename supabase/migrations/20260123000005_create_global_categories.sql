-- Create global_categories table for system-wide categories
-- These categories are created by super admin and can be selected by any merchant
CREATE TABLE IF NOT EXISTS public.global_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.global_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_categories_slug ON public.global_categories(slug);

-- Create index on parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_global_categories_parent_id ON public.global_categories(parent_id);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_global_categories_is_active ON public.global_categories(is_active);

-- Enable Row Level Security
ALTER TABLE public.global_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active global categories
CREATE POLICY "Anyone can view active global categories"
  ON public.global_categories
  FOR SELECT
  USING (is_active = true);

-- Policy: Only super admins can view all categories (including inactive)
CREATE POLICY "Super admins can view all global categories"
  ON public.global_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Only super admins can insert categories
CREATE POLICY "Super admins can create global categories"
  ON public.global_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Only super admins can update categories
CREATE POLICY "Super admins can update global categories"
  ON public.global_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Only super admins can delete categories
CREATE POLICY "Super admins can delete global categories"
  ON public.global_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_global_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_global_categories_updated_at
  BEFORE UPDATE ON public.global_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_global_categories_updated_at();

-- Add category_id to merchants table for selected category
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.global_categories(id) ON DELETE SET NULL;

-- Create index on category_id
CREATE INDEX IF NOT EXISTS idx_merchants_category_id ON public.merchants(category_id);
