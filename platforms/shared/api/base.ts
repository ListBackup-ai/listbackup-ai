import { apiClient } from './client'

export class BaseAPI {
  protected async get<T>(path: string, params?: any): Promise<T> {
    const response = await apiClient.get(path, { params })
    return response.data
  }

  protected async post<T>(path: string, data?: any): Promise<T> {
    const response = await apiClient.post(path, data)
    return response.data
  }

  protected async put<T>(path: string, data?: any): Promise<T> {
    const response = await apiClient.put(path, data)
    return response.data
  }

  protected async patch<T>(path: string, data?: any): Promise<T> {
    const response = await apiClient.patch(path, data)
    return response.data
  }

  protected async delete<T>(path: string): Promise<T> {
    const response = await apiClient.delete(path)
    return response.data
  }
}