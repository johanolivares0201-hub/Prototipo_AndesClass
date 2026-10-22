import { useState } from 'react';
import { useStore } from '../store/Store';
import { useCompliance } from '../rules/useCompliance';
import { jurisdictionLabels } from '../data/labels';
import { FindingList } from '../components/Compliance';
export function Findings() {
    const { state } = useStore();
    const { findings } = useCompliance();
    const [severity, setSeverity] = useState('');
    const [country, setCountry] = useState('');
    const [assetId, setAssetId] = useState('');
    const filtered = findings.filter(item => (!severity || item.severity === severity) && (!country || item.jurisdiction === country) && (!assetId || (assetId === "__incidents" ? item.topic === "incident" : item.assetId === assetId)));
    return <><div className="page-heading"><div><span className="eyebrow">CONTROLAR / EVALUACIÓN</span><h1>Hallazgos</h1><p>Requisitos incumplidos del modelo y recomendaciones por jurisdicción.</p></div><span className="chip neutral">{findings.length} hallazgos</span></div><section className="card"><div className="filter-grid findings-filters"><label>Severidad<select value={severity} onChange={event => setSeverity(event.target.value)}><option value="">Todas</option><option value="critical">Crítico</option><option value="warning">Advertencia</option></select></label><label>País<select value={country} onChange={event => setCountry(event.target.value)}><option value="">Todos</option>{Object.entries(jurisdictionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Dato<select value={assetId} onChange={event => setAssetId(event.target.value)}><option value="">Todos</option><option value="__incidents">Incidentes</option>{state.assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><button className="button secondary" onClick={() => { setSeverity(''); setCountry(''); setAssetId(''); }}>Limpiar filtros</button></div><div className="results-bar" role="status">{filtered.length} de {findings.length} hallazgos</div><FindingList findings={filtered}/></section></>;
}
