import { useMemo } from 'react';
import { useStore } from '../store/Store';
import { getComplianceSummary } from './evaluate';
import { useDemoClock } from '../store/DemoClock';
export function useCompliance() { const { state } = useStore(); const { now } = useDemoClock(); return useMemo(() => getComplianceSummary(state, now), [state, now]); }
