import { useState } from 'react';
import type { Relationship } from '../types';

type Props = {
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  relationship?: Partial<Relationship>;
  projectId: string;
  onSave: (data: Omit<Relationship, 'id' | 'created_at'>) => void;
  onClose: () => void;
};

const RELATIONSHIP_TYPES = [
  { value: 'unknown', label: 'Desconocida', color: '#9ca3af', emoji: '❓' },
  { value: 'family', label: 'Familiar', color: '#10b981', emoji: '👨‍👩‍👧' },
  { value: 'professional', label: 'Profesional', color: '#3b82f6', emoji: '💼' },
  { value: 'enemy', label: 'Enemigos', color: '#ef4444', emoji: '⚔️' },
  { value: 'love', label: 'Amorosa', color: '#ec4899', emoji: '❤️' },
  { value: 'secret', label: 'Secreta', color: '#8b5cf6', emoji: '🤫' },
];

export default function RelationshipForm({
  sourceId, targetId, sourceLabel, targetLabel,
  relationship, projectId, onSave, onClose
}: Props) {
  const [type, setType] = useState(relationship?.type ?? 'unknown');
  const [label, setLabel] = useState(relationship?.label ?? '');
  const [intensity, setIntensity] = useState(relationship?.intensity ?? 2);
  const [bidirectional, setBidirectional] = useState(relationship?.bidirectional ?? true);
  const [status, setStatus] = useState(relationship?.status ?? 'active');

  const selectedType = RELATIONSHIP_TYPES.find(t => t.value === type) ?? RELATIONSHIP_TYPES[0];

  const handleSave = () => {
    onSave({
      project_id: projectId,
      source_id: sourceId,
      target_id: targetId,
      type,
      label: label.trim() || undefined,
      intensity,
      bidirectional,
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">🧵 Definir Relación</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl cursor-pointer">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Connection preview */}
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-3">
            <span className="text-sm font-semibold text-blue-400 truncate max-w-[100px]">{sourceLabel}</span>
            <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: selectedType.color }} />
            <span className="text-base flex-shrink-0">{selectedType.emoji}</span>
            <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: selectedType.color }} />
            <span className="text-sm font-semibold text-blue-400 truncate max-w-[100px]">{targetLabel}</span>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Tipo de Relación</label>
            <div className="grid grid-cols-3 gap-2">
              {RELATIONSHIP_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    type === t.value ? 'bg-zinc-700' : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
                  style={{ borderColor: type === t.value ? t.color : undefined, borderWidth: type === t.value ? 2 : 1 }}
                >
                  <span className="text-xl mb-1">{t.emoji}</span>
                  <span className="text-zinc-300">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
              Intensidad: <span className="text-white font-bold">{intensity}</span>/5
            </label>
            <div className="flex items-center gap-3">
              <span className="text-zinc-600 text-xs">Débil</span>
              <input
                type="range"
                min={1} max={5}
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-zinc-600 text-xs">Fuerte</span>
            </div>
          </div>

          {/* Label / Note */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Nota en el hilo (opcional)</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Ej: Le debe dinero, Traición 2019..."
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          {/* Status + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Estado</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer"
              >
                <option value="active">✅ Activa</option>
                <option value="broken">💔 Rota</option>
                <option value="hidden">🕵️ Oculta</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Dirección</label>
              <button
                onClick={() => setBidirectional(b => !b)}
                className={`w-full py-2 px-3 rounded-lg text-sm border transition-colors cursor-pointer ${
                  bidirectional
                    ? 'bg-blue-900/40 border-blue-700 text-blue-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {bidirectional ? '↔️ Bidireccional' : '→ Unilateral'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-zinc-800">
          <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
            {relationship ? 'Guardar Cambios' : 'Crear Relación'}
          </button>
        </div>
      </div>
    </div>
  );
}
