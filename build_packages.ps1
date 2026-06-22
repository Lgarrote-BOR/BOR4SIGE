# build_packages.ps1
# Script de empaquetado y sincronización para Bor4SIGE
# Adaptado a la nueva estructura de 5 directorios
# Ejecuta sincronización entre directorios y compresión de paquetes .zip

$ErrorActionPreference = "Stop"

# Directorios de origen (resueltos dinámicamente desde la raíz del proyecto)
$projectRoot = $PSScriptRoot
$appDir      = Join-Path $projectRoot "1_App_BOR4SIGE"
$instDir     = Join-Path $projectRoot "2_Instalable_BOR4SIGE"
$pluginDir   = Join-Path $projectRoot "3_Plugin_WordPress"
$docsDir     = Join-Path $projectRoot "4_Documentos"
$webDir      = Join-Path $projectRoot "5_Web_Corporativa"

# Directorio espejo "SIG 2.0"
$targetDir   = Join-Path (Split-Path $projectRoot -Parent) "SIG 2.0"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[INFO] Iniciando empaquetado Bor4SIGE (estructura 5 carpetas)..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Copiar landing-template.php a bor4sige_wordpress.html
Write-Host "[1/6] Sincronizando landing WordPress..." -ForegroundColor Yellow
$landingSrc = Join-Path $pluginDir "bor4sige-wp-addon\templates\landing-template.php"
$landingDst = Join-Path $webDir "web_presentacion\bor4sige_wordpress.html"
if (Test-Path $landingSrc) {
    Copy-Item $landingSrc $landingDst -Force
    Write-Host "   [OK] landing-template.php -> bor4sige_wordpress.html" -ForegroundColor Green
}

# 2. Sincronizar directorio del instalador (bor4sige_webapp_instalable)
Write-Host "[2/6] Sincronizando directorio bor4sige_webapp_instalable..." -ForegroundColor Yellow
$instalableDir = Join-Path $instDir "bor4sige_webapp_instalable"

# Copiar módulos de la app al instalador
$excludeDirs = @(".git", "node_modules", "dist", "bor4d_v3.png", "image.png_1", "image.png_2", "image.png_3", "image.png_4", "image.png_5", "image.png_6", "image.png_7", "standardized_enterprise_core_1", "standardized_enterprise_core_2", "stitch_gesti_n_integral_multi_norma")

$modules = Get-ChildItem -Path $appDir -Directory
foreach ($mod in $modules) {
    if ($excludeDirs -notcontains $mod.Name) {
        $destModPath = Join-Path $instalableDir $mod.Name
        if (Test-Path $destModPath) {
            Remove-Item $destModPath -Recurse -Force
        }
        Copy-Item $mod.FullName $instalableDir -Recurse -Force
    }
}

# Copiar archivos raíz obligatorios del instalador.
# IMPORTANTE: incluir los módulos backend (auth/database/encryption/setup_db/db_operations/db_migration) que requiere
# el nuevo server.js; de lo contrario el instalable falla al arrancar con MODULE_NOT_FOUND.
$rootFiles = @(
    "index.html", "api-sync.js", "server.js",
    "auth.js", "database.js", "encryption.js", "setup_db.js", "db_operations.js", "test_endpoints.js",
    "scripts/smoke_test_db.js",
    "tests/fixtures/expected_manifest.json",
    ".env.example",
    "iniciar_servidor.bat", "iniciar_servidor.sh", "package.json", "package-lock.json"
)

foreach ($file in $rootFiles) {
    $src = Join-Path $appDir $file
    if (Test-Path $src) {
        # Preservar subdirectorios (p.ej. tests/fixtures/expected_manifest.json).
        # Sin esto, Copy-Item aplana la ruta y copia el archivo al nivel raiz
        # del instalable, rompiendo el smoke test del zip distribuido.
        $dstPath = Join-Path $instalableDir $file
        $dstParent = Split-Path -Path $dstPath -Parent
        if ($dstParent -ne $instalableDir -and -not (Test-Path $dstParent)) {
            New-Item -ItemType Directory -Path $dstParent -Force | Out-Null
        }
        Copy-Item $src $dstPath -Force
    }
}

# NUNCA empaquetar el .env real con secretos. Eliminarlo del instalador si se hubiera colado.
$leakedEnv = Join-Path $instalableDir ".env"
if (Test-Path $leakedEnv) {
    Remove-Item $leakedEnv -Force
    Write-Host "   [SEGURIDAD] Eliminado .env del instalador (no debe distribuirse)." -ForegroundColor Yellow
}

# Copiar manual de uso al instalador
$manualSrc = Join-Path $docsDir "manual_de_uso.md"
if (Test-Path $manualSrc) {
    Copy-Item $manualSrc (Join-Path $instalableDir "manual_de_uso.md") -Force
}

# README del proyecto
$readmeSrc = Join-Path $docsDir "README_proyecto.md"
if (Test-Path $readmeSrc) {
    Copy-Item $readmeSrc (Join-Path $instalableDir "README.md") -Force
}

# 3. Sincronizar al directorio espejo "SIG 2.0"
Write-Host "[3/6] Sincronizando a SIG 2.0..." -ForegroundColor Yellow
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

# Copiar la estructura completa del proyecto (excluyendo .git y node_modules)
$projectDirs = Get-ChildItem -Path $projectRoot -Directory | Where-Object { $_.Name -ne ".git" }
foreach ($dir in $projectDirs) {
    $destPath = Join-Path $targetDir $dir.Name
    if (Test-Path $destPath) {
        Remove-Item $destPath -Recurse -Force
    }
    # Excluir node_modules de la copia
    if ($dir.Name -eq "1_App_BOR4SIGE") {
        New-Item -ItemType Directory -Path $destPath | Out-Null
        Get-ChildItem -Path $dir.FullName | Where-Object { $_.Name -ne "node_modules" } | ForEach-Object {
            Copy-Item $_.FullName $destPath -Recurse -Force
        }
    } else {
        Copy-Item $dir.FullName $targetDir -Recurse -Force
    }
}

# Copiar archivos raíz del proyecto
foreach ($file in (Get-ChildItem -Path $projectRoot -File)) {
    if ($file.Extension -ne ".zip" -and $file.Name -ne "reorganizar.ps1") {
        Copy-Item $file.FullName (Join-Path $targetDir $file.Name) -Force
    }
}

# 4. Copiar los archivos PDF al instalador
Write-Host "[4/6] Copiando PDFs al instalador..." -ForegroundColor Yellow
$pdfFiles = @("RGPD y Normas.pdf", "PDF Normas.pdf")
foreach ($pdf in $pdfFiles) {
    $src = Join-Path $docsDir $pdf
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $instalableDir $pdf) -Force
        $targetInstDir = Join-Path $targetDir "2_Instalable_BOR4SIGE\bor4sige_webapp_instalable"
        if (Test-Path $targetInstDir) {
            Copy-Item $src (Join-Path $targetInstDir $pdf) -Force
        }
    }
}

# 5. Generar los archivos .zip
Write-Host "[5/6] Generando archivos .zip comprimidos..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Create-CleanZip {
    param(
        [string]$folderPath,
        [string]$zipPath,
        [string[]]$excludes
    )
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    $tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    Copy-Item "$folderPath\*" $tempDir -Recurse -Force
    if ($excludes) {
        foreach ($ex in $excludes) {
            $exPath = Join-Path $tempDir $ex
            if (Test-Path $exPath) {
                Remove-Item $exPath -Recurse -Force
            }
        }
    }
    
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
    Remove-Item $tempDir -Recurse -Force
}

# Empaqueta una carpeta CONSERVANDO el directorio raíz dentro del .zip
# (necesario para los plugins de WordPress: deben llevar una carpeta de nivel superior).
function Create-PluginZip {
    param(
        [string]$folderPath,
        [string]$zipPath
    )
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    Compress-Archive -Path $folderPath -DestinationPath $zipPath -CompressionLevel Optimal
}

# A. Plugin de WordPress
Write-Host "   -> Comprimiendo Plugin de WordPress..." -ForegroundColor Gray
$wpAddonSrc = Join-Path $pluginDir "bor4sige-wp-addon"
Create-CleanZip $wpAddonSrc (Join-Path $pluginDir "bor4sige-wp-addon.zip")
$targetPluginDir = Join-Path $targetDir "3_Plugin_WordPress"
if (Test-Path $targetPluginDir) {
    Create-CleanZip (Join-Path $targetPluginDir "bor4sige-wp-addon") (Join-Path $targetPluginDir "bor4sige-wp-addon.zip")
}

# B. Web de Presentación — DOS plugins de WordPress + web estática (Nginx)
#   - bor4sige_web_presentacion.zip = Plugin PRODUCTO (sirve index.html, slug /bor4sige/)
#   - bor4d_web_corporativa.zip      = Plugin CORPORATIVO (sirve la plantilla bilingüe, slug /web-corporativa/)
#   - bor4sige_web_estatica.zip      = web estática para Nginx/Hetzner
$webPresSrc      = Join-Path $webDir "web_presentacion"
$pluginProdDir   = Join-Path $webDir "wp-plugin\bor4sige-presentacion-producto"
$pluginCorpDir   = Join-Path $webDir "wp-plugin\bor4d-web-corporativa"

# La carpeta web_presentacion es la ÚNICA fuente de verdad de los contenidos.
Write-Host "   -> Sincronizando contenidos en los plugins..." -ForegroundColor Gray
if (Test-Path $pluginProdDir) {
    $ass = Join-Path $pluginProdDir "assets"
    if (-not (Test-Path $ass)) { New-Item -ItemType Directory -Path $ass -Force | Out-Null }
    Copy-Item (Join-Path $webPresSrc "index.html")     (Join-Path $ass "index.html") -Force
    Copy-Item (Join-Path $webPresSrc "logo-bor4d.png") (Join-Path $ass "logo-bor4d.png") -Force
    Write-Host "   -> Comprimiendo Plugin Producto (BOR4SIGE)..." -ForegroundColor Gray
    Create-PluginZip $pluginProdDir (Join-Path $webDir "bor4sige_web_presentacion.zip")
}
if (Test-Path $pluginCorpDir) {
    $ass = Join-Path $pluginCorpDir "assets"
    if (-not (Test-Path $ass)) { New-Item -ItemType Directory -Path $ass -Force | Out-Null }
    # El fragmento corporativo se sirve como .php (la plantilla lleva un bloque <?php inicial).
    Copy-Item (Join-Path $webPresSrc "bor4sige_wordpress.html") (Join-Path $ass "landing-template.php") -Force
    Copy-Item (Join-Path $webPresSrc "logo-bor4d.png")          (Join-Path $ass "logo-bor4d.png") -Force
    Write-Host "   -> Comprimiendo Plugin Web Corporativa (Bor4D)..." -ForegroundColor Gray
    Create-PluginZip $pluginCorpDir (Join-Path $webDir "bor4d_web_corporativa.zip")
}

Write-Host "   -> Comprimiendo Web de Presentación estática (Nginx)..." -ForegroundColor Gray
Create-CleanZip $webPresSrc (Join-Path $webDir "bor4sige_web_estatica.zip")

$targetWebDir = Join-Path $targetDir "5_Web_Corporativa"
if (Test-Path $targetWebDir) {
    $tProd = Join-Path $targetWebDir "wp-plugin\bor4sige-presentacion-producto"
    $tCorp = Join-Path $targetWebDir "wp-plugin\bor4d-web-corporativa"
    if (Test-Path $tProd) { Create-PluginZip $tProd (Join-Path $targetWebDir "bor4sige_web_presentacion.zip") }
    if (Test-Path $tCorp) { Create-PluginZip $tCorp (Join-Path $targetWebDir "bor4d_web_corporativa.zip") }
    Create-CleanZip (Join-Path $targetWebDir "web_presentacion") (Join-Path $targetWebDir "bor4sige_web_estatica.zip")
}

# C. Webapp Instalable Completa
Write-Host "   -> Comprimiendo Webapp Instalable Completa..." -ForegroundColor Gray
Create-CleanZip $instalableDir (Join-Path $instDir "bor4sige_webapp_instalable.zip")
$targetInstParent = Join-Path $targetDir "2_Instalable_BOR4SIGE"
if (Test-Path $targetInstParent) {
    Create-CleanZip (Join-Path $targetInstParent "bor4sige_webapp_instalable") (Join-Path $targetInstParent "bor4sige_webapp_instalable.zip")
}

# D. Webapp Instalable SGI (Sin PDF grande)
Write-Host "   -> Comprimiendo Webapp Instalable SGI (Sin PDF Normas)..." -ForegroundColor Gray
Create-CleanZip $instalableDir (Join-Path $instDir "bor4sige_webapp_instalable_sgi.zip") -excludes "PDF Normas.pdf"
if (Test-Path $targetInstParent) {
    Create-CleanZip (Join-Path $targetInstParent "bor4sige_webapp_instalable") (Join-Path $targetInstParent "bor4sige_webapp_instalable_sgi.zip") -excludes "PDF Normas.pdf"
}

# 6. Verificación
Write-Host "[6/6] Verificando los archivos resultantes..." -ForegroundColor Yellow
$zips = @(
    @{path=(Join-Path $pluginDir "bor4sige-wp-addon.zip"); name="Plugin WordPress (Addon SGI)"},
    @{path=(Join-Path $webDir "bor4sige_web_presentacion.zip"); name="Plugin WP (Producto BOR4SIGE)"},
    @{path=(Join-Path $webDir "bor4d_web_corporativa.zip"); name="Plugin WP (Web Corporativa Bor4D)"},
    @{path=(Join-Path $webDir "bor4sige_web_estatica.zip"); name="Web Presentación estática (Nginx)"},
    @{path=(Join-Path $instDir "bor4sige_webapp_instalable.zip"); name="Webapp Completa"},
    @{path=(Join-Path $instDir "bor4sige_webapp_instalable_sgi.zip"); name="Webapp SGI (ligera)"}
)

foreach ($zip in $zips) {
    if (Test-Path $zip.path) {
        $fileInfo = Get-Item $zip.path
        Write-Host "[OK] $($zip.name): $([Math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "[WARN] No encontrado: $($zip.name)" -ForegroundColor Red
    }
}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Empaquetado completado con exito!" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
