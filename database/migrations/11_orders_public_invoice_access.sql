-- ============================================================================
-- HARINAMA STORE — PERMISSIONS FOR LIVE TAX INVOICES & ORDER TRACKING
-- Migration 11: Public Read Access for Orders & Order Items
-- ============================================================================

-- 1. Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy restrictive SELECT policies that prevent devotees from viewing their invoices
DROP POLICY IF EXISTS "Public can view orders by order_number" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Devotees can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public read order_items" ON public.order_items;

-- 3. Create permissive SELECT policies for public/anon/authenticated roles
CREATE POLICY "Public can view orders" ON public.orders
FOR SELECT USING (true);

CREATE POLICY "Public can view order items" ON public.order_items
FOR SELECT USING (true);

-- 4. Grant explicit SELECT permissions to anon and authenticated roles
GRANT SELECT ON TABLE public.orders TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.order_items TO anon, authenticated, service_role;

-- 5. Notify PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
