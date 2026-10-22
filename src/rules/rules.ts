import { ruleVerification } from '../data/sources';
import type { Jurisdiction, Rule } from '../types';
export type { Rule } from '../types';
export const evaluatedCountries: Jurisdiction[] = ['PE', 'ES_UE', 'MX', 'CO', 'US'];
export const commercialPurposes = ['analitica', 'publicidad', 'recomendaciones'] as const;
const norms: Record<Jurisdiction, string> = { PE: 'Ley 29733', ES_UE: 'RGPD', MX: 'LFPDPPP 2025; artículo por contrastar', CO: 'Ley 1581 de 2012', US: 'Contrato de encargo; requisito del modelo académico por contrastar' };
const consentBases = ['consentimiento', 'consentimiento_escrito', 'consentimiento_explicito'] as const;
type Template = Omit<Rule, 'id' | 'jurisdiction' | 'norm' | 'verificationStatus' | 'sourceIds'>;
// Los artículos aportados en la Entrega 2 complementan la matriz original.
function perCountry(key: string, template: Template, citations: Partial<Record<Jurisdiction, string>> = {}): Rule[] {
    return evaluatedCountries.map(jurisdiction => ({ ...template, id: `${jurisdiction}-${key}`, jurisdiction,
        norm: citations[jurisdiction] || norms[jurisdiction],
        ...ruleVerification(jurisdiction, key),
    }));
}
export const rules: Rule[] = [
    { id: 'PE-flow-registered', jurisdiction: 'PE', appliesTo: { internationalTransfer: true }, check: 'pe-flow-registered', topic: 'transfer', requirement: 'Comunicar el flujo transfronterizo al Registro Nacional de Protección de Datos Personales.', norm: 'Trámite ANPD de comunicación del flujo; Ley 29733 art. 15 (contexto)', severityIfMissing: 'warning', recommendation: 'Registrar la comunicación del flujo ante el Registro Nacional de Protección de Datos Personales y conservar la constancia.', ...ruleVerification('PE', 'flow-registered') },
    ...(['PE', 'ES_UE', 'MX', 'CO'] as const).map((jurisdiction): Rule => ({
        id: `${jurisdiction}-health-consent`, jurisdiction, appliesTo: { category: 'salud' }, check: 'health-consent', topic: 'consent',
        requirement: jurisdiction === 'PE' ? 'Salud requiere consentimiento escrito y separado.' : jurisdiction === 'ES_UE' ? 'Salud requiere consentimiento explícito y separado.' : jurisdiction === 'MX' ? 'Salud requiere consentimiento expreso y por escrito.' : 'Salud requiere autorización explícita.',
        acceptedBases: jurisdiction === 'PE' || jurisdiction === 'MX' ? ['consentimiento_escrito'] : ['consentimiento_escrito', 'consentimiento_explicito'],
        requireSeparate: jurisdiction === 'PE' || jurisdiction === 'ES_UE',
        norm: jurisdiction === 'MX' ? 'LFPDPPP 2025 art. 8' : jurisdiction === 'PE' ? 'Ley 29733 art. 13.6 (por contrastar)' : jurisdiction === 'ES_UE' ? 'RGPD art. 9.2.a' : norms[jurisdiction], severityIfMissing: 'critical',
        recommendation: jurisdiction === 'MX' ? 'Obtener consentimiento expreso y por escrito mediante firma autógrafa, electrónica o mecanismo de autenticación (art. 8); no basta consentimiento explícito sin constancia escrita.' : 'Registrar autorización adecuada para cada finalidad; para Perú conservar constancia escrita y separar el consentimiento.',
        ...ruleVerification(jurisdiction, 'health-consent'),
    })),
    ...perCountry('health-commercial', { appliesTo: { category: 'salud', purposesAny: [...commercialPurposes] }, check: 'no-health-commercial', topic: 'purpose', requirement: 'El modelo excluye finalidades comerciales sobre salud.', severityIfMissing: 'critical', recommendation: 'Retirar analítica, publicidad y recomendaciones de los datos de salud; revisar finalidad con asesoría competente.' }, { PE: 'Ley 29733 art. 6', ES_UE: 'RGPD art. 5.1.b' }),
    ...perCountry('advertising', { appliesTo: { purpose: 'publicidad' }, check: 'advertising-consent', topic: 'consent', acceptedBases: [...consentBases], requirement: 'Publicidad requiere una base de consentimiento.', severityIfMissing: 'critical', recommendation: 'Obtener consentimiento para publicidad o retirar esa finalidad.' }, { ES_UE: 'RGPD art. 6 y LSSI art. 21' }),
    ...perCountry('secondary-contract', { appliesTo: { purposesAny: ['analitica', 'recomendaciones'] }, check: 'secondary-basis', topic: 'basis', acceptedBases: ['contrato'], requirement: 'Revisar analítica o recomendaciones basadas únicamente en contrato.', severityIfMissing: 'warning', recommendation: 'Revisar la base aplicable a cada finalidad secundaria.' }),
    ...perCountry('secondary-none', { appliesTo: { purposesAny: ['analitica', 'recomendaciones'] }, check: 'secondary-basis', topic: 'basis', acceptedBases: ['ninguna'], requirement: 'Analítica o recomendaciones requieren base jurídica.', severityIfMissing: 'critical', recommendation: 'Registrar una base adecuada o retirar la finalidad secundaria.' }),
    ...perCountry('basis', { appliesTo: {}, check: 'legal-basis', topic: 'basis', requirement: 'Cada finalidad requiere base jurídica.', severityIfMissing: 'critical', recommendation: 'Definir y registrar la base jurídica de cada finalidad antes de tratar el dato.' }),
    ...perCountry('contract', { appliesTo: { providerOrTransfer: true }, check: 'provider-contract', topic: 'transfer', requirement: 'Registrar un contrato de encargo con el proveedor.', severityIfMissing: 'critical', recommendation: 'Formalizar y registrar el contrato de encargo; confirmar obligaciones del receptor.' }),
    ...(['PE', 'ES_UE', 'MX', 'CO'] as const).map((jurisdiction): Rule => ({ id: `${jurisdiction}-mechanism`, jurisdiction, appliesTo: { internationalTransfer: true }, check: 'transfer-mechanism', topic: 'transfer', requirement: 'Registrar un mecanismo de transferencia internacional.', norm: ({ PE: 'Ley 29733 art. 15', ES_UE: 'RGPD Cap. V: DPF o cláusulas tipo', MX: 'LFPDPPP 2025; artículo por contrastar', CO: 'Ley 1581 art. 26' })[jurisdiction], severityIfMissing: jurisdiction === 'ES_UE' ? 'critical' : 'warning', recommendation: 'Registrar cláusulas tipo u otro mecanismo válido. DPF solo para un proveedor de EE. UU. certificado; la demo no verifica certificación.', ...ruleVerification(jurisdiction, 'mechanism') })),
    ...perCountry('encryption', { appliesTo: { category: 'salud' }, check: 'health-encryption', topic: 'security', requirement: 'Registrar cifrado para salud.', severityIfMissing: 'warning', recommendation: 'Implementar cifrado y registrar evidencia de las medidas de seguridad.' }, { PE: 'Ley 29733 art. 16', ES_UE: 'RGPD art. 32' }),
    ...perCountry('separate', { appliesTo: { purposesAny: [...commercialPurposes] }, check: 'separate-commercial', topic: 'consent', requirement: 'Separar el consentimiento para las finalidades comerciales.', severityIfMissing: 'warning', recommendation: 'Registrar consentimiento separado para cada finalidad comercial.' }),
];
