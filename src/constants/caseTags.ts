export const CASE_TAGS = [
  { label: 'Agente de Ley', color: '#3b82f6' },
  { label: 'Sospechoso',    color: '#ef4444' },
  { label: 'Víctima',       color: '#8b5cf6' },
  { label: 'Testigo',       color: '#f59e0b' },
  { label: 'Cómplice',      color: '#dc2626' },
  { label: 'Informante',    color: '#10b981' },
  { label: 'Prófugo',       color: '#f97316' },
  { label: 'Civil',         color: '#6b7280' },
];

export const TAG_COLOR: Record<string, string> = Object.fromEntries(
  CASE_TAGS.map(t => [t.label, t.color]),
);
