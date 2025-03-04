declare module 'fengari-web' {
    export const L: any;
    export const lua: any;
    export const lauxlib: any;
    export const lualib: any;
    export function to_luastring(str: string): any;
    export function to_jsstring(luaString: any): string;
} 