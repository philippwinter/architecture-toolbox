import { Filter, RotateCcw } from 'lucide-react';
import type { FilterOption, FilterSelection } from '../domain/types';

interface FilterMenuProps {
  options: FilterOption[];
  selection: FilterSelection;
  onChange: (selection: FilterSelection) => void;
}

export function FilterMenu({ options, selection, onChange }: FilterMenuProps) {
  const activeCount = Object.values(selection).reduce((count, values) => count + values.length, 0);
  const toggle = (field: string, value: string) => {
    const values = selection[field] ?? [];
    const nextValues = values.includes(value)
      ? values.filter((entry) => entry !== value)
      : [...values, value];
    onChange({ ...selection, [field]: nextValues });
  };

  return (
    <details className="filter-menu">
      <summary className={activeCount > 0 ? 'active' : ''}>
        <Filter size={16} /> Filter {activeCount > 0 && <span>{activeCount}</span>}
      </summary>
      <div className="filter-popover">
        <div className="filter-popover__heading">
          <strong>Metadatenfilter</strong>
          {activeCount > 0 && (
            <button type="button" onClick={() => onChange({})}>
              <RotateCcw size={14} /> Zurücksetzen
            </button>
          )}
        </div>
        {options.length === 0 ? (
          <p>Keine filterbaren Werte vorhanden.</p>
        ) : (
          options.map((option) => (
            <fieldset key={option.field}>
              <legend>{option.label}</legend>
              {option.values.map((value) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={(selection[option.field] ?? []).includes(value)}
                    onChange={() => toggle(option.field, value)}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </fieldset>
          ))
        )}
      </div>
    </details>
  );
}
