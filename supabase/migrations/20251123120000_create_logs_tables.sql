CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  error_type text,
  error_message text,
  stack_trace text,
  url text,
  user_agent text,
  ip_address text,
  context jsonb,
  severity text,
  resolved boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at);

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  action text,
  entity_type text,
  entity_id text,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity_logs(created_at);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_logs_insert_any" ON public.error_logs;
CREATE POLICY "error_logs_insert_any"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "user_activity_insert_any" ON public.user_activity_logs;
CREATE POLICY "user_activity_insert_any"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "error_logs_select_own" ON public.error_logs;
CREATE POLICY "error_logs_select_own"
  ON public.error_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_activity_select_own" ON public.user_activity_logs;
CREATE POLICY "user_activity_select_own"
  ON public.user_activity_logs FOR SELECT
  USING (user_id = auth.uid());
