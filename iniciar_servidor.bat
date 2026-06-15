@echo off
:: Asegurar que nos situamos en la carpeta donde esta el script
cd /d "%~dp0"

title SGI 2.0 - Servidor de Aplicacion

echo ===================================================
echo SGI 2.0 - Iniciando Asistente de Despliegue
echo ===================================================

:: Verificar si Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado en este equipo.
    echo Por favor, descarga e instala Node.js desde https://nodejs.org/ antes de continuar.
    echo.
    pause
    exit /b
)

:: Verificar si existen las dependencias de node_modules
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias de Node.js... esto puede tardar unos segundos.
    call npm install
)

:: Iniciar el servidor Express en una ventana separada
echo [INFO] Iniciando el servidor en http://localhost:3000...
start "Servidor SGI 2.0 Backend" cmd /k "node server.js"

:: Esperar 3 segundos para asegurar que el servidor levante
ping 127.0.0.1 -n 4 >nul

:: Abrir el navegador por defecto
echo [INFO] Abriendo el navegador en http://localhost:3000...
start http://localhost:3000

echo ===================================================
echo Todo listo. El servidor esta corriendo en una ventana separada.
echo Si el navegador no se abrio automaticamente, ve a: http://localhost:3000
echo ===================================================
echo Presiona cualquier tecla para cerrar este asistente.
pause >nul
exit /b
