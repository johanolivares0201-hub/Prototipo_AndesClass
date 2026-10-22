import { Link } from 'react-router-dom';
import { useStore } from '../store/Store';
import { useDemoClock } from '../store/DemoClock';
import { getNextDeadline } from '../rules/incidents';
import { Deadline } from './Deadline';
export function IncidentSummary() {
    const { state } = useStore();
    const { now } = useDemoClock();
    const active = state.incidents.filter(incident => incident.status !== 'cerrado');
    const next = getNextDeadline(state, now);
    if (!active.length)
        return null;
    return <section className="card incident-summary"><div><span className="eyebrow">RESPUESTA A INCIDENTES</span><h2>{active[0].title}</h2><p>{active[0].affectedUsers} usuarios · Estado: {active[0].status} · {active[0].affectedCountries.includes('por_confirmar') ? 'Países por confirmar: seleccionarlos activa los plazos.' : `${active[0].affectedCountries.length} países confirmados`}</p></div><div>{next ? <><strong>{next.notification.authority}</strong><Deadline incident={next.incident} notification={next.notification} now={now}/></> : <p>Sin próximo plazo verificado activo.</p>}</div><Link to="/incidentes" className="button primary">Gestionar incidente</Link></section>;
}
