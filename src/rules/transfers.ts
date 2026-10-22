import type { AppState, Finding, Jurisdiction } from '../types';
import { evaluateCompliance } from './evaluate';
export interface TransferDestination {
    id: string;
    name: string;
    country: Jurisdiction;
    storageCountry: Jurisdiction;
    mechanism: string;
    assetIds: string[];
    findings: Finding[];
}
export function getTransferModel(state: AppState, assetId = '') {
    const assets = state.assets.filter(asset => !assetId || asset.id === assetId);
    const ids = new Set(assets.map(asset => asset.id));
    const findings = evaluateCompliance(state).filter(item => item.topic === 'transfer' && ids.has(item.assetId));
    const destinations: TransferDestination[] = [];
    for (const asset of assets) {
        const provider = state.providers.find(item => item.id === asset.providerId);
        const id = `${provider?.id || 'unregistered'}:${asset.storageCountry}`;
        let destination = destinations.find(item => item.id === id);
        if (!destination) {
            destination = { id, name: provider?.name || 'Almacenamiento sin proveedor', country: provider?.country || asset.storageCountry, storageCountry: asset.storageCountry, mechanism: provider?.transferMechanism || 'ninguno', assetIds: [], findings: [] };
            destinations.push(destination);
        }
        destination.assetIds.push(asset.id);
    }
    for (const destination of destinations)
        destination.findings = findings.filter(item => destination.assetIds.includes(item.assetId));
    const countries = [...new Set(assets.flatMap(asset => asset.dataSubjectCountries))];
    return { assets, findings, destinations, countries };
}
