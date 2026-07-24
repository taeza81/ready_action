Add-Type -AssemblyName System.Drawing

$folderPath = "d:\앱(APP) 제작\Ready Action\동작"
$files = Get-ChildItem -Path $folderPath -Filter "*.png"

$maxWidth = 1920
$maxHeight = 1080

foreach ($file in $files) {
    $img = [System.Drawing.Image]::FromFile($file.FullName)
    
    # Check if resizing is needed
    if ($img.Width -gt $maxWidth -or $img.Height -gt $maxHeight) {
        Write-Host "Compressing: $($file.Name)"
        
        # Calculate new size while maintaining aspect ratio
        $ratioX = $maxWidth / $img.Width
        $ratioY = $maxHeight / $img.Height
        $ratio = [math]::Min($ratioX, $ratioY)
        
        $newWidth = [int]($img.Width * $ratio)
        $newHeight = [int]($img.Height * $ratio)
        
        $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($newImg)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        # Save to temp file first because original file is locked by the Image object
        $tempPath = $file.FullName + ".tmp"
        $newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $graphics.Dispose()
        $newImg.Dispose()
        $img.Dispose()
        
        # Replace original
        Remove-Item $file.FullName -Force
        Rename-Item -Path $tempPath -NewName $file.Name -Force
    } else {
        $img.Dispose()
    }
}

Write-Host "Compression completed."
