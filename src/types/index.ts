export type Project = {
  id: string;
  name: string;
  description?: string;
  story?: string;
  created_at?: string;
};

export type Character = {
  id: string;
  project_id: string;
  name: string;
  alias?: string;
  age?: number;
  birthplace?: string;
  nationality?: string;
  status?: string;
  personality?: string;
  fears?: string;
  motivations?: string;
  objectives?: string;
  secrets?: string;
  residence?: string;
  social_class?: string;
  family?: string;
  profession?: string;
  studies?: string;
  current_job?: string;
  relevant_experience?: string;
  height?: string;
  build_type?: string;
  distinctive_features?: string;
  avatar?: string;
  color: string;
  role: string;
  position_x: number;
  position_y: number;
  notes?: string;
  created_at?: string;
};

export type Relationship = {
  id: string;
  project_id: string;
  source_id: string;
  target_id: string;
  type: string;
  label?: string;
  intensity: number;
  bidirectional: boolean;
  status?: string;
  created_at?: string;
};
