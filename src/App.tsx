import { useState } from 'react';
import type { Project } from './types';
import ProjectSelector from './components/ProjectSelector';
import BoardView from './components/BoardView';

export default function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  if (!currentProject) {
    return <ProjectSelector onSelect={setCurrentProject} />;
  }

  return (
    <BoardView
      project={currentProject}
      onBack={() => setCurrentProject(null)}
    />
  );
}
