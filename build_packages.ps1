# build_packages.ps1
# Script de empaquetado y sincronización para Bor4SIGE
# Ejecuta la copia de seguridad, sincronización entre directorios y compresión de paquetes .zip

$ErrorActionPreference = "Stop"

# Directorios de origen y destino
$sourceDir = "c:\Users\Bor\OneDrive\Documentos\Antigravity\BOR4SIGE"
$targetDir = "c:\Users\Bor\OneDrive\Documentos\Antigravity\SIG 2.0"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[INFO] Iniciando empaquetado y sincronizacion de Bor4SIGE..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Copiar landing-template.php a bor4sige_wordpress.html
Write-Host "[1/6] Sincronizando landing WordPress en web_presentacion..." -ForegroundColor Yellow
Copy-Item "$sourceDir\bor4sige-wp-addon\templates\landing-template.php" "$sourceDir\web_presentacion\bor4sige_wordpress.html" -Force

# 2. Sincronizar directorio del instalador (bor4sige_webapp_instalable)
Write-Host "[2/6] Sincronizando directorio bor4sige_webapp_instalable..." -ForegroundColor Yellow
$modules = Get-ChildItem -Path $sourceDir -Directory
$excludeDirs = @(".git", "node_modules", "bor4sige-wp-addon", "web_presentacion", "bor4sige_webapp_instalable", "dist")

foreach ($mod in $modules) {
    if ($excludeDirs -notcontains $mod.Name) {
        $destModPath = "$sourceDir\bor4sige_webapp_instalable\$($mod.Name)"
        if (Test-Path $destModPath) {
            Remove-Item $destModPath -Recurse -Force
        }
        Copy-Item $mod.FullName "$sourceDir\bor4sige_webapp_instalable\" -Recurse -Force
    }
}

# Copiar archivos raíz obligatorios del instalador
$rootFiles = @("index.html", "api-sync.js", "server.js", "manual_de_uso.md", "iniciar_servidor.bat", "iniciar_servidor.sh", "package.json", "package-lock.json")
foreach ($file in $rootFiles) {
    Copy-Item "$sourceDir\$file" "$sourceDir\bor4sige_webapp_instalable\$file" -Force
}

# 3. Sincronizar todos los archivos y directorios actualizados a "SIG 2.0"
Write-Host "[3/6] Sincronizando de BOR4SIGE a SIG 2.0..." -ForegroundColor Yellow
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

# Copiar módulos de código y raíz (excluyendo git, node_modules y zips)
foreach ($mod in (Get-ChildItem -Path $sourceDir -Directory)) {
    if ($mod.Name -ne ".git" -and $mod.Name -ne "node_modules") {
        $destPath = "$targetDir\$($mod.Name)"
        if (Test-Path $destPath) {
            Remove-Item $destPath -Recurse -Force
        }
        Copy-Item $mod.FullName $targetDir -Recurse -Force
    }
}

foreach ($file in (Get-ChildItem -Path $sourceDir -File)) {
    if ($file.Extension -ne ".zip" -and $file.Name -ne "build_packages.ps1" -and $file.Name -ne "git_status_utf8.txt") {
        Copy-Item $file.FullName "$targetDir\$($file.Name)" -Force
    }
}

# 4. Copiar los archivos PDF grandes necesarios para el empaquetado del instalador
Write-Host "[4/6] Copiando PDFs del SGI al instalador..." -ForegroundColor Yellow
Copy-Item "$sourceDir\RGPD y Normas.pdf" "$sourceDir\bor4sige_webapp_instalable\RGPD y Normas.pdf" -Force
Copy-Item "$sourceDir\RGPD y Normas.pdf" "$targetDir\bor4sige_webapp_instalable\RGPD y Normas.pdf" -Force

# Asegurar copia en la raíz de la webapp
Copy-Item "$sourceDir\PDF Normas.pdf" "$sourceDir\bor4sige_webapp_instalable\PDF Normas.pdf" -Force
Copy-Item "$sourceDir\PDF Normas.pdf" "$targetDir\bor4sige_webapp_instalable\PDF Normas.pdf" -Force

# 5. Generar los archivos .zip
Write-Host "[5/6] Generando archivos .zip comprimidos..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Función para generar Zip limpio
function Create-CleanZip {
    param(
        [string]$folderPath,
        [string]$zipPath,
        [string[]]$excludes
    )
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    # Crear un directorio temporal limpio
    $tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    # Copiar elementos filtrando exclusiones
    Copy-Item "$folderPath\*" $tempDir -Recurse -Force
    if ($excludes) {
        foreach ($ex in $excludes) {
            $exPath = Join-Path $tempDir $ex
            if (Test-Path $exPath) {
                Remove-Item $exPath -Recurse -Force
            }
        }
    }
    
    # Comprimir
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
    
    # Limpiar temp
    Remove-Item $tempDir -Recurse -Force
}

# A. Plugin de WordPress
Write-Host "   -> Comprimiendo Plugin de WordPress..." -ForegroundColor Gray
Create-CleanZip "$sourceDir\bor4sige-wp-addon" "$sourceDir\bor4sige-wp-addon.zip"
Create-CleanZip "$targetDir\bor4sige-wp-addon" "$targetDir\bor4sige-wp-addon.zip"

# B. Web de Presentación
Write-Host "   -> Comprimiendo Web de Presentación..." -ForegroundColor Gray
Create-CleanZip "$sourceDir\web_presentacion" "$sourceDir\bor4sige_web_presentacion.zip"
Create-CleanZip "$targetDir\web_presentacion" "$targetDir\bor4sige_web_presentacion.zip"

# C. Webapp Instalable Completa (con PDF Normas.pdf)
Write-Host "   -> Comprimiendo Webapp Instalable Completa..." -ForegroundColor Gray
Create-CleanZip "$sourceDir\bor4sige_webapp_instalable" "$sourceDir\bor4sige_webapp_instalable.zip"
Create-CleanZip "$targetDir\bor4sige_webapp_instalable" "$targetDir\bor4sige_webapp_instalable.zip"

# D. Webapp Instalable SGI (Excluyendo PDF Normas.pdf para que sea más ligera)
Write-Host "   -> Comprimiendo Webapp Instalable SGI (Sin PDF Normas)..." -ForegroundColor Gray
Create-CleanZip "$sourceDir\bor4sige_webapp_instalable" "$sourceDir\bor4sige_webapp_instalable_sgi.zip" -excludes "PDF Normas.pdf"
Create-CleanZip "$targetDir\bor4sige_webapp_instalable" "$targetDir\bor4sige_webapp_instalable_sgi.zip" -excludes "PDF Normas.pdf"

# 6. Limpieza y Verificación
Write-Host "[6/6] Verificando los archivos resultantes..." -ForegroundColor Yellow
$zips = @(
    "bor4sige-wp-addon.zip",
    "bor4sige_web_presentacion.zip",
    "bor4sige_webapp_instalable.zip",
    "bor4sige_webapp_instalable_sgi.zip"
)

foreach ($zip in $zips) {
    $fileInfo1 = Get-Item "$sourceDir\$zip"
    $fileInfo2 = Get-Item "$targetDir\$zip"
    Write-Host "[OK] Generado: $zip (BOR4SIGE: $([Math]::Round($fileInfo1.Length / 1MB, 2)) MB | SIG 2.0: $([Math]::Round($fileInfo2.Length / 1MB, 2)) MB)" -ForegroundColor Green
}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Empaquetado y Sincronizacion completados con exito!" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
