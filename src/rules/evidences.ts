import type { AppState, Evidence, EvidenceStatus } from '../types';
import { evaluateCompliance, getConsent, isInternationalTransfer } from './evaluate';
import { deriveNotifications, evaluateIncidents } from './incidents';
export interface EvidenceView extends Evidence {
    suggested: EvidenceStatus;
    effectiveStatus: EvidenceStatus;
    source: 'calculado' | 'confirmado por el usuario' | 'manual pendiente';
    reason: string;
}
export function getEvidenceViews(state: AppState, now: string): EvidenceView[] {
    const findings = evaluateCompliance(state);
    function suggestion(evidence: Evidence): {
        status: EvidenceStatus;
        reason: string;
    } {
        if (!evidence.automatic)
            return { status: 'pendiente', reason: 'Criterio manual: requiere revisión y constancia del responsable.' };
        if (!state.assets.length && evidence.id !== 'evidence-8')
            return { status: 'pendiente', reason: 'No hay activos suficientes para evaluar.' };
        let meets = false;
        let reason = '';
        switch (evidence.id) {
            case 'evidence-1':
                meets = state.assets.every(asset => !!asset.name.trim() && !!asset.category && !!asset.storageCountry && !!asset.purposes.length && !!asset.dataSubjectCountries.length && asset.purposes.every(purpose => getConsent(asset, purpose).legalBasis !== 'ninguna') && (!asset.dataSubjectCountries.some(country => isInternationalTransfer(state, asset, country)) || state.providers.some(provider => provider.id === asset.providerId)) && (!asset.providerId || state.providers.some(provider => provider.id === asset.providerId)));
                reason = 'Completitud del inventario y destinos declarados para construir el mapa.';
                break;
            case 'evidence-2':
                meets = state.providers.every(provider => provider.hasContract) && !findings.some(item => item.ruleId.endsWith('-contract'));
                reason = 'Contratos declarados de proveedores y referencias de los activos.';
                break;
            case 'evidence-3':
                meets = !findings.some(item => item.ruleId.endsWith('-mechanism')) && state.providers.every(provider => provider.transferMechanism !== 'ninguno');
                reason = 'Garantías declaradas; no se verifica validez jurídica ni certificación DPF.';
                break;
            case 'evidence-4':
                meets = !findings.some(item => ['consent', 'basis', 'purpose'].includes(item.topic));
                reason = 'Ausencia de hallazgos de consentimiento, base y finalidad del modelo.';
                break;
            case 'evidence-6':
                meets = state.assets.every(asset => asset.encrypted);
                reason = 'Cifrado declarado en todos los activos; no se comprueba implementación técnica.';
                break;
            case 'evidence-8':
                meets = state.incidents.every(incident => incident.status === 'cerrado' && incident.containmentActions.every(action => action.completed) && !!incident.rootCause.trim() && incident.correctiveActions.some(action => action.trim()) && !incident.affectedCountries.includes('por_confirmar') && incident.affectedCountries.length > 0 && deriveNotifications(incident, state).every(notification => (notification.required !== 'por_evaluar' || notification.status === 'enviada') && (notification.status === 'enviada' || notification.status === 'no_requerida' && !!notification.justification.trim()))) && !evaluateIncidents(state, now).length;
                reason = state.incidents.length ? 'Contención, alcance, evaluación, notificaciones, causa y cierre documentados.' : 'Sin incidentes registrados en este escenario; no demuestra gestión de un incidente real.';
                break;
        }
        return { status: meets ? 'cumple' : 'no_cumple', reason };
    }
    return state.evidences.map(evidence => { const result = suggestion(evidence); return { ...evidence, suggested: result.status, effectiveStatus: evidence.confirmed ? evidence.status : result.status, source: evidence.confirmed ? 'confirmado por el usuario' : evidence.automatic ? 'calculado' : 'manual pendiente', reason: result.reason }; });
}
