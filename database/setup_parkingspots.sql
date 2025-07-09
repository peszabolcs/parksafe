-- Optimized ParkSafe Database Setup with PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create parkingSpots table with PostGIS geometry support
CREATE TABLE IF NOT EXISTS "public"."parkingSpots" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "coordinate" geometry(POINT, 4326) NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "available" boolean NOT NULL DEFAULT true,
    "city" text NOT NULL,
    "covered" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT "parkingSpots_pkey" PRIMARY KEY ("id")
);

-- Create repairStation table with PostGIS geometry support
CREATE TABLE IF NOT EXISTS "public"."repairStation" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "coordinate" geometry(POINT, 4326) NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "available" boolean NOT NULL DEFAULT true,
    "covered" boolean NOT NULL DEFAULT false,
    "free" boolean NOT NULL DEFAULT true,
    "city" text NOT NULL,
    "pictureUrl" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT "repairStation_pkey" PRIMARY KEY ("id")
);

-- Optimized spatial indexes
CREATE INDEX IF NOT EXISTS "idx_parkingSpots_coordinate" ON "public"."parkingSpots" USING GIST ("coordinate");
CREATE INDEX IF NOT EXISTS "idx_repairStation_coordinate" ON "public"."repairStation" USING GIST ("coordinate");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_parkingSpots_available_city" ON "public"."parkingSpots" ("available", "city");
CREATE INDEX IF NOT EXISTS "idx_repairStation_available_city" ON "public"."repairStation" ("available", "city");

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_parkingSpots_updated_at 
    BEFORE UPDATE ON "public"."parkingSpots" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repairStation_updated_at 
    BEFORE UPDATE ON "public"."repairStation" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert parking spots data
INSERT INTO "public"."parkingSpots" ("id", "coordinate", "name", "description", "available", "city", "created_at", "updated_at", "covered") VALUES 
('061201d2-c276-4a38-8ccd-d1c1c5ddeff9', ST_SetSRID(ST_MakePoint(20.14599102958507, 46.2505772555628), 4326), 'Dugonics tér - Somogyi utca Parkoló', '8 szabad hely', true, 'Szeged', '2025-06-29 09:18:40.832655+00', '2025-06-29 09:18:40.832655+00', false),
('1273b1e8-1f90-4c9a-a582-c6875a07e90a', ST_SetSRID(ST_MakePoint(20.152801539892348, 46.25410303535427), 4326), 'Stefánia tér Parkoló', '8 szabad hely', true, 'Szeged', '2025-06-29 08:50:08.323681+00', '2025-06-29 08:50:08.323681+00', false),
('213aaf9c-e117-419f-b1c2-3039ded03c67', ST_SetSRID(ST_MakePoint(20.11036345806334, 46.23720373023432), 4326), 'Szabakai út - Kecskéstelep Parkoló', '6 szabad hely', true, 'Szeged', '2025-06-29 15:26:33.374903+00', '2025-06-29 15:26:33.374903+00', false),
('28167dde-3501-453d-945f-18c505c4d7f2', ST_SetSRID(ST_MakePoint(20.154931100200468, 46.255396781663414), 4326), 'Körösy Iskola Parkoló', '8 szabad hely', true, 'Szeged', '2025-06-29 08:52:59.88118+00', '2025-06-29 08:52:59.88118+00', false),
('29ef5699-84e7-4fa7-ad96-48a505a513dd', ST_SetSRID(ST_MakePoint(20.139190820019213, 46.26939946357344), 4326), 'Tesco Extra Parkoló', '120 szabad hely', true, 'Szeged', '2025-06-27 15:12:36.16156+00', '2025-06-27 15:12:36.16156+00', false),
('45eaf8f3-f070-4155-9836-0d4925d9bd5b', ST_SetSRID(ST_MakePoint(20.147997067847594, 46.2536547208774), 4326), 'Széchenyi tér Parkoló', '20 szabad hely', true, 'Szeged', '2025-06-27 15:12:36.16156+00', '2025-06-27 15:12:36.16156+00', false),
('4838ba8a-f53b-4c6b-b496-a0ae0de02efb', ST_SetSRID(ST_MakePoint(20.147997067847594, 46.253761777315056), 4326), 'Gutenbeg utca Parkoló', '4 szabad hely', true, 'Szeged', '2025-06-30 12:53:22.000773+00', '2025-06-30 12:53:22.000773+00', false),
('4c0131bd-9a4e-4f70-b98a-98191b6d032c', ST_SetSRID(ST_MakePoint(20.14592394289778, 46.249518421386554), 4326), 'Nagyáruház Parkoló', '18 szabd hely', true, 'Szeged', '2025-06-29 09:03:47.386027+00', '2025-06-29 09:03:47.386027+00', false),
('78207bc1-9216-442f-b4a9-3d44b4c5d7a4', ST_SetSRID(ST_MakePoint(20.112364456334735, 46.23803707654547), 4326), 'Kecskés patika Parkoló', '12 szabad hely', true, 'Szeged', '2025-06-29 15:28:50.627071+00', '2025-06-29 15:28:50.627071+00', true),
('92893f60-678c-4842-a9bb-b24f668f54b7', ST_SetSRID(ST_MakePoint(20.15171918313715, 46.25229722022321), 4326), 'Móra Ferenc múzeum Parkoló', '12 szabad hely', true, 'Szeged', '2025-06-29 08:47:54.79691+00', '2025-06-29 08:47:54.79691+00', false),
('9361f21e-48cd-44be-9e9a-4786aeb06879', ST_SetSRID(ST_MakePoint(20.144938709204364, 46.25045395642796), 4326), 'Dugonics tér Parkoló', '48 szabad hely', true, 'Szeged', '2025-06-27 15:12:36.16156+00', '2025-06-27 15:12:36.16156+00', false),
('ae90aa52-5b87-42fd-a6e3-ba782c46dcb4', ST_SetSRID(ST_MakePoint(20.14861654289801, 46.24928467401436), 4326), 'Somogyi könyvár Parkoló', '20 szabad hely', false, 'Szeged', '2025-06-27 15:12:36.16156+00', '2025-06-27 15:12:36.16156+00', false),
('c18a0ea4-c4de-439f-9f8e-2cdcb785dc93', ST_SetSRID(ST_MakePoint(20.146550914750367, 46.25048345694075), 4326), 'Somogyi utca - KFC Parkoló', '8 szabad hely', true, 'Szeged', '2025-06-29 09:21:42.211883+00', '2025-06-29 09:21:42.211883+00', false),
('cfbf0696-5d8f-4786-b309-8a1a354bd177', ST_SetSRID(ST_MakePoint(20.147187351097614, 46.250290874196885), 4326), 'Somogyi utca - 7-es megálló Parkoló', '10 szabad hely', true, 'Szeged', '2025-06-29 09:23:44.884742+00', '2025-06-29 09:23:44.884742+00', false),
('d87c3b0e-3e17-40dc-a675-712113a085aa', ST_SetSRID(ST_MakePoint(20.146893065982383, 46.25011550549756), 4326), 'Toldy utca Parkoló', '12 szabad hely', true, 'Szeged', '2025-06-29 09:33:25.885801+00', '2025-06-29 09:33:25.885801+00', false),
('e7e0da35-f7a0-4171-b192-43e8acb5808c', ST_SetSRID(ST_MakePoint(20.149052995604777, 46.252283345180885), 4326), 'Tündérkonyha Parkoló', '18 szabad hely', true, 'Szeged', '2025-06-29 08:56:05.179365+00', '2025-06-29 08:56:05.179365+00', false);

-- Insert repair station data
INSERT INTO "public"."repairStation" ("id", "coordinate", "name", "description", "available", "covered", "free", "city", "pictureUrl") VALUES 
('196be852-69c9-4536-ae33-547a84aab153', ST_SetSRID(ST_MakePoint(20.15905651566589, 46.24520654542345), 4326), 'Bike Repair Station', 'Csanádi utcai pumpa', true, false, true, 'Szeged', 'https://lh5.googleusercontent.com/p/AF1QipN3sTmkLmvgCQ5XAJr3Emf-zis521ejdDxf-kav=w1220-h920-k-no'),
('3cba5208-3b6c-412d-bbd6-0ac84d2e51ec', ST_SetSRID(ST_MakePoint(20.158353272391235, 46.256308245365986), 4326), 'Bike repair station', 'Ifjúsági ház főbejárata mellett', true, true, true, 'Szeged', 'https://scontent-muc2-1.xx.fbcdn.net/v/t1.6435-9/117204274_1587001678171978_5785526383866642686_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=QnZG7O-chqQQ7kNvwF8lxek&_nc_oc=AdmcrW7sk8A2YQ4tvJeBmvnoQDUpxtFBnIMkKbTzzca-7XfNm5fxrnm6FpdUY6Yj7hPJRWAmMLgWhGh213T8RgpA&_nc_zt=23&_nc_ht=scontent-muc2-1.xx&_nc_gid=610ijU2Be-bz8dwU9SpgCA&oh=00_AfPuBgc9MgPhxcvMw46JsXuVbQ9fYYqDl5GQqPYVXzadeA&oe=68827B65'),
('95c620d0-d130-48ff-bad4-c717b120d9ed', ST_SetSRID(ST_MakePoint(20.144946357669607, 46.250504557425955), 4326), 'Kerekpár pumpa és szerszámok', 'Dugonics téri javitó szerszámok és pumpa', true, true, true, 'Szeged', 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4nordt9eiHtvWzEQoZGuZ46wKghasQQeoKs43_h2Ia3CVwrZNHC-ESUCUAjiIXNUQWZf-FJeA-Ezt1nJnXV9OJrQIkulOz5UGYwHzlO380GzslKAXTqfHylntYECsOGky-7Nhh4aEQ=s680-w680-h510-rw'),
('f7b68f1e-1234-4abc-9876-0f8e1f4c1234', ST_SetSRID(ST_MakePoint(19.691276, 46.906183), 4326), 'Fake', 'Test repair station in Kecskemét', true, false, true, 'Kecskemét', 'https://example.com/fake_station.jpg');

-- Optimized functions for fetching all data
CREATE OR REPLACE FUNCTION get_all_parking_spots()
RETURNS TABLE(
    id uuid, name text, description text, available boolean, covered boolean, city text,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, created_at timestamptz, updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT ps.id, ps.name, ps.description, ps.available, ps.covered, ps.city,
           ST_Y(ps.coordinate), ST_X(ps.coordinate), ps.created_at, ps.updated_at
    FROM "public"."parkingSpots" ps
    ORDER BY ps.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_all_repair_stations()
RETURNS TABLE(
    id uuid, name text, description text, available boolean, covered boolean, free boolean, city text, "pictureUrl" text,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, created_at timestamptz, updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT rs.id, rs.name, rs.description, rs.available, rs.covered, rs.free, rs.city, rs."pictureUrl",
           ST_Y(rs.coordinate), ST_X(rs.coordinate), rs.created_at, rs.updated_at
    FROM "public"."repairStation" rs
    ORDER BY rs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Optimized proximity search functions
CREATE OR REPLACE FUNCTION find_nearby_parking_spots(
    user_lat DOUBLE PRECISION, user_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000, only_available BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id uuid, name text, description text, available boolean, covered boolean, city text,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT ps.id, ps.name, ps.description, ps.available, ps.covered, ps.city,
           ST_Y(ps.coordinate), ST_X(ps.coordinate),
           ST_Distance(ps.coordinate::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)
    FROM "public"."parkingSpots" ps
    WHERE ST_DWithin(ps.coordinate::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_meters)
      AND (NOT only_available OR ps.available = true)
    ORDER BY ps.coordinate <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_nearby_repair_stations(
    user_lat DOUBLE PRECISION, user_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000, only_available BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id uuid, name text, description text, available boolean, covered boolean, free boolean, city text, "pictureUrl" text,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT rs.id, rs.name, rs.description, rs.available, rs.covered, rs.free, rs.city, rs."pictureUrl",
           ST_Y(rs.coordinate), ST_X(rs.coordinate),
           ST_Distance(rs.coordinate::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)
    FROM "public"."repairStation" rs
    WHERE ST_DWithin(rs.coordinate::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_meters)
      AND (NOT only_available OR rs.available = true)
    ORDER BY rs.coordinate <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326);
END;
$$ LANGUAGE plpgsql; 