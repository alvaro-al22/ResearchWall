import { useState, useEffect, useRef } from 'react';
import type { Character } from '../types';
import { CASE_TAGS } from '../constants/caseTags';

// ── Constantes ────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'alive',   label: '🟢 Con vida' },
  { value: 'dead',    label: '💀 Fallecido' },
  { value: 'missing', label: '❓ Desaparecido' },
  { value: 'unknown', label: '⬜ Desconocido' },
];

const SOCIAL_CLASSES = [
  'Aristocracia / Élite', 'Alta burguesía', 'Clase media-alta',
  'Clase media', 'Clase trabajadora', 'Clase obrera',
  'Marginal / Pobreza', 'Desconocida',
];

const BUILD_TYPES = ['Delgado/a', 'Atlético/a', 'Mediano/a', 'Robusto/a', 'Corpulento/a', 'Desconocida'];

const PRESET_COLORS = [
  '#1e3a5f', '#1a1c2e', '#1a2e1e', '#2e1a1a', '#2e2a1a',
  '#2a1a2e', '#1a2e2e', '#3b1a1a', '#1a3b3b', '#2d2d1a',
];

// ── Country Picker ─────────────────────────────────────────────
let countriesCache: string[] | null = null;

function CountryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [countries, setCountries] = useState<string[]>(countriesCache ?? []);
  const [query, setQuery] = useState(value);
  const [open, setOpen]   = useState(false);

  useEffect(() => {
    if (countriesCache) { setCountries(countriesCache); return; }
    fetch('https://restcountries.com/v3.1/all?fields=name,translations')
      .then(r => r.json())
      .then((data: Array<{ name: { common: string }; translations?: { spa?: { common: string } } }>) => {
        countriesCache = data
          .map(c => c.translations?.spa?.common || c.name.common)
          .sort((a, b) => a.localeCompare(b, 'es'));
        setCountries(countriesCache);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  const filtered = query.length >= 1
    ? countries.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="País..."
        className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 bg-zinc-800 border border-zinc-600 rounded-lg mt-1 max-h-44 overflow-y-auto w-full shadow-xl">
          {filtered.map(c => (
            <li key={c} onMouseDown={() => { onChange(c); setQuery(c); setOpen(false); }}
              className="px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm text-white">
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── City Autocomplete (Nominatim / OpenStreetMap) ──────────────
function CitySearch({ value, onChange, placeholder = 'Ciudad o localidad...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [query,   setQuery]   = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open,    setOpen]    = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function handleInput(q: string) {
    setQuery(q);
    onChange(q);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=0`,
          { headers: { 'Accept-Language': 'es' } },
        );
        const data: Array<{ display_name: string }> = await res.json();
        setResults([...new Set(data.map(d => d.display_name.split(',')[0].trim()))].slice(0, 8));
      } catch { setResults([]); }
    }, 700);
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 bg-zinc-800 border border-zinc-600 rounded-lg mt-1 max-h-44 overflow-y-auto w-full shadow-xl">
          {results.map(r => (
            <li key={r} onMouseDown={() => { onChange(r); setQuery(r); setOpen(false); }}
              className="px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm text-white">
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tag Selector ───────────────────────────────────────────────
function TagSelector({ selected, onChange }: { selected: string[]; onChange: (t: string[]) => void }) {
  function toggle(label: string) {
    onChange(selected.includes(label) ? selected.filter(t => t !== label) : [...selected, label]);
  }
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {CASE_TAGS.map(({ label, color }) => {
        const active = selected.includes(label);
        return (
          <button key={label} type="button" onClick={() => toggle(label)}
            style={active ? { backgroundColor: color, borderColor: color } : { borderColor: color + '66' }}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              active ? 'text-white shadow-md' : 'text-zinc-400 bg-transparent hover:bg-zinc-800'
            }`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Label helper ───────────────────────────────────────────────
const LBL = ({ t }: { t: string }) => (
  <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block font-semibold">{t}</label>
);

// ── Main Form ──────────────────────────────────────────────────
type Tab = 'ID' | 'Psicología' | 'Localización' | 'Historial' | 'Físico' | 'Expediente';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ID',           label: '🪪 Identificación' },
  { key: 'Psicología',   label: '🧠 Psicología'     },
  { key: 'Localización', label: '📍 Localización'   },
  { key: 'Historial',    label: '💼 Historial'       },
  { key: 'Físico',       label: '🩺 Físico'          },
  { key: 'Expediente',   label: '📋 Expediente'      },
];

type Props = {
  character?: Partial<Character>;
  projectId: string;
  onSave: (data: Omit<Character, 'id' | 'created_at'>) => void;
  onDelete?: () => void;
  onClose: () => void;
};

type FormData = Omit<Character, 'id' | 'created_at'>;

export default function CharacterForm({ character, projectId, onSave, onDelete, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ID');
  const [form, setForm] = useState<FormData>({
    project_id:           projectId,
    name:                 character?.name                 ?? '',
    alias:                character?.alias                ?? '',
    age:                  character?.age,
    birthplace:           character?.birthplace           ?? '',
    nationality:          character?.nationality          ?? '',
    status:               character?.status               ?? 'alive',
    personality:          character?.personality          ?? '',
    fears:                character?.fears                ?? '',
    motivations:          character?.motivations          ?? '',
    objectives:           character?.objectives           ?? '',
    secrets:              character?.secrets              ?? '',
    residence:            character?.residence            ?? '',
    social_class:         character?.social_class         ?? '',
    family:               character?.family               ?? '',
    profession:           character?.profession           ?? '',
    studies:              character?.studies              ?? '',
    current_job:          character?.current_job          ?? '',
    relevant_experience:  character?.relevant_experience  ?? '',
    height:               character?.height               ?? '',
    build_type:           character?.build_type           ?? '',
    distinctive_features: character?.distinctive_features ?? '',
    avatar:               character?.avatar               ?? '',
    color:                character?.color                ?? '#1e3a5f',
    role:                 character?.role                 ?? '',
    tags:                 character?.tags                 ?? [],
    position_x:           character?.position_x           ?? 0,
    position_y:           character?.position_y           ?? 0,
    notes:                character?.notes                ?? '',
  });

  const set = (field: keyof FormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const inp = (key: keyof FormData, placeholder: string) => (
    <input
      value={(form[key] as string | undefined) ?? ''}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
    />
  );

  const ta = (key: keyof FormData, placeholder: string, rows = 3) => (
    <textarea
      value={(form[key] as string | undefined) ?? ''}
      onChange={e => set(key, e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
    />
  );

  const isEditing  = !!character?.name;
  const primaryTag = CASE_TAGS.find(t => (form.tags ?? []).includes(t.label));

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* ── Header (ficha policial) ── */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.25em] font-bold">FICHA DE SUJETO</p>
              <h2 className="text-base font-bold mt-0.5" style={{ color: primaryTag?.color ?? '#ffffff' }}>
                {isEditing ? character.name : 'Nuevo Sujeto'}
              </h2>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl cursor-pointer">✕</button>
          </div>
          {(form.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.tags ?? []).map(t => {
                const def = CASE_TAGS.find(ct => ct.label === t);
                return (
                  <span key={t}
                    style={{ backgroundColor: (def?.color ?? '#6b7280') + '28', borderColor: def?.color ?? '#6b7280', color: def?.color ?? '#9ca3af' }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide">
                    {t}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 px-6 pt-3 overflow-x-auto border-b border-zinc-800">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md whitespace-nowrap transition-colors cursor-pointer ${
                tab === t.key
                  ? 'text-blue-400 border-b-2 border-blue-500 bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Identificación */}
          {tab === 'ID' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LBL t="Nombre completo *" />
                  <input autoFocus value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Nombre y apellidos"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div><LBL t="Alias / Apodo" />{inp('alias', 'Alias conocido')}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <LBL t="Edad" />
                  <input type="number" value={form.age ?? ''}
                    onChange={e => set('age', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="--"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <LBL t="Estado vital" />
                  <select value={form.status ?? 'alive'} onChange={e => set('status', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div><LBL t="Función en el caso" />{inp('role', 'Detective, Civil...')}</div>
              </div>
              <div>
                <LBL t="Nacionalidad" />
                <CountryPicker value={form.nationality ?? ''} onChange={v => set('nationality', v)} />
              </div>
              <div>
                <LBL t="Etiquetas del caso" />
                <TagSelector selected={form.tags ?? []} onChange={tags => set('tags', tags)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LBL t="Color de ficha" />
                  <div className="flex gap-2 flex-wrap items-center mt-1">
                    {PRESET_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => set('color', c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                          form.color === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                      className="w-6 h-6 rounded-full border-2 border-zinc-600 bg-transparent cursor-pointer"
                      title="Color personalizado" />
                  </div>
                </div>
                <div><LBL t="URL de foto" />{inp('avatar', 'https://...')}</div>
              </div>
            </div>
          )}

          {/* Psicología */}
          {tab === 'Psicología' && (
            <div className="flex flex-col gap-4">
              <div><LBL t="Personalidad" />{ta('personality', 'Rasgos, comportamiento, actitud...')}</div>
              <div><LBL t="Miedos y puntos débiles" />{ta('fears', 'Fobias, vulnerabilidades...')}</div>
              <div><LBL t="Motivaciones" />{ta('motivations', 'Qué le impulsa, qué quiere...')}</div>
              <div><LBL t="Objetivos" />{ta('objectives', 'Metas conocidas o deducidas...')}</div>
              <div><LBL t="🤫 Secretos e información confidencial" />{ta('secrets', 'Datos sensibles del expediente...', 4)}</div>
            </div>
          )}

          {/* Localización */}
          {tab === 'Localización' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LBL t="Lugar de nacimiento" />
                  <CitySearch value={form.birthplace ?? ''} onChange={v => set('birthplace', v)} placeholder="Ciudad natal..." />
                </div>
                <div>
                  <LBL t="País de nacimiento" />
                  <CountryPicker value={form.nationality ?? ''} onChange={v => set('nationality', v)} />
                </div>
              </div>
              <div>
                <LBL t="Residencia actual" />
                <CitySearch value={form.residence ?? ''} onChange={v => set('residence', v)} placeholder="Ciudad de residencia..." />
              </div>
              <div>
                <LBL t="Clase social" />
                <select value={form.social_class ?? ''} onChange={e => set('social_class', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer">
                  <option value="">Seleccionar...</option>
                  {SOCIAL_CLASSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><LBL t="Vínculos familiares" />{ta('family', 'Familia, convivientes, círculo cercano...', 3)}</div>
            </div>
          )}

          {/* Historial */}
          {tab === 'Historial' && (
            <div className="flex flex-col gap-4">
              <div><LBL t="Profesión" />{inp('profession', 'Ocupación conocida')}</div>
              <div><LBL t="Estudios" />{inp('studies', 'Nivel formativo, titulaciones...')}</div>
              <div><LBL t="Trabajo actual" />{inp('current_job', 'Empresa, cargo, puesto...')}</div>
              <div><LBL t="Historial laboral / Antecedentes" />{ta('relevant_experience', 'Cargos anteriores, antecedentes penales, hechos relevantes...', 4)}</div>
            </div>
          )}

          {/* Físico */}
          {tab === 'Físico' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div><LBL t="Altura" />{inp('height', 'ej. 182 cm')}</div>
                <div>
                  <LBL t="Complexión" />
                  <select value={form.build_type ?? ''} onChange={e => set('build_type', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer">
                    <option value="">Seleccionar...</option>
                    {BUILD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div><LBL t="Rasgos físicos distintivos" />{ta('distinctive_features', 'Cicatrices, tatuajes, marcas, descripción general...', 5)}</div>
            </div>
          )}

          {/* Expediente */}
          {tab === 'Expediente' && (
            <div>
              <LBL t="Notas del expediente" />
              <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={14}
                placeholder="Observaciones del caso, hipótesis, timeline personal, pruebas relacionadas..."
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <div>
            {isEditing && onDelete && (
              <button onClick={() => { if (confirm(`¿Eliminar la ficha de ${character.name}?`)) onDelete(); }}
                className="text-red-500 hover:text-red-400 text-sm transition-colors cursor-pointer">
                🗑️ Eliminar ficha
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer">
              Cancelar
            </button>
            <button onClick={() => { if (form.name.trim()) onSave(form); }} disabled={!form.name.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
              {isEditing ? 'Guardar Cambios' : 'Registrar Sujeto'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
