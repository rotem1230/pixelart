# PostgreSQL Setup Script for Windows
Write-Host "🐘 Setting up PostgreSQL for Pixel Art VJ..." -ForegroundColor Green

# Check if PostgreSQL is already installed
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if ($pgPath) {
    Write-Host "✅ PostgreSQL is already installed!" -ForegroundColor Green
} else {
    Write-Host "📥 PostgreSQL not found. Please install it manually:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "2. Or use Chocolatey: choco install postgresql" -ForegroundColor Cyan
    Write-Host "3. Or use Scoop: scoop install postgresql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# Try to connect and setup database
Write-Host "🔧 Setting up database and user..." -ForegroundColor Green

$setupSQL = @"
-- Create user if not exists
DO `$`$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pixelart_user') THEN
      CREATE USER pixelart_user WITH PASSWORD 'pixelart_password';
   END IF;
END
`$`$;

-- Create database if not exists
SELECT 'CREATE DATABASE pixelart_db OWNER pixelart_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pixelart_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pixelart_db TO pixelart_user;
"@

# Save SQL to temp file
$tempSQL = [System.IO.Path]::GetTempFileName() + ".sql"
$setupSQL | Out-File -FilePath $tempSQL -Encoding UTF8

try {
    # Try to run setup as postgres user
    Write-Host "Running database setup..." -ForegroundColor Yellow
    & psql -U postgres -f $tempSQL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 You can now start the server with: npm start" -ForegroundColor Green
    } else {
        Write-Host "❌ Database setup failed. Please run manually:" -ForegroundColor Red
        Write-Host "psql -U postgres" -ForegroundColor Cyan
        Write-Host "Then paste the SQL commands from the setup." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not connect to PostgreSQL. Make sure it's running." -ForegroundColor Red
    Write-Host "Try: net start postgresql-x64-14" -ForegroundColor Cyan
} finally {
    # Clean up temp file
    Remove-Item $tempSQL -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "📋 Manual setup instructions:" -ForegroundColor Yellow
Write-Host "1. Connect to PostgreSQL: psql -U postgres" -ForegroundColor Cyan
Write-Host "2. Create user: CREATE USER pixelart_user WITH PASSWORD 'pixelart_password';" -ForegroundColor Cyan
Write-Host "3. Create database: CREATE DATABASE pixelart_db OWNER pixelart_user;" -ForegroundColor Cyan
Write-Host "4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE pixelart_db TO pixelart_user;" -ForegroundColor Cyan
