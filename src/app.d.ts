declare global {
  namespace App {
    interface Locals {}
    interface Platform {
      env: {
        GOOGLE_SHEET_ID: string;
        GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
        GOOGLE_PRIVATE_KEY: string;
      };
      context: {
        waitUntil(promise: Promise<any>): void;
      };
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
