declare module '*palette.config.mjs' {
  const config: { colors: Record<string, [number, number, number]> };
  export default config;
}
declare module '*scripts/color.mjs' {
  export function gamutMap(L: number, C: number, H: number): number;
  export function oklchToSrgb(L: number, C: number, H: number): [number, number, number];
}
