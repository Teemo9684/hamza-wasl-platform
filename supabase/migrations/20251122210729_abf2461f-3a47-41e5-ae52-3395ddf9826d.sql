-- Add support for multiple attachments in homework table
-- First, add a new column for multiple attachments
ALTER TABLE homework ADD COLUMN IF NOT EXISTS attachments text[];

-- Migrate existing single attachment_url to attachments array
UPDATE homework 
SET attachments = ARRAY[attachment_url] 
WHERE attachment_url IS NOT NULL AND attachments IS NULL;

-- Create a comment to document the change
COMMENT ON COLUMN homework.attachments IS 'Array of URLs for homework attachments (supports multiple files)';
COMMENT ON COLUMN homework.attachment_url IS 'Deprecated: Use attachments array instead. Kept for backward compatibility.';