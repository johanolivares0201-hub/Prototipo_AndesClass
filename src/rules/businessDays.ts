const DAY_MS = 24 * 60 * 60 * 1000;
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;
export function addBusinessDays(detectedAt: string, days: number, holidays: readonly string[] = []): string {
    const detected = Date.parse(detectedAt);
    if (!Number.isFinite(detected) || !Number.isInteger(days) || days < 0)
        throw new Error('Fecha o plazo hábil inválido');
    let local = detected - LIMA_OFFSET_MS;
    let count = 0;
    const excluded = new Set(holidays);
    while (count < days) {
        local += DAY_MS;
        const date = new Date(local);
        const weekday = date.getUTCDay();
        if (weekday !== 0 && weekday !== 6 && !excluded.has(date.toISOString().slice(0, 10)))
            count++;
    }
    // Conservar hora de detección: precisión horaria de diseño, no regla jurídica adicional.
    return new Date(local + LIMA_OFFSET_MS).toISOString();
}
