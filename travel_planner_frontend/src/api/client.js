import axios from "axios";
import { getApiBaseUrl, isBackendEnabled } from "../config/env";

/**
 * Normalize axios errors to a consistent shape for UI.
 * @param {unknown} err
 */
function normalizeError(err) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null;
    const data = err.response?.data;
    const message =
      (typeof data === "string" && data) ||
      data?.detail ||
      err.message ||
      "Request failed";
    return {
      kind: "http",
      status,
      message,
      data,
    };
  }
  if (err instanceof Error) {
    return { kind: "unknown", status: null, message: err.message, data: null };
  }
  return { kind: "unknown", status: null, message: "Unknown error", data: null };
}

/**
 * Create a configured axios instance.
 */
const http = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple request/response interceptors for future auth headers, tracing, etc.
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error))
);

/**
 * PUBLIC_INTERFACE
 * A small wrapper around axios that supports feature-flagged backend calls.
 */
export const apiClient = {
  /**
   * Perform a GET request (safe-gated).
   * @param {string} url
   * @param {import("axios").AxiosRequestConfig} [config]
   */
  async get(url, config) {
    if (!isBackendEnabled()) {
      // Keep UI functional while backend endpoints are being implemented.
      return { data: null, mocked: true };
    }
    const res = await http.get(url, config);
    return { data: res.data, mocked: false };
  },

  /**
   * Perform a POST request (safe-gated).
   * @param {string} url
   * @param {any} body
   * @param {import("axios").AxiosRequestConfig} [config]
   */
  async post(url, body, config) {
    if (!isBackendEnabled()) {
      return { data: null, mocked: true };
    }
    const res = await http.post(url, body, config);
    return { data: res.data, mocked: false };
  },

  /**
   * Perform a PATCH request (safe-gated).
   * @param {string} url
   * @param {any} body
   * @param {import("axios").AxiosRequestConfig} [config]
   */
  async patch(url, body, config) {
    if (!isBackendEnabled()) {
      return { data: null, mocked: true };
    }
    const res = await http.patch(url, body, config);
    return { data: res.data, mocked: false };
  },

  /**
   * Perform a DELETE request (safe-gated).
   * @param {string} url
   * @param {import("axios").AxiosRequestConfig} [config]
   */
  async delete(url, config) {
    if (!isBackendEnabled()) {
      return { data: null, mocked: true };
    }
    const res = await http.delete(url, config);
    return { data: res.data, mocked: false };
  },

  /**
   * Expose baseURL for debugging/UI display.
   */
  getBaseUrl() {
    return getApiBaseUrl();
  },
};
