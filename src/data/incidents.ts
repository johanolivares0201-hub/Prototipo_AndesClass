import type { Incident } from '../types';
export const DEMO_DETECTED_AT = '2026-10-12T10:15:00-05:00';
export function createIncidentSeed(): Incident {
    return { id: 'incident-demo', title: 'Archivo de prueba expuesto en el cloud',
        description: 'Archivo de prueba con nombres, correos y datos de salud de 320 usuarios de AndeClass, expuesto aproximadamente cuatro horas.',
        detectedAt: DEMO_DETECTED_AT, exposureHours: 4, affectedAssetIds: ['asset-1', 'asset-2', 'asset-7'], affectedUsers: 320,
        affectedCountries: ['por_confirmar'], digitalEnvironment: true, accessAssessment: 'desconocido', riskLevel: 'alto', riskJustification: '', rightsAffected: 'por_evaluar',
        containmentActions: [['public-access', 'Cerrar acceso público'], ['credentials', 'Revocar enlaces y credenciales'], ['logs', 'Preservar registros del proveedor antes de eliminar'], ['file', 'Eliminar el archivo y verificar copias']].map(([id, label]) => ({ id, label, completed: false })),
        rootCause: '', correctiveActions: [], status: 'abierto', notifications: [] };
}
