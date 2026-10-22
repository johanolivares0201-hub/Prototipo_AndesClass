import { useState, type FormEvent } from 'react';
import type { Incident, IncidentNotification } from '../types';
import { Modal } from './Modal';
import { useStore } from '../store/Store';
import { useDemoClock } from '../store/DemoClock';
import { deriveNotifications } from '../rules/incidents';
import { formatLima } from '../store/clock';
export function NotificationForm({ incident, notification, onClose }: {
    incident: Incident;
    notification: IncidentNotification;
    onClose: () => void;
}) {
    const { state, dispatch } = useStore();
    const { now } = useDemoClock();
    const [status, setStatus] = useState<IncidentNotification['status']>(notification.status === 'pendiente' ? 'enviada' : notification.status);
    const [justification, setJustification] = useState(notification.justification);
    const [error, setError] = useState('');
    const [decision, setDecision] = useState<'si' | 'no' | 'por_evaluar'>(notification.decision || 'por_evaluar');
    function submit(event: FormEvent) {
        event.preventDefault();
        if ((status === 'no_requerida' || notification.jurisdiction === 'MX' && decision === 'no') && !justification.trim()) {
            setError('Justifica por qué se considera no requerida.');
            return;
        }
        if (status === 'enviada' && Date.parse(now) < Date.parse(incident.detectedAt)) {
            setError('La fecha de envío no puede preceder a la detección. Avanza el reloj.');
            return;
        }
        dispatch({ type: 'UPDATE_INCIDENT', incident: { ...incident, notifications: deriveNotifications(incident, state).map(item => item.id === notification.id ? { ...item, status, decision: notification.jurisdiction === "MX" ? status === "enviada" ? "si" : status === "no_requerida" ? "no" : decision === "por_evaluar" ? undefined : decision : item.decision, justification: justification.trim(), sentAt: status === 'enviada' ? now : undefined } : item) } });
        onClose();
    }
    return <Modal title={`Notificación: ${notification.authority}`} onClose={onClose}><form onSubmit={submit}><div className="form-body"><p className="muted">Registro académico. Este formulario no envía comunicaciones a autoridades ni titulares.</p>{notification.jurisdiction === "MX" && <label>¿Afecta significativamente derechos patrimoniales o morales?<select value={decision} onChange={event => { const next = event.target.value as typeof decision; setDecision(next); setStatus(next === "no" ? "no_requerida" : "pendiente"); }}><option value="por_evaluar">Por evaluar</option><option value="si">Sí: informar de forma inmediata</option><option value="no">No: justificar decisión</option></select></label>}<label>Estado<select value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="enviada">Enviada</option><option value="no_requerida">No requerida</option><option value="pendiente">Pendiente</option></select></label>{status === 'enviada' && <p>Fecha de envío del reloj: <strong>{formatLima(now)}</strong></p>}<label>Justificación {status === 'no_requerida' && '*'}<textarea autoFocus required={status === 'no_requerida'} rows={4} value={justification} onChange={event => setJustification(event.target.value)} maxLength={2000}/></label>{error && <p className="form-error" role="alert">{error}</p>}</div><div className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">Guardar registro</button></div></form></Modal>;
}
