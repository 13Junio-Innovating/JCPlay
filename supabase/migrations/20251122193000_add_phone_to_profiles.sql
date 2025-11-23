ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verification_code text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);