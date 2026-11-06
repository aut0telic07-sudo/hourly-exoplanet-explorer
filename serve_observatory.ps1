$Port = 8765
$Root = "C:\Users\mmass\.gemini\antigravity\scratch\exoplanet-explorer"
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Prefixes.Add("http://127.0.0.1:$Port/")
$Listener.Start()
Write-Host "ASTRONAV // EXO-COMMAND v4.2 Web Server listening on http://localhost:$Port/"

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
}

while ($Listener.IsListening) {
    try {
        $Context  = $Listener.GetContext()
        $Request  = $Context.Request
        $Response = $Context.Response

        $RelPath = $Request.Url.AbsolutePath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($RelPath)) {
            $RelPath = "index.html"
        }
        $RelPath = $RelPath.Replace('/', '\')
        $FullPath = Join-Path $Root $RelPath

        if (Test-Path $FullPath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FullPath).ToLower()
            $Response.ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
            $Bytes = [System.IO.File]::ReadAllBytes($FullPath)
            $Response.ContentLength64 = $Bytes.Length
            $Response.StatusCode = 200
            if ($Request.HttpMethod -ne "HEAD") {
                $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            }
        } else {
            $Response.StatusCode = 404
        }
        $Response.Close()
    } catch {
        Start-Sleep -Milliseconds 100
    }
}
