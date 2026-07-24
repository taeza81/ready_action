Add-Type -AssemblyName System.Drawing

$folderPath = "d:\앱(APP) 제작\Ready Action\동작"
$files = Get-ChildItem -Path $folderPath -Filter "*.png"

$maxWidth = 1280
$maxHeight = 720

$count = 0

foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        Write-Host "Checking $($file.Name) - $($img.Width)x$($img.Height)"
        
        # Calculate new size while maintaining aspect ratio
        $ratioX = $maxWidth / $img.Width
        $ratioY = $maxHeight / $img.Height
        $ratio = [math]::Min($ratioX, $ratioY)
        
        if ($ratio -lt 1) {
            Write-Host "Compressing: $($file.Name) to $($ratio * 100)%"
            
            $newWidth = [math]::Max([int]($img.Width * $ratio), 1)
            $newHeight = [math]::Max([int]($img.Height * $ratio), 1)
            
            $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
            $graphics = [System.Drawing.Graphics]::FromImage($newImg)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
            
            $tempPath = $file.FullName + ".tmp"
            # Save as JPEG for better compression, but keep .png extension so it works without code changes
            $newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
            
            $graphics.Dispose()
            $newImg.Dispose()
            $img.Dispose()
            
            Remove-Item $file.FullName -Force
            Rename-Item -Path $tempPath -NewName $file.Name -Force
            $count++
        } else {
            $img.Dispose()
        }
    } catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}

Write-Host "Compression completed. Resized $count files."
