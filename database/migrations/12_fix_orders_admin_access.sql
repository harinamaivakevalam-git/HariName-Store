-- ============================================================================
-- HARINAMA STORE — FIX ORDERS ACCESS FOR ADMIN DASHBOARD & STORE FRONT
-- Migration 12: Ensure Orders & Order Items are readable and manageable
-- ============================================================================

-- 1. Enable RLS on orders and order_items
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy restrictive policies on public.orders
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_customer_select" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Devotees can view orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;

-- 3. Drop legacy policies on public.order_items
DROP POLICY IF EXISTS "order_items_admin_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_customer_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_manage" ON public.order_items;
DROP POLICY IF EXISTS "Allow all access to order_items" ON public.order_items;

-- 4. Drop legacy policies on public.payments
DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;

-- 5. Create Permissive Policies for Orders, Order Items & Payments
CREATE POLICY "Allow all access to orders" ON public.orders
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to order_items" ON public.order_items
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to payments" ON public.payments
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Explicit Grants for PostgREST Roles
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
