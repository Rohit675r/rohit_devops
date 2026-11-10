param([ValidateSet('staging','production')][string]$Environment='staging',[ValidateSet('docker-desktop','minikube')][string]$Context='docker-desktop')
$ErrorActionPreference='Stop'
$config=Get-Content -LiteralPath (Join-Path $PSScriptRoot '../catalog.json') -Raw | ConvertFrom-Json
$slug=$config.slug; $namespace="$slug-$Environment"; $image=$env:IMAGE_TAG
if(-not $image -or $image -notmatch '^[a-z0-9._/-]+:[a-zA-Z0-9._-]+$'){throw 'Set IMAGE_TAG to the published Docker Hub image tag.'}
function Kube { & kubectl --context $Context @args; if($LASTEXITCODE -ne 0){throw 'kubectl command failed.'} }
Kube cluster-info
@{apiVersion='v1';kind='Namespace';metadata=@{name=$namespace}} | ConvertTo-Json -Depth 10 | & kubectl --context $Context apply -f -
if($LASTEXITCODE -ne 0){throw 'Namespace setup failed.'}
$resources=@(
 @{apiVersion='v1';kind='PersistentVolumeClaim';metadata=@{name='mongo-data';namespace=$namespace};spec=@{accessModes=@('ReadWriteOnce');resources=@{requests=@{storage='1Gi'}}}},
 @{apiVersion='apps/v1';kind='Deployment';metadata=@{name='mongo';namespace=$namespace};spec=@{replicas=1;strategy=@{type='Recreate'};selector=@{matchLabels=@{app='mongo'}};template=@{metadata=@{labels=@{app='mongo'}};spec=@{containers=@(@{name='mongo';image='mongo:7';ports=@(@{containerPort=27017});resources=@{requests=@{cpu='100m';memory='256Mi'};limits=@{cpu='500m';memory='512Mi'}};volumeMounts=@(@{name='data';mountPath='/data/db'})});volumes=@(@{name='data';persistentVolumeClaim=@{claimName='mongo-data'}})}}}},
 @{apiVersion='v1';kind='Service';metadata=@{name='mongo';namespace=$namespace};spec=@{selector=@{app='mongo'};ports=@(@{port=27017;targetPort=27017})}},
 @{apiVersion='v1';kind='Secret';metadata=@{name='mongo-uri';namespace=$namespace};type='Opaque';stringData=@{uri="mongodb://mongo:27017/$namespace"}}
)
@{apiVersion='v1';kind='List';items=$resources} | ConvertTo-Json -Depth 30 | & kubectl --context $Context apply -f -
if($LASTEXITCODE -ne 0){throw 'MongoDB resources failed.'}
Kube -n $namespace rollout status deployment/mongo --timeout=180s
$active=& kubectl --context $Context -n $namespace get service $slug -o 'jsonpath={.spec.selector.color}' --ignore-not-found
if($LASTEXITCODE -ne 0){throw 'Cannot read the current production/staging service.'}
$color=if($active -eq 'green'){'blue'}else{'green'}
function Render([string]$File){(Get-Content -LiteralPath $File -Raw).Replace('${APP}',$slug).Replace('${COLOR}',$color).Replace('${NAMESPACE}',$namespace).Replace('${IMAGE}',$image)}
Render (Join-Path $PSScriptRoot 'k8s/deployment.yaml') | & kubectl --context $Context apply -f -
if($LASTEXITCODE -ne 0){throw 'Candidate deployment failed.'}
Kube -n $namespace rollout status "deployment/$slug-$color" --timeout=180s
$port=6202
$forward=Start-Process -FilePath (Get-Command kubectl).Source -ArgumentList @('--context',$Context,'-n',$namespace,'port-forward',"service/$slug-candidate","${port}:80") -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $env:WORKSPACE 'k8s-forward.stdout.log') -RedirectStandardError (Join-Path $env:WORKSPACE 'k8s-forward.stderr.log')
try {
 $ready=$false;for($i=0;$i -lt 30;$i++){try{$health=Invoke-RestMethod "http://127.0.0.1:$port/health" -TimeoutSec 2;if($health.status -eq 'ok' -and $health.storage -eq 'mongodb'){$ready=$true;break}}catch{};Start-Sleep -Seconds 1}
 if(-not $ready){throw 'Candidate health check failed.'}
 $env:BASE_URL="http://127.0.0.1:$port"; & npm.cmd run test:e2e
 if($LASTEXITCODE -ne 0){throw 'Candidate Selenium checkout failed; active service unchanged.'}
 Render (Join-Path $PSScriptRoot 'k8s/service.yaml') | & kubectl --context $Context apply -f -
 if($LASTEXITCODE -ne 0){throw 'Traffic switch failed.'}
 Write-Output "Promoted $Environment to $color. Previous color: $active. Old deployment retained for rollback."
} finally {if(-not $forward.HasExited){Stop-Process -Id $forward.Id -ErrorAction SilentlyContinue}}
