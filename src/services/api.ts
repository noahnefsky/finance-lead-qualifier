import type { Lead } from '../Models/Lead';
import type { Project } from '../Models/Project';

const API_URL = 'http://localhost:3001/api';

export const createProject = async (leads: Lead[]): Promise<string> => {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ leads }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  
  const data = await response.json();
  console.log("data from create project", data);
  return data.id;
};
export const checkProjectStatus = async (projectId: string): Promise<any> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/check-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check status for project ${projectId}`);
  }

  const data = await response.json();
  console.log("data from checkProjectStatus", data);
  return data;
};


export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/projects`);
  if (!response.ok) {
    throw new Error('Failed to get projects');
  }
  return response.json();
};

export const getProject = async (projectId: string): Promise<Project> => {
  const response = await fetch(`${API_URL}/projects/${projectId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get project');
  }
  
  return response.json();
};

// export const startCall = async (projectId: string, leadId: string): Promise<string> => {
//   const response = await fetch(`${API_URL}/projects/${projectId}/start-call`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ leadId }),
//   });
  
//   if (!response.ok) {
//     throw new Error('Failed to start call');
//   }
  
//   const data = await response.json();
//   return data.callId;
// };

export const deleteProject = async (projectId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}; 