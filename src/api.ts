import type { Product, User, Txn, CartLine, PayMethod } from "./types";

const API_BASE = "/api";

function getUrl(endpoint: string): string {
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.origin &&
    !window.location.origin.startsWith("null") &&
    !window.location.origin.startsWith("about:")
  ) {
    return `${API_BASE}${endpoint}`;
  }
  return `http://localhost:5173${API_BASE}${endpoint}`;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = getUrl(endpoint);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Bootstrap initial state
  async getBootstrap(): Promise<{ products: Product[]; users: User[]; transactions: Txn[] }> {
    return request<{ products: Product[]; users: User[]; transactions: Txn[] }>("/bootstrap");
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return request<Product[]>("/products");
  },

  async upsertProduct(product: Product): Promise<Product> {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  async updateStock(id: string, stock: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    });
  },

  async toggleAvailable(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/products/${id}/available`, {
      method: "PATCH",
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request<User[]>("/users");
  },

  async createUser(user: User): Promise<User> {
    return request<User>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  async updateUser(user: User): Promise<User> {
    return request<User>(`/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/users/${id}`, {
      method: "DELETE",
    });
  },

  // Transactions
  async getTransactions(): Promise<Txn[]> {
    return request<Txn[]>("/transactions");
  },

  async createTransaction(data: {
    lines: { productId: string; name: string; price: number; qty: number }[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    method: PayMethod;
    tendered?: number;
    change?: number;
    cashierName?: string;
    discountCode?: string;
  }): Promise<Txn> {
    return request<Txn>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async refundTransaction(id: string): Promise<Txn> {
    return request<Txn>(`/transactions/${id}/refund`, {
      method: "POST",
    });
  },
};
