ALTER TABLE plot_objects DROP CONSTRAINT IF EXISTS plot_objects_type_check;
ALTER TABLE plot_objects ADD CONSTRAINT plot_objects_type_check CHECK (type IN ('building','garden_bed','tree','terrace','stairs','utility','custom'));
ALTER TABLE plot_objects ADD COLUMN IF NOT EXISTS geometry text NOT NULL DEFAULT 'footprint' CHECK (geometry IN ('footprint','polyline','polygon'));
ALTER TABLE plot_objects ADD COLUMN IF NOT EXISTS points jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE plot_objects ADD COLUMN IF NOT EXISTS properties jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE plot_objects DROP CONSTRAINT IF EXISTS plot_objects_z_check;
ALTER TABLE plot_objects ADD CONSTRAINT plot_objects_z_finite CHECK (z = z AND abs(z) < 'Infinity'::float8);
