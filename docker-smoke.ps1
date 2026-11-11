param(
    [Parameter(Mandatory = $true)]
    [string]$Image
)

$ErrorActionPreference = 'Stop'

$expectedStore = & node -p "require('./store.js').id"
if ($LASTEXITCODE -ne 0 -or -not $expectedStore) {
    throw 'Could not read the store ID from store.js.'
}

$container = & docker run --detach --publish '127.0.0.1::8080' $Image
if ($LASTEXITCODE -ne 0 -or -not $container) {
    throw 'Docker could not start the test container.'
}

try {
    $address = & docker port $container '8080/tcp'
    if ($LASTEXITCODE -ne 0 -or $address -notmatch '^127\.0\.0\.1:\d+$') {
        throw 'Could not find the container’s local port.'
    }

    $baseUrl = "http://$address"
    $health = $null

    for ($attempt = 1; $attempt -le 20; $attempt++) {
        try {
            $health = Invoke-RestMethod "$baseUrl/health" -TimeoutSec 2
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    if ($health.status -ne 'ok' -or $health.store -ne $expectedStore) {
        throw "Health check failed for $expectedStore."
    }

    $products = Invoke-RestMethod "$baseUrl/api/products" -TimeoutSec 5
    if ($products.Count -ne 6) {
        throw "Expected six products. Received $($products.Count)."
    }

    Write-Host "Health check passed for $expectedStore."
    Write-Host "Product API returned $($products.Count) products."
} catch {
    & docker logs $container
    throw
} finally {
    & docker rm --force $container | Out-Null
}