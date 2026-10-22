import { createContext, useCallback, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { createSeed } from '../data/seed';
import { inventoryReducer, type Action } from './reducer';
import { useDemoClock } from './DemoClock';
const StoreContext = createContext<{
    state: AppState;
    dispatch: Dispatch<Action>;
} | null>(null);
export function StoreProvider({ children }: {
    children: ReactNode;
}) {
    const [state, rawDispatch] = useReducer(inventoryReducer, undefined, createSeed);
    // La hora se captura fuera del reducer: evaluación y reducer siguen siendo puros.
    const clock = useDemoClock();
    const dispatch = useCallback((action: Action) => {
        rawDispatch({ ...action, meta: { timestamp: clock.now, id: crypto.randomUUID() } });
        if (['LOAD_SCENARIO', 'LOAD_CORRECTED', 'LOAD_INCIDENT', 'RESET_DEMO'].includes(action.type))
            clock.reset();
        if (action.type === 'UPDATE_INCIDENT' && action.incident.detectedAt !== state.incidents.find(item => item.id === action.incident.id)?.detectedAt)
            clock.reset(action.incident.detectedAt);
    }, [clock, state.incidents]);
    return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}
export function useStore() {
    const store = useContext(StoreContext);
    if (!store)
        throw new Error('StoreProvider no encontrado');
    return store;
}
