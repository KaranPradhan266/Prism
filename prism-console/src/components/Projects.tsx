import React, { useEffect, useState } from 'react';
import { getProjects, getRulesForProject } from '@/lib/api';
import { useSession } from './SessionProvider';

interface Project {
  id: string;
  name: string;
  // Add other project properties here
}

interface Rule {
  id: string;
  type: string;
  value: string;
  // Add other rule properties here
}

const Projects = () => {
  const { session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (session) {
      getProjects(session)
        .then(data => {
          setProjects(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (selectedProject) {
    return <ProjectDetails project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Projects</h1>
      <ul>
        {projects.map(project => (
          <li key={project.id}>
            <button onClick={() => setSelectedProject(project)}>{project.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProjectDetails = ({ project, onBack }: { project: Project, onBack: () => void }) => {
  const { session } = useSession();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      getRulesForProject(session, project.id)
        .then(data => {
          setRules(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session, project.id]);

  return (
    <div className="container mx-auto p-4">
      <button onClick={onBack}>Back to Projects</button>
      <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
      <h2 className="text-2xl font-bold mb-2">Rules</h2>
      {loading && <div>Loading rules...</div>}
      {error && <div>Error: {error}</div>}
      <ul>
        {rules.map(rule => (
          <li key={rule.id}>
            <strong>{rule.type}:</strong> {rule.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;
