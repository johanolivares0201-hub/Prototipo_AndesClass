import { useDemoClock } from '../store/DemoClock';
import { formatLima } from '../store/clock';
export function DemoClockControl() {
    const clock = useDemoClock();
    return <section className="demo-clock" aria-label="Reloj de la demo"><div><strong>Reloj de la demo</strong><p>{formatLima(clock.now)} · {clock.mode === 'simulated' ? 'Simulado' : 'Tiempo real'}</p></div><label>Modo<select value={clock.mode} onChange={event => clock.setMode(event.target.value as typeof clock.mode)}><option value="simulated">Simulado</option><option value="real">Tiempo real</option></select></label>{clock.mode === 'simulated' && <div className="clock-actions">{[1, 6, 24, 48, 72].map(hours => <button className="button secondary" key={hours} onClick={() => clock.advance(hours)}>+{hours} h</button>)}<button className="button subtle" onClick={clock.restart}>Volver al inicio</button></div>}</section>;
}
