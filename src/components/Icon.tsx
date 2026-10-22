export function Icon({ name, size = 20 }: {
    name: string;
    size?: number;
}) {
    const paths: Record<string, string> = { dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', inventory: 'M4 4h16v16H4z M4 9h16 M9 9v11', matrix: 'M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5', transfer: 'M3 7h17 M16 3l4 4-4 4 M21 17H4 M8 13l-4 4 4 4', consent: 'M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7z M8 12l3 3 5-6', incident: 'M12 3L2 21h20z M12 9v5 M12 17v1', report: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6', plus: 'M12 5v14 M5 12h14', search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6', edit: 'M14 4l6 6 M4 20l4-1L21 6l-4-4L4 15z', trash: 'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7', arrow: 'M5 12h14 M14 7l5 5-5 5', users: 'M8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M2 21v-3a6 6 0 0 1 12 0v3 M16 4a4 4 0 0 1 0 8 M17 15a5 5 0 0 1 5 5', globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M2 12h20 M12 2c-6 5-6 15 0 20 M12 2c6 5 6 15 0 20' };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.inventory}/></svg>;
}
