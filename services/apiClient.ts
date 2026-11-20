import { API_BASE_URL } from "@/constants/api";
import { emitForceLogout } from "./authEvents";
import { clearSession, getToken } from "./session";

class ApiError extends Error {
    status: number;
    body: any;
    constructor(status: number, body: any) {
        super(body?.message || `Error ${status}`);
        this.status = status;
        this.body = body;
    }
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
    body?: any;
    skipAuth?: boolean;
};

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}) {
    const { body, skipAuth, headers, ...rest } = options;

    const finalHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
        const token = await getToken();
        if (token) {
            finalHeaders.Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...rest,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data: any = null;
    try {
        data = await response.json();
    } catch {

    }

    if (response.status === 401) {
        await clearSession();
        emitForceLogout();
    }

    if (!response.ok) {
        throw new ApiError(response.status, data);
    }

    return data;
}