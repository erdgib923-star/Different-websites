// p5 1.x ships without TypeScript types; the lab uses it through a narrow, untyped boundary.
declare module 'p5' {
  const P5: any;
  export default P5;
}
declare module '*palette.config.mjs' {
  const config: { colors: Record<string, [number, number, number]> };
  export default config;
}
declare module '*scripts/color.mjs' {
  export function gamutMap(L: number, C: number, H: number): number;
  export function oklchToSrgb(L: number, C: number, H: number): [number, number, number];
}
