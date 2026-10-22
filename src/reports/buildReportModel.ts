import type { AppState, AuditEntry } from '../types';
import { accessLabels, auditActionLabels, notificationStatusLabels, requiredLabels, basisLabels, categoryLabels, countryLabels, evidenceStatusLabels, jurisdictionLabels, mechanismLabels, purposeLabels } from '../data/labels';
import { evaluateCompliance, getComplianceSummary, getConsent, getTrafficLight, sortFindings } from '../rules/evaluate';
import { deriveNotifications, getDeadline, getIncidentTimeline } from '../rules/incidents';
import { getEvidenceViews } from '../rules/evidences';
import { formatLima } from '../store/clock';
import { sources, verificationLabels, VERIFICATION_DATE } from '../data/sources';
import { rules } from '../rules/rules';
import { incidentRules } from '../rules/incidentRules';
import { notificationDeadlineLabel } from '../rules/incidents';
import { reportLimitations } from './limitations';
export const reportSeverityLabels = { ok: 'Verde - Sin hallazgos', warning: 'Ámbar - Advertencia', critical: 'Rojo - Crítico' };
export interface ReportSection {
    id: string;
    title: string;
    headers: string[];
    rows: string[][];
    intro?: string;
}
const auditFields: Record<string, string> = { affectedCountries: 'Países afectados', rightsAffected: 'Derechos afectados', containmentActions: 'Contención', notifications: 'Notificaciones', riskLevel: 'Riesgo', riskJustification: 'Justificación del riesgo', rootCause: 'Causa raíz', correctiveActions: 'Acciones correctivas', affectedAssetIds: 'Activos afectados', legalBasis: 'Base jurídica', consentSeparate: 'Consentimiento separado', purposes: 'Finalidades', encrypted: 'Cifrado', storageCountry: 'Almacenamiento', dataSubjectCountries: 'Países de titulares', hasContract: 'Contrato', transferMechanism: 'Mecanismo', status: 'Estado', confirmed: 'Confirmado', note: 'Nota', responsible: 'Responsable', date: 'Fecha', name: 'Nombre', category: 'Categoría', sensitivity: 'Sensibilidad', providerId: 'Proveedor', purposeConsents: 'Consentimientos por finalidad' };
function auditValue(value: unknown): string {
    if (value === undefined || value === null)
        return 'Sin registro';
    if (typeof value === 'boolean')
        return value ? 'Sí' : 'No';
    if (Array.isArray(value))
        return value.map(auditValue).join(', ');
    if (typeof value === 'string')
        return ({ ...jurisdictionLabels, ...basisLabels, ...purposeLabels, ...notificationStatusLabels, ...requiredLabels, ...mechanismLabels } as Record<string, string>)[value] || value;
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
export function summarizeAudit(entry: AuditEntry): string {
    try {
        const { before, after } = JSON.parse(entry.detail) as {
            before: Record<string, unknown> | null;
            after: Record<string, unknown> | null;
        };
        if (!before || !after || typeof before !== 'object' || typeof after !== 'object')
            return `Registro: ${auditValue(after ?? before)}`.slice(0, 600);
        const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
        const text = keys.map(key => {
            if (['containmentActions', 'notifications'].includes(key) && Array.isArray(after[key])) {
                const previous = Array.isArray(before[key]) ? before[key] as Record<string, unknown>[] : [];
                const changes = (after[key] as Record<string, unknown>[]).filter(item => JSON.stringify(item) !== JSON.stringify(previous.find(old => old.id === item.id)));
                return `${auditFields[key]}: ${changes.map(item => `${item.label || item.authority}: ${key === 'containmentActions' ? item.completed ? 'completa' : 'pendiente' : auditValue(item.status)}${item.justification ? ' (' + item.justification + ')' : ''}`).join('; ')}`;
            }
            return `${auditFields[key] || key}: ${auditValue(before[key])} -> ${auditValue(after[key])}`;
        }).join('; ');
        return text.slice(0, 600) + (text.length > 600 ? ' [detalle resumido; registro íntegro en la app]' : '');
    }
    catch {
        return entry.detail.slice(0, 600);
    }
}
export function buildReportModel(state: AppState, now: string, clockMode: 'simulated' | 'real' = 'simulated') {
    if (!Number.isFinite(Date.parse(now)))
        throw new Error('Fecha del reporte inválida');
    const summary = getComplianceSummary(state, now);
    const findings = sortFindings(evaluateCompliance(state, now));
    const evidenceViews = getEvidenceViews(state, now);
    const countries = [...new Set([...(['PE', 'ES_UE', 'MX', 'CO'] as const), ...state.assets.flatMap(asset => asset.dataSubjectCountries), ...state.incidents.flatMap(incident => incident.affectedCountries)])];
    const countryTraffic = countries.map(country => ({ country, label: jurisdictionLabels[country], status: getTrafficLight(findings.filter(item => item.jurisdiction === country)) }));
    const executiveRows = [['Escenario', state.scenario], ['Generado', `${formatLima(now)} - ${clockMode === 'simulated' ? 'Reloj simulado' : 'Tiempo real'}`], ['Reglas de inventario cumplidas', `${summary.percentage ?? 'Sin reglas'}${summary.percentage === null ? '' : ' %'} (${summary.passed}/${summary.applicable})`], ['Hallazgos críticos', String(summary.critical)], ['Advertencias', String(summary.warning)], ...countryTraffic.map(item => [item.label, reportSeverityLabels[item.status]])];
    for (const incident of state.incidents) {
        executiveRows.push(['Incidente', `${incident.title} - ${incident.status}`]);
        for (const notification of deriveNotifications(incident, state).filter(item => item.required === 'si' && item.status === 'pendiente'))
            executiveRows.push([`Plazo: ${notification.authority}`, getDeadline(incident, notification, now).text]);
    }
    const inventoryRows = state.assets.map(asset => [asset.name, categoryLabels[asset.category], asset.sensitivity, asset.purposes.map(purpose => purposeLabels[purpose]).join(', '), asset.purposes.map(purpose => `${purposeLabels[purpose]}: ${basisLabels[getConsent(asset, purpose).legalBasis]}`).join('; '), countryLabels[asset.storageCountry], reportSeverityLabels[getTrafficLight(findings.filter(item => item.assetId === asset.id))]]);
    const providerRows = state.providers.map(provider => [provider.name, countryLabels[provider.country], provider.hasContract ? 'Registrado' : 'No registrado', mechanismLabels[provider.transferMechanism], countryTraffic.filter(item => item.country !== 'por_confirmar').map(item => `${item.label}: ${reportSeverityLabels[getTrafficLight(findings.filter(finding => finding.topic === 'transfer' && finding.providerId === provider.id && finding.jurisdiction === item.country))]}`).join('; ')]);
    const findingRows = findings.map(item => [reportSeverityLabels[item.severity], jurisdictionLabels[item.jurisdiction], item.incidentId ? state.incidents.find(incident => incident.id === item.incidentId)?.title || item.incidentId : state.assets.find(asset => asset.id === item.assetId)?.name || item.assetId, item.message, item.norm, item.recommendation, `${verificationLabels[item.verificationStatus]} (${item.sourceIds.join(', ')})`]);
    const incidentRows: string[][] = [];
    const timelineRows: string[][] = [];
    const notificationRows: string[][] = [];
    for (const incident of state.incidents) {
        incidentRows.push(['Título', incident.title], ['Descripción', incident.description], ['Detectado', formatLima(incident.detectedAt)], ['Exposición aproximada', `${incident.exposureHours} h`], ['Usuarios', String(incident.affectedUsers)], ['Países', incident.affectedCountries.map(country => jurisdictionLabels[country]).join(', ')], ['Datos', incident.affectedAssetIds.map(id => state.assets.find(asset => asset.id === id)?.name || `${id} (ya no registrado)`).join(', ')], ['Entorno digital', incident.digitalEnvironment ? 'Sí' : 'No'], ['Accesos', accessLabels[incident.accessAssessment]], ['Riesgo', incident.riskLevel], ['Justificación del riesgo', incident.riskJustification || 'Sin registrar'], ['Estado', incident.status], ['Contención', incident.containmentActions.map(action => `${action.completed ? 'Completa' : 'Pendiente'}: ${action.label}`).join('; ')], ['Causa raíz', incident.rootCause || 'Sin registrar'], ['Acciones correctivas', incident.correctiveActions.join('; ') || 'Sin registrar']);
        for (const event of getIncidentTimeline(state, incident))
            timelineRows.push([formatLima(event.timestamp), event.action, state.auditLog.some(entry => entry.id === event.id) ? summarizeAudit(state.auditLog.find(entry => entry.id === event.id)!) : event.detail]);
        for (const notification of deriveNotifications(incident, state))
            notificationRows.push([notification.authority, jurisdictionLabels[notification.jurisdiction], requiredLabels[notification.required], notificationStatusLabels[notification.status], notificationDeadlineLabel(notification), getDeadline(incident, notification, now).text, notification.sentAt ? formatLima(notification.sentAt) : '-', notification.justification || '-', `${verificationLabels[notification.verificationStatus]} (${notification.sourceIds.join(', ')})`]);
    }
    const sections: ReportSection[] = [
        { id: 'cover', title: 'Portada', headers: ['Campo', 'Valor'], rows: [['Título', 'Expediente de cumplimiento - ComplianceData'], ['Escenario', state.scenario], ['Generación', `${formatLima(now)} - ${clockMode === 'simulated' ? 'Reloj simulado' : 'Tiempo real'}`], ['Aviso', 'Prototipo académico. No constituye asesoría legal']] },
        { id: 'executive', title: 'Resumen ejecutivo', headers: ['Indicador', 'Resultado'], rows: executiveRows, intro: 'Semáforos del inventario y de incidentes. El porcentaje se refiere únicamente a las reglas de inventario del modelo.' },
        { id: 'inventory', title: 'Inventario de datos', headers: ['Dato', 'Categoría', 'Sensibilidad', 'Finalidades', 'Base jurídica por finalidad', 'Almacenamiento', 'Estado'], rows: inventoryRows },
        { id: 'providers', title: 'Proveedores y transferencias', headers: ['Proveedor', 'País', 'Contrato', 'Mecanismo', 'Semáforo de transferencias por país'], rows: providerRows },
        { id: 'findings', title: 'Hallazgos', headers: ['Severidad', 'País', 'Dato / incidente', 'Mensaje', 'Norma', 'Recomendación', 'Verificación'], rows: findingRows },
        { id: 'incident', title: 'Incidente', headers: ['Campo', 'Valor'], rows: incidentRows },
        { id: 'timeline', title: 'Línea de tiempo del incidente', headers: ['Fecha / hora Lima', 'Evento', 'Detalle'], rows: timelineRows },
        { id: 'notifications', title: 'Notificaciones del incidente', headers: ['Destinatario', 'País', 'Requerida', 'Estado', 'Plazo', 'Contador', 'Enviada', 'Justificación', 'Verificación'], rows: notificationRows },
        { id: 'evidences', title: 'Evidencias mínimas', headers: ['Evidencia / criterio', 'Estado', 'Tipo', 'Responsable', 'Fecha', 'Nota'], rows: evidenceViews.map(item => [`${item.title}. Criterio: ${item.acceptanceCriterion}`, evidenceStatusLabels[item.effectiveStatus], item.source, item.responsible || 'Sin asignar', item.date ? formatLima(item.date) : 'Sin fecha', item.note || item.reason]) },
        { id: 'audit', title: 'Registro de cambios - últimos 50 movimientos', headers: ['Fecha / hora Lima', 'Acción', 'Entidad', 'Detalle resumido'], rows: state.auditLog.slice(-50).map(entry => [formatLima(entry.timestamp), auditActionLabels[entry.action] || entry.action, entry.entity, summarizeAudit(entry)]), intro: 'Registro íntegro disponible en la app. Se acotan los detalles para mantener tablas legibles.' },
        { id: 'sources', title: 'Fuentes y estado de verificación', headers: ['Fuente', 'Tipo / consulta', 'Cita / URL', 'Nota'], rows: sources.map(source => [`${source.id}: ${source.title}`, `${verificationLabels[source.type]} - ${source.consultedAt}`, source.citation + (source.url ? '\n' + source.url : ''), source.note]), intro: `Corte ${VERIFICATION_DATE}. Procedencia de las fuentes; no certifica validez de las condiciones automáticas.` },
        { id: 'verification', title: 'Estado de verificación de las reglas', headers: ['Regla', 'Requisito', 'Estado', 'Fuentes'], rows: [...rules, ...incidentRules].map(rule => [rule.id, rule.requirement, verificationLabels[rule.verificationStatus], rule.sourceIds.join(', ')]) },
        { id: 'limitations', title: 'Supuestos y limitaciones', headers: ['N.º', 'Limitación'], rows: reportLimitations.map((text, index) => [String(index + 1), text]) },
    ];
    const slug = state.scenario.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
    return { title: 'Expediente de cumplimiento - ComplianceData', scenario: state.scenario, generatedAt: now, generatedLabel: formatLima(now), clockMode, filename: `Expediente_ComplianceData_${slug}_${date}.pdf`, sections, summary: { percentage: summary.percentage, applicable: summary.applicable, passed: summary.passed, critical: summary.critical, warning: summary.warning }, countryTraffic, findings };
}
export type ReportModel = ReturnType<typeof buildReportModel>;
