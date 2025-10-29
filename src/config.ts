import config from 'config';

export function getString(key: string): string {
    return config.get<string>(key);
}
export function getInt(key: string): number {
    return config.get<number>(key);
}
export function getBoolean(key: string): boolean {
    return config.get<boolean>(key);
}
