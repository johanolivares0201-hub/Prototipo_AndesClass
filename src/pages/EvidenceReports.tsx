import { useState } from 'react';
import { useStore } from '../store/Store';
import { useDemoClock } from '../store/DemoClock';
import { DemoClockControl } from '../components/DemoClockControl';
import { EvidenceForm } from '../components/EvidenceForm';
import { getEvidenceViews, type EvidenceView } from '../rules/evidences';
import { auditActionLabels, evidenceStatusLabels } from '../data/labels';
import { buildReportModel, summarizeAudit } from '../reports/buildReportModel';
import { formatLima } from '../store/clock';
export function EvidenceReports() {
    const { state, dispatch } = useStore();
    const { now, mode } = useDemoClock();
    const [filter, setFilter] = useState('');
    const [source, setSource] = useState('');
    const [form, setForm] = useState<EvidenceView | null>(null);
    const [actionType, setActionType] = useState('');
    const [date, setDate] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const evidences = getEvidenceViews(state, now);
    const model = buildReportModel(state, now, mode);
    const audit = state.auditLog.filter(entry => (!actionType || entry.action === actionType) && (!date || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(entry.timestamp)) === date));
    async function download() {
        setBusy(true);
        setError('');
        setMessage('Preparando expediente…');
        try {
            const { renderReportPdf } = await import('../reports/renderReportPdf');
            const result = await renderReportPdf(model);
            result.document.save(result.filename);
            setMessage(`Expediente descargado (${result.pageCount} páginas).`);
        }
        catch {
            setError('No se pudo generar el PDF. Vuelve a intentarlo con el sitio servido por Vite o en HTTPS.');
            setMessage('');
        }
        finally {
            setBusy(false);
        }
    }
    return <><div className="page-heading"><div><span className="eyebrow">DEMOSTRAR / EXPEDIENTE DE CUMPLIMIENTO</span><h1>Evidencias y reporte</h1><p>Revisa los criterios, confirma evidencias y genera el expediente de esta sesión.</p></div><button className="button primary" onClick={download} disabled={busy} aria-busy={busy}>{busy ? 'Generando…' : 'Descargar expediente PDF'}</button></div><DemoClockControl /><section className="card"><div className="card-heading"><div><h2>10 evidencias mínimas</h2><p>Los estados calculados son sugerencias. La confirmación del usuario queda registrada en memoria.</p></div></div><div className="filter-grid evidence-filters"><label>Estado<select value={filter} onChange={event => setFilter(event.target.value)}><option value="">Todos</option>{Object.entries(evidenceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Origen del estado<select value={source} onChange={event => setSource(event.target.value)}><option value="">Todos</option><option value="calculado">Calculado</option><option value="confirmado por el usuario">Confirmado por el usuario</option><option value="manual pendiente">Manual pendiente</option></select></label></div><div className="evidence-list">{evidences.filter(evidence => (!filter || evidence.effectiveStatus === filter) && (!source || evidence.source === source)).map(evidence => <article className="evidence-card" key={evidence.id}><div className="finding-meta"><span className={`chip ${evidence.effectiveStatus === 'cumple' ? 'traffic-ok' : evidence.effectiveStatus === 'no_cumple' ? 'traffic-critical' : 'neutral'}`}>{evidenceStatusLabels[evidence.effectiveStatus]}</span><span className="chip neutral">{evidence.source}</span></div><h3>{evidence.title}</h3><p><strong>Criterio:</strong> {evidence.acceptanceCriterion}</p><p className="muted">{evidence.reason}</p><p>Responsable: {evidence.responsible || 'Sin asignar'} · {evidence.date ? formatLima(evidence.date) : 'Sin fecha'}</p>{evidence.note && <p><strong>Nota:</strong> {evidence.note}</p>}<div className="button-group"><button className="button secondary" onClick={() => setForm(evidence)}>{evidence.confirmed ? 'Editar confirmación' : 'Confirmar / marcar otro estado'}</button>{evidence.confirmed && <button className="button subtle" onClick={() => dispatch({ type: 'UPDATE_EVIDENCE', evidence: { id: evidence.id, title: evidence.title, acceptanceCriterion: evidence.acceptanceCriterion, automatic: evidence.automatic, status: 'pendiente', confirmed: false, responsible: evidence.responsible, date: now, note: 'Confirmación retirada: vuelve al estado sugerido o manual pendiente.' } })}>Volver a sugerencia</button>}</div></article>)}</div></section><section className="card provider-section"><div className="card-heading"><div><h2>Registro de cambios</h2><p>{audit.length} movimientos seleccionados. El PDF incluye los últimos 50 del registro completo.</p></div></div><div className="filter-grid evidence-filters"><label>Tipo de acción<select value={actionType} onChange={event => setActionType(event.target.value)}><option value="">Todas</option>{[...new Set(state.auditLog.map(entry => entry.action))].map(type => <option key={type} value={type}>{auditActionLabels[type] || type}</option>)}</select></label><label>Fecha en Lima<input type="date" value={date} onChange={event => setDate(event.target.value)}/></label><button className="button secondary" onClick={() => { setDate(''); setActionType(''); }}>Limpiar filtros</button></div><div className="table-scroll" tabIndex={0} role="region" aria-label="Registro de cambios"><table><thead><tr><th scope="col">Fecha / hora</th><th scope="col">Acción</th><th scope="col">Entidad</th><th scope="col">Detalle</th></tr></thead><tbody>{[...audit].reverse().map(entry => <tr key={entry.id}><td>{formatLima(entry.timestamp)}</td><td>{auditActionLabels[entry.action] || entry.action}</td><td>{entry.entity}</td><td><details><summary>{summarizeAudit(entry).slice(0, 100)}</summary><pre className="audit-detail">{entry.detail}</pre></details></td></tr>)}</tbody></table></div>{!audit.length && <p className="finding-empty">No hay cambios para los filtros seleccionados.</p>}</section><section className="card provider-section"><div className="card-heading"><div><h2>Vista previa del expediente</h2><p>{model.scenario} · {model.generatedLabel} · {mode === 'simulated' ? 'Reloj simulado' : 'Tiempo real'}</p></div></div><div className="report-preview">{model.sections.map(section => <details key={section.id}><summary>{section.title} <span className="muted">({section.rows.length} registros)</span></summary>{section.intro && <p>{section.intro}</p>}{section.rows.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label={`Vista previa: ${section.title}`}><table><thead><tr>{section.headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{section.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell}</td>)}</tr>)}</tbody></table></div> : <p className="finding-empty">Sin registros.</p>}</details>)}</div></section>{error && <p role="alert" className="form-error">{error}</p>}<p className="status-message" role="status">{message}</p>{form && <EvidenceForm evidence={form} onClose={() => setForm(null)}/>}</>;
}
