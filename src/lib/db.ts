import { supabase } from './supabase';
import type { Project, Character, Relationship } from '../types';

// Helper para loguear errores de Supabase con contexto
function logError(fn: string, error: unknown) {
  console.error(`[db.${fn}]`, error);
}

// --- Projects ---
export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Project[]) ?? [];
  } catch (e) {
    logError('getProjects', e);
    return [];
  }
};

export const createProject = async (data: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> => {
  try {
    const { data: result, error } = await supabase.from('projects').insert(data).select().single();
    if (error) throw error;
    return result as Project;
  } catch (e) {
    logError('createProject', e);
    return null;
  }
};

export const updateProject = async (id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<void> => {
  try {
    const { error } = await supabase.from('projects').update(data).eq('id', id);
    if (error) throw error;
  } catch (e) {
    logError('updateProject', e);
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    logError('deleteProject', e);
  }
};

// --- Characters ---
export const getCharacters = async (projectId: string): Promise<Character[]> => {
  try {
    const { data, error } = await supabase.from('characters').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data as Character[]) ?? [];
  } catch (e) {
    logError('getCharacters', e);
    return [];
  }
};

export const createCharacter = async (data: Omit<Character, 'id' | 'created_at'>): Promise<Character | null> => {
  try {
    const { data: result, error } = await supabase.from('characters').insert(data).select().single();
    if (error) throw error;
    return result as Character;
  } catch (e) {
    logError('createCharacter', e);
    return null;
  }
};

export const updateCharacter = async (id: string, data: Partial<Omit<Character, 'id' | 'created_at'>>): Promise<Character | null> => {
  try {
    const { data: result, error } = await supabase.from('characters').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result as Character;
  } catch (e) {
    logError('updateCharacter', e);
    return null;
  }
};

export const deleteCharacter = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    logError('deleteCharacter', e);
  }
};

// --- Relationships ---
export const getRelationships = async (projectId: string): Promise<Relationship[]> => {
  try {
    const { data, error } = await supabase.from('relationships').select('*').eq('project_id', projectId);
    if (error) throw error;
    return (data as Relationship[]) ?? [];
  } catch (e) {
    logError('getRelationships', e);
    return [];
  }
};

export const createRelationship = async (data: Omit<Relationship, 'id' | 'created_at'>): Promise<Relationship | null> => {
  try {
    const { data: result, error } = await supabase.from('relationships').insert(data).select().single();
    if (error) throw error;
    return result as Relationship;
  } catch (e) {
    logError('createRelationship', e);
    return null;
  }
};

export const updateRelationship = async (id: string, data: Partial<Omit<Relationship, 'id' | 'created_at'>>): Promise<Relationship | null> => {
  try {
    const { data: result, error } = await supabase.from('relationships').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result as Relationship;
  } catch (e) {
    logError('updateRelationship', e);
    return null;
  }
};

export const deleteRelationship = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('relationships').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    logError('deleteRelationship', e);
  }
};
