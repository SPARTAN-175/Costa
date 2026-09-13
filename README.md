# COSTA — Costos y precios

Aplicación web estática, sin Firebase y sin servidor. Funciona en GitHub Pages.

## Características
- Dashboard visual de costos.
- Productos y recetas.
- Ingredientes / insumos.
- Equipos y herramientas con depreciación mensual.
- Servicios con porcentaje de uso del negocio.
- Transporte por costo/km.
- Mano de obra por hora.
- Empaques.
- Gastos fijos.
- Marketing y ventas.
- Simulador de precio y volumen.
- Punto de equilibrio.
- Reportes.
- Exportar/importar respaldo JSON.
- Configuración del negocio.
- Datos guardados en LocalStorage del navegador.
- PWA instalable y con caché para funcionar sin conexión después de la primera carga.

## Publicar en GitHub Pages
1. Crea un repositorio, por ejemplo `costa`.
2. Sube todos los archivos de esta carpeta a la raíz.
3. En GitHub entra a Settings → Pages.
4. En Source selecciona `Deploy from a branch`.
5. Selecciona `main` y `/ (root)`.
6. Guarda y abre la URL que GitHub genere.

No necesita Firebase, Node, npm ni base de datos para esta primera versión.


## v1.1 mejorada
Ahora cada producto puede asociar equipos/herramientas y servicios, con métodos de asignación por unidad, porcentaje, tiempo o costo fijo. También admite unidades compatibles (g/kg, mL/L, etc.) y tiempos en minutos, horas, días, semanas y meses.
