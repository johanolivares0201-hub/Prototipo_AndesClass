import { useState } from 'react';
import { basisLabels, countryLabels, mechanismLabels, purposeLabels } from '../data/labels';
import { useStore } from '../store/Store';
import { compareSimulation, createSimulation, simulationChanges, updateSimulation } from '../rules/simulation';
import { evaluateCompliance, getComplianceSummary } from '../rules/evaluate';
import type { DataAsset, Jurisdiction, Provider, Purpose } from '../types';
import { FindingList, TrafficLight } from './Compliance';
export function Simulator() {
    const { state, dispatch } = useStore();
    const [session, setSession] = useState(() => ({ baseline: state, draft: createSimulation(state) }));
    const [assetId, setAssetId] = useState(state.assets[0]?.id || '');
    const [message, setMessage] = useState('');
    const asset = session.draft.assets.find(item => item.id === assetId);
    const provider = session.draft.providers.find(item => item.id === asset?.providerId);
    const stale = session.baseline !== state;
    const before = evaluateCompliance(session.baseline);
    const after = evaluateCompliance(session.draft);
    const changes = compareSimulation(session.baseline, session.draft);
    const mutations = simulationChanges(session.baseline, session.draft);
    const countries = [...new Set([...session.baseline.assets.flatMap(item => item.dataSubjectCountries), ...session.draft.assets.flatMap(item => item.dataSubjectCountries)])];
    function updateAsset(patch: Partial<DataAsset>) {
        if (!asset)
            return;
        setSession(current => ({ ...current, draft: updateSimulation(current.draft, { ...asset, ...patch }) }));
        setMessage('');
    }
    function updateProvider(patch: Partial<Provider>) {
        if (!asset || !provider)
            return;
        setSession(current => ({ ...current, draft: updateSimulation(current.draft, asset, { ...provider, ...patch }) }));
        setMessage('');
    }
    function togglePurpose(purpose: Purpose) {
        if (asset)
            updateAsset({ purposes: asset.purposes.includes(purpose) ? asset.purposes.filter(item => item !== purpose) : [...asset.purposes, purpose] });
    }
    function toggleCountry(country: Jurisdiction) {
        if (asset)
            updateAsset({ dataSubjectCountries: asset.dataSubjectCountries.includes(country) ? asset.dataSubjectCountries.filter(item => item !== country) : [...asset.dataSubjectCountries, country] });
    }
    function discard() { setSession({ baseline: state, draft: createSimulation(state) }); setAssetId(state.assets.some(item => item.id === assetId) ? assetId : state.assets[0]?.id || ''); setMessage('Simulación descartada. Se copió el inventario actual.'); }
    const invalid = session.draft.assets.some(item => !item.purposes.length);
    function apply() {
        if (stale || invalid)
            return;
        dispatch({ type: 'APPLY_SIMULATION', baseline: session.baseline, ...mutations });
        setMessage('Cambios aplicados al inventario. Descarta o inicia otra simulación para continuar.');
    }
    const beforeSummary = getComplianceSummary(session.baseline);
    const afterSummary = getComplianceSummary(session.draft);
    return <section className="card provider-section"><div className="card-heading"><div><span className="eyebrow">LABORATORIO EN MEMORIA</span><h2>¿Y si…?</h2><p>Prueba cambios sobre una copia temporal. Solo «Aplicar» modifica el inventario.</p></div><span className="chip neutral">{mutations.assets.length + mutations.providers.length} entidades modificadas</span></div>{stale && <p className="notice simulator-notice">El inventario cambió desde el inicio de esta simulación. Descarta para copiar el estado actual antes de aplicar.</p>}<div className="simulator-grid"><div className="simulator-form"><label>Dato a simular<select value={assetId} onChange={event => setAssetId(event.target.value)}>{session.draft.assets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{asset ? <><fieldset><legend>Finalidades</legend><div className="check-grid">{Object.entries(purposeLabels).map(([value, label]) => <label className="check" key={value}><input type="checkbox" checked={asset.purposes.includes(value as Purpose)} onChange={() => togglePurpose(value as Purpose)}/>{label}</label>)}</div></fieldset><fieldset><legend>Países de titulares</legend><div className="check-grid">{Object.entries(countryLabels).map(([value, label]) => <label className="check" key={value}><input type="checkbox" checked={asset.dataSubjectCountries.includes(value as Jurisdiction)} onChange={() => toggleCountry(value as Jurisdiction)}/>{label}</label>)}</div></fieldset><label>País de almacenamiento<select value={asset.storageCountry} onChange={event => updateAsset({ storageCountry: event.target.value as Jurisdiction })}>{Object.entries(countryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Base jurídica común<select value={asset.legalBasis} onChange={event => updateAsset({ legalBasis: event.target.value as DataAsset['legalBasis'], purposeConsents: undefined })}>{Object.entries(basisLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="check"><input type="checkbox" checked={asset.consentSeparate} onChange={event => updateAsset({ consentSeparate: event.target.checked, purposeConsents: undefined })}/>Consentimiento separado (todas las finalidades)</label><p className="field-note">Cambiar la base común o el consentimiento separado reemplaza las excepciones por finalidad de este dato.</p><label className="check"><input type="checkbox" checked={asset.encrypted} onChange={event => updateAsset({ encrypted: event.target.checked })}/>Cifrado</label>{provider ? <fieldset><legend>{provider.name}</legend><label className="check"><input type="checkbox" checked={provider.hasContract} onChange={event => updateProvider({ hasContract: event.target.checked })}/>Contrato registrado</label><label>Mecanismo<select value={provider.transferMechanism} onChange={event => updateProvider({ transferMechanism: event.target.value as Provider['transferMechanism'] })}>{Object.entries(mechanismLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className="field-note">Este proveedor es compartido: los cambios simulados afectan a todos sus activos.</p></fieldset> : <p className="field-note">Este dato no tiene proveedor asociado. Asígnalo desde el inventario para simular sus condiciones.</p>}</> : <p className="finding-empty">Agrega un dato al inventario para simular.</p>}</div><div className="simulation-results"><h3>Antes y después · Todos los activos</h3><p className="muted">Cumplimiento del modelo: {beforeSummary.percentage ?? 'Sin reglas'}{beforeSummary.percentage !== null && ' %'} → {afterSummary.percentage ?? 'Sin reglas'}{afterSummary.percentage !== null && ' %'}</p><div className="table-scroll" tabIndex={0} role="region" aria-label="Comparación de semáforos"><table><thead><tr><th scope="col">País</th><th scope="col">Antes</th><th scope="col">Después</th></tr></thead><tbody>{countries.map(country => <tr key={country}><td>{countryLabels[country]}</td><td>{session.baseline.assets.some(item => item.dataSubjectCountries.includes(country)) ? <TrafficLight findings={before.filter(item => item.jurisdiction === country)}/> : 'Sin titulares'}</td><td>{session.draft.assets.some(item => item.dataSubjectCountries.includes(country)) ? <TrafficLight findings={after.filter(item => item.jurisdiction === country)}/> : 'Sin titulares'}</td></tr>)}</tbody></table></div><h3 className="simulation-subtitle">Nuevos ({changes.newFindings.length})</h3><FindingList findings={changes.newFindings} emptyMessage="No aparecen hallazgos nuevos."/><h3 className="simulation-subtitle">Resueltos ({changes.resolvedFindings.length})</h3><FindingList findings={changes.resolvedFindings} emptyMessage="Aún no se resuelve ningún hallazgo."/></div></div>{invalid && <p className="form-error simulator-notice" role="alert">Cada dato necesita al menos una finalidad para aplicar los cambios.</p>}<div className="modal-footer"><button className="button secondary" onClick={discard}>Descartar / copiar estado actual</button><button className="button primary" onClick={apply} disabled={stale || invalid || !asset || !mutations.assets.length && !mutations.providers.length}>Aplicar al inventario</button></div><p className="status-message simulator-notice" role="status">{message}</p></section>;
}
