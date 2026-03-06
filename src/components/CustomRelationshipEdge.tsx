import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

const typeColorMap: Record<string, string> = {
  family: '#10b981',
  professional: '#3b82f6',
  enemy: '#ef4444',
  love: '#ec4899',
  secret: '#8b5cf6',
  unknown: '#9ca3af',
};

const typeEmojiMap: Record<string, string> = {
  family: '👨‍👩‍👧',
  professional: '💼',
  enemy: '⚔️',
  love: '❤️',
  secret: '🤫',
  unknown: '❓',
};

const typeLabelMap: Record<string, string> = {
  family: 'Familia',
  professional: 'Profesional',
  enemy: 'Enemigos',
  love: 'Amor',
  secret: 'Secreto',
  unknown: 'Desconocido',
};

export default function CustomRelationshipEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationType = String(data?.type || 'unknown');
  const customColor = typeColorMap[relationType] || typeColorMap.unknown;
  const intensity = Number(data?.intensity || 2);
  const edgeLabel = data?.label ? String(data.label) : null;
  const emoji = typeEmojiMap[relationType] || '❓';
  const typeLabel = typeLabelMap[relationType] || 'Desconocido';
  // Filled/empty dots representing intensity 1–5
  const dots = Array.from({ length: 5 }, (_, i) => (i < intensity ? '●' : '○')).join(' ');
  const strokeWidth = Math.max(1.5, intensity * 0.5);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth, stroke: customColor }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              background: '#18181b',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11px',
              color: '#f9fafb',
              boxShadow: '0 4px 16px rgba(0,0,0,0.65)',
              border: `1.5px solid ${customColor}`,
              textAlign: 'center',
              minWidth: '72px',
              maxWidth: '150px',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px' }}>{emoji}</span>
              <span style={{ fontWeight: 700, color: customColor, fontSize: '10px', letterSpacing: '0.3px' }}>
                {typeLabel}
              </span>
            </div>
            {edgeLabel && (
              <div style={{ color: '#a1a1aa', fontSize: '10px', marginTop: '2px', fontStyle: 'italic', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {edgeLabel}
              </div>
            )}
            <div style={{ color: customColor, fontSize: '8px', letterSpacing: '2px', marginTop: '3px', opacity: 0.85 }}>
              {dots}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}