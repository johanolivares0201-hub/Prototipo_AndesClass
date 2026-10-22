# Entrega 3 — ComplianceData (Fases 6 y 7)

## 1. Implementación por fase

**Fase 6:** incidente ampliado, alcance por país, riesgo y accesos, contención, notificaciones, plazos, reloj simulado/real, causa raíz, acciones correctivas, línea de tiempo y auditLog. Panel integrado con incidente activo, próximo plazo y semáforos que incluyen incidentes. El mapa conserva únicamente hallazgos de tema `transfer`.

**Fase 7:** diez evidencias con criterios, sugerencias y confirmación por responsable; filtros de evidencias y auditoría; vista previa por secciones y PDF generado localmente con librerías diferidas. Se entrega un expediente de ejemplo.

No se implementaron vista del estudiante, Estándar más alto ni publicación. Todo sigue en memoria, sin backend, persistencia ni comunicaciones reales.

## 2. Archivos nuevos o modificados

Nuevos:

```text
src/data/{incidents,evidences}.ts
src/store/{clock.ts,DemoClock.tsx}
src/rules/{incidentRules,incidents,evidences}.ts
src/rules/incidents.test.ts
src/components/{DemoClockControl,Deadline,NotificationForm,IncidentSummary,EvidenceForm}.tsx
src/reports/{limitations,buildReportModel,renderReportPdf}.ts
src/reports/{buildReportModel,renderReportPdf}.test.ts
scripts/{generate-example.mjs,report-example.ts}
output/pdf/Expediente_ComplianceData_AndeClass_con_incidente_2026-10-14.pdf
AVANCE_3.md
```

Modificados: tipos, seed, labels, reducer, Store, evaluate/useCompliance, Layout, Compliance, Dashboard, Findings, Incidents, EvidenceReports, main.tsx, styles.module.css, reports/README.md, README.md, package.json/lock, eslint.config.js y .gitignore.

Se conservaron estructura, Context/useReducer, HashRouter, CSS Modules y IDs estables. AVANCE.md y AVANCE_2.md permanecen intactos. Los tres archivos de las 37 pruebas anteriores se conservaron byte por byte, comprobando SHA-256.

## 3. Reglas de incidentes y plazos

| Destinatario | Requisito del modelo | Plazo | Verificación según el enunciado |
| --- | --- | --- | --- |
| ANPD PE | Sí | 48 h desde detección | Sí; Ley 29733 y DS 016-2024-JUS |
| CNSD PE | Sí si entorno digital | 48 h | Sí; referencia de Perú del caso |
| Titulares PE | Si se afectan derechos; inicialmente por evaluar | Sin plazo numérico | Requisito verificado, sin contador |
| AEPD ES/UE | Sí para riesgo medio/alto; bajo deja excepción por evaluar | 72 h | Sí; RGPD art. 33 |
| Afectados ES/UE | Sí si riesgo alto | Sin plazo numérico | RGPD art. 34; verified false, revisión pendiente |
| Titulares MX | Sí | Plazo por verificar | No; LFPDPPP 2025 |
| SIC CO | Sí | Plazo por verificar | No; Ley 1581 de 2012 |

«Verificado» significa suministrado como verificado en el ejercicio, no revisión jurídica externa. No se inventaron plazos para titulares, MX/CO ni una regla US.

`incidentRules.ts` declara cinco reglas de **diseño del prototipo**, identificadas así en los hallazgos:

1. Requerida, pendiente y vencida: crítico; cita la norma de la notificación.
2. Requerida, pendiente y con 25 % o menos de plazo: advertencia; solo plazos numéricos verificados.
3. Salud con riesgo no alto sin justificación: advertencia; regla conservadora de diseño, referencia RGPD arts. 33/34.
4. Contención incompleta y abierto: advertencia; sensible y más de 24 h: crítico; referencias Ley 29733/DS 016-2024-JUS y RGPD arts. 33/34.
5. No requerida sin justificación: crítico; referencia aplicable, MX/CO con plazo por verificar.

`evaluateIncidents(state, now)` es pura. Los IDs combinan incidente, regla y notificación/condición. Hallazgos con alcance desconocido usan `por_confirmar` para no atribuirlos a un país inventado. `evaluateCompliance(state, now?)` añade incidentes solo con now: sin él conserva los resultados anteriores. Los incidentes entran en semáforos y conteos; el porcentaje mantiene el denominador de reglas de inventario y se etiqueta así.

## 4. Reloj y flujo del caso

`DemoClockProvider` envuelve StoreProvider. El reloj está fuera de AppState/reducer y arranca en `2026-10-12T10:15:00-05:00`. +1/+6/+24/+48/+72 h modifican solo ese reloj; volver al inicio restaura la detección. Tiempo real usa hora del sistema y actualiza cada 15 segundos. Fechas visibles, filtros por fecha y filename usan America/Lima.

Context captura IDs y hora de auditoría fuera del reducer. Envios y evidencias usan el reloj. Cargar escenario reinicia tiempo simulado y conserva auditLog. Volver el reloj atrás puede producir horas no monótonas; auditoría conserva orden de inserción y timeline ordena por instante, con detección primero ante empate.

Verde si queda más del 25 %; ámbar hasta vencimiento; rojo al llegar a cero. Texto de horas/minutos faltantes o vencidos. Aria-live polite anuncia únicamente cambios de estado del contador. Enviada/no requerida no mantiene cuenta regresiva.

Seed: archivo de prueba con nombre/correo/salud de 320 usuarios, 4 h de exposición, accesos desconocidos, riesgo alto sugerido y contención incompleta. Países por confirmar es excluyente: seleccionar países activa destinatarios. La demo registra comunicaciones, no las envía. No requerida exige fundamento. Cambiar requisitos de riesgo reactiva decisiones no requeridas obsoletas; constancias enviadas se conservan.

Salud permite modificar riesgo, exige justificación en el formulario y advierte si falta. Contención incompleta vuelve el estado a abierto. Cierre exige contención completa, alcance, causa/acciones guardadas y resolver notificaciones. Las notas se guardan explícitamente para no auditar cada tecla.

Adaptación mínima: inicial conserva el incidente con nuevo modelo; corregido no tiene incidente activo y sigue verde. El botón del escenario con incidente usa activos iniciales y etiqueta propia. No se añadió CRUD genérico de incidentes ni edición UI de detectedAt: se gestiona el caso preparado.

## 5. Estados de evidencias

`getEvidenceViews(state, now)` deriva estado efectivo, sugerencia, origen y explicación sin mutar estado:

| Evidencia automática | Comprobación |
| --- | --- |
| 1. Inventario/mapa | Campos, titulares, finalidades/base y referencias completos; proveedor identificado para flujos internacionales |
| 2. Roles/contratos | Contratos declarados y sin hallazgos de contrato |
| 3. Transferencias | Mecanismos declarados y sin hallazgos de mecanismo |
| 4. Transparencia/consentimiento | Sin hallazgos de consentimiento, finalidad o base |
| 6. Seguridad | Todos los activos declaran cifrado |
| 8. Incidente | Cierre, contención, alcance, causa, acciones y notificaciones resueltos, sin hallazgos |

5, 7, 9 y 10 son manuales. Sin datos suficientes se sugiere pendiente. Inicial: 1 cumple; 2/3/4/6/8 no cumplen. Corregido: seis automáticas cumplen, cuatro manuales pendientes. Sin incidentes, 8 cumple la comprobación vacía pero explica que no demuestra gestión real.

Confirmar requiere responsable y nota, registra hora del reloj y prevalece sobre la sugerencia. Se muestra calculado, confirmado por el usuario o manual pendiente. Volver a sugerencia retira la confirmación y audita. Son declaraciones, no revisión de contratos, implementación técnica o documentos reales.

## 6. PDF, librerías y tamaño

`buildReportModel(state, now, clockMode?)` es puro; clockMode opcional identifica simulado/real. El modelo alimenta también la vista previa. Secciones: portada, resumen, inventario, proveedores/transferencias, hallazgos, incidente, timeline, notificaciones, evidencias, últimos 50 cambios y supuestos/limitaciones.

`renderReportPdf(model)` dibuja y devuelve documento, filename y diagnósticos. La pantalla descarga. jsPDF **4.2.1**, AutoTable **5.0.8** y el renderizador usan import dinámico; no hay CDN ni exportación HTML. Los chunks estáticos son recursos locales de Vite, no consultas de datos a una API.

A4 horizontal, Helvetica/WinAnsi, acentos/ñ preservados y símbolos no soportados sustituidos; título, idioma es, fecha del reloj, encabezado ComplianceData y Página X de Y. Anchos explícitos, encabezados repetidos y rowPageBreak avoid. Textos excepcionales se reparten en registros rotulados de continuación sin omitir contenido ni cortar físicamente filas. AuditLog conserva JSON íntegro en la app y exporta resúmenes legibles, acotados a 600 caracteres y señalados si se acortan.

Filename: `Expediente_ComplianceData_<escenario>_<AAAA-MM-DD>.pdf`. Limitaciones son síntesis estática de AVANCE_2 en limitations.ts; el navegador no lee Markdown del filesystem. No se incluyó la alternativa imprimible opcional.

Referencia Entrega 2: JS inicial 100,97 kB gzip. Resultado final: **113,96 kB gzip** de JS inicial (375,21 kB sin comprimir), incremento de 12,99 kB gzip por pantallas/modelo. PDF queda diferido: jsPDF 128,84 kB gzip, AutoTable 9,92 kB gzip y renderizador 2,10 kB gzip. Vite emite módulos opcionales HTML/canvas de jsPDF, pero el flujo de tablas no los invoca.

Ejemplo: **19 páginas, aproximadamente 42 kB**, países PE/ES/MX/CO confirmados, una contención completa, ANPD registrada a +40 h y generación a +49 h. CNSD vencido 1 h y AEPD con 23 h restantes. Reproducible con `npm run report:example`.

## 7. Verificación

- Build correcto; sitio estático dist, base './'. Lint sin errores; se excluyen herramientas temporales QA, caché y salida PDF.
- **62 pruebas aprobadas, 6 archivos**: 37 originales intactas y 25 nuevas. Notificaciones, plazos/umbrales, cada regla, pureza, reloj, auditoría, evidencias inicial/corregido, modelo y paginación extensa.
- PDF producido con el renderizador real; se renderizaron e inspeccionaron sus 19 páginas con PyMuPDF. Pypdf verificó idioma es. **0 filas partidas, 0 filas fuera del área útil, 0 caracteres de reemplazo, 19 pies de página; acentos y ñ correctos.** Se corrigieron anchos, cabeceras fragmentadas y legibilidad del timeline/auditoría.
- No se abrió el PDF en una aplicación gráfica; se inspeccionaron sus imágenes renderizadas y texto/metadatos.
- **App sin revisión visual en navegador:** la herramienta devolvió apps/browsers vacíos. No se comprobó interfaz de escritorio/móvil ni pantallas anteriores. La inspección PDF no sustituye esa prueba.
- Esbuild y herramientas Python requirieron ejecución fuera del sandbox por restricciones de lectura Windows; no se cambiaron políticas del sistema.

## 8. Pendientes Fase 8

Revisión real en navegador/lector de pantalla y pulido responsive, formularios y descarga. Vista del estudiante y Estándar más alto sin duplicar reglas. Revisión jurídica de supuestos, mecanismos y plazos pendientes. Ampliar edición de datos clave/alta de incidentes y preservar clasificación histórica cuando se eliminen activos del inventario. Mejorar snapshots documentales y trazabilidad de evidencias.

Publicación estática pendiente de la Fase 8: no se crearon cuentas ni se desplegó a servicios externos.
