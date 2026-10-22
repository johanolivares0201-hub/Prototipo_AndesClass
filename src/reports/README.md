# Reportes — Fase 7

Fase 7 implementada. `buildReportModel(state, now, clockMode?)` arma un modelo puro para la vista previa y el PDF. `renderReportPdf(model)` carga jsPDF/AutoTable dinámicamente y dibuja tablas paginadas con fuente WinAnsi. La pantalla realiza la descarga; no se usan servicios externos. `limitations.ts` mantiene la síntesis de supuestos de AVANCE_2. El script `npm run report:example` reproduce el expediente del escenario con incidente en `output/pdf/`.
