$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path -LiteralPath ".env")) {
  Copy-Item -LiteralPath ".env.example" -Destination ".env"
}

docker compose up -d mysql
npm run dev

Pop-Location
