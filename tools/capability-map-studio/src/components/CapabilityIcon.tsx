import { createElement } from 'react';
import type { LucideProps } from 'lucide-react';
import { getCapabilityIcon } from '../domain/icons';

interface CapabilityIconProps extends LucideProps {
  name?: string;
}

export function CapabilityIcon({ name, ...props }: CapabilityIconProps) {
  return createElement(getCapabilityIcon(name), props);
}
