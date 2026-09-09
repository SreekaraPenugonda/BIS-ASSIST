import { api } from "@/services/api";
import type {
  ApplicationRecord,
  RecommendRequest,
  RecommendResponse,
  StandardListItem,
  StandardListResponse,
} from "@/types/api";

export async function searchStandards(
  query: string,
  category: string,
  page: number,
  size = 12
): Promise<StandardListResponse> {
  const { data } = await api.get<StandardListResponse>("/api/standards", {
    params: { q: query, category, page, size },
  });
  return data;
}

export async function getStandardByNumber(isNumber: string): Promise<StandardListItem> {
  const { data } = await api.get<StandardListItem>(`/api/standards/${encodeURIComponent(isNumber)}`);
  return data;
}

export async function recommendProduct(payload: RecommendRequest): Promise<RecommendResponse> {
  const { data } = await api.post<RecommendResponse>("/api/standards/recommend", payload);
  return data;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const { data } = await api.get<ApplicationRecord[]>("/api/applications");
  return data;
}

export async function createApplication(payload: {
  product_name: string;
  category: string;
  is_number: string;
  standard_title: string;
  notes?: string;
}): Promise<ApplicationRecord> {
  const { data } = await api.post<ApplicationRecord>("/api/applications", payload);
  return data;
}

export async function getApplication(number: string): Promise<ApplicationRecord> {
  const { data } = await api.get<ApplicationRecord>(`/api/applications/${encodeURIComponent(number)}`);
  return data;
}

export async function updateApplicationStatus(id: number, status: string): Promise<ApplicationRecord> {
  const { data } = await api.patch<ApplicationRecord>(`/api/applications/${id}/status`, { status });
  return data;
}