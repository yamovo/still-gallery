<# 
  Image Gallery Server
  Usage: Right-click -> Run with PowerShell
#>

$port = 3456
$url = "http://localhost:$port/"

# Open browser
Start-Process $url

# Simple HTTP server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host ""
Write-Host "========================================"
Write-Host "   Image Gallery Server"
Write-Host "========================================"
Write-Host ""
Write-Host "URL: $url"
Write-Host "Press Ctrl+C to stop"
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path $PSScriptRoot ($localPath.TrimStart("/").Replace("/", "\"))
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentTypes = @{
                ".html" = "text/html"
                ".css"  = "text/css"
                ".js"   = "application/javascript"
                ".json" = "application/json"
                ".png"  = "image/png"
                ".jpg"  = "image/jpeg"
                ".jpeg" = "image/jpeg"
                ".gif"  = "image/gif"
                ".webp" = "image/webp"
                ".svg"  = "image/svg+xml"
                ".ico"  = "image/x-icon"
            }
            $contentType = if ($contentTypes.ContainsKey($ext)) { $contentTypes[$ext] } else { "application/octet-stream" }
            
            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        
        $response.Close()
        Write-Host "$($request.HttpMethod) $localPath -> $($response.StatusCode)"
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped."
}
