import { describe, expect, it } from 'vitest';
import { createSeed } from '../data/seed';
import { inventoryReducer } from './reducer';
describe('Inventario en memoria', () => {
    it('agrega un activo sin mutar el estado anterior', () => { const initial = createSeed(); const asset = { ...initial.assets[0], id: 'new', name: 'Nuevo' }; const next = inventoryReducer(initial, { type: 'ADD_ASSET', asset }); expect(next.assets).toHaveLength(8); expect(initial.assets).toHaveLength(7); expect(next.assets.at(-1)?.name).toBe('Nuevo'); });
    it('edita únicamente el activo seleccionado', () => { const initial = createSeed(); const next = inventoryReducer(initial, { type: 'UPDATE_ASSET', asset: { ...initial.assets[0], name: 'Nombre actualizado' } }); expect(next.assets[0].name).toBe('Nombre actualizado'); expect(next.assets[1]).toEqual(initial.assets[1]); });
    it('elimina por id', () => { const next = inventoryReducer(createSeed(), { type: 'DELETE_ASSET', id: 'asset-1' }); expect(next.assets).toHaveLength(6); expect(next.assets.some(asset => asset.id === 'asset-1')).toBe(false); });
    it('impide salud personal tanto al agregar como al editar', () => { const initial = createSeed(); const asset = { ...initial.assets[0], id: 'health', category: 'salud' as const, sensitivity: 'personal' as const }; const next = inventoryReducer(initial, { type: 'ADD_ASSET', asset }); expect(next.assets.at(-1)?.sensitivity).toBe('sensible'); expect(inventoryReducer(initial, { type: 'UPDATE_ASSET', asset: { ...asset, id: 'asset-1' } }).assets[0].sensitivity).toBe('sensible'); });
    it('restablece copias independientes del escenario', () => { const initial = createSeed(); const empty = inventoryReducer(initial, { type: 'DELETE_ASSET', id: 'asset-1' }); const reset = inventoryReducer(empty, { type: 'RESET_DEMO' }); expect(reset.assets).toHaveLength(7); expect(reset.assets).not.toBe(initial.assets); });
});
