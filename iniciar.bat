@echo off
REM ============================================================
REM  Inventario de Medicamentos - inicio en Windows
REM  Doble clic en este archivo para arrancar el sistema.
REM ============================================================

setlocal
cd /d "%~dp0"

echo ============================================================
echo   Inventario de Medicamentos
echo ============================================================
echo.

REM 1) Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    echo.
    echo Descarga Python 3.10 o superior desde:
    echo   https://www.python.org/downloads/
    echo.
    echo IMPORTANTE: durante la instalacion, marca la casilla
    echo "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

REM 2) Crear entorno virtual si no existe
if not exist "venv\Scripts\python.exe" (
    echo Creando entorno virtual...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
)

REM 3) Instalar dependencias
echo Verificando dependencias...
venv\Scripts\python.exe -m pip install --upgrade pip >nul 2>&1
venv\Scripts\pip.exe install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
)

REM 4) Abrir el navegador automaticamente luego de 2 segundos
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:5000"

REM 5) Iniciar la aplicacion
echo.
echo ============================================================
echo   Iniciando servidor en http://localhost:5000
echo   Presiona Ctrl+C para detener.
echo ============================================================
echo.
venv\Scripts\python.exe app.py

pause
