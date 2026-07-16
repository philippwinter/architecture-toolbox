import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Diagnostic } from '../domain/types';

interface DiagnosticsPanelProps {
  diagnostics: Diagnostic[];
  isPending: boolean;
}

export function DiagnosticsPanel({ diagnostics, isPending }: DiagnosticsPanelProps) {
  if (isPending) {
    return (
      <div className="diagnostic-summary pending">
        <LoaderCircle size={15} className="spin" /> Wird geprüft …
      </div>
    );
  }

  if (diagnostics.length === 0) {
    return (
      <div className="diagnostic-summary valid">
        <CheckCircle2 size={15} /> Dokument ist gültig
      </div>
    );
  }

  return (
    <details className="diagnostics" open>
      <summary>
        <AlertCircle size={15} /> {diagnostics.length}{' '}
        {diagnostics.length === 1 ? 'Problem' : 'Probleme'}
      </summary>
      <ul>
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.from}-${diagnostic.path}-${index}`}>
            <strong>
              Zeile {diagnostic.line ?? 1}, Spalte {diagnostic.column ?? 1}
            </strong>
            <code>{diagnostic.path}</code>
            <span>{diagnostic.message}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
