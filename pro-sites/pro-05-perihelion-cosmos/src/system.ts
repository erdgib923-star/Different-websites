// The Halcyra system: every world, number and name here is FICTIONAL SAMPLE DATA.
export type Kind = 'lava' | 'desert' | 'ocean' | 'gas' | 'ice';
export type Planet = {
  name: string;
  roman: string;
  kind: Kind;
  hue: number; // OKLCH hue: 30 + 68° × index (hue rotation)
  orbit: number; // scene units
  angle: number; // radians, position on its orbit
  radius: number; // scene units
  au: string;
  period: string;
  temp: string;
  gravity: string;
  blurb: string;
};

export const STAR = { name: 'Halcyra', type: 'K2 orange dwarf', temp: '4,950 K', age: '6.1 billion years' };

export const planets: Planet[] = [
  { name: 'Vey', roman: 'I', kind: 'lava', hue: 30, orbit: 10, angle: 0.35, radius: 0.9, au: '0.31 AU', period: '41 days', temp: '690 K', gravity: '0.8 g', blurb: 'Close enough to the star that its day side never cools. Basalt plates drift on a molten mantle, splitting along glowing seams.' },
  { name: 'Orrin', roman: 'II', kind: 'desert', hue: 98, orbit: 16, angle: 1.3, radius: 1.3, au: '0.72 AU', period: '180 days', temp: '310 K', gravity: '0.9 g', blurb: 'A dry, sulphur-dusted world of long dunes. Its thin air keeps the sky pale and the nights very cold.' },
  { name: 'Selk', roman: 'III', kind: 'ocean', hue: 166, orbit: 24, angle: 2.15, radius: 1.6, au: '1.12 AU', period: '351 days', temp: '288 K', gravity: '1.1 g', blurb: 'Nine-tenths ocean, with scattered archipelagos under fast weather. In this system it is the only world with liquid water at the surface.' },
  { name: 'Mauna Rel', roman: 'IV', kind: 'gas', hue: 234, orbit: 37, angle: 3.0, radius: 4.2, au: '5.4 AU', period: '11.8 years', temp: '128 K', gravity: '2.3 g', blurb: 'A banded giant with a wide, dusty ring. Storms the size of Selk drift along its equator for decades.' },
  { name: 'Isk', roman: 'V', kind: 'ice', hue: 302, orbit: 52, angle: 3.85, radius: 0.85, au: '31 AU', period: '172 years', temp: '41 K', gravity: '0.2 g', blurb: 'A small, cracked ice dwarf at the edge of the system. Faint violet frost forms where sunlight barely reaches.' },
];

/** OKLCH → linear sRGB (for shader uniforms) */
export function oklchLinear(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const c = (v: number) => Math.min(1, Math.max(0, v));
  return [c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}

/** the per-planet palette: same L/C steps for every planet, only the hue rotates */
export const palette = (hue: number) => ({
  dark: oklchLinear(0.34, 0.07, hue),
  mid: oklchLinear(0.64, 0.12, hue),
  light: oklchLinear(0.86, 0.06, hue),
  atmo: oklchLinear(0.78, 0.1, hue + 12),
});
