import { useEffect, useState } from 'react';
import { parseCapabilityDocument } from '../domain/parser';
import type { DocumentResult, NormalizedMap } from '../domain/types';
import { SAMPLE_YAML } from '../sample';

const sampleResult = parseCapabilityDocument(SAMPLE_YAML);
if (!sampleResult.ok) throw new Error('Das eingebaute Beispieldokument ist ungültig.');
const sampleMap = sampleResult.value;

export function useCapabilityDocument(source: string): {
  result: DocumentResult;
  lastValidMap: NormalizedMap;
  isPending: boolean;
  isStale: boolean;
} {
  const [state, setState] = useState<{
    parsedSource: string;
    result: DocumentResult;
    lastValidMap: NormalizedMap;
  }>(() => {
    const initialResult = parseCapabilityDocument(source);
    return {
      parsedSource: source,
      result: initialResult,
      lastValidMap: initialResult.ok ? initialResult.value : sampleMap,
    };
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextResult = parseCapabilityDocument(source);
      setState((current) => ({
        parsedSource: source,
        result: nextResult,
        lastValidMap: nextResult.ok ? nextResult.value : current.lastValidMap,
      }));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [source]);

  const isPending = state.parsedSource !== source;

  return {
    result: state.result,
    lastValidMap: state.lastValidMap,
    isPending,
    isStale: isPending || !state.result.ok,
  };
}
