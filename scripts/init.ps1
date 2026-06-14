$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path -LiteralPath ".env")) {
  Copy-Item -LiteralPath ".env.example" -Destination ".env"
}

npm install

docker compose up -d mysql

$deadline = (Get-Date).AddSeconds(120)
do {
  $status = docker inspect --format='{{.State.Health.Status}}' anxin-psychology-mysql 2>$null
  if ($status -eq "healthy") { break }
  Start-Sleep -Seconds 3
} while ((Get-Date) -lt $deadline)

docker compose exec -T mysql mysql -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS anxin_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS anxin_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON anxin_test.* TO 'anxin'@'%'; FLUSH PRIVILEGES;"

npm run db:migrate
npm run db:seed

Pop-Location
