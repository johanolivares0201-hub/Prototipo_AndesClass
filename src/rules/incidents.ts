import type { AppState, Finding, Incident, IncidentNotification, Jurisdiction, VerificationMetadata } from '../types';
import { HOUR_MS } from '../store/clock';
import { incidentRules } from './incidentRules';
import { auditActionLabels } from '../data/labels';
import { colombiaHolidays } from '../data/calendar';
import { addBusinessDays } from './businessDays';
export function incidentHasHealth(state: AppState, incident: Incident): boolean { return incident.affectedAssetIds.some(id => state.assets.some(asset => asset.id === id && asset.category === 'salud')); }
export function incidentHasSensitive(state: AppState, incident: Incident): boolean { return incident.affectedAssetIds.some(id => state.assets.some(asset => asset.id === id && asset.sensitivity === 'sensible')); }
const peMeta: VerificationMetadata = { verificationStatus: 'secundaria', sourceIds: ['pe-ds-cms', 'pe-ds-peruano'] };
const euMeta: VerificationMetadata = { verificationStatus: 'oficial', sourceIds: ['eu-gdpr'] };
export function deriveNotifications(incident: Incident, state?: AppState): IncidentNotification[] {
    const result: IncidentNotification[] = [];
    function add(key: string, authority: string, jurisdiction: Jurisdiction, required: IncidentNotification['required'], meta: VerificationMetadata, norm: string, deadlineType: IncidentNotification['deadlineType'] = 'none', deadlineHours?: number, deadlineDays?: number) {
        const id = `${incident.id}:${key}`;
        const previous = incident.notifications.find(item => item.id === id);
        const mxDecision = previous?.decision || (previous?.status === 'enviada' ? 'si' : previous?.status === 'no_requerida' && previous.justification.trim() ? 'no' : undefined);
        if (jurisdiction === 'MX')
            required = mxDecision || 'por_evaluar';
        const registered = previous && (previous.status === 'enviada' || previous.required === required || jurisdiction === 'MX' && !!previous.decision) ? previous : undefined;
        result.push({ id, authority, jurisdiction, required, ...meta, sourceIds: [...meta.sourceIds], norm, deadlineType, deadlineHours, deadlineDays,
            suggestedRequired: jurisdiction === 'MX' && state && incidentHasHealth(state, incident) ? 'si' : undefined,
            decision: jurisdiction === 'MX' ? mxDecision : previous?.decision, status: registered?.status || 'pendiente', sentAt: registered?.sentAt, justification: registered?.justification ?? '' });
    }
    const countries = new Set(incident.affectedCountries);
    if (countries.has('PE')) {
        add('anpd', 'ANPD', 'PE', 'si', peMeta, 'Ley 29733 y DS 016-2024-JUS', 'hours', 48);
        if (incident.digitalEnvironment)
            add('cnsd', 'CNSD', 'PE', 'si', peMeta, 'DS 126-2025-PCM; entorno digital del caso', 'hours', 48);
        add('pe-subjects', 'Titulares (Perú)', 'PE', incident.rightsAffected, peMeta, 'Ley 29733 y DS 016-2024-JUS');
    }
    if (countries.has('ES_UE')) {
        add('aepd', 'AEPD', 'ES_UE', incident.riskLevel === 'bajo' ? 'por_evaluar' : 'si', euMeta, 'RGPD art. 33', 'hours', 72);
        add('eu-subjects', 'Afectados (España / UE)', 'ES_UE', incident.riskLevel === 'alto' ? 'si' : 'no', euMeta, 'RGPD art. 34');
    }
    if (countries.has('MX'))
        add('mx-subjects', 'Titulares (México)', 'MX', 'por_evaluar', { verificationStatus: 'secundaria', sourceIds: ['mx-lfpdppp-2025'] }, 'LFPDPPP 2025 art. 19: comunicación inmediata si afectación significativa', 'immediate');
    if (countries.has('CO'))
        add('sic', 'SIC / RNBD', 'CO', 'si', { verificationStatus: 'oficial', sourceIds: ['co-sic-circular', 'co-sic-incident'] }, 'Circular Única SIC, Título V, capítulo 2, numeral 2.5', 'business_days', undefined, 15);
    return result;
}
export function notificationDeadlineLabel(notification: IncidentNotification): string {
    return notification.deadlineType === 'business_days' ? `${notification.deadlineDays} días hábiles` : notification.deadlineType === 'hours' ? `${notification.deadlineHours} h desde detección` : notification.deadlineType === 'immediate' ? 'Inmediata · sin contador en horas' : 'Sin plazo numérico';
}
export interface DeadlineResult {
    state: 'ok' | 'warning' | 'critical' | 'inactive' | 'unverified' | 'immediate';
    text: string;
    deadlineAt?: string;
    remainingMs?: number;
}
export function getDeadline(incident: Incident, notification: IncidentNotification, now: string, holidays: readonly string[] = colombiaHolidays): DeadlineResult {
    if (notification.status === 'enviada')
        return { state: 'inactive', text: 'Enviada' };
    if (notification.status === 'no_requerida')
        return { state: 'inactive', text: 'No requerida (decisión registrada)' };
    if (notification.deadlineType === 'immediate')
        return notification.required === 'no' ? { state: 'inactive', text: 'No requerida según decisión registrada · sin contador' } : { state: 'immediate', text: notification.required === 'por_evaluar' ? 'Inmediata · obligación por evaluar, sin contador' : 'Comunicación inmediata · sin contador' };
    if (notification.required !== 'si')
        return { state: 'inactive', text: notification.required === 'no' ? 'No requerida según modelo · registrar decisión' : 'Requisito por evaluar' };
    if (notification.verificationStatus === 'por_contrastar' || notification.deadlineType === 'none')
        return { state: 'unverified', text: notification.deadlineType === 'none' ? 'Sin contador · sin plazo numérico' : 'Sin contador · plazo por contrastar' };
    const detected = Date.parse(incident.detectedAt);
    const current = Date.parse(now);
    if (!Number.isFinite(detected) || !Number.isFinite(current))
        return { state: 'inactive', text: 'Fecha inválida: revisar' };
    const deadline = notification.deadlineType === 'business_days' ? Date.parse(addBusinessDays(incident.detectedAt, notification.deadlineDays || 15, holidays)) : detected + (notification.deadlineHours || 0) * HOUR_MS;
    const remainingMs = deadline - current;
    const expired = remainingMs <= 0;
    const minutes = expired ? Math.floor(-remainingMs / 60000) : Math.ceil(remainingMs / 60000);
    const time = notification.deadlineType === 'business_days' ? `${Math.floor(minutes / 1440)} días ${Math.floor(minutes % 1440 / 60)} h ${minutes % 60} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
    return { state: expired ? 'critical' : remainingMs <= (deadline - detected) * .25 ? 'warning' : 'ok', text: `${expired ? 'Vencido hace' : 'Faltan'} ${time}`, deadlineAt: new Date(deadline).toISOString(), remainingMs };
}
export function evaluateIncidents(state: AppState, now: string): Finding[] {
    const findings: Finding[] = [];
    for (const incident of state.incidents) {
        const countries = incident.affectedCountries.length ? [...new Set(incident.affectedCountries)] : ['por_confirmar' as const];
        const notifications = deriveNotifications(incident, state);
        for (const rule of incidentRules) {
            function add(jurisdiction: Finding['jurisdiction'], suffix: string, severity = rule.severityIfMissing, notification?: IncidentNotification) { findings.push({ id: `${incident.id}:${rule.id}:${suffix}`, incidentId: incident.id, assetId: '', jurisdiction, ruleId: rule.id, severity, message: `Regla de diseño del prototipo: ${rule.requirement}${notification ? ' Destinatario: ' + notification.authority + '.' : ''}`, norm: notification?.norm || rule.norm, recommendation: rule.recommendation, verificationStatus: notification?.verificationStatus || rule.verificationStatus, sourceIds: [...(notification?.sourceIds || rule.sourceIds)], topic: 'incident' }); }
            if (['overdue', 'near-deadline', 'no-justification', 'mx-decision'].includes(rule.check)) {
                for (const notification of notifications) {
                    const deadline = getDeadline(incident, notification, now);
                    if (rule.check === 'overdue' && deadline.state === 'critical')
                        add(notification.jurisdiction, notification.id, 'critical', notification);
                    if (rule.check === 'near-deadline' && deadline.state === 'warning')
                        add(notification.jurisdiction, notification.id, 'warning', notification);
                    if (rule.check === 'no-justification' && notification.status === 'no_requerida' && !notification.justification.trim())
                        add(notification.jurisdiction, notification.id, 'critical', notification);
                    if (rule.check === 'mx-decision' && notification.jurisdiction === 'MX' && incidentHasHealth(state, incident) && !notification.decision && notification.status === 'pendiente')
                        add('MX', notification.id, 'warning', notification);
                }
            }
            else if (rule.check === 'health-risk' && incidentHasHealth(state, incident) && incident.riskLevel !== 'alto' && !incident.riskJustification.trim()) {
                for (const country of countries)
                    add(country, 'risk');
            }
            else if (rule.check === 'containment' && incident.status === 'abierto' && incident.containmentActions.some(item => !item.completed)) {
                const critical = incidentHasSensitive(state, incident) && Date.parse(now) - Date.parse(incident.detectedAt) > 24 * HOUR_MS;
                for (const country of countries)
                    add(country, 'containment', critical ? 'critical' : 'warning');
            }
        }
    }
    return findings;
}
export function getNextDeadline(state: AppState, now: string) { return state.incidents.flatMap(incident => deriveNotifications(incident, state).map(notification => ({ incident, notification, deadline: getDeadline(incident, notification, now) }))).filter(item => item.deadline.deadlineAt).sort((a, b) => Date.parse(a.deadline.deadlineAt!) - Date.parse(b.deadline.deadlineAt!))[0]; }
export function getIncidentTimeline(state: AppState, incident: Incident) { const events = [{ id: `${incident.id}:detected`, timestamp: incident.detectedAt, action: 'Detección', detail: incident.description }, ...state.auditLog.filter(entry => entry.entity === `Incidente ${incident.id}`).map(entry => ({ id: entry.id, timestamp: entry.timestamp, action: auditActionLabels[entry.action] || entry.action, detail: entry.detail })), ...deriveNotifications(incident, state).filter(item => item.status === 'enviada' && item.sentAt).map(item => ({ id: item.id, timestamp: item.sentAt!, action: `Notificación a ${item.authority}`, detail: 'Enviada según registro de la demo.' }))]; return events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || (a.id.endsWith(':detected') ? -1 : b.id.endsWith(':detected') ? 1 : a.id.localeCompare(b.id))); }
