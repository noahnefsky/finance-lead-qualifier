import type { Lead } from "./Lead";

export interface Batch {
    id: string;
    name: string;
    createdAt: string;
    leads: Lead[];
    qualifiedLeads: number;
    status: 'processing' | 'completed';
  }