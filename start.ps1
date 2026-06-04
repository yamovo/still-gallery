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
        
        # API: return image list from images/ folder
        if ($localPath -eq "/api/images") {
            $imgDir = Join-Path $PSScriptRoot "images"
            $list = @()
            $meta = @{}
            $metaFile = Join-Path $imgDir "images.json"
            if (Test-Path $metaFile) {
                try {
                    $raw = Get-Content $metaFile -Raw -Encoding UTF8
                    ($raw | ConvertFrom-Json) | ForEach-Object { if ($_.file) { $meta[$_.file] = $_ } }
                } catch {}
            }
            if (Test-Path $imgDir) {
                Get-ChildItem $imgDir -File | Where-Object { $_.Name -match '\.(jpg|jpeg|png|gif|webp|svg)$' } | Sort-Object Name | ForEach-Object {
                    $m = if ($meta.ContainsKey($_.Name)) { $meta[$_.Name] } else { $null }
                    $title = if ($m -and $m.title) { $m.title } else { $_.BaseName }
                    $category = if ($m -and $m.category) { $m.category } else { "" }
                    $list += @{
                        src = "images/" + [Uri]::EscapeDataString($_.Name)
                        title = $title
                        category = $category
                    }
                }
            }
            $response.ContentType = "application/json"
            $json = $list | ConvertTo-Json -Compress
            if ($json -eq $null) { $json = "[]" }
            if ($json -isnot [string]) { $json = "[" + ($json -join ",") + "]" }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            Write-Host "$($request.HttpMethod) $localPath -> 200"
            continue
        }
        
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
