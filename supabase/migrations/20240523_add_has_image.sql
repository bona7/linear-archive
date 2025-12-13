-- Add has_image column to board table
ALTER TABLE board ADD COLUMN has_image BOOLEAN DEFAULT FALSE;

-- Policy (optional, if RLS needs update, usually strictly typed columns don't need new policies if the table is already covered, but good to know)
-- Result:
-- All existing rows will have has_image = FALSE.
-- You will need to run the backfill script to verify actual image existence.
