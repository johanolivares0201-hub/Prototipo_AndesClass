import { describe,expect,it } from 'vitest';
import { createIncidentScenario } from '../data/seed';
import { buildReportModel } from './buildReportModel';
import { deriveNotifications } from '../rules/incidents';
import { evaluateCompliance } from '../rules/evaluate';
import { pdfText } from './renderReportPdf';
const now='2026-10-14T11:15:00-05:00';
describe('Modelo puro del expediente',()=>{
    it('contiene portada y todas las secciones solicitadas',()=>{const model=buildReportModel(createIncidentScenario(),now);expect(model.sections.map(item=>item.id)).toEqual(['cover','executive','inventory','providers','findings','incident','timeline','notifications','evidences','audit','sources','verification','limitations']);expect(model.sections.find(item=>item.id === 'evidences')?.rows).toHaveLength(10);});
    it('cuenta hallazgos de inventario e incidentes sin mutar el estado',()=>{const state=createIncidentScenario();state.incidents[0].affectedCountries=['PE','ES_UE','MX','CO'];state.incidents[0].notifications=deriveNotifications(state.incidents[0]);const snapshot=structuredClone(state);const model=buildReportModel(state,now);const findings=evaluateCompliance(state,now);expect(model.summary.critical).toBe(findings.filter(item=>item.severity === 'critical').length);expect(model.summary.warning).toBe(findings.filter(item=>item.severity === 'warning').length);expect(model.findings).toEqual(expect.arrayContaining(findings));expect(model.sections.find(item=>item.id === 'notifications')?.rows).toHaveLength(7);expect(state).toEqual(snapshot);});
    it('usa fecha Lima, reloj señalado y nombre de archivo estable',()=>{const model=buildReportModel(createIncidentScenario(),now);expect(model.filename).toBe('Expediente_ComplianceData_AndeClass_con_incidente_2026-10-14.pdf');expect(model.clockMode).toBe('simulated');expect(buildReportModel(createIncidentScenario(),now,'real').clockMode).toBe('real');});
    it('incluye solo últimos 50 movimientos sin truncar el estado real',()=>{const state=createIncidentScenario();state.auditLog=Array.from({length:60},(_,index)=>({id:String(index),timestamp:now,action:'UPDATE_INCIDENT',entity:'Incidente incident-demo',detail:'Cambio '+index}));const model=buildReportModel(state,now);const rows=model.sections.find(item=>item.id === 'audit')!.rows;expect(rows).toHaveLength(50);expect(rows[0][3]).toBe('Cambio 10');expect(state.auditLog).toHaveLength(60);});
    it('preserva acentos y ñ, sustituye símbolos fuera de WinAnsi',()=>{expect(pdfText('Perú, México, España → ñ ≤ 3 • caso')).toBe('Perú, México, España  ->  ñ  <=  3  -  caso');expect(pdfText('Información de salud')).toBe('Información de salud');});
});
