import { describe, expect, it } from 'vitest';
import { createCorrectedSeed, createSeed } from '../data/seed';
import { compareSimulation, createSimulation, simulationChanges, updateSimulation } from './simulation';
import { inventoryReducer } from '../store/reducer';
import { getTransferModel } from './transfers';
describe('Simulador y auditoría en memoria', () => {
    it('copia profundamente y las modificaciones no alteran el estado real', () => {
        const state = createSeed();
        const snapshot = structuredClone(state);
        const draft = createSimulation(state);
        draft.assets[0].purposes.push('analitica');
        draft.assets[0].dataSubjectCountries.pop();
        draft.providers[0].hasContract = true;
        expect(state).toEqual(snapshot);
        expect(draft.assets).not.toBe(state.assets);
    });
    it('actualizar una simulación es inmutable y afecta al proveedor compartido', () => {
        const state = createSeed();
        const next = updateSimulation(createSimulation(state), { ...state.assets[0], encrypted: true }, { ...state.providers[0], hasContract: true });
        expect(state.providers[0].hasContract).toBe(false);
        expect(next.providers[0].hasContract).toBe(true);
        expect(compareSimulation(state, next).resolvedFindings.filter(item => item.ruleId.endsWith('contract'))).toHaveLength(28);
    });
    it('distingue hallazgos nuevos y resueltos por ids estables', () => {
        const corrected = createCorrectedSeed();
        const original = createSeed();
        expect(compareSimulation(original, corrected).newFindings).toEqual([]);
        expect(compareSimulation(corrected, original).newFindings.length).toBeGreaterThan(0);
        expect(compareSimulation(original, corrected).resolvedFindings.length).toBeGreaterThan(0);
    });
    it('aplica solo cambios, conserva incidentes y registra cada entidad', () => {
        const state = createSeed();
        const draft = updateSimulation(createSimulation(state), { ...state.assets[0], encrypted: true }, { ...state.providers[0], hasContract: true });
        const next = inventoryReducer(state, { type: 'APPLY_SIMULATION', baseline: state, ...simulationChanges(state, draft), meta: { timestamp: '2026-10-14T15:00:00Z', id: 'apply' } });
        expect(next.assets[0].encrypted).toBe(true);
        expect(next.providers[0].hasContract).toBe(true);
        expect(next.incidents).toEqual(state.incidents);
        expect(next.auditLog).toHaveLength(2);
        expect(state.auditLog).toEqual([]);
    });
    it('rechaza una simulación obsoleta', () => {
        const state = createSeed();
        const latest = inventoryReducer(state, { type: 'DELETE_ASSET', id: 'asset-1' });
        expect(inventoryReducer(latest, { type: 'APPLY_SIMULATION', baseline: state, ...simulationChanges(state, createCorrectedSeed()) })).toBe(latest);
    });
    it('actualizar consentimiento solo cambia la finalidad elegida y registra fecha', () => {
        const state = createSeed();
        const next = inventoryReducer(state, { type: 'UPDATE_CONSENT', assetId: 'asset-5', purpose: 'publicidad', consent: { legalBasis: 'consentimiento_explicito', consentSeparate: true }, meta: { timestamp: '2026-10-14T15:00:00Z', id: 'consent' } });
        expect(next.assets[4].purposeConsents?.publicidad?.consentSeparate).toBe(true);
        expect(next.assets[4].purposeConsents?.analitica).toBeUndefined();
        expect(next.auditLog[0].timestamp).toBe('2026-10-14T15:00:00Z');
    });
    it('elimina proveedores sin referencias colgantes y conserva auditoría al cargar escenarios', () => {
        const state = createSeed();
        const next = inventoryReducer(state, { type: 'DELETE_PROVIDER', id: 'cloud-us' });
        expect(next.providers).toEqual([]);
        expect(next.assets.every(item => !item.providerId)).toBe(true);
        const corrected = inventoryReducer(next, { type: 'LOAD_CORRECTED' });
        expect(corrected.auditLog).toHaveLength(2);
        expect(corrected.providers[0].hasContract).toBe(true);
    });
    it('el mapa filtra activos y separa país de proveedor de almacenamiento', () => {
        const state = createSeed();
        state.assets[0].storageCountry = 'MX';
        const model = getTransferModel(state, 'asset-1');
        expect(model.assets).toHaveLength(1);
        expect(model.destinations[0].country).toBe('US');
        expect(model.destinations[0].storageCountry).toBe('MX');
        expect(model.findings.every(item => item.assetId === 'asset-1')).toBe(true);
    });
});
