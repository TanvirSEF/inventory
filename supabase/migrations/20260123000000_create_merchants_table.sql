-- Create merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS idx_merchants_owner_id ON public.merchants(owner_id);

-- Create index on subdomain for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchants_subdomain ON public.merchants(subdomain);

-- Create index on api_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchants_api_key ON public.merchants(api_key);

-- Enable Row Level Security
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own merchants
CREATE POLICY "Users can view their own merchants"
  ON public.merchants
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert their own merchants
CREATE POLICY "Users can insert their own merchants"
  ON public.merchants
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own merchants
CREATE POLICY "Users can update their own merchants"
  ON public.merchants
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete their own merchants
CREATE POLICY "Users can delete their own merchants"
  ON public.merchants
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_merchants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_merchants_updated_at();
