import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://testing-production-1105.up.railway.app/api/v1";

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.instance.interceptors.request.use(
      (config) => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("admin_access_token");
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          typeof window !== "undefined"
        ) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("admin_refresh_token");

          if (refreshToken) {
            try {
              const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken,
              });
              const newAccessToken =
                res.data?.tokens?.accessToken || res.data?.data?.tokens?.accessToken;
              if (newAccessToken) {
                localStorage.setItem("admin_access_token", newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return this.instance(originalRequest);
              }
            } catch {
              localStorage.removeItem("admin_access_token");
              localStorage.removeItem("admin_refresh_token");
              localStorage.removeItem("admin_user");
              if (window.location.pathname !== "/login") {
                window.location.href = "/login";
              }
            }
          }
        }

        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "An unexpected error occurred.";
        return Promise.reject(new Error(message));
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get(url, config);
    return response.data?.data !== undefined ? response.data.data : response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data?.data !== undefined ? response.data.data : response.data;
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch(url, data, config);
    return response.data?.data !== undefined ? response.data.data : response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete(url, config);
    return response.data?.data !== undefined ? response.data.data : response.data;
  }
}

export const apiClient = new ApiClient();
