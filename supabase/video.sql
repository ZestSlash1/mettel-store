-- Add YouTube video URL to products
-- Run in the Supabase SQL editor.
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;

NOTIFY pgrst, 'reload schema';
