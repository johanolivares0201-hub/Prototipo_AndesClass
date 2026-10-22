import { useState } from 'react';
import { countryLabels, mechanismLabels } from '../data/labels';
import { useStore } from '../store/Store';
import { getTransferModel } from '../rules/transfers';
import { getTrafficLight } from '../rules/evaluate';
import { FindingList, severityLabels } from './Compliance';
const colors = { ok: '#26715b', warning: '#94600c', critical: '#b33438' };
export function DataJourney() {
    const { state } = useStore();
    const [assetId, setAssetId] = useState('');
    const [selected, setSelected] = useState('');
    const model = getTransferModel(state, assetId);
    const height = Math.max(350, Math.max(model.countries.length, model.destinations.length) * 95 + 70);
    const center = height / 2;
    const selectedFindings = selected.startsWith('source:') ? model.findings.filter(item => item.jurisdiction === selected.slice(7)) : model.destinations.find(item => item.id === selected)?.findings || [];
    const lines = [...model.countries.map(country => ({ id: `source:${country}`, label: `${countryLabels[country]} → AndeClass (Perú)`, findings: model.findings.filter(item => item.jurisdiction === country) })), ...model.destinations.map(destination => ({ id: destination.id, label: `AndeClass → ${destination.name} / ${countryLabels[destination.storageCountry]}`, findings: destination.findings }))];
    const choose = (id: string) => setSelected(id);
    return <section className="card"><div className="card-heading"><div><h2>El viaje del dato</h2><p>Selecciona una línea para revisar sus hallazgos de transferencia.</p></div><label>Datos del diagrama<select value={assetId} onChange={event => { setAssetId(event.target.value); setSelected(''); }}><option value="">Todos los datos</option>{state.assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label></div><div className="journey-legend"><span className="chip traffic-ok">Verde · Sin hallazgos</span><span className="chip traffic-warning">Ámbar · Advertencia</span><span className="chip traffic-critical">Rojo · Crítico</span><span>┆ Cruce de frontera</span></div>{!model.assets.length ? <p className="finding-empty">No hay activos para representar.</p> : <div className="journey-scroll" tabIndex={0} role="region" aria-label="Diagrama del viaje del dato, desplazable"><svg className="journey" viewBox={`0 0 1000 ${height}`} aria-labelledby="journey-title" role="group"><title id="journey-title">Titulares, AndeClass y destinos de almacenamiento declarados</title><line x1="590" x2="590" y1="30" y2={height - 20} stroke="#98a9bf" strokeDasharray="6 7"/><text x="595" y="22" className="svg-caption">FRONTERA (SI EL DESTINO ES EXTRANJERO)</text>{model.countries.map((country, index) => {
                const y = 65 + index * 95;
                const matches = model.findings.filter(item => item.jurisdiction === country);
                const status = getTrafficLight(matches);
                return <g key={country}><g className="journey-edge" tabIndex={0} role="button" aria-label={`${countryLabels[country]} a AndeClass. ${severityLabels[status]}. Ver hallazgos`} onClick={() => choose(`source:${country}`)} onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            choose(`source:${country}`);
                        }
                    }}><path d={`M220 ${y} C300 ${y}, 320 ${center}, 400 ${center}`} stroke="transparent" strokeWidth="22" fill="none"/><path d={`M220 ${y} C300 ${y}, 320 ${center}, 400 ${center}`} stroke={colors[status]} strokeWidth={selected === `source:${country}` ? 5 : 3} fill="none" strokeDasharray={country !== 'PE' ? '8 4' : undefined}/></g><rect x="25" y={y - 28} width="195" height="56" rx="8" fill="#f0f4fa" stroke="#ccd9eb"/><text x="42" y={y - 5} className="svg-title">{countryLabels[country]}</text><text x="42" y={y + 15} className="svg-caption">Titulares · {country !== 'PE' ? 'Cruza frontera' : 'Origen nacional'}</text></g>;
            })}{model.destinations.map((destination, index) => {
                const y = 65 + index * 95;
                const status = getTrafficLight(destination.findings);
                const cross = destination.country !== 'PE' || destination.storageCountry !== 'PE';
                return <g key={destination.id}><g className="journey-edge" tabIndex={0} role="button" aria-label={`AndeClass a ${destination.name}. ${severityLabels[status]}. Ver hallazgos`} onClick={() => choose(destination.id)} onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            choose(destination.id);
                        }
                    }}><path d={`M530 ${center} C610 ${center}, 620 ${y}, 700 ${y}`} stroke="transparent" strokeWidth="24" fill="none"/><path d={`M530 ${center} C610 ${center}, 620 ${y}, 700 ${y}`} stroke={colors[status]} strokeWidth={selected === destination.id ? 5 : 3} fill="none" strokeDasharray={cross ? '8 4' : undefined}/><text x="608" y={y - 18} className="svg-caption">{destination.mechanism === 'clausulas_tipo' ? 'Cláusulas tipo' : destination.mechanism === 'dpf' ? 'DPF' : destination.mechanism === 'otro' ? 'Otro' : 'Ninguno'}</text></g><rect x="700" y={y - 36} width="275" height="76" rx="8" fill="#eef3fb" stroke="#ccd9eb"/><text x="715" y={y - 13} className="svg-title">{destination.name.length > 32 ? destination.name.slice(0, 29) + '…' : destination.name}</text><text x="715" y={y + 6} className="svg-caption">Proveedor: {countryLabels[destination.country]}</text><text x="715" y={y + 24} className="svg-caption">Almacenamiento: {countryLabels[destination.storageCountry]}</text></g>;
            })}<rect x="400" y={center - 42} width="130" height="84" rx="10" fill="#1F3864"/><text x="465" y={center - 6} fill="white" textAnchor="middle" fontSize="18" fontWeight="600">AndeClass</text><text x="465" y={center + 18} fill="#d8e4f4" textAnchor="middle" fontSize="13">Perú · Responsable</text>{!model.countries.length && <text x="30" y="60" className="svg-title">Sin países de titulares registrados</text>}</svg></div>}<div className="card-note">Las líneas de entrada resumen los hallazgos de transferencia de cada origen hacia los destinos. El mecanismo se declara en el proveedor; DPF no acredita certificación.</div><div className="journey-links">{lines.map(line => <button className={`button ${selected === line.id ? 'primary' : 'secondary'}`} key={line.id} onClick={() => choose(line.id)}>{line.label}</button>)}</div>{selected && <div className="journey-details"><h3>{lines.find(line => line.id === selected)?.label || 'Ruta seleccionada'}</h3><FindingList findings={selectedFindings}/></div>}<div className="journey-mechanisms">{model.destinations.map(destination => <p key={destination.id}><strong>{destination.name}:</strong> {mechanismLabels[destination.mechanism as keyof typeof mechanismLabels]} · {destination.country !== 'PE' || destination.storageCountry !== 'PE' ? 'Cruce internacional' : 'Destino nacional'}</p>)}</div></section>;
}
