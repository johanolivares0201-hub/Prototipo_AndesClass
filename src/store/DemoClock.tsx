import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEMO_DETECTED_AT } from '../data/incidents';
import { advanceDemoClock } from './clock';
type ClockMode = 'simulated' | 'real';
interface ClockValue {
    now: string;
    mode: ClockMode;
    setMode: (mode: ClockMode) => void;
    advance: (hours: number) => void;
    restart: () => void;
    reset: (detectedAt?: string) => void;
}
const ClockContext = createContext<ClockValue | null>(null);
export function DemoClockProvider({ children }: {
    children: ReactNode;
}) {
    const [mode, setMode] = useState<ClockMode>('simulated');
    const [start, setStart] = useState(DEMO_DETECTED_AT);
    const [simulated, setSimulated] = useState(DEMO_DETECTED_AT);
    const [real, setReal] = useState(() => new Date().toISOString());
    useEffect(() => {
        if (mode !== 'real')
            return;
        const tick = () => setReal(new Date().toISOString());
        tick();
        const timer = window.setInterval(tick, 15000);
        return () => window.clearInterval(timer);
    }, [mode]);
    const reset = useCallback((detectedAt = DEMO_DETECTED_AT) => { setStart(detectedAt); setSimulated(detectedAt); setMode('simulated'); }, []);
    const value = { now: mode === 'simulated' ? simulated : real, mode, setMode, advance: (hours: number) => setSimulated(current => advanceDemoClock(current, hours)), restart: () => setSimulated(start), reset };
    return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}
export function useDemoClock() {
    const clock = useContext(ClockContext);
    if (!clock)
        throw new Error('DemoClockProvider no encontrado');
    return clock;
}
