export type ExportAction = 'pdf' | 'png' | 'pptx-current' | 'pptx-full' | 'svg';

const EXPORT_ACTION_LABELS: Record<ExportAction, string> = {
  pdf: 'PDF',
  png: 'PNG',
  'pptx-current': 'PPTX – aktuelle Darstellung',
  'pptx-full': 'PPTX – vollständige Map',
  svg: 'SVG',
};

export function exportActionLabel(action: ExportAction): string {
  return EXPORT_ACTION_LABELS[action];
}
