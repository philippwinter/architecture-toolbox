import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from '../domain/parser';
import { DetailPanel } from './DetailPanel';

const parsed = parseCapabilityDocument(SAMPLE_YAML);
if (!parsed.ok) throw new Error('Sample document must be valid.');
const customer = parsed.value.capabilitiesById.get('customer');
if (!customer) throw new Error('Customer capability missing.');

describe('DetailPanel', () => {
  it('renders capability details and exposes collapse without a focus action', () => {
    const onClose = vi.fn();
    const onToggle = vi.fn();

    render(
      <DetailPanel
        capability={customer}
        collapsed={false}
        onClose={onClose}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Customer' })).toBeInTheDocument();
    expect(screen.getByText('Risk')).toBeInTheDocument();
    expect(screen.getByText('9 direkte Kinder · 9 Nachfahren')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fokussieren' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Einklappen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Details schließen' }));

    expect(onToggle).toHaveBeenCalledWith('customer');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
