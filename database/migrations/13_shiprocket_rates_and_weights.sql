-- ============================================================================
-- Migration 13: Shiprocket Live Rates, Package Weights & Shipment Metadata
-- Adds tracking columns for chargeable weight, courier details, and rate cache
-- ============================================================================

-- 1. Enhance Orders table with shipping rate metadata
ALTER TABLE orders ADD COLUMN IF NOT EXISTS chargeable_weight NUMERIC(8, 3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(50) DEFAULT 'shiprocket';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate_response JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Enhance Products table with weight and dimensions for accurate packing
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams NUMERIC(10, 2) DEFAULT 25.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm NUMERIC(8, 2) DEFAULT 15.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS breadth_cm NUMERIC(8, 2) DEFAULT 10.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm NUMERIC(8, 2) DEFAULT 3.0;

-- 3. Create index for fast shipping queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
