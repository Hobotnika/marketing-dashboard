/**
 * Lead Storage System
 * Persists leads to JSON file (can be migrated to database later)
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFilters,
  LeadSourceAttribution,
  LeadStatusStats,
} from '@/types/leads';

const LEADS_FILE = path.join(process.cwd(), '.cache', 'leads.json');

// Ensure cache directory exists
function ensureCacheDir() {
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * Read all leads from storage
 */
export function readLeads(): Lead[] {
  try {
    ensureCacheDir();
    if (!fs.existsSync(LEADS_FILE)) {
      return [];
    }

    const data = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading leads:', error);
    return [];
  }
}

/**
 * Write leads to storage
 */
function writeLeads(leads: Lead[]): boolean {
  try {
    ensureCacheDir();
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing leads:', error);
    return false;
  }
}

/**
 * Create a new lead
 */
export function createLead(data: CreateLeadRequest): Lead {
  const leads = readLeads();

  const newLead: Lead = {
    id: uuidv4(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    source: data.source,
    campaign_id: data.campaign_id,
    status: data.status || 'new',
    value: data.value,
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  leads.push(newLead);
  writeLeads(leads);

  return newLead;
}

/**
 * Get lead by ID
 */
export function getLeadById(id: string): Lead | null {
  const leads = readLeads();
  return leads.find(lead => lead.id === id) || null;
}

/**
 * Update a lead
 */
export function updateLead(id: string, data: UpdateLeadRequest): Lead | null {
  const leads = readLeads();
  const index = leads.findIndex(lead => lead.id === id);

  if (index === -1) {
    return null;
  }

  const updatedLead: Lead = {
    ...leads[index],
    ...data,
    updated_at: new Date().toISOString(),
  };

  // If status changed to 'converted', set converted_at
  if (data.status === 'converted' && leads[index].status !== 'converted') {
    updatedLead.converted_at = new Date().toISOString();
  }

  leads[index] = updatedLead;
  writeLeads(leads);

  return updatedLead;
}

/**
 * Delete a lead
 */
export function deleteLead(id: string): boolean {
  const leads = readLeads();
  const filtered = leads.filter(lead => lead.id !== id);

  if (filtered.length === leads.length) {
    return false; // Lead not found
  }

  writeLeads(filtered);
  return true;
}

/**
 * Get leads with filters
 */
export function getLeads(filters?: LeadFilters): Lead[] {
  let leads = readLeads();

  // Filter by source
  if (filters?.source) {
    const sources = Array.isArray(filters.source) ? filters.source : [filters.source];
    leads = leads.filter(lead => sources.includes(lead.source));
  }

  // Filter by status
  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    leads = leads.filter(lead => statuses.includes(lead.status));
  }

  // Filter by date range
  if (filters?.startDate) {
    const startDate = new Date(filters.startDate).getTime();
    leads = leads.filter(lead => new Date(lead.created_at).getTime() >= startDate);
  }

  if (filters?.endDate) {
    const endDate = new Date(filters.endDate + 'T23:59:59').getTime();
    leads = leads.filter(lead => new Date(lead.created_at).getTime() <= endDate);
  }

  // Search in name, phone, email
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    leads = leads.filter(
      lead =>
        lead.name.toLowerCase().includes(search) ||
        lead.phone?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search)
    );
  }

  // Sort by created_at (newest first)
  leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Pagination
  if (filters?.offset !== undefined) {
    leads = leads.slice(filters.offset);
  }

  if (filters?.limit !== undefined) {
    leads = leads.slice(0, filters.limit);
  }

  return leads;
}

/**
 * Get lead attribution by source
 */
export function getLeadAttribution(filters?: Omit<LeadFilters, 'source'>): LeadSourceAttribution[] {
  const leads = getLeads(filters);

  // Group by source
  const sourceMap = new Map<string, Lead[]>();

  leads.forEach(lead => {
    const existing = sourceMap.get(lead.source) || [];
    existing.push(lead);
    sourceMap.set(lead.source, existing);
  });

  // Calculate attribution for each source
  const attribution: LeadSourceAttribution[] = [];

  sourceMap.forEach((sourceLeads, source) => {
    const converted = sourceLeads.filter(lead => lead.status === 'converted');
    const totalValue = converted.reduce((sum, lead) => sum + (lead.value || 0), 0);

    attribution.push({
      source: source as Lead['source'],
      count: sourceLeads.length,
      converted: converted.length,
      conversionRate: sourceLeads.length > 0 ? (converted.length / sourceLeads.length) * 100 : 0,
      totalValue,
      averageValue: converted.length > 0 ? totalValue / converted.length : 0,
    });
  });

  // Sort by count (descending)
  attribution.sort((a, b) => b.count - a.count);

  return attribution;
}

/**
 * Get lead stats by status
 */
export function getLeadStatusStats(filters?: Omit<LeadFilters, 'status'>): LeadStatusStats[] {
  const leads = getLeads(filters);
  const total = leads.length;

  // Group by status
  const statusMap = new Map<Lead['status'], number>();

  leads.forEach(lead => {
    statusMap.set(lead.status, (statusMap.get(lead.status) || 0) + 1);
  });

  // Convert to stats array
  const stats: LeadStatusStats[] = [];

  statusMap.forEach((count, status) => {
    stats.push({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    });
  });

  // Sort by pipeline order
  const statusOrder: Lead['status'][] = ['new', 'contacted', 'qualified', 'meeting_booked', 'converted', 'lost'];
  stats.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  return stats;
}

/**
 * Get lead count
 */
export function getLeadCount(filters?: LeadFilters): number {
  return getLeads(filters).length;
}

/**
 * Bulk import leads (for Google Sheets import)
 */
export function bulkImportLeads(leadsData: CreateLeadRequest[]): { success: number; failed: number; errors: string[] } {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  leadsData.forEach((data, index) => {
    try {
      createLead(data);
      success++;
    } catch (error) {
      failed++;
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return { success, failed, errors };
}
