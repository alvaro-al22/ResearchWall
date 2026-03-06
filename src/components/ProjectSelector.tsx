import { useState, useEffect, type SetStateAction } from 'react';
import type { Project } from '../types';
import * as db from '../lib/db';

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
    if (!confirm('¿Eliminar este proyecto y todos sus personajes? Esta acción es irreversible.')) return;
    await db.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
            Research Wall
          </h1>
          <p className="text-zinc-500 mt-3 text-lg">Tu espacio de investigación visual e interactivo</p>
        </div>

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-zinc-300">Proyectos</h2>
          <button
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            + Nuevo Proyecto
          </button>
        </div>

        {creating && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
            <h3 className="font-semibold mb-4 text-zinc-200">Nuevo Proyecto</h3>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre del proyecto"
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
            <p className="text-5xl mb-4">📌</p>
            <p className="text-lg font-medium text-zinc-500">No tienes proyectos aún</p>
            <p className="text-sm mt-1">Crea tu primer muro de investigación</p>
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
                    <span className="text-lg">📋</span>
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
                  title="Eliminar proyecto"
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
