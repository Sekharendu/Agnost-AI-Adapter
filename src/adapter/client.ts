import type { AgnostAdapterConfig, AgnostResponse } from '../types';

/** Thin HTTP client for Agnost's REST API, providing create, query, and delete-many operations. */
export class AgnostClient {
  private apiUrl: string;
  private apiKey: string;
  private dbName: string;

  constructor(config: AgnostAdapterConfig) {
    this.apiUrl = config.apiUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.dbName = config.dbName;
  }

  async create<T>(collection: string, data: object): Promise<AgnostResponse<T>> {
    const url = `${this.apiUrl}/object/${this.dbName}/${collection}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<AgnostResponse<T>>;
  }

  async query<T>(
    collection: string,
    filter: object,
    options?: { limit?: number; sort?: object },
  ): Promise<AgnostResponse<T[]>> {
    const url = `${this.apiUrl}/object/${this.dbName}/${collection}/search`;
    const body = {
      filter,
      options: {
        limit: options?.limit ?? 10,
        sort: options?.sort ?? { timestamp: 'asc' },
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<AgnostResponse<T[]>>;
  }

  async deleteMany(
    collection: string,
    filter: object,
  ): Promise<AgnostResponse<{ count: number }>> {
    const url = `${this.apiUrl}/object/${this.dbName}/${collection}/delete-many`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ filter }),
    });
    return res.json() as Promise<AgnostResponse<{ count: number }>>;
  }
}
