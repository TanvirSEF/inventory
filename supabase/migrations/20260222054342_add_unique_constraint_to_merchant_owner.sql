-- Migration to add UNIQUE constraint to owner_id in merchants table
-- First, ensure there are no duplicate owner_ids (this might fail if duplicates exist)
-- Then, add the constraint

ALTER TABLE merchants
ADD CONSTRAINT unique_merchant_owner UNIQUE (owner_id);
