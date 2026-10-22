# Avance — ComplianceData

## 1. Implementación por fase

- **Fase 1:** tipos de activos, jurisdicciones, proveedores, hallazgos, reglas, incidentes y evidencias; seed independiente con siete activos, un cloud en US y un incidente de 320 usuarios. Matriz normativa estructurada de cinco jurisdicciones.
- **Fase 2:** siete pantallas con HashRouter, menú lateral, conteos reales, matriz filtrable, listado provisional de proveedores/destinos, estados vacíos por fase y pie fijo académico. Layout responsive, foco visible, etiquetas, enlace de salto y modales nativos accesibles.
- **Fase 3:** CRUD de inventario, confirmación de eliminación, búsqueda sin distinción de tildes/mayúsculas, filtros combinables, chips, formularios validados, gestión de proveedores por alta/edición, restauración de escenario. Salud sensible protegida en formulario y reducer.

## 2. Árbol de carpetas

```text
src/
  types/index.ts
  data/{labels,seed,normative}.ts
  rules/{rules,evaluate}.ts
  store/{Store.tsx,reducer.ts,reducer.test.ts}
  components/{Layout,Icon,Modal,AssetForm,ProviderForm,Chips,EmptyState}.tsx
  pages/{Dashboard,Inventory,NormativeMatrix,Transfers,Consents,Incidents,EvidenceReports}.tsx
  reports/README.md
  main.tsx
  styles.module.css
index.html
package.json
package-lock.json
vite.config.ts
tsconfig.json
eslint.config.js
README.md
AVANCE.md
```

## 3. Decisiones técnicas

React + TypeScript + Vite, React Router con HashRouter, Context + useReducer, CSS Modules. El módulo CSS utiliza selectores explícitos `:global` para las clases del único layout; no hay Tailwind ni librerías de UI. Iconos SVG locales sin dependencias. `dialog.showModal()` aporta foco modal, bloqueo del fondo, navegación por teclado y Escape; al cerrar se intenta devolver el foco al control que lo abrió. IDs nuevos con `crypto.randomUUID()` (localhost o HTTPS).

El filtro país se interpreta como país del titular y se etiqueta así. País de almacenamiento se define por activo; país del proveedor se registra por separado, sin asumir que siempre coinciden. Sin proveedor es válido. El formulario nuevo inicia almacenamiento en Perú; el país es obligatorio y la lista impide un valor vacío. Datos sensibles de otras categorías sí pueden registrarse manualmente.

Ambos botones de demo restauran el seed; se confirma el reemplazo por afectar las ediciones de la sesión. No se implementa borrado de proveedores porque el alcance pide agregar/editar. Campos no descritos por el enunciado usan decisiones simples: consentimiento para los activos ordinarios, cifrado sin registrar y fecha ficticia del incidente, señalados en notas o descripción. No se agregan requisitos jurídicos externos.

## 4. Estado y seed

`AppState` contiene `assets`, `providers`, `incidents` y `evidences`. No contiene resultados inventados. `createSeed()` crea arrays y objetos nuevos para cada inicio/restauración. Los países de titulares iniciales son PE, ES_UE, MX y CO; almacenamiento US para todos los activos y proveedor `cloud-us`. Académico/comportamiento añaden analítica, publicidad y recomendaciones a servicio. Salud usa bienestar más esas tres finalidades, consentimiento simple y consentimiento separado falso.

Las acciones agregan, actualizan y eliminan activos; agregan/actualizan proveedores y restauran el escenario. La normalización obliga a salud sensible incluso si la acción evade el formulario. No existen localStorage, sessionStorage, IndexedDB ni llamadas de datos a la red. Los contadores se derivan del inventario en cada render.

## 5. Pendiente y límites

Fase 4: evaluación real y semáforos. Fase 5: viaje del dato, revisión de transferencias, consentimientos y simulador. Fase 6: incidentes con plazos. Fase 7: evidencias y expediente PDF. Vista estudiante pendiente, sin ruta añadida en esta entrega.

La matriz reproduce el material del caso, sin validación de vigencia. Redacción de incidentes MX, plazo CO y campos no suministrados permanecen «por verificar». Los círculos del panel son grises, sin significado de cumplimiento. No se muestran resultados críticos pese a los problemas preparados en el seed. Las fechas y estados básicos de Incident/Evidence son preparatorios y no tienen operaciones de UI.

Mejoras posteriores: mensajes de validación por campo, revisión experta de fuentes, pruebas de integración con navegador y manejo de evidencias. No se incluye carga de documentos ni datos reales.

Verificación de entrega: `npm run build`, `npm run lint` y `npm test` ejecutados satisfactoriamente (cinco pruebas del reducer). Se verificó HTTP 200 en el servidor local. La instalación con Vitest 5.0.4 informó cero vulnerabilidades. Esbuild necesitó permisos fuera del sandbox de esta sesión por el bloqueo de lectura de directorios superiores en Windows. No se pudo realizar revisión visual/interacción con navegador: la herramienta disponible devolvió un inventario de navegadores vacío. El diseño responsive y las interacciones quedan pendientes de esa comprobación manual.

## 6. Extender el motor en Fase 4

1. Revisar la matriz y resolver cada «por verificar» con fuentes oficiales, sin convertir texto incierto en regla automática.
2. Poblar `src/rules/rules.ts` con `Rule[]`. `appliesTo` admite categoría, finalidad y transferencia internacional; definir expresamente cómo se combina y cómo se calcula una transferencia.
3. Ampliar el esquema con condiciones tipadas para requisito incumplido (base legal, consentimiento separado, contrato, mecanismo) si hacen falta; evitar interpretar requisitos de texto como código.
4. Implementar `evaluateCompliance(state): Finding[]` en `evaluate.ts`, hoy devuelve `[]`. Cada hallazgo debe vincular jurisdicción, activo, regla, norma y recomendación; utilizar IDs estables y resultados deterministas.
5. Agregar pruebas de escenarios de cumplimiento y excepciones por país antes de conectar el resultado al panel y a la columna de estado. Definir cómo agregar severidades sin asumir que ausencia de hallazgos significa cumplimiento legal completo.
6. Evaluar desde estado derivado, sin almacenar resultados obsoletos; conservar inventario y seed separados de las reglas.
