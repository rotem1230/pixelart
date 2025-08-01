-- Migration script to update user IDs to consistent hash-based values
-- Run this in Supabase SQL Editor

-- The new consistent IDs are:
-- pixelartvj@gmail.com -> user_1544803905 (hash of email)
-- pixeloffice2025@gmail.com -> user_1882459111 (hash of email)

-- First, clean up any duplicate entries that might cause conflicts
DELETE FROM user_data
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, entity_name, entity_id
      ORDER BY updated_at DESC
    ) as rn
    FROM user_data
  ) t WHERE rn > 1
);

-- Update user_data table to use new consistent user IDs (only if target doesn't exist)
UPDATE user_data
SET user_id = 'user_1544803905'
WHERE user_id IN ('admin_1', '1753961919673', 'pixelartvj_fixed_id')
  AND user_id != 'user_1544803905'
  AND NOT EXISTS (
    SELECT 1 FROM user_data ud2
    WHERE ud2.user_id = 'user_1544803905'
    AND ud2.entity_name = user_data.entity_name
    AND ud2.entity_id = user_data.entity_id
  );

UPDATE user_data
SET user_id = 'user_1882459111'
WHERE user_id IN ('admin_2', 'pixeloffice2025_fixed_id')
  AND user_id != 'user_1882459111'
  AND NOT EXISTS (
    SELECT 1 FROM user_data ud2
    WHERE ud2.user_id = 'user_1882459111'
    AND ud2.entity_name = user_data.entity_name
    AND ud2.entity_id = user_data.entity_id
  );

-- Update users table to use new consistent IDs (only if target doesn't exist)
UPDATE users
SET id = 'user_1544803905'
WHERE email = 'pixelartvj@gmail.com'
  AND id IN ('admin_1', '1753961919673', 'pixelartvj_fixed_id')
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = 'user_1544803905');

UPDATE users
SET id = 'user_1882459111'
WHERE email = 'pixeloffice2025@gmail.com'
  AND id IN ('admin_2', 'pixeloffice2025_fixed_id')
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = 'user_1882459111');

-- Insert new users with consistent IDs if they don't exist
INSERT INTO users (id, email, password, name, role) VALUES
('user_1544803905', 'pixelartvj@gmail.com', 'yvj{89kN$2.8', 'Pixel Art VJ', 'admin'),
('user_1882459111', 'pixeloffice2025@gmail.com', 'b)W17,>1@Z2C', 'Pixel Office 2025', 'user')
ON CONFLICT (id) DO NOTHING;

-- Copy data from old user IDs to new consistent IDs if needed
INSERT INTO user_data (user_id, entity_name, entity_id, data, updated_at)
SELECT 'user_1544803905', entity_name, entity_id, data, updated_at
FROM user_data
WHERE user_id IN ('admin_1', '1753961919673', 'pixelartvj_fixed_id')
  AND NOT EXISTS (
    SELECT 1 FROM user_data ud2
    WHERE ud2.user_id = 'user_1544803905'
    AND ud2.entity_name = user_data.entity_name
    AND ud2.entity_id = user_data.entity_id
  );

INSERT INTO user_data (user_id, entity_name, entity_id, data, updated_at)
SELECT 'user_1882459111', entity_name, entity_id, data, updated_at
FROM user_data
WHERE user_id IN ('admin_2', 'pixeloffice2025_fixed_id')
  AND NOT EXISTS (
    SELECT 1 FROM user_data ud2
    WHERE ud2.user_id = 'user_1882459111'
    AND ud2.entity_name = user_data.entity_name
    AND ud2.entity_id = user_data.entity_id
  );

-- Clean up old user data (optional - uncomment if you want to remove old data)
-- DELETE FROM user_data WHERE user_id IN ('admin_1', 'admin_2', '1753961919673', 'pixelartvj_fixed_id', 'pixeloffice2025_fixed_id');
-- DELETE FROM users WHERE id IN ('admin_1', 'admin_2', '1753961919673', 'pixelartvj_fixed_id', 'pixeloffice2025_fixed_id');

SELECT 'Migration completed successfully!' as status;
