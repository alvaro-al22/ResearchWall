import { useState } from 'react';
import type { Character } from '../types';

type Props = {
  character?: Partial<Character>;
  projectId: string;
  onSave: (data: Omit<Character, 'id' | 'created_at'>) => void;
  onDelete?: () => void;
  onClose: () => void;
};

type Tab = 'Básico' | 'Psicología' | 'Contexto' | 'Profesional' | 'Físico' | 'Notas';
const TABS: Tab[] = ['Básico', 'Psicología', 'Contexto', 'Profesional', 'Físico', 'Notas'];

const STATUS_OPTIONS = [
  { value: 'alive', label: '🟢 Vivo' },
  { value: 'dead', label: '💀 Muerto' },
  { value: 'missing', label: '❓ Desaparecido' },
  { value: 'unknown', label: '⬜ Desconocido' },
];

const PRESET_COLORS = [
  '#1e3a5f', '#1a1c2e', '#1a2e1e', '#2e1a1a', '#2e2a1a',
  '#2a1a2e', '#1a2e2e', '#3b1a1a', '#1a3b3b', '#2d2d1a',
];

type FormData = Omit<Character, 'id' | 'created_at'>;

export default function CharacterForm({ character, projectId, onSave, onDelete, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('Básico');
  const [form, setForm] = useState<FormData>({
    project_id: projectId,
    name: character?.name ?? '',
    alias: character?.alias ?? '',
    age: character?.age,
    birthplace: character?.birthplace ?? '',
    nationality: character?.nationality ?? '',
    status: character?.status ?? 'alive',
    personality: character?.personality ?? '',
    fears: character?.fears ?? '',
    motivations: character?.motivations ?? '',
    objectives: character?.objectives ?? '',
    secrets: character?.secrets ?? '',
    residence: character?.residence ?? '',
    social_class: character?.social_class ?? '',
    family: character?.family ?? '',
    profession: character?.profession ?? '',
    studies: character?.studies ?? '',
    current_job: character?.current_job ?? '',
    relevant_experience: character?.relevant_experience ?? '',
    height: character?.height ?? '',
    build_type: character?.build_type ?? '',
    distinctive_features: character?.distinctive_features ?? '',
    avatar: character?.avatar ?? '',
    color: character?.color ?? '#1e3a5f',
    role: character?.role ?? '',
    position_x: character?.position_x ?? 0,
    position_y: character?.position_y ?? 0,
    notes: character?.notes ?? '',
  });

  const set = (field: keyof FormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  // Cast form to access string fields dynamically in tabs
  const f = form as unknown as Record<string, string>;

  const textareaField = (key: keyof FormData, label: string, rows = 2) => (
    <div key={key}>
      <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <textarea
        value={f[key] || ''}
        onChange={e => set(key, e.target.value)}
        rows={rows}
        className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
      />
    </div>
  );

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  const isEditing = !!character?.name;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">
            {isEditing ? `✏️ ${character.name}` : '➕ Nuevo Personaje'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-6 pt-3 overflow-x-auto border-b border-zinc-800">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md whitespace-nowrap transition-colors cursor-pointer ${
                tab === t
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'Básico' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Alias / Apodo</label>
                  <input
                    value={form.alias ?? ''}
                    onChange={e => set('alias', e.target.value)}
                    placeholder="Alias"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Rol</label>
                  <input
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    placeholder="Detective, Villano, Civil..."
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Edad</label>
                  <input
                    type="number"
                    value={form.age ?? ''}
                    onChange={e => set('age', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="30"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Estado</label>
                  <select
                    value={form.status ?? 'alive'}
                    onChange={e => set('status', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Nacionalidad</label>
                  <input
                    value={form.nationality ?? ''}
                    onChange={e => set('nationality', e.target.value)}
                    placeholder="Española..."
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Color de la ficha</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => set('color', c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                        form.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => set('color', e.target.value)}
                    className="w-7 h-7 rounded-full border-2 border-zinc-600 bg-transparent cursor-pointer"
                    title="Color personalizado"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'Psicología' && (
            <div className="flex flex-col gap-4">
              {textareaField('personality', 'Personalidad')}
              {textareaField('fears', 'Miedos')}
              {textareaField('motivations', 'Motivaciones')}
              {textareaField('objectives', 'Objetivos')}
              {textareaField('secrets', '🤫 Secretos')}
            </div>
          )}

          {tab === 'Contexto' && (
            <div className="flex flex-col gap-4">
              {textareaField('birthplace', 'Lugar de nacimiento')}
              {textareaField('residence', 'Residencia actual')}
              {textareaField('social_class', 'Clase social')}
              {textareaField('family', 'Familia')}
            </div>
          )}

          {tab === 'Profesional' && (
            <div className="flex flex-col gap-4">
              {textareaField('profession', 'Profesión')}
              {textareaField('studies', 'Estudios')}
              {textareaField('current_job', 'Trabajo actual')}
              {textareaField('relevant_experience', 'Experiencia relevante', 3)}
            </div>
          )}

          {tab === 'Físico' && (
            <div className="flex flex-col gap-4">
              {textareaField('height', 'Altura')}
              {textareaField('build_type', 'Complexión')}
              {textareaField('distinctive_features', 'Rasgos distintivos', 3)}
            </div>
          )}

          {tab === 'Notas' && (
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Notas libres</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
                rows={12}
                placeholder="Cualquier dato, ideas, timeline personal..."
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <div>
            {isEditing && onDelete && (
              <button
                onClick={() => { if (confirm(`¿Eliminar a ${character.name}?`)) onDelete(); }}
                className="text-red-500 hover:text-red-400 text-sm transition-colors cursor-pointer"
              >
                🗑️ Eliminar personaje
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Personaje'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
