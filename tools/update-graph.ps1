param()

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$graphifyCommand = Get-Command graphify -ErrorAction SilentlyContinue
$graphifyPath = if ($graphifyCommand) { $graphifyCommand.Source } else { Join-Path $env:USERPROFILE '.local/bin/graphify.exe' }
if (-not (Test-Path -LiteralPath $graphifyPath)) {
  throw 'Graphify não encontrado. Instale graphifyy ou inclua graphify no PATH.'
}

Push-Location $projectRoot
try {
  & $graphifyPath update .
  if ($LASTEXITCODE -ne 0) { throw "Graphify falhou com código $LASTEXITCODE. O tema não foi aplicado." }
  & (Join-Path $PSScriptRoot 'style-graph.ps1')
} finally {
  Pop-Location
}

