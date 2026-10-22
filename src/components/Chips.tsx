import { purposeLabels } from '../data/labels';
import type { DataAsset } from '../types';
export function SensitivityChip({ value }: {
    value: DataAsset['sensitivity'];
}) { return <span className={`chip ${value === 'sensible' ? 'sensitive' : 'personal'}`}><span className="dot"/>{value === 'sensible' ? 'Sensible' : 'Personal'}</span>; }
export function PurposeChips({ values }: {
    values: DataAsset['purposes'];
}) { return <div className="chips">{values.map(value => <span key={value} className={`chip purpose-${value}`}>{purposeLabels[value]}</span>)}</div>; }
