param([Parameter(Mandatory=$true)][ValidateSet('Tools','Install','Test','Build','Image','Run','Browser','Publish')][string]$Task)
$ErrorActionPreference='Stop'
$config=Get-Content -LiteralPath (Join-Path $PSScriptRoot '../catalog.json') -Raw | ConvertFrom-Json
$slug=$config.slug
function Check-Exit([string]$Message) { if ($LASTEXITCODE -ne 0) { throw "$Message (exit $LASTEXITCODE)" } }
switch ($Task) {
 'Tools' {
   & node --version; Check-Exit 'Node missing'
   & npm.cmd --version; Check-Exit 'npm missing'
   & git --version; Check-Exit 'Git missing'
   if ($env:RUN_DOCKER -eq 'true') { & docker info --format '{{.ServerVersion}}'; Check-Exit 'Docker engine unavailable. Start Docker Desktop and verify WSL 2.' }
 }
 'Install' { $env:NODE_ENV='development'; & npm.cmd ci --no-fund; Check-Exit 'Package installation failed' }
 'Test' { $env:NODE_ENV='test'; & npm.cmd test; Check-Exit 'Jest tests failed' }
 'Build' { $env:NODE_ENV='production'; & npm.cmd run build; Check-Exit 'Frontend build failed' }
 'Image' { & docker build -t $env:IMAGE_TAG .; Check-Exit 'Docker image build failed' }
 'Run' {
   $network="$slug-ci"; $database="$slug-ci-mongo"; $container="$slug-ci-app"
   & docker network inspect $network *> $null
   if ($LASTEXITCODE -ne 0) { & docker network create $network; Check-Exit 'Network creation failed' }
   $existing=& docker ps -a --filter "name=^/$database$" --format '{{.Names}}'; Check-Exit 'Database inspection failed'
   if ($existing -eq $database) { & docker start $database; Check-Exit 'Database start failed' }
   else { & docker run -d --name $database --network $network -v "${slug}-ci-mongo-data:/data/db" mongo:7; Check-Exit 'Database creation failed' }
   $ready=$false
   for($i=0;$i -lt 30;$i++) { & docker exec $database mongosh --quiet --eval "db.adminCommand('ping').ok" *> $null; if($LASTEXITCODE -eq 0){$ready=$true;break}; Start-Sleep -Seconds 2 }
   if(-not $ready){throw 'MongoDB did not become ready.'}
   $existing=& docker ps -a --filter "name=^/$container$" --format '{{.Names}}'; Check-Exit 'App inspection failed'
   if($existing -eq $container){& docker rm -f $container;Check-Exit 'Old CI app container removal failed'}
   & docker run -d --name $container --network $network -p "127.0.0.1:$($env:STAGING_PORT):8080" -e "MONGODB_URI=mongodb://${database}:27017/$slug" -e RELEASE_COLOR=ci $env:IMAGE_TAG
   Check-Exit 'App container failed to start'
   $healthy=$false
   for($i=0;$i -lt 40;$i++){try{$health=Invoke-RestMethod "http://127.0.0.1:$($env:STAGING_PORT)/health" -TimeoutSec 3;if($health.status -eq 'ok' -and $health.storage -eq 'mongodb' -and $health.app -eq $slug){$healthy=$true;break}}catch{};Start-Sleep -Seconds 2}
   if(-not $healthy){& docker logs $container;throw 'Container health check failed.'}
   $products=Invoke-RestMethod "http://127.0.0.1:$($env:STAGING_PORT)/api/products"
   if($products.Count -ne 6){throw 'Expected six products.'}
   Write-Output 'Container is healthy; MongoDB connected; six products returned.'
 }
 'Browser' { $env:BASE_URL="http://127.0.0.1:$($env:STAGING_PORT)"; & npm.cmd run test:e2e; Check-Exit 'Selenium checks failed' }
 'Publish' {
   if(-not $env:DOCKER_USER -or -not $env:DOCKER_TOKEN){throw 'Add the dockerhub username/password credential in Jenkins (use a Docker Hub access token as password).'}
   $previousConfig=$env:DOCKER_CONFIG
   $authDir=Join-Path ([System.IO.Path]::GetTempPath()) ('devops-docker-auth-'+[guid]::NewGuid().ToString('N'))
   New-Item -ItemType Directory -Path $authDir | Out-Null
   $env:DOCKER_CONFIG=$authDir
   try {
     $env:DOCKER_TOKEN | & docker login --username $env:DOCKER_USER --password-stdin; Check-Exit 'Docker Hub login failed'
     & docker push $env:IMAGE_TAG; Check-Exit 'Image push failed'
   } finally {
     & docker logout *> $null
     $env:DOCKER_CONFIG=$previousConfig
     Remove-Item -LiteralPath (Join-Path $authDir 'config.json') -Force -ErrorAction SilentlyContinue
     Remove-Item -LiteralPath $authDir -ErrorAction SilentlyContinue
   }
 }
}
