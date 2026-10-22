export type Jurisdiction = 'PE' | 'ES_UE' | 'MX' | 'CO' | 'US';
export type VerificationStatus = 'oficial' | 'secundaria' | 'por_contrastar';
export interface VerificationMetadata {
    verificationStatus: VerificationStatus;
    sourceIds: string[];
}
export interface Source {
    id: string;
    title: string;
    citation: string;
    url?: string;
    type: 'oficial' | 'secundaria';
    consultedAt: string;
    note: string;
}
export type Category = 'identificacion' | 'contacto' | 'ubicacion' | 'academico' | 'comportamiento' | 'salud' | 'otro';
export type Purpose = 'servicio' | 'bienestar' | 'analitica' | 'publicidad' | 'recomendaciones';
export type LegalBasis = 'consentimiento' | 'consentimiento_escrito' | 'consentimiento_explicito' | 'contrato' | 'interes_legitimo' | 'ninguna';
export interface DataAsset {
    id: string;
    name: string;
    category: Category;
    sensitivity: 'personal' | 'sensible';
    purposes: Purpose[];
    legalBasis: LegalBasis;
    consentSeparate: boolean;
    storageCountry: Jurisdiction;
    providerId?: string;
    dataSubjectCountries: Jurisdiction[];
    encrypted: boolean;
    notes?: string;
    purposeConsents?: Partial<Record<Purpose, ConsentRecord>>;
}
export interface ConsentRecord {
    legalBasis: LegalBasis;
    consentSeparate: boolean;
}
export interface Provider {
    id: string;
    name: string;
    country: Jurisdiction;
    role: 'encargado';
    hasContract: boolean;
    transferMechanism: 'ninguno' | 'clausulas_tipo' | 'dpf' | 'otro';
    peFlowRegistered?: boolean;
}
export interface Finding extends VerificationMetadata {
    id: string;
    severity: 'ok' | 'warning' | 'critical';
    jurisdiction: Jurisdiction | 'por_confirmar';
    assetId: string;
    ruleId: string;
    message: string;
    norm: string;
    recommendation: string;
    topic: 'consent' | 'purpose' | 'basis' | 'transfer' | 'security' | 'incident';
    providerId?: string;
    incidentId?: string;
}
export type RuleCheck = 'health-consent' | 'no-health-commercial' | 'advertising-consent' | 'secondary-basis' | 'legal-basis' | 'provider-contract' | 'transfer-mechanism' | 'health-encryption' | 'separate-commercial' | 'pe-flow-registered';
export interface Rule extends VerificationMetadata {
    id: string;
    jurisdiction: Jurisdiction;
    appliesTo: {
        category?: Category;
        purpose?: Purpose;
        internationalTransfer?: boolean;
        purposesAny?: Purpose[];
        providerOrTransfer?: boolean;
    };
    requirement: string;
    norm: string;
    severityIfMissing: 'warning' | 'critical';
    recommendation: string;
    check: RuleCheck;
    acceptedBases?: LegalBasis[];
    requireSeparate?: boolean;
    topic: Finding['topic'];
}
export interface Incident {
    id: string;
    title: string;
    description: string;
    detectedAt: string;
    exposureHours: number;
    affectedAssetIds: string[];
    affectedUsers: number;
    affectedCountries: (Jurisdiction | 'por_confirmar')[];
    digitalEnvironment: boolean;
    accessAssessment: 'desconocido' | 'sin_accesos_detectados' | 'accesos_detectados';
    riskLevel: 'bajo' | 'medio' | 'alto';
    riskJustification: string;
    rightsAffected: 'si' | 'no' | 'por_evaluar';
    containmentActions: {
        id: string;
        label: string;
        completed: boolean;
    }[];
    rootCause: string;
    correctiveActions: string[];
    status: 'abierto' | 'contenido' | 'notificado' | 'cerrado';
    notifications: IncidentNotification[];
}
export interface IncidentNotification extends VerificationMetadata {
    id: string;
    authority: string;
    jurisdiction: Jurisdiction;
    required: 'si' | 'no' | 'por_evaluar';
    deadlineHours?: number;
    deadlineType: 'hours' | 'business_days' | 'immediate' | 'none';
    deadlineDays?: number;
    suggestedRequired?: 'si';
    decision?: 'si' | 'no';
    status: 'pendiente' | 'enviada' | 'no_requerida';
    sentAt?: string;
    justification: string;
    norm: string;
}
export interface IncidentRule extends VerificationMetadata {
    id: string;
    check: 'overdue' | 'near-deadline' | 'health-risk' | 'containment' | 'no-justification' | 'mx-decision';
    requirement: string;
    norm: string;
    severityIfMissing: 'warning' | 'critical';
    recommendation: string;
    topic: 'incident';
}
export type EvidenceStatus = 'pendiente' | 'cumple' | 'no_cumple';
export interface Evidence {
    id: string;
    title: string;
    acceptanceCriterion: string;
    automatic: boolean;
    date: string;
    status: EvidenceStatus;
    confirmed: boolean;
    responsible: string;
    note: string;
}
export interface AppState {
    assets: DataAsset[];
    providers: Provider[];
    incidents: Incident[];
    evidences: Evidence[];
    auditLog: AuditEntry[];
    scenario: 'AndeClass inicial' | 'AndeClass corregido' | 'AndeClass con incidente';
}
export interface AuditEntry {
    id: string;
    timestamp: string;
    action: string;
    entity: string;
    detail: string;
}
export interface NormativeEntry {
    jurisdiction: Jurisdiction;
    framework: string;
    health: string;
    transfers: string;
    incidents: string;
    authority: string;
    rights: string;
    additional?: string;
}
