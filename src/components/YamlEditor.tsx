import { lintGutter, linter, type Diagnostic as CodeMirrorDiagnostic } from '@codemirror/lint';
import { yaml } from '@codemirror/lang-yaml';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import type { Diagnostic } from '../domain/types';

interface YamlEditorProps {
  value: string;
  diagnostics: Diagnostic[];
  onChange: (value: string) => void;
}

export function YamlEditor({ value, diagnostics, onChange }: YamlEditorProps) {
  const extensions = useMemo(
    () => [
      yaml(),
      lintGutter(),
      linter((view) =>
        diagnostics.map<CodeMirrorDiagnostic>((diagnostic) => ({
          from: Math.min(diagnostic.from, view.state.doc.length),
          to: Math.min(Math.max(diagnostic.to, diagnostic.from), view.state.doc.length),
          severity: diagnostic.severity,
          message: `${diagnostic.path}: ${diagnostic.message}`,
        })),
      ),
    ],
    [diagnostics],
  );

  return (
    <section className="editor-pane" aria-label="YAML-Editor">
      <div className="pane-heading">
        <div>
          <span className="eyebrow">Quelle</span>
          <h2>YAML</h2>
        </div>
        <span className="schema-badge">Schema v1</span>
      </div>
      <CodeMirror
        aria-label="Capability Map YAML"
        className="yaml-editor"
        value={value}
        height="100%"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          lineNumbers: true,
        }}
      />
    </section>
  );
}
