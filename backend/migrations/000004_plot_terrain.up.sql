ALTER TABLE plots ADD COLUMN terrain_points jsonb NOT NULL DEFAULT '[]'::jsonb;
