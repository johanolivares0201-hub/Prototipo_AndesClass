import type { AppState, DataAsset, Provider } from '../types';
import { evaluateCompliance } from './evaluate';
export const createSimulation = (state: AppState): AppState => structuredClone(state);
export function updateSimulation(state: AppState, asset: DataAsset, provider?: Provider): AppState {
    return { ...state, assets: state.assets.map(item => item.id === asset.id ? structuredClone(asset) : item), providers: provider ? state.providers.map(item => item.id === provider.id ? structuredClone(provider) : item) : state.providers };
}
export function compareSimulation(before: AppState, after: AppState) {
    const original = evaluateCompliance(before);
    const simulated = evaluateCompliance(after);
    return { newFindings: simulated.filter(item => !original.some(old => old.id === item.id)), resolvedFindings: original.filter(item => !simulated.some(next => next.id === item.id)) };
}
export function simulationChanges(before: AppState, after: AppState) {
    return { assets: after.assets.filter(item => JSON.stringify(item) !== JSON.stringify(before.assets.find(old => old.id === item.id))), providers: after.providers.filter(item => JSON.stringify(item) !== JSON.stringify(before.providers.find(old => old.id === item.id))) };
}
