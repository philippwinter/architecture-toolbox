import { Download, FileImage, FileText, Image, Presentation } from 'lucide-react';
import { useRef } from 'react';
import { exportActionLabel, type ExportAction } from '../export/actions';

interface ExportMenuProps {
  busyAction?: ExportAction;
  currentDisabled: boolean;
  disabled: boolean;
  onExport: (action: ExportAction) => void;
}

const OPTIONS: Array<{
  description: string;
  action: ExportAction;
  icon: typeof Image;
  label: string;
}> = [
  { action: 'svg', label: 'SVG', description: 'Vektor, frei skalierbar', icon: Image },
  { action: 'png', label: 'PNG', description: 'Rastergrafik in 2×', icon: FileImage },
  { action: 'pdf', label: 'PDF', description: 'A3 quer, vektorbasiert', icon: FileText },
  { action: 'pptx-current', label: 'PPTX – aktuelle Darstellung', description: 'Eine Folie, aktueller UI-Zustand', icon: Presentation },
  { action: 'pptx-full', label: 'PPTX – vollständige Map', description: 'Hierarchisches Mehrfolien-Deck', icon: Presentation },
];

export function ExportMenu({
  busyAction,
  currentDisabled,
  disabled,
  onExport,
}: ExportMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return (
    <details className="export-menu" ref={detailsRef}>
      <summary
        aria-label="Exportieren"
        aria-disabled={disabled || Boolean(busyAction)}
        onClick={(event) => {
          if (disabled || busyAction) event.preventDefault();
        }}
      >
        <Download size={16} /> {busyAction ? `${exportActionLabel(busyAction)} …` : 'Export'}
      </summary>
      <div className="export-popover" role="menu" aria-label="Exportformat">
        {OPTIONS.map(({ action, description, icon: Icon, label }) => {
          const optionDisabled = disabled || (action !== 'pptx-full' && currentDisabled);
          return (
            <button
              type="button"
              role="menuitem"
              key={action}
              disabled={optionDisabled}
              aria-label={`Als ${label} exportieren`}
              onClick={() => {
                detailsRef.current?.removeAttribute('open');
                onExport(action);
              }}
            >
              <Icon size={17} />
              <span><strong>{label}</strong><small>{description}</small></span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
