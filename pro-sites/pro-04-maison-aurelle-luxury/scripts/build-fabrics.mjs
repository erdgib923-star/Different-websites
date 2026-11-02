// Generates the "fabric" imagery: standalone SVGs built from feTurbulence, feDisplacementMap and
// SVG lighting filters. Written to public/fabrics/*.svg and used as <img>, so each is rasterised once
// by the browser (cheap to transform/scroll) and works without JavaScript.
// Shared lighting rule for every textile: one distant key light from the top-left
// (azimuth 225°), folds lit by the same light, shadows tinted with the ink neutral.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ramp, toHex } from './color.mjs';
import config from './palette.config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/fabrics');
mkdirSync(out, { recursive: true });

// palette → hex (same OKLCH values as the CSS tokens)
const pal = {};
for (const [name, opts] of Object.entries(config.ramps)) for (const s of ramp(opts)) pal[`${name}-${s.step}`] = toHex(s.L, s.C, s.H);

const W = 800, H = 1000;
const light = (el = 48) => `<feDistantLight azimuth="225" elevation="${el}"/>`;

/** drape: low-frequency displacement + fold shading (multiply), shared by all fabrics */
const drape = (input, seed, scale = 46) => `
  <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0021" numOctaves="2" seed="${seed + 7}" result="drapeN"/>
  <feDisplacementMap in="${input}" in2="drapeN" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="draped"/>
  <feDiffuseLighting in="drapeN" surfaceScale="22" diffuseConstant="1.05" lighting-color="#ffffff" result="folds">${light(58)}</feDiffuseLighting>
  <feBlend in="draped" in2="folds" mode="multiply"/>`;

const recipes = {
  twill: ({ color, seed }) => ({
    pre: `<g transform="rotate(32 ${W / 2} ${H / 2})"><rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" filter="url(#f)"/></g>`,
    filter: `<feTurbulence type="turbulence" baseFrequency="0.011 0.21" numOctaves="2" seed="${seed}" result="w"/>
  <feDiffuseLighting in="w" surfaceScale="2.6" diffuseConstant="1.25" lighting-color="${color}" result="lit">${light(46)}</feDiffuseLighting>${drape('lit', seed)}`,
  }),
  gabardine: ({ color, seed }) => ({
    pre: `<g transform="rotate(62 ${W / 2} ${H / 2})"><rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" filter="url(#f)"/></g>`,
    filter: `<feTurbulence type="turbulence" baseFrequency="0.006 0.42" numOctaves="1" seed="${seed}" result="w"/>
  <feDiffuseLighting in="w" surfaceScale="1.4" diffuseConstant="1.18" lighting-color="${color}" result="lit">${light(52)}</feDiffuseLighting>${drape('lit', seed, 38)}`,
  }),
  boucle: ({ color, seed }) => ({
    filter: `<feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" seed="${seed}" result="n"/>
  <feTurbulence type="turbulence" baseFrequency="0.09" numOctaves="2" seed="${seed + 3}" result="n2"/>
  <feDisplacementMap in="n" in2="n2" scale="26" xChannelSelector="R" yChannelSelector="B" result="loops"/>
  <feDiffuseLighting in="loops" surfaceScale="7" diffuseConstant="1.15" lighting-color="${color}" result="lit">${light(44)}</feDiffuseLighting>${drape('lit', seed, 30)}`,
  }),
  cashmere: ({ color, seed }) => ({
    filter: `<feTurbulence type="fractalNoise" baseFrequency="0.024 0.03" numOctaves="4" seed="${seed}" result="n"/>
  <feGaussianBlur in="n" stdDeviation="1.4" result="soft"/>
  <feDiffuseLighting in="soft" surfaceScale="3" diffuseConstant="1.2" lighting-color="${color}" result="lit">${light(50)}</feDiffuseLighting>${drape('lit', seed, 52)}`,
  }),
  silk: ({ color, sheen, seed }) => ({
    filter: `<feTurbulence type="fractalNoise" baseFrequency="0.0019 0.0062" numOctaves="3" seed="${seed}" result="n"/>
  <feFlood flood-color="${color}" result="base"/>
  <feDiffuseLighting in="n" surfaceScale="16" diffuseConstant="1" lighting-color="#ffffff" result="shade">${light(42)}</feDiffuseLighting>
  <feBlend in="base" in2="shade" mode="multiply" result="body"/>
  <feSpecularLighting in="n" surfaceScale="16" specularConstant="0.95" specularExponent="22" lighting-color="${sheen}" result="spec">${light(38)}</feSpecularLighting>
  <feComposite in="spec" in2="body" operator="arithmetic" k1="0" k2="0.75" k3="1" k4="0"/>`,
  }),
  velvet: ({ color, sheen, seed }) => ({
    filter: `<feTurbulence type="fractalNoise" baseFrequency="0.0028 0.0045" numOctaves="3" seed="${seed}" result="n"/>
  <feFlood flood-color="${color}" result="base"/>
  <feDiffuseLighting in="n" surfaceScale="24" diffuseConstant="1.15" lighting-color="#ffffff" result="shade">${light(34)}</feDiffuseLighting>
  <feBlend in="base" in2="shade" mode="multiply" result="body"/>
  <feSpecularLighting in="n" surfaceScale="24" specularConstant="0.55" specularExponent="6" lighting-color="${sheen}" result="spec">${light(30)}</feSpecularLighting>
  <feComposite in="spec" in2="body" operator="arithmetic" k1="0" k2="0.6" k3="1" k4="0" result="v"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${seed + 1}" result="pile"/>
  <feColorMatrix in="pile" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" result="pileA"/>
  <feComposite in="pileA" in2="v" operator="over"/>`,
  }),
  herringbone: ({ color, seed }) => ({
    pre: `<defs><pattern id="hb" width="88" height="28" patternUnits="userSpaceOnUse">
  <path d="M0 28 L22 0 L34 0 L12 28Z M22 28 L44 0 L56 0 L34 28Z" fill="#000"/>
  <path d="M44 0 L66 28 L78 28 L56 0Z M66 0 L88 28 L100 28 L78 0Z M-12 0 L10 28 L22 28 L0 0Z" fill="#000"/>
</pattern></defs><rect x="-90" y="-90" width="${W + 180}" height="${H + 180}" fill="url(#hb)" filter="url(#f)"/>`,
    filter: `<feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="a"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="${seed}" result="fib"/>
  <feComposite in="a" in2="fib" operator="arithmetic" k1="0" k2="1" k3="0.25" k4="0" result="relief"/>
  <feDiffuseLighting in="relief" surfaceScale="3.2" diffuseConstant="1.2" lighting-color="${color}" result="lit">${light(46)}</feDiffuseLighting>${drape('lit', seed, 40)}`,
  }),
  tweed: ({ color, fleck, seed }) => ({
    filter: `<feTurbulence type="turbulence" baseFrequency="0.07 0.11" numOctaves="2" seed="${seed}" result="w"/>
  <feDiffuseLighting in="w" surfaceScale="3.5" diffuseConstant="1.2" lighting-color="${color}" result="lit">${light(46)}</feDiffuseLighting>
  <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="1" seed="${seed + 5}" result="f"/>
  <feColorMatrix in="f" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -5.4" result="mask"/>
  <feFlood flood-color="${fleck}" result="fc"/>
  <feComposite in="fc" in2="mask" operator="in" result="flecks"/>
  <feComposite in="flecks" in2="lit" operator="over" result="tw"/>${drape('tw', seed, 34)}`,
  }),
};

// The collection's fabrics. Colours come only from the three ramps: neutrals, bordeaux, champagne.
const fabrics = {
  'ivory-boucle': ['boucle', { color: pal['neutral-50'] }],
  'ink-twill': ['twill', { color: pal['neutral-700'] }],
  'camel-cashmere': ['cashmere', { color: pal['accent-300'] }],
  'oat-herringbone': ['herringbone', { color: pal['neutral-100'] }],
  'champagne-silk': ['silk', { color: pal['accent-300'], sheen: pal['accent-50'] }],
  'charcoal-tweed': ['tweed', { color: pal['neutral-600'], fleck: pal['accent-300'] }],
  'bordeaux-velvet': ['velvet', { color: pal['brand-700'], sheen: pal['brand-300'] }],
  'ivory-gabardine': ['gabardine', { color: pal['neutral-50'] }],
  'ink-silk': ['silk', { color: pal['neutral-900'], sheen: pal['neutral-300'] }],
  'bordeaux-boucle': ['boucle', { color: pal['brand-500'] }],
  'oat-cashmere': ['cashmere', { color: pal['neutral-100'] }],
  'champagne-twill': ['twill', { color: pal['accent-200'] }],
};

let seed = 3;
for (const [name, [kind, opts]] of Object.entries(fabrics)) {
  seed += 11;
  const r = recipes[kind]({ ...opts, seed });
  const body = r.pre ?? `<rect x="-90" y="-90" width="${W + 180}" height="${H + 180}" filter="url(#f)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<filter id="f" x="-500" y="-500" width="${W + 1000}" height="${H + 1000}" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">${r.filter}
</filter>
<linearGradient id="key" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
  <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
  <stop offset="1" stop-color="${pal['neutral-950']}" stop-opacity="0.34"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${opts.color}"/>
${body}
<rect width="${W}" height="${H}" fill="url(#key)"/>
</svg>`;
  writeFileSync(resolve(out, `${name}.svg`), svg);
}
console.log(`fabrics: wrote ${Object.keys(fabrics).length} SVG textiles -> public/fabrics/`);
