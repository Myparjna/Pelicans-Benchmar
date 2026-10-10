$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root '02-TempFiles\pelican-shots'
$base = 'http://127.0.0.1:9300'
$page = $base + '/seed-2.1-pro-0915-20261005.html'
$port = 9361

# 新建空白标签页，再通过 CDP 导航
$new = Invoke-WebRequest -Method Put -UseBasicParsing -Uri ("http://127.0.0.1:{0}/json/new" -f $port)
$target = $new.Content | ConvertFrom-Json
$wsUrl = $target.webSocketDebuggerUrl
Write-Output ("target: " + $target.id)

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$ws.Options.SetRequestHeader('Origin', 'http://127.0.0.1:' + $port)
$ws.ConnectAsync([Uri]$wsUrl, [Threading.CancellationToken]::None).Wait()

function Send-Cdp($obj) {
  $json = ($obj | ConvertTo-Json -Depth 12 -Compress)
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $seg = [ArraySegment[byte]]::new($bytes)
  $script:ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).Wait()
}

function Recv-ById($wantId) {
  while ($true) {
    $ms = New-Object System.IO.MemoryStream
    do {
      $buf = New-Object byte[] 16384
      $seg = [ArraySegment[byte]]::new($buf)
      $r = $script:ws.ReceiveAsync($seg, [Threading.CancellationToken]::None).Result
      $ms.Write($buf, 0, $r.Count)
    } while (-not $r.EndOfMessage)
    $txt = [Text.Encoding]::UTF8.GetString($ms.ToArray())
    try { $o = $txt | ConvertFrom-Json } catch { continue }
    if ($o.id -eq $wantId) { return $o }
  }
}

$seq = 0
function Call($method, $params) {
  $script:seq++
  Send-Cdp @{ id = $script:seq; method = $method; params = $params }
  return (Recv-ById $script:seq)
}

function Shot($name) {
  $r = Call 'Page.captureScreenshot' @{ format = 'png' }
  $path = Join-Path $script:out $name
  [IO.File]::WriteAllBytes($path, [Convert]::FromBase64String($r.result.data))
  Write-Output ("saved " + $name)
}

Call 'Page.enable' @{} | Out-Null
Call 'Page.navigate' @{ url = $page } | Out-Null
Start-Sleep -Milliseconds 2600
Shot 'r-land-sunny.png'
Start-Sleep -Milliseconds 5300
Shot 'r-land-cloudy.png'
Start-Sleep -Milliseconds 5300
Shot 'r-land-rainy.png'
Start-Sleep -Milliseconds 5300
Shot 'r-land-sunny2.png'

# 竖屏模拟
Call 'Emulation.setDeviceMetricsOverride' @{ width = 390; height = 844; deviceScaleFactor = 1; mobile = $true } | Out-Null
Call 'Page.reload' @{} | Out-Null
Start-Sleep -Milliseconds 2200
Shot 'r-port-sunny.png'
Start-Sleep -Milliseconds 5300
Shot 'r-port-cloudy.png'
Start-Sleep -Milliseconds 5300
Shot 'r-port-rainy.png'

$ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done', [Threading.CancellationToken]::None).Wait()
Write-Output 'all-done'
