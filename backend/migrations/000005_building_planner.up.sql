CREATE TABLE buildings (
    plot_object_id uuid PRIMARY KEY REFERENCES plot_objects(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('house','garage','bathhouse','outbuilding','custom')),
    roof_type text NOT NULL CHECK (roof_type IN ('gable','hip','flat','shed')),
    wall_material text NOT NULL CHECK (wall_material IN ('wood','brick','block','siding','custom')),
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE building_floors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id uuid NOT NULL REFERENCES buildings(plot_object_id) ON DELETE CASCADE,
    level integer NOT NULL CHECK (level BETWEEN 1 AND 5),
    name text NOT NULL CHECK (length(btrim(name)) > 0),
    height double precision NOT NULL CHECK (height > 0 AND height <= 10),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (building_id, level)
);

CREATE TABLE floor_elements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id uuid NOT NULL REFERENCES building_floors(id) ON DELETE CASCADE,
    catalog_key text NOT NULL,
    category text NOT NULL CHECK (category IN ('room','wall','opening','furniture','equipment','utility','custom')),
    name text NOT NULL CHECK (length(btrim(name)) > 0),
    x double precision NOT NULL,
    y double precision NOT NULL,
    width double precision NOT NULL CHECK (width > 0),
    length double precision NOT NULL CHECK (length > 0),
    height double precision NOT NULL CHECK (height >= 0),
    rotation double precision NOT NULL DEFAULT 0,
    geometry text NOT NULL DEFAULT 'footprint' CHECK (geometry IN ('footprint','polyline','polygon')),
    points jsonb NOT NULL DEFAULT '[]'::jsonb,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX building_floors_building_idx ON building_floors(building_id, level);
CREATE INDEX floor_elements_floor_idx ON floor_elements(floor_id, created_at);
