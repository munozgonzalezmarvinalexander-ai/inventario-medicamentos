#!/usr/bin/env bash
# Iniciar el sistema en Linux / macOS
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
    echo "[ERROR] Python 3 no esta instalado."
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
fi

echo "Instalando dependencias..."
./venv/bin/pip install --upgrade pip >/dev/null
./venv/bin/pip install -r requirements.txt

echo
echo "============================================================"
echo "  Servidor en http://localhost:5000"
echo "============================================================"
./venv/bin/python app.py
