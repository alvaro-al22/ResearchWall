import { useState, useRef, useEffect, useCallback } from 'react';
import type { Project, Character, Relationship } from '../types';
import {
  streamWatson,
  buildSystemPrompt,
  parseSuggestion,
} from '../lib/watson';
import type { ChatMessage, WatsonSuggestion, WatsonUpdate, WatsonRelationshipCreate, WatsonProjectUpdate } from '../lib/watson';

// ── Field label map ────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre', alias: 'Alias', age: 'Edad', birthplace: 'Lugar de nacimiento',
  nationality: 'Nacionalidad', status: 'Estado vital', personality: 'Personalidad',
  fears: 'Miedos', motivations: 'Motivaciones', objectives: 'Objetivos',
  secrets: 'Secretos', residence: 'Residencia', social_class: 'Clase social',
  family: 'Familia', profession: 'Profesión', studies: 'Estudios',
  current_job: 'Trabajo actual', relevant_experience: 'Experiencia/Antecedentes',
  height: 'Altura', build_type: 'Complexión', distinctive_features: 'Rasgos físicos',
  notes: 'Notas', tags: 'Etiquetas', role: 'Rol', color: 'Color',
};

const REL_TYPE_LABEL: Record<string, string> = {
  family: '👨‍👩‍👧 Familia', professional: '💼 Profesional',
  enemy: '⚔️ Enemigos', love: '❤️ Amor',
  secret: '🤫 Secreto', unknown: '❓ Desconocido',
};

// ── Confirmation UI ────────────────────────────────────────────
function ConfirmDialog({
  suggestion,
  characters,
  onConfirm,
  onDismiss,
}: {
  suggestion: WatsonSuggestion;
  characters: Character[];
  onConfirm: (upd: WatsonUpdate[], rels: WatsonRelationshipCreate[], proj?: WatsonProjectUpdate) => void;
  onDismiss: () => void;
}) {
  const hasUpdates = suggestion.updates.length > 0;
  const hasRels    = (suggestion.newRelationships?.length ?? 0) > 0;
  const hasProject = !!(suggestion.projectUpdate?.story || suggestion.projectUpdate?.description);

  const [selectedChars, setSelectedChars] = useState<Set<number>>(
    new Set(suggestion.updates.map((_, i) => i)),
  );
  const [selectedRels, setSelectedRels] = useState<Set<number>>(
    new Set((suggestion.newRelationships ?? []).map((_, i) => i)),
  );
  const [includeProject, setIncludeProject] = useState(hasProject);

  function toggleChar(i: number) {
    setSelectedChars(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  }
  function toggleRel(i: number) {
    setSelectedRels(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  }

  function handleConfirm() {
    onConfirm(
      suggestion.updates.filter((_, i) => selectedChars.has(i)),
      (suggestion.newRelationships ?? []).filter((_, i) => selectedRels.has(i)),
      includeProject ? suggestion.projectUpdate : undefined,
    );
  }

  const totalSelected = selectedChars.size + selectedRels.size + (includeProject ? 1 : 0);

  return (
    <div className="mx-3 my-2 bg-zinc-900 border border-amber-600/50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/30 border-b border-amber-700/40">
        <span className="text-amber-400 text-sm">🔍</span>
        <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Watson propone cambios</span>
      </div>

      <div className="p-3 flex flex-col gap-3 max-h-72 overflow-y-auto">

        {/* Character updates */}
        {hasUpdates && (
          <>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Actualizar fichas</p>
            {suggestion.updates.map((upd, i) => {
              const existing   = characters.find(c => c.id === upd.characterId);
              const isSelected = selectedChars.has(i);
              return (
                <div key={i} onClick={() => toggleChar(i)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500/60 bg-blue-900/20' : 'border-zinc-700 bg-zinc-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{upd.characterName}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                      isSelected ? 'bg-blue-500 border-blue-400 text-white' : 'border-zinc-600'
                    }`}>{isSelected && '✓'}</div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(upd.changes).map(([field, newVal]) => {
                      const existing_val = existing?.[field as keyof Character];
                      const hasExisting  = existing_val !== undefined && existing_val !== '' && existing_val !== null;
                      const label        = FIELD_LABELS[field] ?? field;
                      const displayNew   = Array.isArray(newVal) ? (newVal as string[]).join(', ') : String(newVal ?? '');
                      const displayOld   = Array.isArray(existing_val) ? (existing_val as string[]).join(', ') : String(existing_val ?? '');
                      return (
                        <div key={field} className="text-xs">
                          <span className="text-zinc-500 font-semibold">{label}: </span>
                          {hasExisting && <span className="text-red-400/80 line-through mr-1">{displayOld}</span>}
                          <span className="text-green-400">{displayNew}</span>
                          {hasExisting && <span className="ml-1 text-amber-400 text-[10px]">⚠️</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* New relationships */}
        {hasRels && (
          <>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide mt-1">Crear relaciones</p>
            {(suggestion.newRelationships ?? []).map((rel, i) => {
              const isSelected = selectedRels.has(i);
              const dots = Array.from({ length: 5 }, (_, j) => j < rel.intensity ? '●' : '○').join(' ');
              return (
                <div key={i} onClick={() => toggleRel(i)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSelected ? 'border-purple-500/60 bg-purple-900/20' : 'border-zinc-700 bg-zinc-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">
                      {rel.sourceCharacterName} → {rel.targetCharacterName}
                      {rel.bidirectional ? ' ↔' : ''}
                    </span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                      isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-zinc-600'
                    }`}>{isSelected && '✓'}</div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-purple-400 font-semibold">{REL_TYPE_LABEL[rel.type] ?? rel.type}</span>
                    {rel.label && <span className="text-zinc-400 italic">"{rel.label}"</span>}
                    <span className="text-zinc-600 text-[10px] tracking-widest">{dots}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {/* Project update */}
        {hasProject && (
          <>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide mt-1">Expediente del caso</p>
            <div onClick={() => setIncludeProject(p => !p)}
              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                includeProject ? 'border-green-500/60 bg-green-900/20' : 'border-zinc-700 bg-zinc-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white">📖 {suggestion.projectUpdate?.story ? 'Actualizar historia' : 'Actualizar descripción'}</span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                  includeProject ? 'bg-green-500 border-green-400 text-white' : 'border-zinc-600'
                }`}>{includeProject && '✓'}</div>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                {suggestion.projectUpdate?.description && (
                  <div><span className="text-zinc-500 font-semibold">Descripción: </span><span className="text-green-400">{suggestion.projectUpdate.description}</span></div>
                )}
                {suggestion.projectUpdate?.story && (
                  <p className="text-green-400/80 italic line-clamp-3">{suggestion.projectUpdate.story}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 p-3 border-t border-zinc-800">
        <button onClick={handleConfirm} disabled={totalSelected === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer">
          Aplicar seleccionadas
        </button>
        <button onClick={onDismiss}
          className="bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors cursor-pointer">
          Descartar
        </button>
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────
type MsgEntry =
  | { kind: 'user';      text: string }
  | { kind: 'assistant'; text: string; suggestion?: WatsonSuggestion | null }
  | { kind: 'streaming'; text: string }
  | { kind: 'error';     text: string }
  | { kind: 'applied';   text: string };

// ── Main panel ─────────────────────────────────────────────────
type Props = {
  project: Project;
  characters: Character[];
  relationships: Relationship[];
  onApplyUpdates: (updates: WatsonUpdate[], newRels: WatsonRelationshipCreate[], projectUpdate?: WatsonProjectUpdate) => Promise<void>;
};

export default function WatsonPanel({ project, characters, relationships, onApplyUpdates }: Props) {
  const [open,       setOpen]       = useState(false);
  const [messages,   setMessages]   = useState<MsgEntry[]>([]);
  const [input,      setInput]      = useState('');
  const [streaming,  setStreaming]   = useState(false);
  const [dismissed,  setDismissed]  = useState<Set<number>>(new Set());
  const bottomRef   = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const apiKeyMissing = !import.meta.env.VITE_DEEPSEEK_API_KEY;

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userEntry: MsgEntry = { kind: 'user', text };
    setMessages(prev => [...prev, userEntry]);

    // Build history for API
    const history: ChatMessage[] = messages
      .filter((m): m is Extract<MsgEntry, { kind: 'user' | 'assistant' }> =>
        m.kind === 'user' || m.kind === 'assistant')
      .map(m => ({ role: m.kind as 'user' | 'assistant', content: m.text }));

    history.push({ role: 'user', content: text });

    const systemPrompt = buildSystemPrompt(project, characters, relationships);
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    setStreaming(true);
    abortRef.current = new AbortController();
    let accumulated = '';

    // Add streaming placeholder
    setMessages(prev => [...prev, { kind: 'streaming', text: '' }]);

    try {
      await streamWatson(
        apiMessages,
        (delta) => {
          accumulated += delta;
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.kind === 'streaming') next[next.length - 1] = { kind: 'streaming', text: accumulated };
            return next;
          });
        },
        abortRef.current.signal,
      );

      // Replace streaming entry with final assistant entry
      const { cleanText, suggestion } = parseSuggestion(accumulated);
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.kind === 'streaming') next[next.length - 1] = { kind: 'assistant', text: cleanText, suggestion };
        return next;
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.kind !== 'streaming'));
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.kind === 'streaming') next[next.length - 1] = { kind: 'error', text: msg };
          return next;
        });
      }
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, project, characters, relationships]);

  async function handleApply(msgIndex: number, updates: WatsonUpdate[], rels: WatsonRelationshipCreate[], proj?: WatsonProjectUpdate) {
    await onApplyUpdates(updates, rels, proj);
    const parts: string[] = [];
    if (updates.length > 0) parts.push(`Fichas: ${updates.map(u => u.characterName).join(', ')}`);
    if (rels.length > 0) parts.push(`Relaciones: ${rels.map(r => `${r.sourceCharacterName}→${r.targetCharacterName}`).join(', ')}`);
    if (proj) parts.push('Expediente actualizado');
    setMessages(prev => {
      const next = [...prev];
      const msg = next[msgIndex];
      if (msg?.kind === 'assistant') next[msgIndex] = { ...msg, suggestion: null };
      next.push({ kind: 'applied', text: `✅ ${parts.join(' · ')}` });
      return next;
    });
  }

  function handleDismiss(msgIndex: number) {
    setDismissed(prev => new Set(prev).add(msgIndex));
  }

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Watson — Asistente de Investigación"
        className={`fixed bottom-6 right-6 z-50 px-4 rounded-xl shadow-2xl flex items-center gap-2 transition-all cursor-pointer border-2 ${
          open
            ? 'bg-zinc-800 border-zinc-600'
            : 'bg-indigo-700 hover:bg-indigo-600 border-indigo-500 hover:scale-105'
        }`}
      >
        <span className="text-xl">🕵️</span>
        <span className="text-sm font-bold text-white">{open ? '✕ Cerrar' : 'Watson AI'}</span>
      </button>

      {/* ── Panel ── */}
      <div
        className={`fixed bottom-20 right-6 z-40 w-[520px] flex flex-col rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">�️</span>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">WATSON</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Asistente de Investigación</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streaming && (
              <span className="text-[10px] text-indigo-400 animate-pulse font-semibold">● Pensando...</span>
            )}
            {apiKeyMissing && (
              <span className="text-[10px] text-red-400 font-semibold">Sin API Key</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-1" style={{ minHeight: '200px' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 py-10 text-center px-6">
              <span className="text-4xl mb-3">�️</span>
              <p className="text-zinc-400 text-sm font-semibold">Watson está listo</p>
              <p className="text-zinc-600 text-xs mt-1">
                Cuéntame datos del caso o de los sujetos y los añadiré a sus fichas.
              </p>
              <div className="mt-4 flex flex-col gap-1.5 w-full">
                {['¿Qué sabes sobre los sujetos?', 'El sospechoso trabaja en el puerto como estibador', 'Resume las relaciones del caso'].map(hint => (
                  <button key={hint} onClick={() => setInput(hint)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded-lg px-3 py-2 text-left border border-zinc-800 transition-colors cursor-pointer">
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {(msg.kind === 'user') && (
                <div className="flex justify-end px-3 mb-1">
                  <div className="bg-blue-700/80 text-white text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              )}

              {(msg.kind === 'assistant' || msg.kind === 'streaming') && (
                <div className="px-3 mb-1">
                  <div className={`text-xs rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[95%] leading-relaxed whitespace-pre-wrap border ${
                    msg.kind === 'streaming'
                      ? 'bg-zinc-800/60 border-zinc-700/40 text-zinc-300'
                      : 'bg-zinc-800/80 border-zinc-700/30 text-zinc-200'
                  }`}>
                    {msg.text || <span className="animate-pulse text-zinc-500">▌</span>}
                  </div>
                </div>
              )}

              {msg.kind === 'assistant' && msg.suggestion && !dismissed.has(i) && (
                <ConfirmDialog
                  suggestion={msg.suggestion}
                  characters={characters}
                  onConfirm={(upd, rels, proj) => handleApply(i, upd, rels, proj)}
                  onDismiss={() => handleDismiss(i)}
                />
              )}

              {msg.kind === 'error' && (
                <div className="px-3 mb-1">
                  <div className="text-xs bg-red-900/40 border border-red-700/50 rounded-xl px-3 py-2 text-red-300">
                    ⚠️ {msg.text}
                  </div>
                </div>
              )}

              {msg.kind === 'applied' && (
                <div className="px-3 mb-1">
                  <div className="text-xs bg-green-900/30 border border-green-700/40 rounded-xl px-3 py-2 text-green-400">
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-3">
          {apiKeyMissing && (
            <p className="text-[10px] text-amber-500 mb-2 text-center">
              Añade <code className="bg-zinc-800 px-1 rounded">VITE_DEEPSEEK_API_KEY</code> en .env.local y reinicia
            </p>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={streaming || apiKeyMissing}
              placeholder="Cuéntale algo a Watson… (Enter para enviar)"
              rows={2}
              className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none disabled:opacity-40"
            />
            {streaming ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="self-end bg-red-700 hover:bg-red-600 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                ■
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim() || apiKeyMissing}
                className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                ➤
              </button>
            )}
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5 text-center">
            Shift+Enter: nueva línea · Enter: enviar · Caso: {project.name}
          </p>
        </div>
      </div>
    </>
  );
}
