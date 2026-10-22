import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { evidenceStatusLabels } from '../data/labels';
import { useStore } from '../store/Store';
import { useDemoClock } from '../store/DemoClock';
import type { EvidenceStatus } from '../types';
import type { EvidenceView } from '../rules/evidences';
export function EvidenceForm({ evidence, onClose }: {
    evidence: EvidenceView;
    onClose: () => void;
}) {
    const { dispatch } = useStore();
    const { now } = useDemoClock();
    const [status, setStatus] = useState<EvidenceStatus>(evidence.effectiveStatus);
    const [responsible, setResponsible] = useState(evidence.responsible);
    const [note, setNote] = useState(evidence.note);
    const [error, setError] = useState('');
    function submit(event: FormEvent) {
        event.preventDefault();
        if (!note.trim() || !responsible.trim()) {
            setError('Registra responsable y nota para confirmar la evidencia.');
            return;
        }
        const { id, title, acceptanceCriterion, automatic } = evidence;
        dispatch({ type: 'UPDATE_EVIDENCE', evidence: { id, title, acceptanceCriterion, automatic, status, confirmed: true, responsible: responsible.trim(), note: note.trim(), date: now } });
        onClose();
    }
    return <Modal title={evidence.title} onClose={onClose}><form onSubmit={submit}><div className="form-body"><p>{evidence.acceptanceCriterion}</p><p className="field-note">Sugerencia: {evidenceStatusLabels[evidence.suggested]}. {evidence.reason}</p><label>Estado confirmado<select value={status} onChange={event => setStatus(event.target.value as EvidenceStatus)}>{Object.entries(evidenceStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Responsable *<input autoFocus required value={responsible} onChange={event => setResponsible(event.target.value)} maxLength={150}/></label><label>Nota / fundamento *<textarea required rows={4} value={note} onChange={event => setNote(event.target.value)} maxLength={1500}/></label>{error && <p role="alert" className="form-error">{error}</p>}</div><div className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">Confirmar evidencia</button></div></form></Modal>;
}
