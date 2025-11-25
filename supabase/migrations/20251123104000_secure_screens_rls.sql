ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "screens_select_own" ON public.screens;
CREATE POLICY "screens_select_own"
  ON public.screens FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "screens_insert_own" ON public.screens;
CREATE POLICY "screens_insert_own"
  ON public.screens FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "screens_update_own" ON public.screens;
CREATE POLICY "screens_update_own"
  ON public.screens FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());