import type { AppState, Category, DataAsset } from '../types';
import { createIncidentSeed } from './incidents';
import { createEvidenceSeed } from './evidences';
const definitions: [
    string,
    Category
][] = [['Nombre', 'identificacion'], ['Correo electrónico', 'contacto'], ['DNI / pasaporte', 'identificacion'], ['Ubicación aproximada', 'ubicacion'], ['Historial académico', 'academico'], ['Datos de comportamiento', 'comportamiento'], ['Información de salud', 'salud']];
export function createSeed(): AppState {
    const assets: DataAsset[] = definitions.map(([name, category], index) => ({
        id: `asset-${index + 1}`, name, category, sensitivity: category === 'salud' ? 'sensible' : 'personal',
        purposes: category === 'salud' ? ['bienestar', 'analitica', 'publicidad', 'recomendaciones'] : ['academico', 'comportamiento'].includes(category) ? ['servicio', 'analitica', 'publicidad', 'recomendaciones'] : ['servicio'],
        legalBasis: 'consentimiento', consentSeparate: false, storageCountry: 'US', providerId: 'cloud-us',
        dataSubjectCountries: ['PE', 'ES_UE', 'MX', 'CO'], encrypted: false,
        notes: category === 'salud' ? 'Módulo de bienestar. Consentimiento simple, sin registro escrito ni consentimiento separado.' : 'Activo simulado del caso AndeClass. Cifrado no registrado en el escenario.',
    }));
    return { assets, providers: [{ id: 'cloud-us', name: 'Proveedor Cloud EE. UU.', country: 'US', role: 'encargado', hasContract: false, transferMechanism: 'ninguno', peFlowRegistered: false }], incidents: [createIncidentSeed()], evidences: createEvidenceSeed(), auditLog: [], scenario: 'AndeClass inicial' };
}
export function createCorrectedSeed(): AppState {
    const state = createSeed();
    return { ...state, scenario: 'AndeClass corregido', incidents: [], assets: state.assets.map(asset => ({ ...asset,
            legalBasis: asset.category === 'salud' ? 'consentimiento_escrito' : 'consentimiento_explicito',
            consentSeparate: true, encrypted: true,
            purposes: asset.category === 'salud' ? ['bienestar'] : asset.purposes,
            notes: 'Escenario corregido simulado: requisitos del modelo registrados; no prueba cumplimiento jurídico real.',
        })), providers: state.providers.map(provider => ({ ...provider, hasContract: true, transferMechanism: 'clausulas_tipo', peFlowRegistered: true })) };
}
export function createIncidentScenario(): AppState { return { ...createSeed(), scenario: 'AndeClass con incidente' }; }
