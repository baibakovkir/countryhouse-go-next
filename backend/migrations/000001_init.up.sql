CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE plots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    width double precision NOT NULL CHECK (width > 0),
    length double precision NOT NULL CHECK (length > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plot_objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id uuid NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('building', 'garden_bed', 'tree')),
    name text NOT NULL CHECK (length(btrim(name)) > 0),
    x double precision NOT NULL CHECK (x >= 0),
    y double precision NOT NULL CHECK (y >= 0),
    z double precision NOT NULL DEFAULT 0 CHECK (z >= 0),
    width double precision NOT NULL CHECK (width > 0),
    length double precision NOT NULL CHECK (length > 0),
    height double precision NOT NULL DEFAULT 0 CHECK (height >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (plot_id, id)
);

CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id uuid NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    plot_object_id uuid,
    category text NOT NULL CHECK (length(btrim(category)) > 0),
    amount numeric(14,2) NOT NULL CHECK (amount > 0),
    currency char(3) NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
    spent_on date NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT expenses_plot_object_fk FOREIGN KEY (plot_id, plot_object_id)
        REFERENCES plot_objects(plot_id, id) ON DELETE SET NULL (plot_object_id)
);

CREATE TABLE timeline_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id uuid NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (length(btrim(title)) > 0),
    due_date date NOT NULL,
    planned_budget numeric(14,2) CHECK (planned_budget >= 0),
    currency char(3) NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
    description text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX plot_objects_plot_id_idx ON plot_objects(plot_id);
CREATE INDEX expenses_plot_date_idx ON expenses(plot_id, spent_on DESC);
CREATE INDEX expenses_object_idx ON expenses(plot_object_id) WHERE plot_object_id IS NOT NULL;
CREATE INDEX timeline_tasks_plot_date_idx ON timeline_tasks(plot_id, due_date);
