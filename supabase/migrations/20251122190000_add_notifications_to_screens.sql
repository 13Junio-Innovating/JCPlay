ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS notification_emails text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS webhook_url text;

CREATE INDEX IF NOT EXISTS idx_screens_notification_emails ON public.screens USING gin (notification_emails);