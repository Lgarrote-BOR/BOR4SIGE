#!/bin/bash
echo "==================================================="
echo "🚀 SGI 2.0 - Iniciando Asistente de Despliegue (macOS/Linux)"
echo "==================================================="

# Verificar Node.js
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js no está instalado. Instálalo desde https://nodejs.org/"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependencias..."
    npm install
fi

# Iniciar servidor en segundo plano
echo "[INFO] Levantando servidor..."
node server.js &
SERVER_PID=$!

# Esperar 2 segundos
sleep 2

# Abrir navegador
echo "[INFO] Abriendo navegador..."
if command -v xdg-open &> /dev/null
then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null
then
    open http://localhost:3000
else
    echo "[INFO] Abre http://localhost:3000 en tu navegador."
fi

echo "==================================================="
echo "✅ Servidor activo. Presiona CTRL+C para detener."
echo "==================================================="
wait $SERVER_PID
