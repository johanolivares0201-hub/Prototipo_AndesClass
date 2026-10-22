import { createCorrectedSeed, createIncidentScenario, createSeed } from '../data/seed';
import { deriveNotifications } from '../rules/incidents';
import type { AppState, AuditEntry, ConsentRecord, DataAsset, Provider, Purpose, Incident, Evidence } from '../types';
type Payload = {
    type: 'ADD_ASSET' | 'UPDATE_ASSET';
    asset: DataAsset;
} | {
    type: 'DELETE_ASSET' | 'DELETE_PROVIDER';
    id: string;
} | {
    type: 'ADD_PROVIDER' | 'UPDATE_PROVIDER';
    provider: Provider;
} | {
    type: 'UPDATE_CONSENT';
    assetId: string;
    purpose: Purpose;
    consent: ConsentRecord;
} | {
    type: 'LOAD_SCENARIO' | 'LOAD_CORRECTED' | 'LOAD_INCIDENT' | 'RESET_DEMO';
} | {
    type: 'UPDATE_INCIDENT';
    incident: Incident;
} | {
    type: 'UPDATE_EVIDENCE';
    evidence: Evidence;
} | {
    type: 'APPLY_SIMULATION';
    baseline: AppState;
    assets: DataAsset[];
    providers: Provider[];
};
export type Action = Payload & {
    meta?: {
        timestamp: string;
        id: string;
    };
};
const normalizeAsset = (asset: DataAsset): DataAsset => ({ ...asset, name: asset.name.trim(), sensitivity: asset.category === 'salud' ? 'sensible' : asset.sensitivity });
function logged(state: AppState, next: AppState, action: Action, entity: string, before: unknown, after: unknown): AppState {
    const entry: AuditEntry = { id: action.meta?.id || `audit-${state.auditLog.length + 1}`, timestamp: action.meta?.timestamp || 'Fecha no suministrada', action: action.type, entity, detail: JSON.stringify({ before, after }) };
    return { ...next, auditLog: [...state.auditLog, entry] };
}
export function inventoryReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'ADD_ASSET': return logged(state, { ...state, assets: [...state.assets, normalizeAsset(action.asset)] }, action, `Dato ${action.asset.id}`, null, action.asset);
        case 'UPDATE_ASSET': {
            const before = state.assets.find(item => item.id === action.asset.id);
            if (!before)
                return state;
            const asset = normalizeAsset(action.asset);
            return logged(state, { ...state, assets: state.assets.map(item => item.id === asset.id ? asset : item) }, action, `Dato ${asset.id}`, before, asset);
        }
        case 'DELETE_ASSET': {
            const before = state.assets.find(item => item.id === action.id);
            if (!before)
                return state;
            return logged(state, { ...state, assets: state.assets.filter(item => item.id !== action.id) }, action, `Dato ${action.id}`, before, null);
        }
        case 'ADD_PROVIDER': return logged(state, { ...state, providers: [...state.providers, action.provider] }, action, `Proveedor ${action.provider.id}`, null, action.provider);
        case 'UPDATE_PROVIDER': {
            const before = state.providers.find(item => item.id === action.provider.id);
            if (!before)
                return state;
            return logged(state, { ...state, providers: state.providers.map(item => item.id === action.provider.id ? action.provider : item) }, action, `Proveedor ${action.provider.id}`, before, action.provider);
        }
        case 'DELETE_PROVIDER': {
            const before = state.providers.find(item => item.id === action.id);
            if (!before)
                return state;
            // Desvincular referencias; almacenamiento queda registrado en cada activo.
            const next = { ...state, providers: state.providers.filter(item => item.id !== action.id), assets: state.assets.map(item => item.providerId === action.id ? { ...item, providerId: undefined } : item) };
            return logged(state, next, action, `Proveedor ${action.id}`, { provider: before, linkedAssets: state.assets.filter(item => item.providerId === action.id).map(item => item.id) }, null);
        }
        case 'UPDATE_CONSENT': {
            const before = state.assets.find(item => item.id === action.assetId);
            if (!before || !before.purposes.includes(action.purpose))
                return state;
            const asset = { ...before, purposeConsents: { ...before.purposeConsents, [action.purpose]: action.consent } };
            return logged(state, { ...state, assets: state.assets.map(item => item.id === asset.id ? asset : item) }, action, `Consentimiento ${asset.id}/${action.purpose}`, before.purposeConsents?.[action.purpose] || { legalBasis: before.legalBasis, consentSeparate: before.consentSeparate }, action.consent);
        }
        case 'LOAD_SCENARIO':
        case 'LOAD_CORRECTED':
        case 'LOAD_INCIDENT':
        case 'RESET_DEMO': {
            const next = action.type === 'LOAD_CORRECTED' ? createCorrectedSeed() : action.type === 'LOAD_INCIDENT' ? createIncidentScenario() : createSeed();
            return logged(state, next, action, 'Escenario', state.assets.map(item => item.id), next.scenario);
        }
        case 'UPDATE_INCIDENT': {
            const before = state.incidents.find(item => item.id === action.incident.id);
            if (!before)
                return state;
            const incident: Incident = { ...action.incident, status: action.incident.containmentActions.some(item => !item.completed) ? 'abierto' : action.incident.status, notifications: deriveNotifications(action.incident, state) };
            return logged(state, { ...state, incidents: state.incidents.map(item => item.id === incident.id ? incident : item) }, action, `Incidente ${incident.id}`, before, incident);
        }
        case 'UPDATE_EVIDENCE': {
            const before = state.evidences.find(item => item.id === action.evidence.id);
            if (!before)
                return state;
            return logged(state, { ...state, evidences: state.evidences.map(item => item.id === action.evidence.id ? action.evidence : item) }, action, `Evidencia ${action.evidence.id}`, before, action.evidence);
        }
        case 'APPLY_SIMULATION': {
            if (action.baseline !== state)
                return state;
            let next = state;
            for (const asset of action.assets)
                next = inventoryReducer(next, { type: 'UPDATE_ASSET', asset, meta: action.meta ? { ...action.meta, id: `${action.meta.id}:${asset.id}` } : undefined });
            for (const provider of action.providers)
                next = inventoryReducer(next, { type: 'UPDATE_PROVIDER', provider, meta: action.meta ? { ...action.meta, id: `${action.meta.id}:${provider.id}` } : undefined });
            return next;
        }
    }
}
