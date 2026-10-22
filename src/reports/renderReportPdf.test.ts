import { describe,expect,it } from 'vitest';
import { createIncidentScenario } from '../data/seed';
import { buildReportModel } from './buildReportModel';
import { renderReportPdf } from './renderReportPdf';
describe('Paginación del renderizador PDF',()=>{
    it('conserva textos extensos mediante filas de continuación sin filas cortadas',async()=>{
        const model=buildReportModel(createIncidentScenario(),'2026-10-14T11:15:00-05:00');
        model.sections=model.sections.filter(section=>section.id === 'notifications');
        model.sections[0].rows=[['ANPD','Perú','Sí','Pendiente','48 h','Vencido hace 1 h','-',('Fundamento extenso con acentos y ñ. ').repeat(100),'Verificado']];
        const result=await renderReportPdf(model);expect(result.pageCount).toBeGreaterThan(2);
        expect(result.rowLayout.every(row=>row.bottom<=190.1 && row.top>=24)).toBe(true);
        const keys=result.rowLayout.map(row=>`${row.section}:${row.row}`);expect(new Set(keys).size).toBe(keys.length);
        expect(result.document.output('arraybuffer').byteLength).toBeGreaterThan(1000);
    });
});
