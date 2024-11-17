// Simple in-memory storage for local development
class LocalStorage {
    private static store: Map<string, any> = new Map();
  
    static async set(key: string, value: any) {
      this.store.set(key, value);
      return value;
    }
  
    static async get(key: string) {
      return this.store.get(key);
    }
  
    static async keys(pattern: string) {
      return Array.from(this.store.keys()).filter(key => key.includes(pattern));
    }
  
    static async lpush(key: string, value: any) {
      const existing = this.store.get(key) || [];
      this.store.set(key, [value, ...existing]);
      return existing.length + 1;
    }
  }
  
  // Storage wrapper that uses either Vercel KV or local storage
  const storage = {
    set: async (key: string, value: any) => {
      if (process.env.VERCEL) {
        const { kv } = await import('@vercel/kv');
        return kv.set(key, value);
      }
      return LocalStorage.set(key, value);
    },
  
    get: async (key: string) => {
      if (process.env.VERCEL) {
        const { kv } = await import('@vercel/kv');
        return kv.get(key);
      }
      return LocalStorage.get(key);
    },
  
    keys: async (pattern: string) => {
      if (process.env.VERCEL) {
        const { kv } = await import('@vercel/kv');
        return kv.keys(pattern);
      }
      return LocalStorage.keys(pattern);
    },
  
    lpush: async (key: string, value: any) => {
      if (process.env.VERCEL) {
        const { kv } = await import('@vercel/kv');
        return kv.lpush(key, value);
      }
      return LocalStorage.lpush(key, value);
    }
  };
  
  export default storage;