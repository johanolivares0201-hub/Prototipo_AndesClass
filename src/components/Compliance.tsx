import { jurisdictionLabels } from '../data/labels';
import { getTrafficLight, sortFindings } from '../rules/evaluate';
import { VerificationBadge } from './VerificationBadge';
import { useStore } from '../store/Store';
import type { Finding } from '../types';
export const severityLabels = { ok: 'Verde · Sin hallazgos', warning: 'Ámbar · Advertencia', critical: 'Rojo · Crítico' };
export function TrafficLight({ findings }: {
    findings: Finding[];
}) {
    const status = getTrafficLight(findings);
    return <span className={`chip traffic-${status}`}><span className="dot"/>{severityLabels[status]}</span>;
}
export function FindingList({ findings, emptyMessage = 'Sin hallazgos para esta selección.' }: {
    findings: Finding[];
    emptyMessage?: string;
}) {
    const { state } = useStore();
    if (!findings.length)
        return <p className="finding-empty">{emptyMessage}</p>;
    return <ul className="finding-list">{sortFindings(findings).map(finding => <li key={finding.id} className={`finding finding-${finding.severity}`}><div className="finding-meta"><TrafficLight findings={[finding]}/><span>{jurisdictionLabels[finding.jurisdiction]} · {finding.incidentId ? state.incidents.find(incident => incident.id === finding.incidentId)?.title || finding.incidentId : state.assets.find(asset => asset.id === finding.assetId)?.name || finding.assetId}</span><VerificationBadge verificationStatus={finding.verificationStatus} sourceIds={finding.sourceIds}/></div><h3>{finding.message}</h3><p><strong>Norma:</strong> {finding.norm}</p><p><strong>Recomendación:</strong> {finding.recommendation}</p></li>)}</ul>;
}
