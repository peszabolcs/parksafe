-- Enable PostGIS extension for spatial data support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension for auto-generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bicycleService table with PostGIS geometry support
CREATE TABLE IF NOT EXISTS "public"."bicycleService" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "coordinate" geometry(POINT, 4326) NOT NULL, -- PostGIS Point geometry with WGS84 coordinate system
    "name" text NOT NULL,
    "description" text,
    "available" boolean NOT NULL DEFAULT true,
    "city" text NOT NULL,
    
    -- Specific fields for bicycle services
    "phone" text,
    "website" text,
    "opening_hours" text,
    "services" text[], -- array: ["repair", "sale", "parts", "rental", "maintenance"]
    "rating" numeric(2,1), -- 1.0 to 5.0
    "price_range" text, -- "€", "€€", "€€€"
    "picture_url" text,
    
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    
    -- Primary key constraint
    CONSTRAINT "bicycleService_pkey" PRIMARY KEY ("id")
);

-- Create spatial index for efficient location-based queries on bicycleService
CREATE INDEX IF NOT EXISTS "bicycleService_coordinate_idx" 
ON "public"."bicycleService" 
USING GIST ("coordinate");

-- Create regular indexes for common queries on bicycleService
CREATE INDEX IF NOT EXISTS "bicycleService_city_idx" 
ON "public"."bicycleService" ("city");

CREATE INDEX IF NOT EXISTS "bicycleService_available_idx" 
ON "public"."bicycleService" ("available");

CREATE INDEX IF NOT EXISTS "bicycleService_rating_idx" 
ON "public"."bicycleService" ("rating");

CREATE INDEX IF NOT EXISTS "bicycleService_services_idx" 
ON "public"."bicycleService" USING GIN ("services");

-- Create trigger to automatically update updated_at on row updates for bicycleService
CREATE TRIGGER update_bicycleService_updated_at 
    BEFORE UPDATE ON "public"."bicycleService" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample bicycle service data with PostGIS POINT geometry
INSERT INTO "public"."bicycleService" ("id", "coordinate", "name", "description", "available", "city", "phone", "website", "opening_hours", "services", "rating", "price_range", "picture_url") VALUES 
('a1b2c3d4-5678-9012-3456-789012345678', ST_SetSRID(ST_MakePoint(20.146851, 46.253210), 4326), 'Bike Shop Szeged', 'Teljes körű bicikli szerviz és bolt', true, 'Szeged', '+36 62 123 456', 'https://bikeshopszeged.hu', 'H-P: 9:00-18:00, Sz: 9:00-13:00', ARRAY['repair', 'sale', 'parts', 'maintenance'], 4.5, '€€', 'https://example.com/bikeshop1.jpg'),
('b2c3d4e5-6789-0123-4567-890123456789', ST_SetSRID(ST_MakePoint(20.157932, 46.248765), 4326), 'Kerékpár Centrum', 'Szakszerviz és alkatrész bolt', true, 'Szeged', '+36 62 234 567', 'https://kerekparcentrum.hu', 'H-P: 8:00-17:00', ARRAY['repair', 'parts', 'maintenance'], 4.8, '€€€', 'https://example.com/kerekparcentrum.jpg'),
('c3d4e5f6-7890-1234-5678-901234567890', ST_SetSRID(ST_MakePoint(20.142156, 46.259843), 4326), 'Bicikli Doktor', 'Gyors javítás és karbantartás', true, 'Szeged', '+36 62 345 678', '', 'H-P: 10:00-19:00, Sz: 10:00-14:00', ARRAY['repair', 'maintenance'], 4.2, '€', 'https://example.com/biciklidoktor.jpg'),
('d4e5f6a7-8901-2345-6789-012345678901', ST_SetSRID(ST_MakePoint(20.164523, 46.245123), 4326), 'Pro Cycle Service', 'Profi versenykerékpár szerviz', true, 'Szeged', '+36 62 456 789', 'https://procycleservice.hu', 'H-P: 9:00-17:00', ARRAY['repair', 'maintenance', 'parts'], 4.9, '€€€', 'https://example.com/procycle.jpg'),
('e5f6a7b8-9012-3456-7890-123456789012', ST_SetSRID(ST_MakePoint(19.691276, 46.906183), 4326), 'Kecskemét Bike', 'Családi bicikli szerviz', true, 'Kecskemét', '+36 76 123 456', '', 'H-P: 8:30-16:30', ARRAY['repair', 'sale', 'rental'], 4.3, '€', 'https://example.com/kecskemet_bike.jpg');

-- Function to fetch all bicycle services with extracted coordinates (for Supabase RPC)
CREATE OR REPLACE FUNCTION get_all_bicycle_services()
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    available boolean,
    city text,
    phone text,
    website text,
    opening_hours text,
    services text[],
    rating numeric(2,1),
    price_range text,
    picture_url text,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bs.id,
        bs.name,
        bs.description,
        bs.available,
        bs.city,
        bs.phone,
        bs.website,
        bs.opening_hours,
        bs.services,
        bs.rating,
        bs.price_range,
        bs.picture_url,
        ST_Y(bs.coordinate) as latitude,
        ST_X(bs.coordinate) as longitude,
        bs.created_at,
        bs.updated_at
    FROM "public"."bicycleService" bs
    ORDER BY bs.rating DESC, bs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby bicycle services
CREATE OR REPLACE FUNCTION find_nearby_bicycle_services(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000,
    only_available BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    available boolean,
    city text,
    phone text,
    website text,
    opening_hours text,
    services text[],
    rating numeric(2,1),
    price_range text,
    picture_url text,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bs.id,
        bs.name,
        bs.description,
        bs.available,
        bs.city,
        bs.phone,
        bs.website,
        bs.opening_hours,
        bs.services,
        bs.rating,
        bs.price_range,
        bs.picture_url,
        ST_Y(bs.coordinate) as latitude,
        ST_X(bs.coordinate) as longitude,
        ST_Distance(
            bs.coordinate::geography, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) as distance_meters
    FROM "public"."bicycleService" bs
    WHERE 
        ST_DWithin(
            bs.coordinate::geography, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 
            radius_meters
        )
        AND (NOT only_available OR bs.available = true)
    ORDER BY distance_meters ASC, bs.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_all_bicycle_services();
-- SELECT * FROM find_nearby_bicycle_services(46.2520, 20.1480, 2000, true);