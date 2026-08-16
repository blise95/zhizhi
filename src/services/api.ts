/**
 * 后端API统一调用封装
 * 所有数据操作走真实MySQL数据库，不再使用localStorage或mock数据
 */

const API_BASE = '/zhiliang/api';
const AUTH_KEY = 'zhiquality_auth';

export function getAuthToken(): string | null {
  try {
    const authStr = localStorage.getItem(AUTH_KEY);
    if (!authStr) return null;
    const auth = JSON.parse(authStr);
    return auth.token || null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/logout')) {
      localStorage.removeItem(AUTH_KEY);
      if (!window.location.search.includes('login')) {
        window.location.reload();
      }
      throw new Error('未登录或登录已过期');
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] ${url} 请求失败:`, error);
    throw error;
  }
}

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
  token?: string;
}

export const authApi = {
  login: (username: string, password: string, rememberMe?: boolean) =>
    apiFetch<{
      success: boolean;
      message?: string;
      token?: string;
      username?: string;
      displayName?: string;
      role?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, rememberMe: !!rememberMe }),
    }),

  me: () => apiFetch<{ success: boolean; username: string; displayName: string; role: string }>('/auth/me'),

  logout: () =>
    apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }).catch(() => ({ success: true })),
};


// ==================== 质检记录接口 ====================
export interface InspectionRecord {
  id: number;
  date: string;
  shift: string;
  machineId: string;
  team: string;
  partnerSite: string | null;
  brand: string | null;
  sampleTime: string | null;
  sampleTicketNo: string | null;
  cigaretteA: number;
  cigaretteB: number;
  cigaretteC: number;
  cigaretteD: number;
  boxSmallA: number;
  boxSmallB: number;
  boxSmallC: number;
  boxSmallD: number;
  cartonA: number;
  cartonB: number;
  cartonC: number;
  cartonD: number;
  caseAa: number;
  caseAb: number;
  caseAc: number;
  caseAd: number;
  riskLevel: string;
  uploader: string;
  uploadTime: string;
  createdAt: string;
}

export const inspectionApi = {
  // 查询列表（支持筛选）
  list: (params?: {
    startDate?: string;
    endDate?: string;
    brand?: string;
    partnerSite?: string;
    shift?: string;
    team?: string;
  }): Promise<InspectionRecord[]> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.brand) searchParams.set('brand', params.brand);
    if (params?.partnerSite) searchParams.set('partnerSite', params.partnerSite);
    if (params?.shift) searchParams.set('shift', params.shift);
    if (params?.team) searchParams.set('team', params.team);

    const queryString = searchParams.toString();
    return apiFetch<InspectionRecord[]>(`/inspection/list${queryString ? `?${queryString}` : ''}`);
  },

  // 提交记录
  submit: (record: Partial<InspectionRecord>): Promise<{ success: boolean; message: string; data?: InspectionRecord }> => {
    return apiFetch('/inspection/submit', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  // 删除记录
  delete: (id: number): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/inspection/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 缺陷明细接口 ====================
export interface DefectDetail {
  id: number;
  inspectionId: number;
  module: string;
  bodyPart: string;
  code: string;
  name: string;
  grade: string;
  count: number;
}

export const defectApi = {
  // 根据质检记录ID获取缺陷明细
  getByInspectionId: async (inspectionId: number): Promise<DefectDetail[]> => {
    // 注意：后端可能没有单独的缺陷明细接口，这里先预留
    // 实际可以通过 inspection/list 返回的数据关联查询
    return [];
  },
};

// ==================== 预警日志接口 ====================
export interface WarningLog {
  id: number;
  occurTime: string;
  date: string;
  team: string;
  machineId: string;
  defectLevel: string;
  defectCount: number;
  description: string;
  createdAt: string;
}

export const warningApi = {
  list: (): Promise<WarningLog[]> => {
    return apiFetch<WarningLog[]>('/warning/list');
  },
};

// ==================== 图表数据接口 ====================
export const chartApi = {
  // 获取风险趋势数据
  getRiskTrend: (days: number = 10): Promise<any> => {
    return apiFetch(`/chart/risk-trend?days=${days}`);
  },

  // 获取缺陷分布数据
  getDefectDistribution: (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    return apiFetch(`/chart/defect-distribution?${searchParams}`);
  },

  // 获取机台对比数据
  getMachineComparison: (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    return apiFetch(`/chart/machine-comparison?${searchParams}`);
  },
};

// 导出默认对象
export default {
  auth: authApi,
  inspection: inspectionApi,
  defect: defectApi,
  warning: warningApi,
  chart: chartApi,
};
