# Entrega 4 — Verificación normativa y pulido final

Fecha de corte del registro de fuentes: **14/10/2026**. Se leyeron las entregas previas y se mantuvieron Context/useReducer, funciones puras, HashRouter, CSS Modules, reglas como datos e IDs estables. No se implementaron estudiante, Estándar más alto, persistencia ni despliegue.

## Bloque A. Correcciones y reglas

| Cambio | Fuente / estado | Implementación |
| --- | --- | --- |
| MX salud, art. 8 | mx-lfpdppp-2025 / secundaria | Solo consentimiento_escrito satisface salud MX. Explícito sin constancia escrita genera crítico. Recomendación menciona firma autógrafa, electrónica o autenticación. |
| MX incidente, art. 19 | mx-lfpdppp-2025 / secundaria | Requisito inicialmente por_evaluar; salud sugiere informar sí. Etiqueta inmediata, sin deadlineHours ni contador horario. Decisión explícita si/no y fundamento en formulario. |
| MX sin decisión con salud | mx-lfpdppp-2025 / secundaria | Nueva regla de diseño incident-mx-decision: advertencia, no conclusión automática de obligación legal. |
| MX aviso y tercero, arts. 15 fr. II y 35 | mx-lfpdppp-2025 / secundaria | Advertencias informativas en la matriz. No se inventan campos ni se infiere identificación de sensibles o asunción de obligaciones a partir del contrato. |
| CO reporte SIC/RNBD, 15 días hábiles | co-sic-circular + co-sic-incident / oficial | deadlineType business_days, deadlineDays 15. Día de detección excluido; lunes a viernes y festivos configurables. |
| PE comunicación de flujo | pe-flow-gob + pe-law-gob / oficial | Campo simple Provider.peFlowRegistered, editable en proveedor. Regla PE-flow-registered: advertencia para transferencia PE sin constancia declarada. |
| PE artículos contrastados | pe-law-gob / oficial | Matriz y registro señalan arts. 2.5, 5, 6, 9, 11 y 15. No se agrega una regla jurídica no solicitada por cada artículo. |
| PE arts. 16 y 13.6 | pe-law-gob + pe-law-vlex / por_contrastar | Salud escrito/separado y cifrado continúan como condiciones previas, con estado pendiente de contraste. |
| PE notificaciones 48 h | pe-ds-cms + pe-ds-peruano / secundaria | ANPD/CNSD conservan 48 h. CNSD sigue usando entorno digital como simplificación del caso; el ámbito material debe contrastarse. |
| ES AEPD 72 h | eu-gdpr / oficial | Art. 33, comportamiento preservado. Comunicación a afectados art. 34 usa la misma fuente oficial, sin plazo horario inventado. |
| DPF y recurso C-703/25 P | eu-dpf-decision + eu-dpf-appeal / oficial | Se preserva el mecanismo. Aviso oficial confirma interposición 31/10/2025; pendiente según corte del ejercicio. Seguimiento posterior por contrastar. |

Fuente MX: reproducción del texto de la ley de 2025, publicación DOF 20/03/2025; no se etiqueta como consulta directa al DOF. Se contrastaron los arts. 8 y 19 en esa reproducción. El trámite gob.pe respalda comunicación del flujo; art. 15 se cita como contexto, sin inventar un numeral que imponga inscripción.

La SIC distingue responsables inscritos en RNBD de los no obligados y sus canales. Se mantiene el canal RNBD pedido para el caso, señalando revisión de alcance. El número 2.5 corresponde a la referencia del ejercicio; la consolidación de la Circular se deja anotada para contraste.

### Calendario CO

`src/rules/businessDays.ts` cuenta desde el día siguiente en fecha local Lima/Bogotá (UTC-5). Prueba exigida: lunes 12/10/2026 10:15, más 15 días hábiles sin festivos, vence **lunes 02/11/2026**. La demo conserva la hora de detección (10:15) como precisión de diseño; no afirma una regla jurídica sobre la hora de cierre del día.

Configurar festivos en `src/data/calendar.ts`, fechas YYYY-MM-DD; lista vacía por defecto. La función también acepta una lista como argumento para pruebas. No descarga calendarios. El contador muestra tiempo de calendario hasta el vencimiento en días/horas/minutos, no días laborales restantes. El umbral de advertencia sigue siendo el 25 % del intervalo temporal entre detección y vencimiento; es una condición de diseño, no un artículo legal.

Decisiones MX se conservan al derivar nuevamente las notificaciones. Enviada implica decisión sí; no requerida requiere decisión/fundamento y no muestra exhortación de comunicar. Las constancias anteriores de envío/no requerida con fundamento pueden interpretarse como decisiones para compatibilidad con las pruebas/estado previo en memoria.

## Bloque B. Fuentes y verificación

Nuevo `src/data/sources.ts`: 12 registros con id, título, cita, URL cuando disponible, tipo, consulta 2026-10-14 y nota. Incluye LFPDPPP, Circular/concepto SIC, Ley 29733 en gob.pe y referencia vLex, resúmenes CMS/El Peruano de decretos, RGPD, Decisión 2023/1795 y recurso C-703/25 P.

Las referencias vLex y CMS se registran como referencias secundarias facilitadas en el corte; URL específica/consolidación por contrastar. No se afirma acceso autenticado a vLex ni una consulta completa a un enlace CMS que no se pudo identificar. El artículo de análisis de El Peruano es secundaria, aunque el medio publique también normas oficiales.

Se eliminaron verified y needsVerification de los modelos y datos de reglas, hallazgos y notificaciones. Se sustituyen por **verificationStatus** (oficial, secundaria, por_contrastar) y **sourceIds** obligatorios. No hay regla sin estado/fuente. Los pendientes del modelo se vinculan al registro project-matrix; no se simula una norma oficial para una condición conservadora.

Nueva ruta `#/fuentes`, filtro por estado, registro de fuentes y tabla de reglas. Resumen actual de 55 reglas: **7 con fuente oficial, 2 secundaria y 46 por contrastar** (49 de inventario y 6 de incidentes). Estos niveles describen la procedencia/contraste de la referencia, no certifican la traducción de una norma a código. Hallazgos temporales emplean la referencia específica de su notificación; las reglas generales de diseño conservan su propia ficha.

Insignias con texto y color en Hallazgos, Matriz, Incidentes y PDF. PDF agrega «Fuentes y estado de verificación» y tabla de estados por regla, actualiza las limitaciones y retira la etiqueta genérica anterior. Se mantiene la importación diferida de jsPDF/AutoTable. El ejemplo actualizado contiene 27 páginas y fue generado por el mismo renderizador de la app.

## Bloque C. Pulido y límites de revisión

- Panel plegable «Guía de demostración» con seis pasos y enlaces: escenario inicial, panel, simulación, mapa, incidente/reloj y expediente.
- Ajustes estáticos de CSS: min-width 0 en contenedores de grid/flex, tablas/mapa con scroll contenido, texto largo que puede partirse, encabezados/botones que envuelven, modal limitado al viewport, sidebar desplazable y tarjetas de fuentes en una columna a ancho móvil.
- Se preservan foco visible, etiquetas, scroll enfocable, navegación de líneas SVG con Enter/Espacio y alternativa de botones. Las nuevas insignias no dependen solo de color.
- Descarga PDF conserva indicador de generación, estado accesible y mensaje de error; se añadió aria-busy. Mensajes de notificación/decisión inmediata MX son coherentes y exigen fundamento cuando no se requiere.
- **No hubo navegador conectado:** la herramienta devolvió apps/browsers vacíos. No se recorrieron ni midieron realmente pantallas a 375 px, no se ejecutó una prueba visual de teclado/lector de pantalla y no se afirma ausencia visual comprobada de desbordes. Esa revisión sigue pendiente. El pulido descrito es de código, independiente de la inspección PDF.

## Bloque D. Pruebas, build y publicación

- `npm run build`: correcto, dist estático, base './', HashRouter.
- `npm run lint`: sin errores, incluidos scripts Node con sus globals correspondientes.
- `npm test`: **73 pruebas aprobadas, 7 archivos**. Se conservaron los 62 casos anteriores y se agregaron 11 para MX escrito, decisiones inmediatas sin contador, calendario CO y festivos, flujo PE y trazabilidad de todos los registros.
- Ajustes normativos en pruebas existentes: evaluate.test migra la insignia MX; incidents.test migra origen PE/UE, CO con plazo y sustituye el caso sin contador por MX; buildReportModel.test espera las secciones de fuentes/verificación. No se retiraron casos; no se mantienen expectativas jurídicas obsoletas.
- `npm run preview -- --host 127.0.0.1 --port 4173`: ejecutado correctamente. `npm run verify:static` comprobó HTTP 200 y contenidos HTML/CSS/JS en raíz y bajo /compliance-data/ con servidor estático temporal local; comprueba base relativa y presencia de HashRouter en código. **No ejecuta React ni verifica navegación renderizada en un navegador.**
- Rendimiento: JS inicial **119,37 kB gzip** (393,16 kB sin comprimir); jsPDF separado 128,85 kB gzip, AutoTable 9,92 kB gzip, renderizador 2,29 kB gzip. El HTML inicial referencia solo el entry JS/CSS; PDF no figura entre recursos iniciales. Módulos opcionales HTML/canvas de jsPDF se emiten pero no se invocan en este flujo de tablas.
- PDF actualizado: 27 páginas; controles programáticos de texto/paginación y revisión de páginas renderizadas. Sin caracteres de reemplazo ni filas cortadas/fuera del área útil; estados aparecen con texto/color. No se abrió en una app gráfica.
- Sin despliegue, creación de cuentas ni cambios en políticas del sistema. Build/ejecuciones con esbuild requieren salir del sandbox de esta sesión Windows por lectura de directorios superiores.

### Cómo publicar cuando se decida

Netlify: compilar y arrastrar la carpeta dist (index.html en su raíz) al área de despliegue manual de una cuenta gestionada por el usuario. GitHub Pages: publicar el contenido de dist en la rama/carpeta configurada o un artifact de Pages. Mantener rutas con # y recursos relativos; no se requieren reglas de reescritura. README contiene pasos y comprobación local. Esta entrega solo documenta la publicación.

## Archivos principales

Nuevos: sources.ts, calendar.ts, businessDays.ts, VerificationBadge.tsx, SourcesVerification.tsx, DemoGuide.tsx, verification4.test.ts, scripts/verify-static.mjs, AVANCE_4.md.

Modificados: types, rules/evaluate/incidentRules/incidents/evidences, seed/normative, ProviderForm/NotificationForm/Deadline/Compliance/Layout, Incidents/NormativeMatrix/EvidenceReports, main, styles, reports/model/render/limitations, los tres archivos de pruebas indicados, package scripts, eslint config, README y PDF de ejemplo. AVANCE.md, AVANCE_2.md y AVANCE_3.md no se sobrescriben.

## Pendientes

Revisión visual real en escritorio y 375 px, teclado y lector de pantalla; contraste integral de la interfaz. Contraste directo DOF, consolidación Circular SIC, enlaces/versiones vLex/CMS, arts. 16/13.6 PE, alcance CNSD/RNBD, festivos aplicables y seguimiento del recurso DPF. Criterios documentales MX siguen informativos hasta disponer de un modelo que no los infiera indebidamente. Clasificación histórica de activos eliminados, evidencia documental y nuevos incidentes siguen pendientes.

Vista del estudiante y Estándar más alto no se implementaron. Publicación real queda a decisión posterior del usuario.
