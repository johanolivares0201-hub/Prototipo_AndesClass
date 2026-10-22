import { describe, expect, it } from 'vitest';
import { createCorrectedSeed, createSeed } from '../data/seed';
import { evaluateCompliance, evaluateRules, getComplianceSummary, getTrafficLight } from './evaluate';
import type { AppState, DataAsset, Jurisdiction } from '../types';
function isolated(patch: Partial<DataAsset> = {}, country: Jurisdiction = 'PE'): AppState {
    const state = createCorrectedSeed();
    return { ...state, assets: [{ ...state.assets[0], dataSubjectCountries: [country], ...patch }] };
}
const has = (state: AppState, suffix: string) => evaluateCompliance(state).some(item => item.ruleId.endsWith(suffix));
describe('Motor de reglas del modelo académico', () => {
    it('AndeClass inicial queda rojo en las cuatro jurisdicciones', () => {
        const state = createSeed();
        const findings = evaluateCompliance(state);
        for (const country of ['PE', 'ES_UE', 'MX', 'CO']) {
            expect(getTrafficLight(findings.filter(item => item.jurisdiction === country))).toBe('critical');
            expect(findings.some(item => item.jurisdiction === country && item.ruleId.endsWith('health-consent') && item.severity === 'critical')).toBe(true);
            expect(findings.some(item => item.jurisdiction === country && item.ruleId.endsWith('health-commercial'))).toBe(true);
            expect(findings.some(item => item.jurisdiction === country && item.ruleId.endsWith('contract') && item.topic === 'transfer')).toBe(true);
        }
    });
    it('AndeClass corregido queda verde y 100 %', () => {
        const state = createCorrectedSeed();
        const summary = getComplianceSummary(state);
        expect(summary.findings).toEqual([]);
        expect(summary.percentage).toBe(100);
        expect(summary.applicable).toBeGreaterThan(0);
        for (const country of ['PE', 'ES_UE', 'MX', 'CO'])
            expect(getTrafficLight(summary.findings.filter(item => item.jurisdiction === country))).toBe('ok');
    });
    it.each(['PE', 'ES_UE', 'MX', 'CO'] as const)('rechaza consentimiento simple de salud en %s', country => {
        expect(has(isolated({ category: 'salud', purposes: ['bienestar'], legalBasis: 'consentimiento' }, country), 'health-consent')).toBe(true);
        expect(has(isolated({ category: 'salud', purposes: ['bienestar'], legalBasis: 'consentimiento_escrito' }, country), 'health-consent')).toBe(false);
    });
    it('PE exige escrito; ES admite explícito pero requiere separado', () => {
        expect(has(isolated({ category: 'salud', purposes: ['bienestar'], legalBasis: 'consentimiento_explicito' }), 'health-consent')).toBe(true);
        expect(has(isolated({ category: 'salud', purposes: ['bienestar'], consentSeparate: false }, 'ES_UE'), 'health-consent')).toBe(true);
    });
    it('salud comercial produce crítico aunque tenga consentimiento', () => {
        expect(evaluateCompliance(isolated({ category: 'salud', purposes: ['publicidad'] })).find(item => item.ruleId.endsWith('health-commercial'))?.severity).toBe('critical');
    });
    it('publicidad exige base de consentimiento, no contrato', () => {
        expect(has(isolated({ purposes: ['publicidad'], legalBasis: 'contrato' }, 'ES_UE'), 'advertising')).toBe(true);
        expect(has(isolated({ purposes: ['publicidad'], legalBasis: 'consentimiento' }, 'ES_UE'), 'advertising')).toBe(false);
    });
    it('analítica en contrato advierte y sin base es crítica', () => {
        const warning = evaluateCompliance(isolated({ purposes: ['analitica'], legalBasis: 'contrato' }));
        expect(warning.find(item => item.ruleId.endsWith('secondary-contract'))?.severity).toBe('warning');
        const critical = evaluateCompliance(isolated({ purposes: ['recomendaciones'], legalBasis: 'ninguna' }));
        expect(critical.find(item => item.ruleId.endsWith('secondary-none'))?.severity).toBe('critical');
    });
    it('cualquier dato sin base genera crítico', () => {
        expect(evaluateCompliance(isolated({ legalBasis: 'ninguna' })).find(item => item.ruleId.endsWith('-basis'))?.severity).toBe('critical');
    });
    it('contrato ausente o proveedor no registrado genera crítico', () => {
        const state = isolated();
        state.providers[0].hasContract = false;
        expect(has(state, 'contract')).toBe(true);
        expect(has({ ...state, providers: [] }, 'contract')).toBe(true);
    });
    it.each([['PE', 'warning'], ['ES_UE', 'critical'], ['MX', 'warning'], ['CO', 'warning']] as const)('mecanismo ausente tiene severidad %s / %s', (country, severity) => {
        const state = isolated({}, country);
        state.providers[0].transferMechanism = 'ninguno';
        expect(evaluateCompliance(state).find(item => item.ruleId.endsWith('mechanism'))?.severity).toBe(severity);
    });
    it('DPF requiere destino US en la simplificación UE y otro no basta', () => {
        const state = isolated({}, 'ES_UE');
        state.providers[0].transferMechanism = 'dpf';
        expect(has(state, 'mechanism')).toBe(false);
        state.providers[0].country = 'MX';
        expect(has(state, 'mechanism')).toBe(true);
        state.providers[0].transferMechanism = 'otro';
        expect(has(state, 'mechanism')).toBe(true);
    });
    it('salud sin cifrado advierte', () => {
        expect(evaluateCompliance(isolated({ category: 'salud', purposes: ['bienestar'], encrypted: false })).find(item => item.ruleId.endsWith('encryption'))?.severity).toBe('warning');
    });
    it('finalidad comercial sin consentimiento separado advierte', () => { expect(has(isolated({ purposes: ['analitica'], consentSeparate: false }), 'separate')).toBe(true); });
    it('las excepciones de consentimiento se evalúan por finalidad', () => {
        const state = isolated({ purposes: ['servicio', 'publicidad'], purposeConsents: { publicidad: { legalBasis: 'contrato', consentSeparate: false } } });
        expect(has(state, 'advertising')).toBe(true);
        expect(has(state, 'separate')).toBe(true);
        expect(has(state, '-basis')).toBe(false);
    });
    it('solo evalúa jurisdicciones de titulares y no cuenta reglas no aplicables', () => {
        const state = isolated({ storageCountry: 'PE', providerId: undefined });
        const results = evaluateRules(state);
        expect(results.every(item => item.rule.jurisdiction === 'PE')).toBe(true);
        expect(results).toHaveLength(1);
        expect(getComplianceSummary(state).percentage).toBe(100);
        expect(evaluateRules({ ...state, assets: [{ ...state.assets[0], dataSubjectCountries: [] }] })).toEqual([]);
    });
    it('calcula porcentaje sobre todas las comprobaciones y evita 100 % sin reglas', () => {
        const state = isolated({ storageCountry: 'PE', providerId: undefined, legalBasis: 'ninguna' });
        expect(getComplianceSummary(state).percentage).toBe(0);
        expect(getComplianceSummary({ ...state, assets: [] }).percentage).toBeNull();
        const initial = getComplianceSummary(createSeed());
        expect(initial.percentage).toBe(Math.round(initial.passed / initial.applicable * 100));
    });
    it('semáforo da prioridad rojo, luego ámbar, luego verde', () => {
        const state = isolated({ purposes: ['analitica'], legalBasis: 'contrato' });
        const warning = evaluateCompliance(state);
        expect(getTrafficLight(warning)).toBe('warning');
        expect(getTrafficLight([])).toBe('ok');
        expect(getTrafficLight([...warning, ...evaluateCompliance(isolated({ legalBasis: 'ninguna' }))])).toBe('critical');
    });
    it('no muta estado, mantiene ids estables y etiqueta la verificación MX', () => {
        const state = createSeed();
        const snapshot = structuredClone(state);
        const first = evaluateCompliance(state);
        expect(evaluateCompliance(state)).toEqual(first);
        expect(state).toEqual(snapshot);
        expect(first.filter(item => item.jurisdiction === 'MX').every(item => ['secundaria','por_contrastar'].includes(item.verificationStatus))).toBe(true);
        expect(new Set(first.map(item => item.id)).size).toBe(first.length);
    });
});
