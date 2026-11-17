import { api } from './client';
import type { Report, ReportReason } from '../types';

export interface CreateReportBody {
  postId: string;
  reason: ReportReason;
  note?: string;
}

export const reportsApi = {
  create: async (body: CreateReportBody): Promise<Report> => {
    const res = await api.post<Report>('/reports', body);
    return res.data;
  },
};
