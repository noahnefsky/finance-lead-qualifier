import type { Batch } from '../Models/Batch';
import type { Lead } from '../Models/Lead';

const API_URL = 'http://localhost:3001/api';

export const createBatch = async (leads: Lead[], name?: string): Promise<string> => {
  const response = await fetch(`${API_URL}/batches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ leads, name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create batch');
  }
  
  const data = await response.json();
  console.log("data from create batch", data);
  return data.id;
};

export const checkBatchStatus = async (batchId: string): Promise<any> => {
  const response = await fetch(`${API_URL}/batches/${batchId}/check-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check status for batch ${batchId}`);
  }

  const data = await response.json();
  console.log("data from checkBatchStatus", data);
  return data;
};

export const getBatches = async (): Promise<Batch[]> => {
  const response = await fetch(`${API_URL}/batches`);
  if (!response.ok) {
    throw new Error('Failed to get batches');
  }
  return response.json();
};

export const getBatch = async (batchId: string): Promise<Batch> => {
  const response = await fetch(`${API_URL}/batches/${batchId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get batch');
  }
  
  return response.json();
};

export const deleteBatch = async (batchId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/batches/${batchId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete batch');
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}; 