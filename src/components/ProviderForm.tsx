import { useState, type FormEvent } from 'react';
import { countryLabels, mechanismLabels } from '../data/labels';
import { useStore } from '../store/Store';
import type { Provider } from '../types';
import { Modal } from './Modal';
export function ProviderForm({ provider, onClose }: {
    provider?: Provider;
    onClose: () => void;
}) {
    const { dispatch } = useStore();
    const [draft, setDraft] = useState<Provider>(provider || { id: crypto.randomUUID(), name: '', country: 'US', role: 'encargado', hasContract: false, transferMechanism: 'ninguno' });
    const [error, setError] = useState('');
    function submit(event: FormEvent) {
        event.preventDefault();
        if (!draft.name.trim()) {
            setError('El nombre del proveedor es obligatorio.');
            return;
        }
        dispatch({ type: provider ? 'UPDATE_PROVIDER' : 'ADD_PROVIDER', provider: { ...draft, name: draft.name.trim() } });
        onClose();
    }
    return <Modal title={provider ? 'Editar proveedor' : 'Agregar proveedor'} onClose={onClose}><form onSubmit={submit}><div className="form-body">{error && <p role="alert" className="form-error">{error}</p>}<label>Nombre *<input autoFocus required maxLength={150} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label><label>País<select value={draft.country} onChange={event => setDraft({ ...draft, country: event.target.value as Provider['country'] })}>{Object.entries(countryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className="field-note">Rol: encargado del tratamiento.</p><label className="check"><input type="checkbox" checked={draft.hasContract} onChange={event => setDraft({ ...draft, hasContract: event.target.checked })}/>Contrato registrado</label><label className="check"><input type="checkbox" checked={!!draft.peFlowRegistered} onChange={event => setDraft({ ...draft, peFlowRegistered: event.target.checked })}/>Flujo transfronterizo comunicado al Registro Nacional de Protección de Datos Personales (Perú)</label><label>Mecanismo de transferencia<select value={draft.transferMechanism} onChange={event => setDraft({ ...draft, transferMechanism: event.target.value as Provider['transferMechanism'] })}>{Object.entries(mechanismLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className="field-note">Registrar DPF no verifica la certificación del proveedor. Recurso C-703/25 P pendiente según corte 14/10/2026; sin cambio de mecanismo.</p></div><div className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary">Guardar proveedor</button></div></form></Modal>;
}
