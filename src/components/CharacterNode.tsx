import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { TAG_COLOR } from '../constants/caseTags';

export type CharacterNodeData = {
  label: string;
  avatar?: string;
  role: string;
  age?: number;
  color: string;
  alias?: string;
  status?: string;
  personality?: string;
  birthplace?: string;
  residence?: string;
  profession?: string;
  tags?: string[];
};


export type CharacterNodeType = Node<CharacterNodeData, 'character'>;

const STATUS_BADGE: Record<string, string> = {
  alive: '🟢',
  dead: '💀',
  missing: '❓',
  unknown: '⬜',
};

const STATUS_TEXT: Record<string, string> = {
  alive: 'Vivo',
  dead: 'Muerto',
  missing: 'Desaparecido',
  unknown: 'Desconocido',
};

function CharacterNode({ data, dragging }: NodeProps<CharacterNodeType>) {
  const [flipped, setFlipped] = useState(false);
  const wasDragging = useRef(false);

  useEffect(() => {
    if (dragging) wasDragging.current = true;
  }, [dragging]);

  const statusIcon = STATUS_BADGE[data.status ?? 'unknown'] ?? '';
  const statusText = STATUS_TEXT[data.status ?? 'unknown'] ?? '';
  const bgColor = data.color ?? '#1f2937';

  const faceStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    padding: '14px',
    width: '170px',
    minHeight: '108px',
    boxSizing: 'border-box' as const,
  };

  const hasDetails = !!(data.profession || data.residence || data.birthplace || data.personality);

  return (
    <div
      style={{ width: '170px', position: 'relative' }}
      className="select-none"
      onClick={() => {
        if (wasDragging.current) { wasDragging.current = false; return; }
        setFlipped(f => !f);
      }}
    >
      {/* Single connection point at top center */}
      <Handle type="source" position={Position.Top} className="w-3 h-3 bg-zinc-500 border-2 border-zinc-900" />

      {/* Flip wrapper */}
      <div style={{ perspective: '900px' }}>
        <div style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          minHeight: '108px',
        }}>

          {/* ── FRONT ── */}
          <div style={faceStyle}>
            <div className="flex items-center gap-2.5">
              {data.avatar ? (
                <img src={data.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white/15 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black/25 flex items-center justify-center text-white/60 text-base font-black border-2 border-white/10 flex-shrink-0">
                  {data.label.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm text-white truncate">{data.label}</h3>
                  {data.status && data.status !== 'alive' && (
                    <span className="text-xs flex-shrink-0">{statusIcon}</span>
                  )}
                </div>
                <p className="text-white/60 text-xs truncate">{data.role || 'Sin rol'}</p>
                <div className="flex gap-1.5 mt-0.5">
                  {data.alias && <span className="text-white/40 text-xs italic truncate">"{data.alias}"</span>}
                  {data.age && <span className="text-white/40 text-xs">{data.age}a</span>}
                </div>
              </div>
            </div>
            <div className="mt-1.5 text-white/25 text-[9px] text-center tracking-wide">
              {hasDetails ? '↻ clic para detalles' : '↻ clic para voltear'}
            </div>
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {data.tags.slice(0, 2).map(t => (
                  <span key={t}
                    style={{ color: TAG_COLOR[t] ?? '#9ca3af', borderColor: (TAG_COLOR[t] ?? '#9ca3af') + '66', backgroundColor: (TAG_COLOR[t] ?? '#9ca3af') + '22' }}
                    className="text-[8px] font-bold px-1.5 leading-5 rounded-full border">
                    {t}
                  </span>
                ))}
                {data.tags.length > 2 && <span className="text-[8px] text-white/25">+{data.tags.length - 2}</span>}
              </div>
            )}
          </div>

          {/* ── BACK ── */}
          <div style={{
            ...faceStyle,
            transform: 'rotateY(180deg)',
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-white truncate flex-1">{data.label}</h3>
              {data.status && (
                <span className="text-xs ml-1 flex-shrink-0">{statusIcon} <span className="text-white/40">{statusText}</span></span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {data.profession && (
                <div className="flex items-start gap-1.5 text-xs">
                  <span className="text-white/40 flex-shrink-0">💼</span>
                  <span className="text-white/70 truncate">{data.profession}</span>
                </div>
              )}
              {data.residence && (
                <div className="flex items-start gap-1.5 text-xs">
                  <span className="text-white/40 flex-shrink-0">📍</span>
                  <span className="text-white/70 truncate">{data.residence}</span>
                </div>
              )}
              {data.birthplace && (
                <div className="flex items-start gap-1.5 text-xs">
                  <span className="text-white/40 flex-shrink-0">🏠</span>
                  <span className="text-white/70 truncate">{data.birthplace}</span>
                </div>
              )}
              {data.personality && (
                <p className="text-white/50 text-[10px] italic leading-snug mt-0.5 line-clamp-3">
                  {data.personality.length > 90 ? data.personality.slice(0, 90) + '…' : data.personality}
                </p>
              )}
              {!hasDetails && (
                <span className="text-white/30 text-xs italic">Sin detalles adicionales</span>
              )}
            </div>
            <div className="mt-2 text-white/25 text-[9px] text-center tracking-wide">↻ clic para volver</div>
          </div>

        </div>
      </div>

      {/* no bottom handle */}
    </div>
  );
}

export default memo(CharacterNode);
