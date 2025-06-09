import type { Lead } from "./Lead";

export interface Project {
    id: string;
    name: string;
    createdAt: string;
    leads: Lead[];
    qualifiedLeads: number;
    status: 'processing' | 'completed';
  }