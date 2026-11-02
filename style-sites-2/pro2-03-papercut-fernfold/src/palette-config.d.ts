// Types for the build-time palette config and colour helpers imported by seasons.ts.
declare module '*palette.config.mjs' {
  const config: { colors: Record<string, [number, number, number]> };
  export default config;
}
declare module '*scripts/color.mjs' {
  export function gamutMap(L: number, C: number, H: number): number;
}
