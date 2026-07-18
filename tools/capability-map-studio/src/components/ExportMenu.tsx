import { Download, FileImage, FileText, Image, Presentation } from 'lucide-react';
import { useRef } from 'react';

export type ExportFormat = 'pdf' | 'png' | 'pptx' | 'svg';

interface ExportMenuProps {
  busyFormat?: ExportFormat;
  disabled: boolean;
  onExport: (format: ExportFormat) => void;
}

const OPTIONS: Array<{
  description: string;
  format: ExportFormat;
  icon: typeof Image;
  label: string;
}> = [
  { format: 'svg', label: 'SVG', description: 'Vektor, frei skalierbar', icon: Image },
  { format: 'png', label: 'PNG', description: 'Rastergrafik in 2×', icon: FileImage },
  { format: 'pdf', label: 'PDF', description: 'A3 quer, vektorbasiert', icon: FileText },
  { format: 'pptx', label: 'PPTX', description: '16:9, nativ editierbar', icon: Presentation },
];

export function ExportMenu({ busyFormat, disabled, onExport }: ExportMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return (
    <details className="export-menu" ref={detailsRef}>
      <summary
        aria-label="Exportieren"
        aria-disabled={disabled || Boolean(busyFormat)}
        onClick={(event) => {
          if (disabled || busyFormat) event.preventDefault();
        }}
      >
        <Download size={16} /> {busyFormat ? `${busyFormat.toUpperCase()} …` : 'Export'}
      </summary>
      <div className="export-popover" role="menu" aria-label="Exportformat">
        {OPTIONS.map(({ description, format, icon: Icon, label }) => (
          <button
            type="button"
            role="menuitem"
            key={format}
            aria-label={`Als ${label} exportieren`}
            onClick={() => {
              detailsRef.current?.removeAttribute('open');
              onExport(format);
            }}
          >
            <Icon size={17} />
            <span><strong>{label}</strong><small>{description}</small></span>
          </button>
        ))}
      </div>
    </details>
  );
}
