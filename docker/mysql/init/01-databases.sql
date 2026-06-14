CREATE DATABASE IF NOT EXISTS anxin_shadow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS anxin_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON anxin_psychology.* TO 'anxin'@'%';
GRANT ALL PRIVILEGES ON anxin_test.* TO 'anxin'@'%';
FLUSH PRIVILEGES;
