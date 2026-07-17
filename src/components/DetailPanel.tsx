import { ChevronRight, Layers3, UserRound, X } from 'lucide-react';
import type { MetadataValue, NormalizedCapability } from '../domain/types';
import { CapabilityIcon } from './CapabilityIcon';

interface DetailPanelProps {
  capability: NormalizedCapability;
  collapsed: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
}

function renderMetadataValue(value: MetadataValue): string {
  if (value === null) return '–';
  if (Array.isArray(value)) return value.map(renderMetadataValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function DetailPanel({ capability, collapsed, onClose, onToggle }: DetailPanelProps) {
  return (
    <aside className="detail-panel" aria-label={`Details zu ${capability.name}`}>
      <div className="detail-panel__top">
        <span className="eyebrow">Capability</span>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Details schließen">
          <X size={18} />
        </button>
      </div>
      <div className="detail-title">
        <span className="detail-icon" style={{ background: capability.color }}>
          <CapabilityIcon name={capability.icon} size={22} />
        </span>
        <div>
          <h2>{capability.name}</h2>
          <code>{capability.id}</code>
        </div>
      </div>

      <div className="detail-actions">
        {capability.children.some((child) => child.kind === 'capability') && (
          <button type="button" onClick={() => onToggle(capability.id)}>
            <Layers3 size={15} /> {collapsed ? 'Ausklappen' : 'Einklappen'}
          </button>
        )}
      </div>

      {capability.description && (
        <section>
          <h3>Beschreibung</h3>
          <p>{capability.description}</p>
        </section>
      )}

      {capability.owner && (
        <section>
          <h3>Owner</h3>
          <p className="with-icon">
            <UserRound size={15} /> {capability.owner}
          </p>
        </section>
      )}

      {capability.responsibilities.length > 0 && (
        <section>
          <h3>Verantwortlichkeiten</h3>
          <ul>{capability.responsibilities.map((value) => <li key={value}>{value}</li>)}</ul>
        </section>
      )}

      {capability.tags.length > 0 && (
        <section>
          <h3>Tags</h3>
          <div className="tag-list">{capability.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </section>
      )}

      {Object.keys(capability.metadata).length > 0 && (
        <section>
          <h3>Metadaten</h3>
          <dl className="metadata-list">
            {Object.entries(capability.metadata).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{renderMetadataValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section>
        <h3>Hierarchie</h3>
        <div className="breadcrumb detail-breadcrumb">
          {capability.pathNames.map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 && <ChevronRight size={12} />} {part}
            </span>
          ))}
        </div>
        <p className="hierarchy-count">
          {capability.children.filter((child) => child.kind === 'capability').length} direkte Kinder ·{' '}
          {capability.descendantCount} Nachfahren
        </p>
      </section>

      <section>
        <h3>Visualisierung</h3>
        <dl className="metadata-list compact-list">
          <div><dt>Farbe</dt><dd><span className="color-dot" style={{ background: capability.color }} />{capability.color}</dd></div>
          <div><dt>Icon</dt><dd>{capability.icon ?? 'Standard'}</dd></div>
          <div><dt>Form</dt><dd>{capability.shape}</dd></div>
          <div><dt>Richtung</dt><dd>{capability.layout.direction}</dd></div>
          <div><dt>Layer-Gewicht</dt><dd>{capability.layout.layerWeight ?? 'Automatisch'}</dd></div>
          <div><dt>Track-Gewicht</dt><dd>{capability.layout.trackWeight ?? 'Automatisch'}</dd></div>
        </dl>
      </section>
    </aside>
  );
}
