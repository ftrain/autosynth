import { FC } from 'react';

interface DualModeOscillatorProps {
  paramValues: Record<string, number>;
  onChange: (paramId: string, value: number) => void;
  prefix?: string;
  label?: string;
}

export const DualModeOscillator: FC<DualModeOscillatorProps>;
export default DualModeOscillator;
