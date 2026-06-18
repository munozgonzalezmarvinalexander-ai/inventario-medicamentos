# 💊 Sistema de Inventario de Medicamentos

Sistema web para gestión de inventario de medicamentos, diseñado para farmacias, clínicas y centros de salud que necesitan una solución local, sin dependencias en la nube ni costos mensuales.

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-black.svg)](https://flask.palletsprojects.com)
[![openpyxl](https://img.shields.io/badge/openpyxl-3.1-green.svg)](https://openpyxl.readthedocs.io)
[![License](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](LICENSE)

---

## ¿Qué problema resuelve?

Muchas farmacias y clínicas pequeñas llevan su inventario en hojas de Excel manuales o cuadernos. Este sistema digitaliza ese proceso con una interfaz web accesible desde el navegador, manteniendo los datos en un archivo `.xlsx` que el personal ya sabe manejar, sin necesidad de servidores remotos ni conexión a internet.

---

## Funcionalidades

### Dashboard
- Resumen en tiempo real: total de medicamentos, unidades en stock, bajo stock y agotados
- Entradas y entregas del mes actual
- Top 5 medicamentos más entregados
- Alertas de bajo stock priorizadas

### Inventario
- CRUD completo de medicamentos
- Búsqueda instantánea por nombre u observación
- Indicadores de estado: **OK / Bajo stock / Agotado**
- Stock mínimo configurable por medicamento

### Entradas y Salidas
- Registro de lotes recibidos (suma automática si el medicamento ya existe)
- Entrega con confirmación obligatoria y bloqueo si no hay stock suficiente
- Trazabilidad completa: fecha, cantidad, persona que recibe, observaciones

### Reportes y Exportación
- Filtros por rango de fechas y nombre de medicamento
- Gráfico de entregas por mes
- Exportar a `.xlsx` con un clic (toda la base de datos o solo el reporte filtrado)

---

## Decisiones técnicas

### Excel como base de datos
El almacenamiento en `.xlsx` es una decisión deliberada para este contexto, no una limitación:

- El personal objetivo ya domina Excel y puede abrir el archivo directamente para auditorías
- Permite respaldos triviales (copiar el archivo a un USB o Google Drive)
- Sin instalación de motor de base de datos, lo que reduce la fricción en entornos sin soporte técnico
- `openpyxl` garantiza compatibilidad total con Excel y LibreOffice

Para un contexto de múltiples usuarios simultáneos o mayor volumen, la arquitectura se migraría a SQLite o PostgreSQL con mínimos cambios en la capa de acceso a datos.

### Thread-safety con `threading.Lock`
Flask puede recibir varias peticiones al mismo tiempo. Dado que `openpyxl` no es thread-safe para escrituras concurrentes sobre el mismo archivo, se usa un `Lock` global (`excel_lock`) que garantiza que solo una petición escriba el Excel a la vez, previniendo corrupción de datos:

```python
with excel_lock:
    wb = load_workbook(EXCEL_FILE)
    # ... modificaciones ...
    wb.save(EXCEL_FILE)
```

### API REST + SPA
El backend expone una API REST con Flask y el frontend es una Single Page Application en JavaScript vanilla. Esta separación permite en el futuro reemplazar el frontend por React o Vue sin tocar el backend, o consumir la API desde una app móvil.

### Exportación en memoria
Los reportes Excel se generan con `openpyxl` y se sirven como `BytesIO` sin escribir archivos temporales en disco, lo que evita problemas de permisos y limpieza:

```python
buffer = io.BytesIO()
wb_out.save(buffer)
buffer.seek(0)
return send_file(buffer, as_attachment=True, ...)
```

---

## Arquitectura

```
inventario-medicamentos/
├── app.py                  # Backend Flask: API REST + lógica de negocio
├── requirements.txt        # Dependencias Python (Flask + openpyxl)
├── iniciar.bat             # Lanzador Windows (un clic)
├── iniciar.sh              # Lanzador Linux / macOS
│
├── data/
│   └── inventario.xlsx     # Base de datos (se crea al primer inicio)
│
├── templates/
│   └── index.html          # SPA: estructura HTML
│
└── static/
    ├── css/styles.css      # Estilos
    └── js/script.js        # Lógica del navegador (fetch API)
```

### Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventario` | Lista todos los medicamentos y stock |
| GET | `/api/dashboard` | Métricas del dashboard |
| POST | `/api/entradas` | Registrar entrada de medicamento |
| GET | `/api/entradas` | Historial de entradas |
| POST | `/api/salidas` | Registrar entrega |
| GET | `/api/salidas` | Historial de salidas |
| GET | `/api/reportes/por-mes` | Entregas agrupadas por mes |
| GET | `/api/reportes/top-entregados` | Ranking de medicamentos más entregados |
| GET | `/api/exportar` | Descargar base de datos completa como `.xlsx` |
| GET | `/api/exportar/reporte` | Descargar reporte filtrado como `.xlsx` |
| DELETE | `/api/inventario/<nombre>` | Eliminar medicamento |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.10 + Flask 3.0 |
| Almacenamiento | openpyxl 3.1 (archivo `.xlsx`) |
| Frontend | HTML5 + CSS3 + JavaScript (sin frameworks) |
| Concurrencia | `threading.Lock` |

---

## Instalación y uso

### Windows

1. Instalar [Python 3.10+](https://www.python.org/downloads/) marcando **"Add Python to PATH"**
2. Descomprimir este repositorio en cualquier carpeta
3. Doble clic en `iniciar.bat`

El sistema abre automáticamente en `http://localhost:5000`. La primera ejecución tarda 1–2 minutos instalando dependencias.

### Linux / macOS

```bash
git clone https://github.com/TU-USUARIO/inventario-medicamentos.git
cd inventario-medicamentos
chmod +x iniciar.sh
./iniciar.sh
```

Luego abrir `http://localhost:5000`.

> Para detener el servidor: `Ctrl + C` en la terminal.

---

## Respaldo de datos

El único archivo que contiene datos es `data/inventario.xlsx`. Para respaldarlo:

- **Manual:** copiar el archivo a un USB, OneDrive o Google Drive periódicamente
- **Automático:** colocar toda la carpeta del proyecto dentro de una carpeta sincronizada de OneDrive o Google Drive

---

## Solución de problemas

| Error | Solución |
|-------|----------|
| `Python no está en el PATH` | Reinstalar Python marcando "Add Python to PATH" |
| `Permission denied` al guardar | Cerrar el archivo `.xlsx` en Excel antes de usar el sistema |
| El navegador no abre solo | Abrir `http://localhost:5000` manualmente |
| Puerto 5000 ocupado | Cambiar `port=5000` por `port=5001` en la última línea de `app.py` |
| Usar desde otra PC en la red | Cambiar `host="127.0.0.1"` por `host="0.0.0.0"` en `app.py` y conectar desde `http://IP-del-servidor:5000` |

---

## Posibles mejoras (v2)

- Migrar almacenamiento a SQLite para soporte multiusuario real
- Autenticación de usuarios con roles (administrador / farmacéutico)
- Modo multi-sucursal con sincronización por red local
- PWA para instalación en dispositivos móviles sin app store

---

## Licencia

MIT — uso libre para farmacias, clínicas y proyectos personales.
