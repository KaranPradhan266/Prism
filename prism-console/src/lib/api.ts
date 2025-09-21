import { type Session } from '@supabase/supabase-js';

const API_URL = 'http://localhost:8080/api/v1';

export const getProjects = async (session: Session) => {
  const response = await fetch(`${API_URL}/projects`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
};

export const getRulesForProject = async (session: Session, projectId: string) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/rules`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch rules');
  }

  return response.json();
};
