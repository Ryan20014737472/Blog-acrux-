param()

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$graphFile = Join-Path $projectRoot 'graphify-out/graph.html'
if (-not (Test-Path -LiteralPath $graphFile)) {
  throw 'Gere graphify-out/graph.html antes de aplicar o tema ACRUX.'
}

$html = [System.IO.File]::ReadAllText($graphFile)
$cssLink = '<link rel="stylesheet" href="acrux-graph.css">'
$scriptTag = '<script src="acrux-graph.js"></script>'
if (-not $html.Contains($cssLink)) {
  $html = $html.Replace('</style>', "</style>`n$cssLink")
}
if (-not $html.Contains($scriptTag)) {
  $html = $html.Replace('</body>', "$scriptTag`n</body>")
}
[System.IO.File]::WriteAllText($graphFile, $html, [System.Text.UTF8Encoding]::new($false))
Write-Output 'Tema ACRUX aplicado ao grafo.'

