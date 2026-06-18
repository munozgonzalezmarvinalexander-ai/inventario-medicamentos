# 💊 Sistema de Inventario de Medicamentos

Sistema completo y **100% gratuito** para llevar inventario de medicamentos.
Funciona desde tu navegador, en tu propia laptop, **sin servicios mensuales** ni
aplicaciones móviles. Los datos se guardan en un archivo **Excel local** que
puedes abrir con Excel, LibreOffice o subir manualmente a OneDrive cuando
quieras.

---

## 🚀 Instalación rápida en Windows (3 pasos)

### 1. Instalar Python (una sola vez)

1. Ir a https://www.python.org/downloads/
2. Descargar **Python 3.10 o superior**.
3. Ejecutar el instalador y **marcar la casilla "Add Python to PATH"**
   antes de hacer clic en *Install*.

### 2. Descargar este proyecto

Descomprime la carpeta `inventario-medicamentos` en cualquier lugar de tu
computadora (Escritorio, Documentos, etc.).

### 3. Doble clic en `iniciar.bat`

- La primera vez tardará 1–2 minutos en instalar las dependencias.
- Después abrirá el sistema automáticamente en tu navegador en:
  **http://localhost:5000**

Listo. Eso es todo.

> Para **detener** el sistema: cierra la ventana negra que se abrió,
> o presiona `Ctrl + C` dentro de ella.

---

## 🐧 Linux / macOS

```bash
chmod +x iniciar.sh
./iniciar.sh
```

Luego abre http://localhost:5000

---

## 📁 Estructura del proyecto

```
inventario-medicamentos/
│
├── app.py                  # Servidor Flask (Python)
├── requirements.txt        # Dependencias de Python
├── iniciar.bat             # Lanzador para Windows (un solo clic)
├── iniciar.sh              # Lanzador para Linux / macOS
├── README.md               # Este archivo
│
├── data/
│   └── inventario.xlsx     # Base de datos Excel (se crea al iniciar)
│
├── templates/
│   └── index.html          # Interfaz principal
│
└── static/
    ├── css/styles.css      # Estilos
    └── js/script.js        # Lógica del navegador
```

---

## 🗂️ Base de datos: el archivo Excel

El archivo `data/inventario.xlsx` se crea automáticamente la primera vez que
inicias el sistema. Contiene 4 hojas:

| Hoja           | Contenido                                                  |
|----------------|------------------------------------------------------------|
| **Inventario** | Stock actual de cada medicamento                           |
| **Entradas**   | Historial de medicamentos recibidos                        |
| **Salidas**    | Historial de medicamentos entregados                       |
| **Reportes**   | Configuración (ej. umbral global de bajo stock)            |

Puedes:
- **Abrirlo con Excel o LibreOffice** para revisar los datos manualmente.
- **Hacer copias de respaldo** copiando el archivo a otra carpeta o a una
  memoria USB.
- **Subirlo manualmente a OneDrive / Google Drive** cuando quieras tener una
  copia en la nube (no es necesario para que el sistema funcione).

> ⚠️ **Cierra Excel antes de usar el sistema.** Si tienes el archivo abierto
> en Excel mientras el sistema intenta escribir en él, se generará un error.

---

## ✨ Funciones del sistema

### 📊 Dashboard
- Total de medicamentos registrados.
- Unidades totales en stock.
- Conteo de medicamentos con bajo stock y agotados.
- Entradas y entregas del mes actual.
- Top 5 medicamentos más entregados.
- Alertas de bajo stock (las 5 más urgentes).

### 📦 Inventario
- Lista de todos los medicamentos disponibles.
- Búsqueda instantánea por nombre u observación.
- Indicadores visuales: **OK / Bajo stock / Agotado**.
- Botón para eliminar un medicamento del inventario.

### ⬇️ Agregar entrada
- Registrar nuevos lotes de medicamentos.
- Si el medicamento ya existe, **suma** a la cantidad actual.
- Si es nuevo, lo **crea** automáticamente.
- Permite definir un **stock mínimo personalizado** para alertas.

### ⬆️ Entregar
- Selección del medicamento desde una lista (solo muestra los que tienen stock).
- Muestra el **stock disponible** al seleccionar.
- **Confirmación obligatoria** antes de descontar.
- Registra: medicamento, cantidad, fecha, persona que recibe y observaciones.
- **Bloquea entregas** si la cantidad pedida supera el stock.

### 📈 Reportes
- Filtros por **rango de fechas** y por **nombre de medicamento**.
- Entregas totales por mes (con gráfico de barras).
- Ranking de medicamentos más entregados.
- Historial completo filtrado.
- **Exportar reporte filtrado a Excel** con un clic.

### 📥 Exportar
- Botón "Descargar Excel" en la barra lateral: exporta toda la base de datos.
- Botón "Exportar Excel" en Reportes: exporta solo los datos filtrados.

---

## 💾 ¿Cómo respaldar mis datos?

**Opción A — manual (recomendada):**
Copia el archivo `data/inventario.xlsx` a un USB, OneDrive o Google Drive
cada cierto tiempo.

**Opción B — automática:**
Coloca toda la carpeta `inventario-medicamentos` dentro de una carpeta
sincronizada de OneDrive, Dropbox o Google Drive. Cada cambio se subirá
automáticamente a la nube.

---

## ☁️ ¿Y "Excel Online"?

Excel Online (Microsoft 365 web) **no permite que un programa de escritorio
lea y escriba en sus archivos sin una cuenta empresarial y configuración
compleja con Microsoft Graph API**, lo cual rompería la regla de "sin
servicios pagos".

La solución implementada usa el **mismo formato `.xlsx`** que usa Excel
Online, así que puedes:
1. Trabajar con el sistema localmente.
2. Cuando quieras, subir `data/inventario.xlsx` a OneDrive arrastrándolo
   al navegador.
3. Abrirlo desde cualquier lugar con Excel Online (modo lectura).

Si en el futuro quieres edición simultánea desde varios lugares, la mejor
opción gratuita es poner la carpeta dentro de OneDrive o Google Drive
sincronizado.

---

## ❓ Solución de problemas

**"Python no esta instalado o no esta en el PATH"**
→ Instala Python desde python.org y **marca "Add Python to PATH"**
durante la instalación.

**"Permission denied" al guardar el Excel**
→ Cierra el archivo `data/inventario.xlsx` en Excel y vuelve a intentar.

**El navegador no abre solo**
→ Abre manualmente http://localhost:5000

**Puerto 5000 ocupado**
→ Cambia la línea `port=5000` al final de `app.py` por `port=5001`
y abre http://localhost:5001

**Quiero usarlo desde otra computadora en la misma red local**
→ En `app.py`, cambia `host="127.0.0.1"` por `host="0.0.0.0"`. Luego,
desde otra máquina, abre `http://IP-de-tu-laptop:5000`.

---

## 🔧 Tecnologías usadas

| Componente | Tecnología                       |
|------------|----------------------------------|
| Backend    | Python 3 + Flask                 |
| Excel      | openpyxl                         |
| Frontend   | HTML5 + CSS3 + JavaScript        |
| Datos      | Archivo .xlsx local              |

**Sin Docker, sin Kubernetes, sin servicios pagos, sin APKs.**

---

## 📜 Licencia

Uso libre para tu farmacia, clínica o uso personal.
