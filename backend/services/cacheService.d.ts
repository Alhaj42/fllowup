declare class CacheService {
    private client;
    private isConnected;
    private readonly defaultTTL;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private checkConnection;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    delPattern(pattern: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    flushDb(): Promise<boolean>;
    static projectListKey(filter: any): string;
    static projectDetailKey(id: string): string;
    static projectDashboardKey(id: string): string;
    static teamAllocationKey(projectId: string): string;
    static reportKey(type: string, id: string): string;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cacheService.d.ts.map