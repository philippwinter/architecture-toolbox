import { ChevronRight, Code2, Map, RotateCcw, Search, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { buildFilterOptions, computeVisibleTree } from './domain/visibility';
import type { FilterSelection } from './domain/types';
import { useCapabilityDocument } from './hooks/useCapabilityDocument';
import { SAMPLE_YAML } from './sample';
import {
  clearCollapsedIds,
  clearCollapsedGroupIds,
  clearYaml,
  loadCollapsedIds,
  loadCollapsedGroupIds,
  loadYaml,
  saveCollapsedIds,
  saveCollapsedGroupIds,
  saveYaml,
} from './storage';
import { DetailPanel } from './components/DetailPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { FilterMenu } from './components/FilterMenu';

const CapabilityMap = lazy(() =>
  import('./components/CapabilityMap').then((module) => ({ default: module.CapabilityMap })),
);
const YamlEditor = lazy(() =>
  import('./components/YamlEditor').then((module) => ({ default: module.YamlEditor })),
);

export default function App() {
  const [source, setSource] = useState(() => loadYaml(SAMPLE_YAML));
  const [collapsedIds, setCollapsedIds] = useState(loadCollapsedIds);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState(loadCollapsedGroupIds);
  const [selectedId, setSelectedId] = useState<string>();
  const [focusId, setFocusId] = useState<string>();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterSelection>({});
  const [tabletView, setTabletView] = useState<'editor' | 'map'>('map');
  const { result, lastValidMap, isPending, isStale } = useCapabilityDocument(source);
  const diagnostics = result.diagnostics;

  useEffect(() => saveYaml(source), [source]);
  const effectiveCollapsedIds = useMemo(
    () => new Set([...collapsedIds].filter((id) => lastValidMap.capabilitiesById.has(id))),
    [collapsedIds, lastValidMap],
  );
  const effectiveCollapsedGroupIds = useMemo(
    () => new Set([...collapsedGroupIds].filter((id) => lastValidMap.groupsById.has(id))),
    [collapsedGroupIds, lastValidMap],
  );
  const effectiveSelectedId =
    selectedId && lastValidMap.capabilitiesById.has(selectedId) ? selectedId : undefined;
  const effectiveFocusId =
    focusId && lastValidMap.capabilitiesById.has(focusId) ? focusId : undefined;

  useEffect(() => saveCollapsedIds(effectiveCollapsedIds), [effectiveCollapsedIds]);
  useEffect(
    () => saveCollapsedGroupIds(effectiveCollapsedGroupIds),
    [effectiveCollapsedGroupIds],
  );

  const filterOptions = useMemo(() => buildFilterOptions(lastValidMap), [lastValidMap]);
  const visibleTree = useMemo(
    () =>
      computeVisibleTree(lastValidMap, {
        search,
        filters,
        collapsedIds: effectiveCollapsedIds,
        collapsedGroupIds: effectiveCollapsedGroupIds,
        focusId: effectiveFocusId,
      }),
    [
      effectiveCollapsedGroupIds,
      effectiveCollapsedIds,
      effectiveFocusId,
      filters,
      lastValidMap,
      search,
    ],
  );
  const selectedCapability = effectiveSelectedId
    ? lastValidMap.capabilitiesById.get(effectiveSelectedId)
    : undefined;
  const focusedCapability = effectiveFocusId
    ? lastValidMap.capabilitiesById.get(effectiveFocusId)
    : undefined;

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCollapsedGroup = useCallback((id: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = () => {
    if (!window.confirm('YAML und gespeicherten Ansichtsstatus auf das Startbeispiel zurücksetzen?')) {
      return;
    }
    clearYaml();
    clearCollapsedIds();
    clearCollapsedGroupIds();
    setSource(SAMPLE_YAML);
    setCollapsedIds(new Set());
    setCollapsedGroupIds(new Set());
    setSelectedId(undefined);
    setFocusId(undefined);
    setSearch('');
    setFilters({});
  };

  const focusCapability = useCallback((id: string) => {
    setFocusId(id);
    setSelectedId(id);
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark"><Map size={20} /></span>
          <div>
            <span className="eyebrow">Architecture workspace</span>
            <h1>Capability Map Studio</h1>
          </div>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              type="search"
              placeholder="Capabilities durchsuchen"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Suche löschen">
                <X size={14} />
              </button>
            )}
          </label>
          <FilterMenu options={filterOptions} selection={filters} onChange={setFilters} />
          <button type="button" className="toolbar-button" onClick={reset}>
            <RotateCcw size={16} /> Beispiel
          </button>
        </div>

        <div className="document-status">
          <span className={`status-dot ${isStale ? 'stale' : 'current'}`} />
          {isPending ? 'Prüfung läuft' : isStale ? 'Vorschau nicht aktuell' : 'Vorschau aktuell'}
        </div>
      </header>

      <nav className="tablet-tabs" aria-label="Ansicht umschalten">
        <button
          type="button"
          className={tabletView === 'editor' ? 'active' : ''}
          onClick={() => setTabletView('editor')}
        >
          <Code2 size={15} /> YAML
        </button>
        <button
          type="button"
          className={tabletView === 'map' ? 'active' : ''}
          onClick={() => setTabletView('map')}
        >
          <Map size={15} /> Map
        </button>
      </nav>

      <div className={`workspace tablet-${tabletView}`}>
        <div className="editor-column">
          <Suspense fallback={<div className="panel-loading">Editor wird geladen …</div>}>
            <YamlEditor value={source} diagnostics={diagnostics} onChange={setSource} />
          </Suspense>
          <DiagnosticsPanel diagnostics={diagnostics} isPending={isPending} />
        </div>

        <section className="map-pane" aria-label="Capability Map">
          <div className="map-heading">
            <div>
              <span className="eyebrow">Live-Vorschau</span>
              <h2>{lastValidMap.name}</h2>
            </div>
            <div className="map-meta">
              <span>{lastValidMap.capabilitiesById.size} Capabilities</span>
              {isStale && <span className="stale-badge">Nicht aktuell</span>}
            </div>
          </div>

          {focusedCapability && (
            <div className="focus-breadcrumb">
              <button type="button" onClick={() => setFocusId(undefined)}>{lastValidMap.name}</button>
              {focusedCapability.pathNames.map((name, index) => {
                const id = focusedCapability.path[index];
                return (
                  <span key={id}>
                    <ChevronRight size={13} />
                    <button type="button" onClick={() => setFocusId(id)}>{name}</button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="map-canvas">
            <Suspense fallback={<div className="panel-loading">Map wird geladen …</div>}>
              <CapabilityMap
              roots={visibleTree}
              collapsedIds={effectiveCollapsedIds}
                selectedId={effectiveSelectedId}
                onSelect={setSelectedId}
              onToggle={toggleCollapsed}
              onToggleGroup={toggleCollapsedGroup}
                onFocus={focusCapability}
              />
            </Suspense>
          </div>
        </section>

        {selectedCapability && (
          <DetailPanel
            capability={selectedCapability}
            collapsed={effectiveCollapsedIds.has(selectedCapability.id)}
            onClose={() => setSelectedId(undefined)}
            onFocus={focusCapability}
            onToggle={toggleCollapsed}
          />
        )}
      </div>
    </main>
  );
}
