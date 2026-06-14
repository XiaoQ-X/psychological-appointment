$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent $PSScriptRoot)

docker compose up -d mysql
docker compose exec -T mysql mysql -uroot -proot_password -e "DROP DATABASE IF EXISTS anxin_psychology; CREATE DATABASE anxin_psychology CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; DROP DATABASE IF EXISTS anxin_shadow; CREATE DATABASE anxin_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON anxin_psychology.* TO 'anxin'@'%'; FLUSH PRIVILEGES;"

npm run db:migrate
npm run db:seed

Pop-Location
