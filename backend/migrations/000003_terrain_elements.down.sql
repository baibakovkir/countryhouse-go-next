ALTER TABLE plot_objects DROP COLUMN IF EXISTS properties;
ALTER TABLE plot_objects DROP COLUMN IF EXISTS points;
ALTER TABLE plot_objects DROP COLUMN IF EXISTS geometry;
ALTER TABLE plot_objects DROP CONSTRAINT IF EXISTS plot_objects_type_check;
ALTER TABLE plot_objects ADD CONSTRAINT plot_objects_type_check CHECK (type IN ('building','garden_bed','tree'));
