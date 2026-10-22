export const HOUR_MS = 60 * 60 * 1000;
export function advanceDemoClock(now: string, hours: number): string { return new Date(Date.parse(now) + hours * HOUR_MS).toISOString(); }
export function formatLima(iso: string): string {
    if (!Number.isFinite(Date.parse(iso)))
        return iso || 'Sin fecha';
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(iso)) + ' (Lima)';
}
