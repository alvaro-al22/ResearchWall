import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import {
  ReactFlow, Background, Controls, useNodesState, useEdgesState,
  addEdge, BackgroundVariant, MiniMap, Panel,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CharacterNode from './CharacterNode';
import CustomRelationshipEdge from './CustomRelationshipEdge';
import CharacterForm from './CharacterForm';
import RelationshipForm from './RelationshipForm';
import type { Project, Character, Relationship } from '../types';
import * as db from '../lib/db';

const nodeTypes = { character: CharacterNode };
const edgeTypes = { custom: CustomRelationshipEdge };

function characterToNode(c: Character): Node {
  return {
    id: c.id,
    type: 'character',
    position: { x: c.position_x, y: c.position_y },
    data: {
      label: c.name,
      role: c.role,
      age: c.age,
      color: c.color,
      avatar: c.avatar,
      alias: c.alias,
      status: c.status,
      personality: c.personality,
      birthplace: c.birthplace,
      residence: c.residence,
      profession: c.profession,
    },
  };
}

function relationshipToEdge(r: Relationship): Edge {
  return {
    id: r.id,
    source: r.source_id,
    target: r.target_id,
    type: 'custom',
    animated: r.status === 'hidden',
    data: { label: r.label, type: r.type, intensity: r.intensity },
  };
}

type GroupBy = 'none' | 'residence' | 'profession' | 'status';

type PendingConn = { sourceId: string; targetId: string };

type Props = {
  project: Project;
  onBack: () => void;
};

export default function BoardView({ project, onBack }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCharForm, setShowCharForm] = useState(false);
  const [editChar, setEditChar] = useState<Character | undefined>(undefined);
  const [pendingConn, setPendingConn] = useState<PendingConn | null>(null);
  const [editRel, setEditRel] = useState<Relationship | undefined>(undefined);

  // Story panel
  const [showStory, setShowStory] = useState(false);
  const [story, setStory] = useState(project.story ?? '');
  const [storyDirty, setStoryDirty] = useState(false);

  // Load board data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [chars, rels] = await Promise.all([
        db.getCharacters(project.id),
        db.getRelationships(project.id),
      ]);
      setCharacters(chars);
      setRelationships(rels);
      setNodes(chars.map(characterToNode));
      setEdges(rels.map(relationshipToEdge));
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Persist node position on drag stop
  const onNodeDragStop = useCallback(async (_event: MouseEvent, node: Node) => {
    await db.updateCharacter(node.id, { position_x: node.position.x, position_y: node.position.y });
  }, []);

  // New connection → open RelationshipForm
  const onConnect = useCallback((params: Connection | Edge) => {
    if (!params.source || !params.target) return;
    setPendingConn({ sourceId: params.source, targetId: params.target });
  }, []);

  // Double-click a node → open CharacterForm for editing
  const onNodeDoubleClick = useCallback((_evt: MouseEvent, node: Node) => {
    const char = characters.find(c => c.id === node.id);
    if (char) { setEditChar(char); setShowCharForm(true); }
  }, [characters]);

  // Click an edge → open RelationshipForm for editing
  const onEdgeClick = useCallback((_evt: MouseEvent, edge: Edge) => {
    const rel = relationships.find(r => r.id === edge.id);
    if (rel) {
      setEditRel(rel);
      setPendingConn({ sourceId: rel.source_id, targetId: rel.target_id });
    }
  }, [relationships]);

  // Delete nodes via Delete key
  const onNodesDelete = useCallback(async (deleted: Node[]) => {
    await Promise.all(deleted.map(n => db.deleteCharacter(n.id)));
    setCharacters(prev => prev.filter(c => !deleted.some(n => n.id === c.id)));
  }, []);

  // Delete edges via Delete key
  const onEdgesDelete = useCallback(async (deleted: Edge[]) => {
    await Promise.all(deleted.map(e => db.deleteRelationship(e.id)));
    setRelationships(prev => prev.filter(r => !deleted.some(e => e.id === r.id)));
  }, []);

  // Save character (create or update)
  async function handleSaveCharacter(data: Omit<Character, 'id' | 'created_at'>) {
    if (editChar) {
      const updated = await db.updateCharacter(editChar.id, data);
      if (updated) {
        const newChars = characters.map(c => c.id === editChar.id ? updated : c);
        setCharacters(newChars);
        setNodes(newChars.map(characterToNode));
      }
    } else {
      const created = await db.createCharacter({
        ...data,
        project_id: project.id,
        position_x: 150 + Math.random() * 600,
        position_y: 100 + Math.random() * 400,
      });
      if (created) {
        const newChars = [...characters, created];
        setCharacters(newChars);
        setNodes(newChars.map(characterToNode));
      }
    }
    setShowCharForm(false);
    setEditChar(undefined);
  }

  // Delete character from form
  async function handleDeleteCharacter() {
    if (!editChar) return;
    await db.deleteCharacter(editChar.id);
    const newChars = characters.filter(c => c.id !== editChar.id);
    setCharacters(newChars);
    setNodes(newChars.map(characterToNode));
    const newRels = relationships.filter(r => r.source_id !== editChar.id && r.target_id !== editChar.id);
    setRelationships(newRels);
    setEdges(newRels.map(relationshipToEdge));
    setShowCharForm(false);
    setEditChar(undefined);
  }

  // Save relationship (create or update)
  async function handleSaveRelationship(data: Omit<Relationship, 'id' | 'created_at'>) {
    if (editRel) {
      const updated = await db.updateRelationship(editRel.id, data);
      if (updated) {
        const newRels = relationships.map(r => r.id === editRel.id ? updated : r);
        setRelationships(newRels);
        setEdges(newRels.map(relationshipToEdge));
      }
    } else {
      const created = await db.createRelationship(data);
      if (created) {
        const newRels = [...relationships, created];
        setRelationships(newRels);
        setEdges(prev => addEdge(relationshipToEdge(created), prev));
      }
    }
    setPendingConn(null);
    setEditRel(undefined);
  }

  // Smart grouping: reorganize nodes by field
  function handleGroup(by: GroupBy) {
    if (by === 'none') {
      setNodes(characters.map(characterToNode));
      return;
    }
    const fieldMap: Record<GroupBy, keyof Character> = {
      none: 'id',
      residence: 'residence',
      profession: 'profession',
      status: 'status',
    };
    const field = fieldMap[by];
    const groups = new Map<string, Character[]>();
    characters.forEach(c => {
      const key = String((c[field] as string) || 'Sin definir');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    });

    const newNodes: Node[] = [];
    let gx = 80;
    groups.forEach(group => {
      group.forEach((char, i) => {
        newNodes.push({
          id: char.id,
          type: 'character',
          position: { x: gx, y: 100 + i * 140 },
          data: {
            label: char.name, role: char.role, age: char.age,
            color: char.color, avatar: char.avatar, alias: char.alias, status: char.status,
            personality: char.personality, birthplace: char.birthplace,
            residence: char.residence, profession: char.profession,
          },
        });
      });
      gx += 260;
    });
    setNodes(newNodes);
  }

  const getCharName = (id: string) => characters.find(c => c.id === id)?.name ?? id;

  function handleExportCharacters() {
    const blob = new Blob([JSON.stringify(characters, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-')}-personajes.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportCharacters(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const arr: unknown[] = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('expected array');
      for (const item of arr) {
        const c = item as Character;
        await db.createCharacter({
          project_id: project.id,
          name: c.name ?? 'Sin nombre',
          alias: c.alias,
          age: c.age,
          birthplace: c.birthplace,
          nationality: c.nationality,
          status: c.status,
          personality: c.personality,
          fears: c.fears,
          motivations: c.motivations,
          objectives: c.objectives,
          secrets: c.secrets,
          residence: c.residence,
          social_class: c.social_class,
          family: c.family,
          profession: c.profession,
          studies: c.studies,
          current_job: c.current_job,
          relevant_experience: c.relevant_experience,
          height: c.height,
          build_type: c.build_type,
          distinctive_features: c.distinctive_features,
          avatar: c.avatar,
          color: c.color ?? '#1f2937',
          role: c.role ?? '',
          notes: c.notes,
          position_x: (c.position_x ?? 150) + Math.random() * 80,
          position_y: (c.position_y ?? 100) + Math.random() * 80,
        });
      }
      const fresh = await db.getCharacters(project.id);
      setCharacters(fresh);
      setNodes(fresh.map(characterToNode));
    } catch {
      alert('Error al importar: aseg\u00farate de que el archivo sea un JSON exportado desde esta app.');
    }
    e.target.value = '';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🔬</div>
          <p className="text-zinc-400 text-lg">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-72 bg-zinc-950 text-white flex flex-col border-r border-zinc-800 z-10 flex-shrink-0">
        <div className="p-5 border-b border-zinc-800">
          <button onClick={onBack} className="text-zinc-600 hover:text-zinc-300 text-xs mb-2 flex items-center gap-1 transition-colors cursor-pointer">
            ← Todos los proyectos
          </button>
          <h1 className="text-lg font-black text-white leading-tight">{project.name}</h1>
          {project.description && <p className="text-zinc-600 text-xs mt-1 truncate">{project.description}</p>}
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
          {/* Actions */}
          <p className="text-xs text-zinc-600 uppercase font-bold tracking-wider">Acciones</p>
          <button
            onClick={() => { setEditChar(undefined); setShowCharForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 py-2.5 px-4 rounded-lg transition-colors font-semibold text-sm cursor-pointer"
          >
            <span>＋</span> Añadir Personaje
          </button>
          <button
            onClick={() => setShowStory(s => !s)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-lg transition-colors font-medium text-sm border cursor-pointer ${
              showStory ? 'bg-amber-900/40 border-amber-800 text-amber-300' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            📖 Historia del Proyecto
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleExportCharacters}
              disabled={characters.length === 0}
              title="Exportar personajes a JSON"
              className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 py-2 px-2 rounded-lg transition-colors text-xs border border-zinc-700 cursor-pointer"
            >
              📤 Exportar
            </button>
            <label
              title="Importar personajes desde JSON"
              className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 py-2 px-2 rounded-lg transition-colors text-xs border border-zinc-700 cursor-pointer"
            >
              📥 Importar
              <input type="file" accept=".json" onChange={handleImportCharacters} className="hidden" />
            </label>
          </div>

          {/* Grouping */}
          <div className="border-t border-zinc-800 mt-1 pt-3">
            <p className="text-xs text-zinc-600 uppercase font-bold tracking-wider mb-2">Agrupar por</p>
            {([
              { by: 'none' as GroupBy, label: '🔄 Sin agrupar' },
              { by: 'residence' as GroupBy, label: '📍 Residencia' },
              { by: 'profession' as GroupBy, label: '💼 Profesión' },
              { by: 'status' as GroupBy, label: '💡 Estado' },
            ]).map(({ by, label }) => (
              <button
                key={by}
                onClick={() => handleGroup(by)}
                className="w-full text-left flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-2 px-3 rounded-lg transition-colors text-sm border border-zinc-700 mb-1 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Characters list */}
          <div className="border-t border-zinc-800 mt-1 pt-3">
            <p className="text-xs text-zinc-600 uppercase font-bold tracking-wider mb-2">
              Personajes ({characters.length})
            </p>
            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-52">
              {characters.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setEditChar(c); setShowCharForm(true); }}
                  className="flex items-center gap-2 text-left py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors text-sm cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10" style={{ backgroundColor: c.color }} />
                  <span className="text-zinc-300 truncate flex-1">{c.name}</span>
                  <span className="text-zinc-600 text-xs truncate">{c.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-700">
          {characters.length} personajes · {relationships.length} relaciones
        </div>
      </aside>

      {/* ── Story Panel ── */}
      {showStory && (
        <div className="absolute left-72 top-0 bottom-0 w-80 bg-zinc-900 border-r border-zinc-700 z-20 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white text-sm">📖 Historia del Proyecto</h2>
            <button onClick={() => setShowStory(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">✕</button>
          </div>
          <textarea
            value={story}
            onChange={e => { setStory(e.target.value); setStoryDirty(true); }}
            placeholder="Escribe el contexto, historia, timeline o cualquier información relevante del proyecto aquí. Este apartado es libre y solo para ti."
            className="flex-1 bg-transparent text-zinc-300 text-sm px-5 py-4 resize-none outline-none leading-relaxed"
          />
          {storyDirty && (
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={async () => { await db.updateProject(project.id, { story }); setStoryDirty(false); }}
                className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Guardar Historia
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Canvas ── */}
      <main className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeClick={onEdgeClick}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          panOnDrag={[0, 2]}
          className="bg-[#1a1a1a]"
          deleteKeyCode="Delete"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
          <Controls className="bg-zinc-800 fill-white" />
          <MiniMap
            nodeColor={n => String((n.data as { color?: string }).color ?? '#555')}
            maskColor="rgba(10,10,15,0.75)"
            style={{ background: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46' }}
          />
          <Panel position="top-right" className="bg-zinc-800/80 backdrop-blur text-zinc-400 text-xs px-3 py-2 rounded-lg border border-zinc-700">
            Clic: voltear tarjeta · Doble clic: editar · Clic der.: mover lienzo · <kbd className="bg-zinc-700 px-1 rounded">Del</kbd>: eliminar
          </Panel>
        </ReactFlow>
      </main>

      {/* ── Modals ── */}
      {showCharForm && (
        <CharacterForm
          character={editChar}
          projectId={project.id}
          onSave={handleSaveCharacter}
          onDelete={editChar ? handleDeleteCharacter : undefined}
          onClose={() => { setShowCharForm(false); setEditChar(undefined); }}
        />
      )}

      {pendingConn && (
        <RelationshipForm
          sourceId={pendingConn.sourceId}
          targetId={pendingConn.targetId}
          sourceLabel={getCharName(pendingConn.sourceId)}
          targetLabel={getCharName(pendingConn.targetId)}
          relationship={editRel}
          projectId={project.id}
          onSave={handleSaveRelationship}
          onClose={() => { setPendingConn(null); setEditRel(undefined); }}
        />
      )}
    </div>
  );
}
