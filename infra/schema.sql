CREATE TYPE status_enum AS ENUM ('pend', 'apprv', 'flag');

CREATE TABLE questions (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txt  TEXT NOT NULL,
  stat status_enum NOT NULL DEFAULT 'pend',
  gid  UUID REFERENCES questions(id),
  ts   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)