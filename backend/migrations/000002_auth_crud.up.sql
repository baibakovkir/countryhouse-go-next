CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email)))
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email));

CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM plots) THEN
        INSERT INTO users (id, email, password_hash)
        VALUES ('00000000-0000-0000-0000-000000000001', 'legacy-owner@invalid.local', '!bootstrap-required!');
    END IF;
END $$;

ALTER TABLE plots ADD COLUMN owner_id uuid REFERENCES users(id) ON DELETE CASCADE;
UPDATE plots SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE plots ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE plots ADD COLUMN name text NOT NULL DEFAULT 'Мой участок';
ALTER TABLE plots ADD CONSTRAINT plots_name_not_blank CHECK (length(btrim(name)) > 0);
CREATE INDEX plots_owner_idx ON plots(owner_id, created_at);

ALTER TABLE expenses ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE timeline_tasks ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
