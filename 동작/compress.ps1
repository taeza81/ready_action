Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem -Path "." -Filter "*.png"
$maxWidth = 1920
$maxHeight = 1080
$count = 0

foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        
        $ratioX = [double]$maxWidth / [double]$img.Width
        $ratioY = [double]$maxHeight / [double]$img.Height
        $ratio = [math]::Min($ratioX, $ratioY)
        
        if ($ratio -lt 1) {
            $newWidth = [math]::Max([int]($img.Width * $ratio), 1)
            $newHeight = [math]::Max([int]($img.Height * $ratio), 1)
        } else {
            $newWidth = $img.Width
            $newHeight = $img.Height
        }
        
        $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($newImg)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        $tempPath = $file.FullName + ".tmp"
        
        $newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        
        $graphics.Dispose()
        $newImg.Dispose()
        $img.Dispose()
        
        Remove-Item $file.FullName -Force
        Rename-Item -Path $tempPath -NewName $file.Name -Force
        $count++
    } catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}

Write-Host "Compression completed. Processed $count files."
