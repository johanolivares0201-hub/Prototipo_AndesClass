import type { AppState, ConsentRecord, DataAsset, Finding, Jurisdiction, Purpose, Rule } from '../types';
import { rules } from './rules';
import { evaluateIncidents } from './incidents';
export function getConsent(asset: DataAsset, purpose: Purpose): ConsentRecord {
    return asset.purposeConsents?.[purpose] || { legalBasis: asset.legalBasis, consentSeparate: asset.consentSeparate };
}
export function isInternationalTransfer(state: AppState, asset: DataAsset, jurisdiction: Jurisdiction): boolean {
    const provider = state.providers.find(item => item.id === asset.providerId);
    return asset.storageCountry !== jurisdiction || (!!provider && provider.country !== jurisdiction);
}
export interface RuleResult {
    rule: Rule;
    assetId: string;
    passed: boolean;
    finding?: Finding;
}
function applies(rule: Rule, state: AppState, asset: DataAsset): boolean {
    const condition = rule.appliesTo;
    return (!condition.category || asset.category === condition.category)
        && (!condition.purpose || asset.purposes.includes(condition.purpose))
        && (!condition.purposesAny || condition.purposesAny.some(purpose => asset.purposes.includes(purpose)))
        && (!condition.internationalTransfer || isInternationalTransfer(state, asset, rule.jurisdiction))
        && (!condition.providerOrTransfer || !!asset.providerId || isInternationalTransfer(state, asset, rule.jurisdiction));
}
function check(rule: Rule, state: AppState, asset: DataAsset): boolean {
    const provider = state.providers.find(item => item.id === asset.providerId);
    const purposes = asset.purposes.filter(purpose => (!rule.appliesTo.purpose || purpose === rule.appliesTo.purpose) && (!rule.appliesTo.purposesAny || rule.appliesTo.purposesAny.includes(purpose)));
    switch (rule.check) {
        case 'health-consent': return purposes.every(purpose => { const consent = getConsent(asset, purpose); return !!rule.acceptedBases?.includes(consent.legalBasis) && (!rule.requireSeparate || consent.consentSeparate); });
        case 'no-health-commercial': return false;
        case 'advertising-consent': return purposes.every(purpose => rule.acceptedBases?.includes(getConsent(asset, purpose).legalBasis));
        case 'secondary-basis': return !purposes.some(purpose => rule.acceptedBases?.includes(getConsent(asset, purpose).legalBasis));
        case 'legal-basis': return asset.purposes.every(purpose => getConsent(asset, purpose).legalBasis !== 'ninguna');
        case 'pe-flow-registered': return !!provider?.peFlowRegistered;
        case 'provider-contract': return !!provider?.hasContract;
        case 'transfer-mechanism': return !!provider && provider.transferMechanism !== 'ninguno' && (rule.jurisdiction !== 'ES_UE' || provider.transferMechanism === 'clausulas_tipo' || (provider.transferMechanism === 'dpf' && provider.country === 'US' && asset.storageCountry === 'US'));
        case 'health-encryption': return asset.encrypted;
        case 'separate-commercial': return purposes.every(purpose => getConsent(asset, purpose).consentSeparate);
    }
}
export function evaluateRules(state: AppState): RuleResult[] {
    return state.assets.flatMap(asset => rules.filter(rule => asset.dataSubjectCountries.includes(rule.jurisdiction) && applies(rule, state, asset)).map(rule => {
        const passed = check(rule, state, asset);
        return { rule, assetId: asset.id, passed, finding: passed ? undefined : {
                id: `${asset.id}:${rule.id}`, assetId: asset.id, ruleId: rule.id, jurisdiction: rule.jurisdiction,
                severity: rule.severityIfMissing, message: rule.requirement, norm: rule.norm, recommendation: rule.recommendation,
                verificationStatus: rule.verificationStatus, sourceIds: [...rule.sourceIds], topic: rule.topic, providerId: rule.topic === 'transfer' ? asset.providerId : undefined,
            } };
    }));
}
export function evaluateCompliance(state: AppState, now?: string): Finding[] {
    return [...evaluateRules(state).flatMap(result => result.finding ? [result.finding] : []), ...(now ? evaluateIncidents(state, now) : [])];
}
export function getTrafficLight(findings: Finding[]): Finding['severity'] {
    return findings.some(item => item.severity === 'critical') ? 'critical' : findings.some(item => item.severity === 'warning') ? 'warning' : 'ok';
}
export function getComplianceSummary(state: AppState, now?: string) {
    const results = evaluateRules(state);
    const findings = evaluateCompliance(state, now);
    const passed = results.filter(result => result.passed).length;
    return { findings, applicable: results.length, passed, percentage: results.length ? Math.round(passed / results.length * 100) : null,
        critical: findings.filter(item => item.severity === 'critical').length, warning: findings.filter(item => item.severity === 'warning').length };
}
export function sortFindings(findings: Finding[]): Finding[] {
    return [...findings].sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1) || a.id.localeCompare(b.id));
}
