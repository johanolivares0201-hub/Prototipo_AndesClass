# ComplianceData

Prototipo académico para Derecho Informático (UNDAC). Implementa las fases 1 a 7 del caso AndeClass: inventario, reglas, transferencias, simulador, consentimientos, incidentes, evidencias y expediente PDF. Entrega 4 incorpora correcciones normativas y fuentes con corte 14/10/2026. Vista del estudiante y Estándar más alto siguen pendientes.

## Instalación y ejecución

Requiere Node.js 22.12 o superior y npm.

```sh
npm install
npm run dev
```

En PowerShell, si la política bloquea `npm.ps1`, utilizar `npm.cmd` en lugar de `npm`.

## Verificación y compilación

```sh
npm run lint
npm test
npm run build
npm run preview
```

El sitio estático se genera en `dist/`. Vite usa `base: './'` y React Router usa HashRouter; las rutas funcionan sin reglas de redirección del servidor. No abrir `index.html` con `file://`: servir `dist/` mediante un servidor estático o `npm run preview`.

## Publicación

- Netlify: comando de compilación `npm run build`, directorio de publicación `dist`. También se puede subir directamente la carpeta `dist` compilada.
- GitHub Pages: publicar **el contenido** de `dist/` como artefacto de Pages o en la rama configurada para publicación. Las rutas usan `/#/inventario`, etc.; no se requiere fallback del servidor. Los recursos son relativos para permitir un subdirectorio de repositorio.

Esta entrega prepara un sitio local compilable; no crea cuentas ni realiza una publicación externa.

## Uso

El Panel general resume conteos, semáforos, porcentaje de reglas cumplidas y hallazgos prioritarios. Inventario permite crear, editar y eliminar datos, buscar por nombre/notas y combinar filtros de categoría, sensibilidad, finalidad y país **del titular**. Los modales permiten gestionar proveedores. Salud siempre es sensible. El estado de cada dato abre sus hallazgos.

La matriz normativa reproduce el enunciado y muestra las reglas activas del motor; las citas nuevas de la Entrega 2 aparecen en la tabla de reglas. Hallazgos permite filtrar resultados por severidad, país y dato. Transferencias incluye un diagrama SVG propio, contrato/mecanismo editables y un simulador aislado con aplicación explícita. Consentimientos permite editar base y consentimiento separado por finalidad. Incidentes permite confirmar países, contener, evaluar riesgo y registrar notificaciones. Evidencias incluye diez criterios, confirmaciones, auditoría, vista previa y descarga PDF.

Los botones «AndeClass inicial» y «AndeClass corregido» alternan escenarios, previa confirmación de reemplazo. Reiniciar devuelve al inicial. El corregido genera semáforos verdes y 100 % del modelo. Ese porcentaje es una proporción de comprobaciones académicas y no certifica cumplimiento jurídico. El registro de cambios se conserva en memoria al alternar escenarios; se pierde al recargar.

En el simulador, los cambios de un proveedor afectan a todos sus activos en la copia. «Aplicar al inventario» registra los cambios; «Descartar» copia el inventario actual. Si este cambió desde el inicio de la simulación, aplicar se bloquea para evitar sobrescribir ediciones. Cerrar el simulador descarta su sesión. Un hallazgo resuelto puede haber dejado de aplicar al retirar finalidades o países.

Todo el estado vive en React Context + useReducer. La app no utiliza almacenamiento persistente, backend ni peticiones de red; la recarga pierde cambios. Las solicitudes del servidor de desarrollo para recursos/HMR no son peticiones de datos de la aplicación. No introducir datos personales reales en este prototipo.

Consulta `AVANCE.md`, `AVANCE_2.md`, `AVANCE_3.md` y `AVANCE_4.md` para las tres entregas, supuestos, cálculos, pruebas y pendientes.

## Incidentes, reloj y PDF

«Cargar escenario con incidente» restaura el caso detectado el 12/10/2026 a las 10:15 de Lima. Confirmar países activa las notificaciones. ANPD/CNSD tienen 48 h y AEPD 72 h según el caso; México muestra comunicación inmediata condicionada a afectación significativa, sin contador horario. Colombia usa 15 días hábiles desde el día siguiente, lunes a viernes y festivos configurables (vacíos por defecto). «Enviada» registra una constancia simulada, no envía comunicaciones. «No requerida» exige justificación.

El reloj inicia simulado: avances +1/+6/+24/+48/+72 h y retorno a la detección. Tiempo real usa hora del sistema. Los cambios de reloj no alteran el inventario y la auditoría registra la hora seleccionada. El porcentaje corresponde a reglas de inventario; los incidentes también entran en hallazgos y semáforos.

Las evidencias calculadas son sugerencias del modelo. Confirmarlas requiere responsable y nota; las cuatro manuales deben revisarse. «Descargar expediente PDF» toma una instantánea de la sesión y del reloj, con bibliotecas cargadas de forma diferida.

Para reproducir el PDF de ejemplo de la entrega:

```sh
npm run report:example
```

Se guarda en `output/pdf/`. El ejemplo contiene países confirmados y avances/acciones simulados para mostrar plazos. La app no se verificó visualmente en navegador porque no había uno conectado; el PDF sí se renderizó e inspeccionó.

## Verificación normativa y demostración

En «Fuentes y verificación» se distingue fuente oficial, secundaria y por contrastar; cada regla incluye fuentes. México salud exige consentimiento escrito (art. 8, fuente secundaria). Perú incluye declaración de flujo comunicado en el proveedor. Art. 16 y art. 13.6 PE permanecen por contrastar; no se cambia el mecanismo DPF. La guía plegable enlaza los seis pasos para exponer.

Festivos CO: editar `src/data/calendar.ts` con fechas YYYY-MM-DD. La lista vacía no representa el calendario oficial completo. La demo conserva la hora de detección en el día de vencimiento como decisión de diseño.

Comprobación local del sitio compilado (dos terminales):

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

En otra terminal:

```sh
npm run verify:static
```

El script verifica recursos en raíz y subcarpeta `/compliance-data/`, sin ejecutar la interfaz React. No reemplaza una revisión de navegador. La Entrega 4 no tuvo navegador conectado para revisión visual a 375 px.

## Publicar el sitio estático

**Netlify, carga manual:** ejecutar `npm ci` y `npm run build`. En la cuenta del usuario, abrir el área de despliegue manual y arrastrar `dist/`; `index.html` debe estar directamente dentro de esa carpeta. Revisar el enlace y rutas `#/inventario`, `#/fuentes` y `#/incidentes`. No subir node_modules ni el código fuente como carpeta de publicación.

**GitHub Pages:** publicar el contenido de `dist/` en la rama/carpeta elegida para Pages (por ejemplo, rama gh-pages, raíz), añadiendo `.nojekyll` si se publica por rama. En Settings > Pages seleccionar esa rama/carpeta. Alternativa: workflow de Pages con `npm ci`, `npm run build` y artifact cuyo path sea dist. Los recursos relativos y HashRouter permiten `https://usuario.github.io/repositorio/#/fuentes` sin reescrituras del servidor.

Estos pasos son documentación: no se desplegó ni se crearon cuentas en esta entrega. jsPDF y AutoTable se cargan solo al solicitar el PDF, desde chunks estáticos del mismo sitio; no hay API ni persistencia.
