-- ============================================================================
-- HARINAMA STORE — PRODUCTION AIRTIGHT ADMIN RLS POLICIES FOR ORDERS
-- Migration 07: Comprehensive Admin Access for Orders with user_id = NULL
-- ============================================================================

-- 1. Ensure search_path is secure and create/replace the is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_email TEXT;
BEGIN
    -- Extract email securely from the verified Supabase Auth JWT token
    current_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));

    -- Check if JWT email matches the authorized admin whitelist
    IF current_email IN (
        'katturojuanilkumar@gmail.com',
        'harinamaivakevalam@gmail.com'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Secondary check: User ID exists in public.profiles with role = 'admin'
    -- and email matches the authorized admin whitelist
    IF auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
          AND role = 'admin'
          AND LOWER(email) IN (
              'katturojuanilkumar@gmail.com',
              'harinamaivakevalam@gmail.com'
          )
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Ensure RLS is active on public.orders & public.order_items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL EXISTING POLICIES ON public.orders TO PREVENT CONFLICTS
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_customer_select" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;

-- 4. CREATE AIRTIGHT POLICIES ON public.orders

-- A. Admin SELECT Policy: Allows katturojuanilkumar@gmail.com and harinamaivakevalam@gmail.com
-- to view ALL orders (including user_id IS NULL and guest orders)
CREATE POLICY "orders_admin_select" ON public.orders
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- B. Customer SELECT Policy: Allows regular authenticated devotees to view ONLY their own orders
CREATE POLICY "orders_customer_select" ON public.orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- C. Order Creation Policy: Allows authenticated users, guest checkouts (user_id IS NULL), & admins
CREATE POLICY "orders_insert_policy" ON public.orders
    FOR INSERT
    TO public
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (user_id IS NULL) OR
        public.is_admin()
    );

-- D. Admin UPDATE Policy: Allows admins to update order_status, tracking, courier, payment_status
CREATE POLICY "orders_admin_update" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- E. Admin DELETE Policy: Allows admins to remove test/cancelled orders if necessary
CREATE POLICY "orders_admin_delete" ON public.orders
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 5. DROP ALL EXISTING POLICIES ON public.order_items
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_customer_select" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_manage" ON public.order_items;

-- 6. CREATE AIRTIGHT POLICIES ON public.order_items

-- A. Admin SELECT Policy: Allows admins to view all order line items for all orders
CREATE POLICY "order_items_admin_select" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- B. Customer SELECT Policy: Allows devotees to view items belonging to their own orders
CREATE POLICY "order_items_customer_select" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND orders.user_id = auth.uid()
        )
    );

-- C. Order Items INSERT Policy: Allows checkout system to insert line items for created orders
CREATE POLICY "order_items_insert_policy" ON public.order_items
    FOR INSERT
    TO public
    WITH CHECK (true);

-- D. Admin Full Management Policy for order_items (Update/Delete)
CREATE POLICY "order_items_admin_manage" ON public.order_items
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
