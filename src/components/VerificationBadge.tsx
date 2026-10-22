import type { VerificationMetadata } from '../types';
import { sources, verificationLabels } from '../data/sources';
export function VerificationBadge({ verificationStatus, sourceIds }: VerificationMetadata) { return <span className={`chip verification-${verificationStatus}`} title={sourceIds.map(id => sources.find(source => source.id === id)?.title || id).join('; ')}>{verificationLabels[verificationStatus]}</span>; }
