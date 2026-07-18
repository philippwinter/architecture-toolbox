import { ChevronRight, Code2, Layers3, Map, RotateCcw, Search, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  collapsedIdsForProfile,
  mapStructureSignature,
  type ViewProfile,
} from './domain/viewState';
import { buildFilterOptions, computeVisibleTree } from './domain/visibility';
import type { FilterSelection, NormalizedMap } from './domain/types';
import { useCapabilityDocument } from './hooks/useCapabilityDocument';
import { SAMPLE_YAML } from './sample';
import {
  clearCollapsedIds,
  clearCollapsedGroupIds,
  clearViewStateMetadata,
  clearYaml,
  loadCollapsedIds,
  loadCollapsedGroupIds,
  loadViewProfile,
  loadViewSignature,
  loadYaml,
  saveCollapsedIds,
  saveCollapsedGroupIds,
  saveViewProfile,
  saveViewSignature,
  saveYaml,
} from './storage';
import { DetailPanel } from './components/DetailPanel';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { FilterMenu } from './components/FilterMenu';
import { ExportMenu, type ExportFormat } from './components/ExportMenu';
import { downloadBlob, svgBlob } from './export/download';
import { createSvgExport } from './export/exportSvg';

const CapabilityMap = lazy(() =>
  import('./components/CapabilityMap').then((module) => ({ default: module.CapabilityMap })),
);
const YamlEditor = lazy(() =>
  import('./components/YamlEditor').then((module) => ({ default: module.YamlEditor })),
);

interface StoredViewState {
  signature: string;
  profile: ViewProfile;
  collapsedIds: Set<string>;
  collapsedGroupIds: Set<string>;
}

function initialViewState(map: NormalizedMap): StoredViewState {
  const signature = mapStructureSignature(map);
  const storedProfile = loadViewProfile();
  if (loadViewSignature() === signature) {
    return {
      signature,
      profile: storedProfile,
      collapsedIds: loadCollapsedIds(),
      collapsedGroupIds: loadCollapsedGroupIds(),
    };
  }
  return {
    signature,
    profile: 'level-1',
    collapsedIds: collapsedIdsForProfile(map, 'level-1'),
    collapsedGroupIds: new Set(),
  };
}

export default function App() {
  const [source, setSource] = useState(() => loadYaml(SAMPLE_YAML));
  const { result, lastValidMap, isPending, isStale } = useCapabilityDocument(source);
  const [viewState, setViewState] = useState(() => initialViewState(lastValidMap));
  const [selectedId, setSelectedId] = useState<string>();
  const [focusId, setFocusId] = useState<string>();
  const [fitVersion, setFitVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterSelection>({});
  const [tabletView, setTabletView] = useState<'editor' | 'map'>('map');
  const [exportStatus, setExportStatus] = useState<{
    format?: ExportFormat;
    state: 'idle' | 'exporting' | 'done' | 'error';
  }>({ state: 'idle' });
  const diagnostics = result.diagnostics;
  const currentMapSignature = useMemo(() => mapStructureSignature(lastValidMap), [lastValidMap]);

  useEffect(() => saveYaml(source), [source]);

  useEffect(() => {
    if (viewState.signature === currentMapSignature) return;
    const timeout = window.setTimeout(() => setViewState(initialViewState(lastValidMap)), 0);
    return () => window.clearTimeout(timeout);
  }, [currentMapSignature, lastValidMap, viewState.signature]);

  const effectiveCollapsedIds = useMemo(
    () =>
      new Set(
        [...viewState.collapsedIds].filter((id) => lastValidMap.capabilitiesById.has(id)),
      ),
    [lastValidMap, viewState.collapsedIds],
  );
  const effectiveCollapsedGroupIds = useMemo(
    () =>
      new Set(
        [...viewState.collapsedGroupIds].filter((id) => lastValidMap.groupsById.has(id)),
      ),
    [lastValidMap, viewState.collapsedGroupIds],
  );
  const effectiveSelectedId =
    selectedId && lastValidMap.capabilitiesById.has(selectedId) ? selectedId : undefined;
  const effectiveFocusId =
    focusId && lastValidMap.capabilitiesById.has(focusId) ? focusId : undefined;

  useEffect(() => {
    if (viewState.signature !== currentMapSignature) return;
    saveCollapsedIds(effectiveCollapsedIds);
    saveCollapsedGroupIds(effectiveCollapsedGroupIds);
    saveViewProfile(viewState.profile);
    saveViewSignature(currentMapSignature);
  }, [currentMapSignature, effectiveCollapsedGroupIds, effectiveCollapsedIds, viewState]);

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

  const exportMap = useCallback(async (format: ExportFormat) => {
    if (
      isStale &&
      !window.confirm(
        `Die YAML-Datei ist nicht gültig. Die letzte gültige Vorschau als ${format.toUpperCase()} exportieren?`,
      )
    ) {
      return;
    }
    setExportStatus({ state: 'exporting', format });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    try {
      const options = {
        map: lastValidMap,
        roots: visibleTree,
        profile: viewState.profile,
        filters,
        filterOptions,
        search,
        focusPath: focusedCapability?.pathNames,
      };
      if (format === 'svg') {
        const { filename, svg } = createSvgExport(options);
        downloadBlob(filename, svgBlob(svg));
      } else if (format === 'png') {
        const { createPngExport } = await import('./export/png');
        const { blob, filename } = await createPngExport(options);
        downloadBlob(filename, blob);
      } else if (format === 'pdf') {
        const { createPdfExport } = await import('./export/pdf');
        const { blob, filename } = await createPdfExport(options);
        downloadBlob(filename, blob);
      } else {
        const { createPptxExport } = await import('./export/pptx');
        const { blob, filename } = await createPptxExport(options);
        downloadBlob(filename, blob);
      }
      setExportStatus({ state: 'done', format });
    } catch (error) {
      console.error(`${format.toUpperCase()}-Export fehlgeschlagen`, error);
      setExportStatus({ state: 'error', format });
    }
  }, [
    filterOptions,
    filters,
    focusedCapability,
    isStale,
    lastValidMap,
    search,
    viewState.profile,
    visibleTree,
  ]);

  const toggleCollapsed = useCallback((id: string) => {
    setViewState((current) => {
      const next = new Set(current.collapsedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, profile: 'custom', collapsedIds: next };
    });
  }, []);

  const toggleCollapsedGroup = useCallback((id: string) => {
    setViewState((current) => {
      const next = new Set(current.collapsedGroupIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, profile: 'custom', collapsedGroupIds: next };
    });
  }, []);

  const applyViewProfile = useCallback(
    (profile: Exclude<ViewProfile, 'custom'>) => {
      setViewState({
        signature: currentMapSignature,
        profile,
        collapsedIds: collapsedIdsForProfile(
          lastValidMap,
          profile,
        ),
        collapsedGroupIds: new Set(),
      });
    },
    [currentMapSignature, lastValidMap],
  );

  const reset = () => {
    if (!window.confirm('YAML und gespeicherten Ansichtsstatus auf das Startbeispiel zurücksetzen?')) {
      return;
    }
    clearYaml();
    clearCollapsedIds();
    clearCollapsedGroupIds();
    clearViewStateMetadata();
    setSource(SAMPLE_YAML);
    setViewState((current) => ({
      ...current,
      signature: '',
      profile: 'level-1',
      collapsedIds: new Set(),
      collapsedGroupIds: new Set(),
    }));
    setSelectedId(undefined);
    setFocusId(undefined);
    setFitVersion((version) => version + 1);
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
          <label className="view-profile-control" title="Sichtbare Hierarchieebenen wählen">
            <Layers3 size={16} />
            <select
              aria-label="Ansichtstiefe"
              value={viewState.profile}
              onChange={(event) => {
                const profile = event.target.value as ViewProfile;
                if (profile !== 'custom') applyViewProfile(profile);
              }}
            >
              <option value="level-1">Ebene 1</option>
              <option value="level-2">Ebene 2</option>
              <option value="level-3">Ebene 3</option>
              <option value="all">Vollständig</option>
              {viewState.profile === 'custom' && <option value="custom">Individuell</option>}
            </select>
          </label>
          <FilterMenu options={filterOptions} selection={filters} onChange={setFilters} />
          <ExportMenu
            disabled={visibleTree.length === 0}
            busyFormat={exportStatus.state === 'exporting' ? exportStatus.format : undefined}
            onExport={(format) => void exportMap(format)}
          />
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
              {exportStatus.state === 'done' && exportStatus.format && (
                <span className="export-feedback">{exportStatus.format.toUpperCase()} erstellt</span>
              )}
              {exportStatus.state === 'error' && exportStatus.format && (
                <span className="export-feedback error" role="alert">
                  {exportStatus.format.toUpperCase()}-Export fehlgeschlagen
                </span>
              )}
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
                mapKey={currentMapSignature}
                focusId={effectiveFocusId}
                fitVersion={fitVersion}
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
            onToggle={toggleCollapsed}
          />
        )}
      </div>
    </main>
  );
}
