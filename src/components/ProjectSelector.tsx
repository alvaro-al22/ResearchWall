import { useState, useEffect, useRef, type SetStateAction } from 'react';
import type { Project } from '../types';
import * as db from '../lib/db';

// ── Network canvas background ─────────────────────────────────
function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── World: clusters of node-cards ────────────────────────
    type WorldNode = { wx: number; wy: number };
    type Cluster   = { nodes: WorldNode[]; edges: [number, number][] };

    const CLUSTER_COUNT  = 7;
    const WORLD_SPREAD   = 2400;

    const clusters: Cluster[] = Array.from({ length: CLUSTER_COUNT }, () => {
      const cx = (Math.random() - 0.5) * WORLD_SPREAD * 2;
      const cy = (Math.random() - 0.5) * WORLD_SPREAD * 2;
      const n  = 5 + Math.floor(Math.random() * 7);
      const nodes: WorldNode[] = Array.from({ length: n }, () => ({
        wx: cx + (Math.random() - 0.5) * 500,
        wy: cy + (Math.random() - 0.5) * 380,
      }));
      const edges: [number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        const count = 1 + Math.floor(Math.random() * 2);
        for (let k = 0; k < count; k++) {
          const j = Math.floor(Math.random() * nodes.length);
          if (j !== i) edges.push([i, j]);
        }
      }
      return { nodes, edges };
    });

    // ── Camera state ─────────────────────────────────────────
    let camX     = 0, camY = 0, camZoom = 0.9;
    let targetX  = 0, targetY = 0, targetZoom = 0.9;
    let dwellTimer   = 0;
    let currentIdx   = 0;

    function clusterCenter(c: Cluster) {
      const ax = c.nodes.reduce((s, n) => s + n.wx, 0) / c.nodes.length;
      const ay = c.nodes.reduce((s, n) => s + n.wy, 0) / c.nodes.length;
      return { ax, ay };
    }

    // Start at first cluster
    const { ax: ix, ay: iy } = clusterCenter(clusters[0]);
    camX = targetX = ix;
    camY = targetY = iy;

    function pickNext() {
      currentIdx = (currentIdx + 1) % clusters.length;
      const { ax, ay } = clusterCenter(clusters[currentIdx]);
      targetX    = ax + (Math.random() - 0.5) * 80;
      targetY    = ay + (Math.random() - 0.5) * 60;
      targetZoom = 0.55 + Math.random() * 0.65;
      dwellTimer = 0;
    }

    const DWELL = 220; // frames before moving to next cluster
    const LERP  = 0.018;

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function worldToScreen(wx: number, wy: number, cw: number, ch: number): [number, number] {
      return [
        cw / 2 + (wx - camX) * camZoom,
        ch / 2 + (wy - camY) * camZoom,
      ];
    }

    function drawRoundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }

    function draw() {
      if (!ctx || !canvas) return;
      const c  = ctx;
      const cv = canvas;
      c.clearRect(0, 0, cv.width, cv.height);

      // Smooth camera
      camX    = lerp(camX,    targetX,    LERP);
      camY    = lerp(camY,    targetY,    LERP);
      camZoom = lerp(camZoom, targetZoom, LERP);
      dwellTimer++;
      if (dwellTimer > DWELL) pickNext();

      for (const cluster of clusters) {
        const { ax, ay } = clusterCenter(cluster);
        const worldDist  = Math.hypot(ax - camX, ay - camY);
        const fadeDist   = 1200;
        const baseFade   = Math.max(0, 1 - worldDist / fadeDist);

        // Edges
        for (const [i, j] of cluster.edges) {
          const [x1, y1] = worldToScreen(cluster.nodes[i].wx, cluster.nodes[i].wy, cv.width, cv.height);
          const [x2, y2] = worldToScreen(cluster.nodes[j].wx, cluster.nodes[j].wy, cv.width, cv.height);
          c.strokeStyle = `rgba(99,102,241,${baseFade * 0.3})`;
          c.lineWidth   = 1;
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
          c.stroke();
        }

        // Node cards
        const cardW = 38 * camZoom;
        const cardH = 24 * camZoom;
        const dotR  = 2.5 * camZoom;
        const rad   = Math.max(1, 3 * camZoom);

        for (const node of cluster.nodes) {
          const [sx, sy] = worldToScreen(node.wx, node.wy, cv.width, cv.height);

          drawRoundRect(c, sx - cardW / 2, sy - cardH / 2, cardW, cardH, rad);
          c.fillStyle   = `rgba(30,30,40,${baseFade * 0.85})`;
          c.strokeStyle = `rgba(99,102,241,${baseFade * 0.55})`;
          c.lineWidth   = 1;
          c.fill();
          c.stroke();

          if (camZoom > 0.45) {
            const lw = cardW * 0.55;
            const lh = 1.5 * camZoom;
            const ly = sy - cardH * 0.15;
            c.fillStyle = `rgba(148,163,184,${baseFade * 0.35})`;
            c.fillRect(sx - lw / 2, ly, lw, lh);
            c.fillRect(sx - lw * 0.35, ly + lh * 3, lw * 0.7, lh);
          }

          c.beginPath();
          c.arc(sx, sy - cardH * 0.25, dotR, 0, Math.PI * 2);
          c.fillStyle = `rgba(129,140,248,${baseFade * 0.85})`;
          c.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// ─────────────────────────────────────────────────────────────

type Props = {
  onSelect: (project: Project) => void;
};

export default function ProjectSelector({ onSelect }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    db.getProjects().then((data: SetStateAction<Project[]>) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const created = await db.createProject({ name: newName.trim(), description: newDesc.trim(), story: '' });
    if (created) {
      setProjects(prev => [created, ...prev]);
      setNewName('');
      setNewDesc('');
      setCreating(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('¿Eliminar este caso y todos sus sujetos? Esta acción es irreversible.')) return;
    await db.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <NetworkBackground />
      <div className="max-w-2xl w-full relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
            Research Wall
          </h1>
          <p className="text-zinc-500 mt-3 text-lg">Tablero de investigación visual</p>
        </div>

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-zinc-300">Casos</h2>
          <button
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            + Nuevo Caso
          </button>
        </div>

        {creating && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
            <h3 className="font-semibold mb-4 text-zinc-200">Nuevo Caso</h3>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre del caso"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Descripción breve (opcional)"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm mb-4 resize-none outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                Crear
              </button>
              <button onClick={() => setCreating(false)} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-zinc-500 text-center py-12">Cargando proyectos...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-5xl mb-4">�</p>
            <p className="text-lg font-medium text-zinc-500">No hay casos aún</p>
            <p className="text-sm mt-1">Abre tu primer caso de investigación</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                className="bg-zinc-900 border border-zinc-800 hover:border-blue-600/50 rounded-xl p-5 flex justify-between items-center cursor-pointer transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">�</span>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">{p.name}</h3>
                  </div>
                  {p.description && <p className="text-zinc-500 text-sm mt-1 truncate pl-7">{p.description}</p>}
                  <p className="text-zinc-700 text-xs mt-2 pl-7">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  className="text-zinc-700 hover:text-red-500 transition-colors text-lg ml-4 flex-shrink-0 cursor-pointer"
                  title="Eliminar caso"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
