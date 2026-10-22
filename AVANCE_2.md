# Entrega 2 — ComplianceData (Fases 4 y 5)

## 1. Implementación por fase

**Fase 4:** motor puro de evaluación, 48 reglas declaradas como datos, IDs estables de hallazgos, semáforos por país/dato y porcentaje global. Panel con críticos, advertencias y los cinco hallazgos prioritarios. Nueva ruta `#/hallazgos` con filtros por severidad, país y dato. Inventario con estado clicable y hallazgos al abrir/editar. Matriz con tabla de reglas resaltadas y conteos de hallazgos. Escenarios inicial/corregido, reinicio y auditoría de cambios en memoria.

**Fase 5:** viaje del dato en SVG propio, filtrado por activo, líneas seleccionables con teclado y botones HTML equivalentes; proveedores, países y almacenamiento dinámicos. Tabla de contrato/mecanismo editable. Simulador sobre copia temporal con antes/después, hallazgos nuevos/resueltos, aplicación explícita y descarte. Consentimientos editables por dato/finalidad, hallazgos relacionados y auditoría automática.

Incidentes y Evidencias/reporte conservan sus estados vacíos de Fases 6 y 7. No hay PDF, cuenta regresiva ni vista de estudiante.

## 2. Archivos nuevos o modificados

Nuevos:

```text
src/rules/useCompliance.ts
src/rules/simulation.ts
src/rules/transfers.ts
src/rules/evaluate.test.ts
src/rules/simulation.test.ts
src/components/Compliance.tsx
src/components/DataJourney.tsx
src/components/Simulator.tsx
src/pages/Findings.tsx
AVANCE_2.md
```

Modificados: `src/types/index.ts`, `src/data/seed.ts`, `src/store/reducer.ts`, `src/store/Store.tsx`, `src/rules/rules.ts`, `src/rules/evaluate.ts`, `src/components/Layout.tsx`, `src/components/AssetForm.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Inventory.tsx`, `src/pages/NormativeMatrix.tsx`, `src/pages/Transfers.tsx`, `src/pages/Consents.tsx`, `src/main.tsx`, `src/styles.module.css` y `README.md`.

Se conservan estructura, Context/useReducer, HashRouter, CSS Modules y dependencias de la Entrega 1. No se sobrescribió `AVANCE.md` ni se modificaron sus cinco pruebas.

## 3. Reglas implementadas y normas

| Regla | Severidad | Norma del modelo |
| --- | --- | --- |
| Salud PE: escrito y separado | Crítico | Ley 29733 |
| Salud ES/UE: explícito y separado | Crítico | RGPD art. 9.2.a |
| Salud MX: expreso | Crítico | LFPDPPP 2025; artículo por verificar |
| Salud CO: autorización explícita | Crítico | Ley 1581 de 2012 |
| Salud con analítica/publicidad/recomendaciones | Crítico | PE: Ley 29733 art. 6; ES/UE: RGPD art. 5.1.b; otras jurisdicciones: marco general, detalle por verificar |
| Publicidad sin consentimiento | Crítico | ES/UE: RGPD art. 6 y LSSI art. 21; otras: marco general del caso |
| Analítica/recomendaciones con contrato | Advertencia | Marco general de la jurisdicción |
| Analítica/recomendaciones sin base | Crítico | Marco general de la jurisdicción |
| Cualquier finalidad sin base | Crítico | Marco general de la jurisdicción |
| Proveedor/transferencia sin contrato | Crítico | Marco general del caso y contrato de encargo |
| Transferencia ES/UE sin mecanismo aceptado por el modelo | Crítico | RGPD Cap. V: DPF o cláusulas tipo |
| Transferencia PE sin mecanismo | Advertencia | Ley 29733 art. 15 |
| Transferencia MX sin mecanismo | Advertencia | LFPDPPP 2025; artículo por verificar |
| Transferencia CO sin mecanismo | Advertencia | Ley 1581 art. 26 |
| Salud sin cifrado | Advertencia | PE: Ley 29733 art. 16; ES/UE: RGPD art. 32; otras: marco general, detalle por verificar |
| Finalidad comercial sin consentimiento separado | Advertencia | Marco general de la jurisdicción |

Las reglas comunes se despliegan en PE, ES_UE, MX, CO y US; salud/autorización y mecanismos específicos solo tienen las cuatro variantes expresamente suministradas. US no recibe artículos ni una ley general inventada: sus reglas comunes se identifican como requisitos académicos por verificar. Las citas específicas de los artículos 6, 15 y 16 de Ley 29733 y 5.1.b, 6 y 32 RGPD provienen del prompt de Entrega 2, que amplía la matriz original. Se presentan en la tabla adicional de reglas sin alterar silenciosamente el texto original de referencia.

Cada regla tiene condición `appliesTo`, comprobador tipado `check`, requisito, norma, severidad, recomendación, tema y `needsVerification`. MX se marca por artículo pendiente; US por extrapolación académica; CO marca las reglas comunes que no tienen detalle normativo suministrado. Incidentes no se evalúan, por lo que sus plazos pendientes no se convierten en reglas.

### Adaptaciones mínimas y supuestos explícitos

- El esquema previo no distinguía «expreso» de consentimiento simple ni registraba simultáneamente escrito/explícito. En el modelo, `consentimiento_escrito` satisface escrito, expreso y explícito; `consentimiento_explicito` satisface explícito/expreso, pero no escrito PE. El consentimiento simple no satisface salud MX. Esta simplificación es académica y debe revisarse antes de tratar datos reales.
- La prohibición de finalidades comerciales sobre salud se implementa como regla conservadora exigida por el ejercicio; no representa una prohibición legal universal automáticamente demostrada por las citas.
- `purposeConsents` es un mapa opcional por finalidad. Sin registro propio, la fila hereda `legalBasis` y `consentSeparate` del activo anterior. Cambiar esos valores comunes desde el formulario o simulador reemplaza las excepciones por finalidad; la UI lo explica. Editar en Consentimientos cambia únicamente la fila seleccionada.
- Transferencia internacional: almacenamiento o país del proveedor distinto de la jurisdicción del titular. `ES_UE` representa un único ámbito. Contrato se revisa siempre que haya proveedor asociado o transferencia, incluso si falta proveedor registrado. No se inventa un contrato válido para un almacenamiento extranjero sin proveedor.
- Para ES/UE el modelo acepta cláusulas tipo, o DPF con proveedor y almacenamiento US. «Otro» requiere revisión y produce crítico en el modelo UE; no se certifica invalidez jurídica de cualquier otro mecanismo posible. Para PE/MX/CO cualquier mecanismo declarado distinto de ninguno supera esta comprobación simplificada.
- Proveedores no asociados a activos no reciben hallazgos por jurisdicción, ya que no hay titulares ni flujo atribuible. País del proveedor y país de almacenamiento permanecen separados.
- Se añadió eliminación de proveedores con confirmación para cubrir la auditoría solicitada. Desvincula los activos sin borrar su almacenamiento; el log registra IDs de activos afectados.
- No se implementó el interruptor opcional «Estándar más alto» para mantener un solo alcance de evaluación: países de los titulares.

## 4. Semáforos y porcentaje

`evaluateRules(state)` genera una comprobación por **activo × jurisdicción del titular × regla aplicable**. Las condiciones filtran categoría, finalidad, grupo de finalidades y transferencia. Se deduplican países mediante la regla por jurisdicción; las reglas de grupos comerciales se comprueban una vez por activo/país, considerando todas las finalidades relevantes y sus bases individuales.

`evaluateCompliance(state)` devuelve solo comprobaciones fallidas, sin mutar estado, consultar red, generar IDs aleatorios ni leer el reloj. Los IDs son `assetId:ruleId`. El mismo proveedor se evalúa en el contexto de cada activo y país; estos hallazgos son comprobaciones distintas, no un conteo de proveedores únicos.

Rojo si existe crítico; ámbar si no hay críticos y hay advertencias; verde si no hay hallazgos. Se agregan por `assetId`, por `jurisdiction` o por una selección de rutas. El mapa utiliza únicamente hallazgos de tema `transfer`. Las líneas de origen resumen sus transferencias hacia los destinos y se identifican como tal; los trazos discontinuos y las etiquetas indican cruce de frontera.

Porcentaje = `round(reglas aplicables cumplidas / reglas aplicables × 100)`. No pondera severidades. Los requisitos inciertos del modelo también se cuentan y se etiquetan, por lo que el resultado no es certificación jurídica. Sin reglas aplicables se muestra «Sin reglas», no 100 %. El simulador muestra «Sin titulares» cuando un país sale del alcance. Los denominadores pueden cambiar al retirar finalidades o países.

El escenario corregido mantiene los cuatro países, contrato registrado, cláusulas tipo, bases adecuadas, consentimiento separado, cifrado y salud exclusivamente para bienestar. Genera cero hallazgos y 100 % de las comprobaciones del modelo.

## 5. Simulador y auditoría

`createSimulation` usa `structuredClone`. La sesión retiene el estado real de referencia y una copia editable. Cambios de finalidades, titulares, almacenamiento, base, consentimiento y cifrado afectan al activo seleccionado; contrato/mecanismo afectan a su proveedor compartido y se recalcula todo el inventario simulado.

La comparación usa IDs estables para distinguir hallazgos nuevos y resueltos. «Resuelto» incluye reglas que dejaron de aplicar al retirar países o finalidades: no implica una medida jurídica demostrada. Aplicar requiere al menos una finalidad por activo. La acción atómica `APPLY_SIMULATION` envía solo activos/proveedores modificados y produce entradas de auditoría por entidad. No sustituye incidentes ni evidencias.

Si el estado real cambió durante la simulación, la UI bloquea aplicar y el reducer rechaza el estado base obsoleto. Descartar copia nuevamente el inventario actual. Cerrar el panel también descarta su sesión temporal; al abrir se crea una nueva copia. No hay escrituras al estado real durante la experimentación.

`auditLog` mantiene ID, timestamp ISO, acción, entidad y detalle antes/después. Context captura hora e ID fuera del reducer, manteniéndolo puro y evitando duplicar efectos en StrictMode. Carga de escenario y reinicio conservan el historial en memoria y añaden una entrada. Recargar borra todo el historial y vuelve al seed inicial. No hay pantalla completa de auditoría aún.

## 6. Verificación

- `npm run build`: correcto; genera sitio estático con `base: './'`.
- `npm run lint`: sin errores.
- `npm test`: **37 pruebas aprobadas, 3 archivos**, incluidas las 5 existentes.
- Pruebas: escenarios inicial/corregido; consentimiento salud en cuatro países; salud comercial; publicidad; bases secundarias/ausentes; contrato; mecanismos y DPF; cifrado; separación; excepciones por finalidad; aplicabilidad; semáforos; porcentaje; pureza; IDs; simulación aislada; comparación; aplicación atómica y rechazo de estado obsoleto; auditoría; eliminación de proveedor; modelo de rutas.
- En este entorno Windows, esbuild requiere ejecutar build/pruebas fuera del sandbox por lectura bloqueada de directorios superiores. No es un error de TypeScript ni del proyecto.
- **Revisión visual no realizada:** la herramienta de navegador devolvió `apps: []` y `browsers: []`. Debe completarse manualmente en escritorio y móvil, incluyendo selección de rutas SVG por teclado, formularios y edición de consentimientos. No se afirma una comprobación visual que no se realizó.

## 7. Pendientes para Fases 6 y 7

Fase 6: ampliar Incident con instante y tipo de detección, países/activos/afectados, criterios de notificación y estado; confirmar fuentes y plazos pendientes de MX/CO antes de contar tiempo; añadir registro, seguimiento y pruebas de plazos. El incidente ficticio inicial sigue sin temporizador.

Fase 7: ampliar Evidence para vincular medidas, hallazgos y cambios; consumir `auditLog`; preparar expediente PDF en el cliente con inventario, proveedores, hallazgos, incidentes, fuentes, fecha y limitaciones. Elegir una dependencia PDF ligera, verificar accesibilidad y diseño de exportación. No se incluyen todavía captura de documentos, persistencia, archivos ni librería PDF.

Antes de usar como herramienta real: revisión jurídica de las simplificaciones, verificación de mecanismos/certificaciones, bases legales y textos por país, y pruebas de interfaz en navegador. El prototipo mantiene el pie académico solicitado.
