import type { Project, Character, Relationship } from '../types';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type WatsonUpdate = {
  characterId: string;
  characterName: string;
  changes: Partial<Omit<Character, 'id' | 'created_at' | 'project_id' | 'position_x' | 'position_y'>>;
};

export type WatsonRelationshipCreate = {
  sourceId: string;
  sourceCharacterName: string;
  targetId: string;
  targetCharacterName: string;
  type: string;
  label?: string;
  intensity: number;
  bidirectional: boolean;
  status: string;
};

export type WatsonProjectUpdate = {
  story?: string;
  description?: string;
};

export type WatsonSuggestion = {
  updates: WatsonUpdate[];
  newRelationships?: WatsonRelationshipCreate[];
  projectUpdate?: WatsonProjectUpdate;
};

// Delimiters Watson uses to embed JSON suggestions in its message
const UPDATE_OPEN  = '%%WATSON_UPDATES_START%%';
const UPDATE_CLOSE = '%%WATSON_UPDATES_END%%';

export function buildSystemPrompt(project: Project, characters: Character[], relationships: Relationship[]): string {
  const charSummary = characters.map(c =>
    `- ID: ${c.id} | Nombre: ${c.name}${c.alias ? ` (${c.alias})` : ''} | Rol: ${c.role || '?'} | Estado: ${c.status || '?'}`
  ).join('\n') || '(ninguno)';

  const relSummary = relationships.map(r => {
    const src = characters.find(c => c.id === r.source_id)?.name ?? r.source_id;
    const tgt = characters.find(c => c.id === r.target_id)?.name ?? r.target_id;
    return `- ${src} → ${tgt} [${r.type}]${r.label ? `: ${r.label}` : ''}`;
  }).join('\n') || '(ninguna)';

  return `Eres Watson, el asistente de investigación del caso "${project.name}".
${project.description ? `Descripción del caso: ${project.description}` : ''}
${project.story ? `Contexto: ${project.story}` : ''}

SUJETOS DEL CASO:
${charSummary}

RELACIONES CONOCIDAS:
${relSummary}

Tu función es ayudar al investigador a:
1. Responder preguntas sobre el caso.
2. Analizar la información que el investigador te cuente y detectar datos de personajes.
3. Cuando detectes datos concretos que actualizar en las fichas, proponerlos usando el bloque especial.

REGLAS CRÍTICAS:
- NUNCA modifiques datos sin proponer el bloque de actualización y esperar confirmación del investigador.
- Si el campo ya tiene un valor existente, indica claramente que lo SOBREESCRIBIRÁS con "⚠️ Sobreescribe: ...valor anterior...".
- Responde siempre en español.
- Sé conciso y profesional, como un asistente forense.

FORMATO DE PROPUESTAS:
Cuando quieras sugerir cambios en las fichas o crear relaciones, incluye al final de tu respuesta un bloque así (y solo uno):
${UPDATE_OPEN}
{
  "updates": [
    {
      "characterId": "uuid-del-personaje",
      "characterName": "Nombre visible",
      "changes": {
        "campo1": "valor1",
        "campo2": "valor2"
      }
    }
  ],
  "newRelationships": [
    {
      "sourceId": "uuid-origen",
      "sourceCharacterName": "Nombre origen",
      "targetId": "uuid-destino",
      "targetCharacterName": "Nombre destino",
      "type": "family|professional|enemy|love|secret|unknown",
      "label": "descripción breve opcional",
      "intensity": 3,
      "bidirectional": true,
      "status": "active"
    }
  ],
  "projectUpdate": {
    "story": "nuevo texto del expediente del caso (opcional, incluye si hay info relevante del caso en sí)",
    "description": "nueva descripción breve del caso (opcional)"
  }
}
${UPDATE_CLOSE}

Campos válidos para changes: name, alias, age, birthplace, nationality, status, personality, fears, motivations, objectives, secrets, residence, social_class, family, profession, studies, current_job, relevant_experience, height, build_type, distinctive_features, notes, tags (array de strings), role, color.
Tipos válidos para relaciones: family, professional, enemy, love, secret, unknown.
Campos válidos para projectUpdate: story (expediente narrativo del caso, resumen amplio), description (descripción breve del caso).
Puedes incluir solo "updates", solo "newRelationships", solo "projectUpdate", o cualquier combinación.

Si no tienes propuestas de cambio, NO incluyas el bloque.`;
}

export function parseSuggestion(text: string): { cleanText: string; suggestion: WatsonSuggestion | null } {
  const start = text.indexOf(UPDATE_OPEN);
  const end   = text.indexOf(UPDATE_CLOSE);
  if (start === -1 || end === -1) return { cleanText: text.trim(), suggestion: null };

  const cleanText  = (text.slice(0, start) + text.slice(end + UPDATE_CLOSE.length)).trim();
  const jsonStr    = text.slice(start + UPDATE_OPEN.length, end).trim();
  try {
    const suggestion = JSON.parse(jsonStr) as WatsonSuggestion;
    return { cleanText, suggestion };
  } catch {
    return { cleanText, suggestion: null };
  }
}

export async function streamWatson(
  messages: ChatMessage[],
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_DEEPSEEK_API_KEY no configurada en .env.local');

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: true,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(trimmed.slice(6)) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = data.choices?.[0]?.delta?.content;
        if (delta) onChunk(delta);
      } catch { /* skip malformed chunk */ }
    }
  }
}
