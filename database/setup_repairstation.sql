-- Enable PostGIS extension for spatial data support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension for auto-generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create repairStation table with PostGIS geometry support
CREATE TABLE IF NOT EXISTS "public"."repairStation" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "coordinate" geometry(POINT, 4326) NOT NULL, -- PostGIS Point geometry with WGS84 coordinate system
    "name" text NOT NULL,
    "description" text,
    "available" boolean NOT NULL DEFAULT true,
    "covered" boolean NOT NULL DEFAULT false,
    "free" boolean NOT NULL DEFAULT true,
    "city" text NOT NULL,
    "pictureUrl" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    
    -- Primary key constraint
    CONSTRAINT "repairStation_pkey" PRIMARY KEY ("id")
);

-- Create spatial index for efficient location-based queries on repairStation
CREATE INDEX IF NOT EXISTS "repairStation_coordinate_idx" 
ON "public"."repairStation" 
USING GIST ("coordinate");

-- Create regular indexes for common queries on repairStation
CREATE INDEX IF NOT EXISTS "repairStation_city_idx" 
ON "public"."repairStation" ("city");

CREATE INDEX IF NOT EXISTS "repairStation_available_idx" 
ON "public"."repairStation" ("available");

CREATE INDEX IF NOT EXISTS "repairStation_covered_idx" 
ON "public"."repairStation" ("covered");

CREATE INDEX IF NOT EXISTS "repairStation_free_idx" 
ON "public"."repairStation" ("free");

-- Create function to automatically update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates for repairStation
CREATE TRIGGER update_repairStation_updated_at 
    BEFORE UPDATE ON "public"."repairStation" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert repair station data with PostGIS POINT geometry
INSERT INTO "public"."repairStation" ("id", "coordinate", "name", "description", "available", "covered", "free", "city", "pictureUrl") VALUES 
('196be852-69c9-4536-ae33-547a84aab153', ST_SetSRID(ST_MakePoint(20.15905651566589, 46.24520654542345), 4326), 'Bike Repair Station', 'Csanádi utcai pumpa', true, false, true, 'Szeged', 'https://lh5.googleusercontent.com/p/AF1QipN3sTmkLmvgCQ5XAJr3Emf-zis521ejdDxf-kav=w1220-h920-k-no'),
('3cba5208-3b6c-412d-bbd6-0ac84d2e51ec', ST_SetSRID(ST_MakePoint(20.158353272391235, 46.256308245365986), 4326), 'Bike repair station', 'Ifjúsági ház főbejárata mellett', true, true, true, 'Szeged', 'https://scontent-muc2-1.xx.fbcdn.net/v/t1.6435-9/117204274_1587001678171978_5785526383866642686_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=QnZG7O-chqQQ7kNvwF8lxek&_nc_oc=AdmcrW7sk8A2YQ4tvJeBmvnoQDUpxtFBnIMkKbTzzca-7XfNm5fxrnm6FpdUY6Yj7hPJRWAmMLgWhGh213T8RgpA&_nc_zt=23&_nc_ht=scontent-muc2-1.xx&_nc_gid=610ijU2Be-bz8dwU9SpgCA&oh=00_AfPuBgc9MgPhxcvMw46JsXuVbQ9fYYqDl5GQqPYVXzadeA&oe=68827B65'),
('95c620d0-d130-48ff-bad4-c717b120d9ed', ST_SetSRID(ST_MakePoint(20.144946357669607, 46.250504557425955), 4326), 'Kerekpár pumpa és szerszámok', 'Dugonics téri javitó szerszámok és pumpa', true, true, true, 'Szeged', 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4nordt9eiHtvWzEQoZGuZ46wKghasQQeoKs43_h2Ia3CVwrZNHC-ESUCUAjiIXNUQWZf-FJeA-Ezt1nJnXV9OJrQIkulOz5UGYwHzlO380GzslKAXTqfHylntYECsOGky-7Nhh4aEQ=s680-w680-h510-rw'),
('f7b68f1e-1234-4abc-9876-0f8e1f4c1234', ST_SetSRID(ST_MakePoint(19.691276, 46.906183), 4326), 'Fake', 'Test repair station in Kecskemét', true, false, true, 'Kecskemét', 'https://example.com/fake_station.jpg');

-- Function to fetch all repair stations with extracted coordinates (for Supabase RPC)
CREATE OR REPLACE FUNCTION get_all_repair_stations()
RETURNS TABLE(
    id uuid,
    name text,
    description text,
    available boolean,
    covered boolean,
    free boolean,
    city text,
    pictureUrl text,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.id,
        rs.name,
        rs.description,
        rs.available,
        rs.covered,
        rs.free,
        rs.city,
        rs."pictureUrl", -- Properly quoted column reference
        ST_Y(rs.coordinate) as latitude,
        ST_X(rs.coordinate) as longitude,
        rs.created_at,
        rs.updated_at
    FROM "public"."repairStation" rs
    ORDER BY rs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby repair stations
CREATE OR REPLACE FUNCTION find_nearby_repair_stations(
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
    covered boolean,
    free boolean,
    city text,
    pictureUrl text,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.id,
        rs.name,
        rs.description,
        rs.available,
        rs.covered,
        rs.free,
        rs.city,
        rs."pictureUrl", -- Properly quoted column reference
        ST_Y(rs.coordinate) as latitude,
        ST_X(rs.coordinate) as longitude,
        ST_Distance(
            rs.coordinate::geography, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) as distance_meters
    FROM "public"."repairStation" rs
    WHERE 
        ST_DWithin(
            rs.coordinate::geography, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 
            radius_meters
        )
        AND (NOT only_available OR rs.available = true)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_all_repair_stations();
-- SELECT * FROM find_nearby_repair_stations(46.2520, 20.1480, 500, true); 