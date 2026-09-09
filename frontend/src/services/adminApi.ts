import { api } from "@/services/api";
import type { AdminStats } from "@/types/api";

export interface ReindexResult {
  knowledge_base_entries: number;
  document_chunks: number;
  total_indexed: number;
  mode: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/api/admin/stats");
  return data;
}

export async function reindexKnowledgeBase(): Promise<ReindexResult> {
  const { data } = await api.post<ReindexResult>("/api/admin/reindex");
  return data;
}
