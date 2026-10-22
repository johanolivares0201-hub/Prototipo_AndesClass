import { Icon } from './Icon';
export function EmptyState({ phase, icon, description }: {
    phase: string;
    icon: string;
    description: string;
}) { return <div className="empty-state"><div className="empty-icon"><Icon name={icon} size={34}/></div><span className="eyebrow">PRÓXIMA ETAPA</span><h2>Disponible en la Fase {phase}</h2><p>{description}</p><span className="chip neutral">Funcionalidad pendiente</span></div>; }
