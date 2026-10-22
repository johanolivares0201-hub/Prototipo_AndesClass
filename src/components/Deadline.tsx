import { useEffect, useState } from 'react';
import type { Incident, IncidentNotification } from '../types';
import { getDeadline } from '../rules/incidents';
export function Deadline({ incident, notification, now }: {
    incident: Incident;
    notification: IncidentNotification;
    now: string;
}) {
    const deadline = getDeadline(incident, notification, now);
    const [announcement, setAnnouncement] = useState('');
    useEffect(() => { const labels = { ok: 'Dentro del plazo', warning: 'Plazo por vencer', critical: 'Plazo vencido', inactive: 'Contador inactivo', unverified: 'Sin plazo numérico contrastado', immediate: 'Comunicación inmediata; sin contador' }; setAnnouncement(`${notification.authority}: ${labels[deadline.state]}.`); }, [deadline.state, notification.authority]);
    return <><span className={`deadline deadline-${deadline.state}`}>{deadline.text}</span><span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span></>;
}
