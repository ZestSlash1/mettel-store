-- COD payment method + product video URL
-- Run in the Supabase SQL editor.

ALTER TABLE orders  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'razorpay';
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;

NOTIFY pgrst, 'reload schema';
