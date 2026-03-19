# PowerShell script to manage test database Docker container
# Windows-compatible alternative to docker-test-db.sh

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start', 'stop', 'down', 'logs', 'shell', 'reset', 'status')]
    [string]$Command
)

$ComposeFile = "docker-compose.test.yml"
$ServiceName = "postgres-test"

function Wait-ForDatabase {
    Write-Host "Waiting for database to be ready..." -NoNewline
    $timeout = 30
    $counter = 0
    
    while ($counter -lt $timeout) {
        try {
            $result = docker compose -f $ComposeFile exec -T $ServiceName pg_isready -U postgres -d afenda_test 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                return $true
            }
        } catch {
            # Continue waiting
        }
        
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline
        $counter++
    }
    
    Write-Host ""
    Write-Host "Error: Database failed to start within $timeout seconds" -ForegroundColor Red
    docker compose -f $ComposeFile logs $ServiceName
    return $false
}

switch ($Command) {
    'start' {
        Write-Host "Starting test database container..." -ForegroundColor Cyan
        docker compose -f $ComposeFile up -d $ServiceName
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to start Docker container" -ForegroundColor Red
            exit 1
        }
        
        if (Wait-ForDatabase) {
            Write-Host "✓ Test database is ready!" -ForegroundColor Green
            Write-Host "  Connection string: postgresql://postgres:postgres@localhost:5433/afenda_test" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "  1. pnpm db:migrate    # Apply migrations"
            Write-Host "  2. pnpm test:db:smoke # Run smoke tests"
            Write-Host "  3. pnpm db:studio     # Open Drizzle Studio"
        } else {
            exit 1
        }
    }
    
    'stop' {
        Write-Host "Stopping test database container..." -ForegroundColor Cyan
        docker compose -f $ComposeFile stop $ServiceName
        Write-Host "✓ Test database stopped" -ForegroundColor Green
    }
    
    'down' {
        Write-Host "Stopping and removing test database container..." -ForegroundColor Cyan
        docker compose -f $ComposeFile down
        Write-Host "✓ Test database container removed" -ForegroundColor Green
    }
    
    'logs' {
        docker compose -f $ComposeFile logs -f $ServiceName
    }
    
    'shell' {
        Write-Host "Opening psql shell to test database..." -ForegroundColor Cyan
        docker compose -f $ComposeFile exec $ServiceName psql -U postgres -d afenda_test
    }
    
    'reset' {
        Write-Host "Resetting test database (removing all data)..." -ForegroundColor Cyan
        docker compose -f $ComposeFile down -v
        docker compose -f $ComposeFile up -d $ServiceName
        
        if (Wait-ForDatabase) {
            Write-Host "✓ Test database reset and ready!" -ForegroundColor Green
        } else {
            exit 1
        }
    }
    
    'status' {
        $status = docker compose -f $ComposeFile ps $ServiceName 2>&1
        if ($status -match "Up") {
            Write-Host "✓ Test database is running" -ForegroundColor Green
            docker compose -f $ComposeFile exec -T $ServiceName pg_isready -U postgres -d afenda_test
        } else {
            Write-Host "✗ Test database is not running" -ForegroundColor Red
            Write-Host "Run: pnpm docker:test:start" -ForegroundColor Yellow
            exit 1
        }
    }
}
