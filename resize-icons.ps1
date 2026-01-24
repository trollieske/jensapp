Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height
    )
    
    $img = [System.Drawing.Image]::FromFile($InputPath)
    $newImg = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $Width, $Height)
    $graphics.Dispose()
    $newImg.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newImg.Dispose()
    $img.Dispose()
    
    Write-Host "Created $OutputPath ($Width x $Height)"
}

# Resize to all needed sizes
$inputFile = "$PSScriptRoot\dosevaktfav.png"

Resize-Image -InputPath $inputFile -OutputPath "$PSScriptRoot\favicon-32.png" -Width 32 -Height 32
Resize-Image -InputPath $inputFile -OutputPath "$PSScriptRoot\apple-touch-icon.png" -Width 180 -Height 180
Resize-Image -InputPath $inputFile -OutputPath "$PSScriptRoot\icon-192.png" -Width 192 -Height 192
Resize-Image -InputPath $inputFile -OutputPath "$PSScriptRoot\icon-512.png" -Width 512 -Height 512
Resize-Image -InputPath $inputFile -OutputPath "$PSScriptRoot\icon-maskable.png" -Width 512 -Height 512

Write-Host "`nAll icons created successfully!"
