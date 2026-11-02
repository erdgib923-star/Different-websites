// All projects, clients and figures below are fictional sample content.
export type ArtVariant = 'orbit' | 'contour' | 'monolith' | 'weave' | 'flare';

export type Project = {
  slug: string;
  title: string;
  client: string;
  year: string;
  discipline: string;
  services: string[];
  summary: string;
  brief: string;
  approach: string[];
  outcomes: { value: string; label: string }[];
  art: ArtVariant;
  seed: number;
};

export const projects: Project[] = [
  {
    slug: 'halden-observatory',
    title: 'Halden Observatory',
    client: 'Halden Public Observatory (fictional)',
    year: '2026',
    discipline: 'Identity & wayfinding',
    services: ['Brand identity', 'Wayfinding', 'Signage system', 'Type direction'],
    summary: 'A night-sky identity that reads at the bottom of a dark stairwell and the top of a hill.',
    brief:
      'Halden needed one visual language for a hilltop dome, a lecture hall and a late-night shuttle, all of it legible in near darkness without washing out anyone’s night vision.',
    approach: [
      'We built the identity around a single low-red signal colour and a stencil-cut letterform that survives being printed, routed and back-lit.',
      'Wayfinding is set at three sizes only. Every sign is tested at 2 lux, the level of a moonlit path, before it is approved.',
      'The orbit mark animates once on arrival screens and is otherwise still, so it never competes with the actual sky.',
    ],
    outcomes: [
      { value: '3', label: 'sign sizes in the whole system' },
      { value: '2 lux', label: 'legibility test threshold' },
      { value: '41', label: 'unique sign types replaced' },
    ],
    art: 'orbit',
    seed: 3,
  },
  {
    slug: 'saltworks-ferry',
    title: 'Saltworks Ferry Co.',
    client: 'Saltworks Ferry Co. (fictional)',
    year: '2025',
    discipline: 'Brand & digital',
    services: ['Brand strategy', 'Ticketing UX', 'Livery', 'Timetable design'],
    summary: 'A harbour ferry rebrand where the timetable became the hero of the identity.',
    brief:
      'Commuters told us the old timetable was the most stressful part of the crossing. The brief became: make departure times impossible to misread, on a phone, a pier pole or a boat hull.',
    approach: [
      'Departure times are set in a tabular, high-contrast cut and colour-coded by pier with a palette checked for colour-blind riders.',
      'The livery is a single tidal stripe whose height shows the vessel’s route length, readable from the shoreline.',
      'Ticketing was rebuilt around one screen: where you are, the next boat and a single tap to board.',
    ],
    outcomes: [
      { value: '1', label: 'screen from open to boarding' },
      { value: '4', label: 'piers, each with its own route colour' },
      { value: '12', label: 'vessels repainted in the pilot' },
    ],
    art: 'contour',
    seed: 7,
  },
  {
    slug: 'kiln-and-quarry',
    title: 'Kiln & Quarry',
    client: 'Kiln & Quarry Ceramics (fictional)',
    year: '2025',
    discipline: 'Packaging & art direction',
    services: ['Packaging', 'Art direction', 'Retail display'],
    summary: 'Packaging for stoneware that wears the marks of its own firing.',
    brief:
      'A small ceramics workshop wanted packaging that felt as physical as the pots, without the waste of rigid gift boxes.',
    approach: [
      'Each sleeve is a single folded sheet of unbleached board, debossed with the kiln-shelf pattern the pot was fired on.',
      'Colour is limited to one ember ink. Glaze names are typeset like geological strata on the spine.',
      'The display system re-uses shipping crates, so nothing is built for the shelf that cannot travel back.',
    ],
    outcomes: [
      { value: '1', label: 'sheet per sleeve, no glue' },
      { value: '1', label: 'ink colour across the range' },
      { value: '9', label: 'glaze families named' },
    ],
    art: 'monolith',
    seed: 11,
  },
  {
    slug: 'verdant-seed-archive',
    title: 'Verdant Seed Archive',
    client: 'Verdant Seed Archive (fictional)',
    year: '2024',
    discipline: 'Spatial & exhibition',
    services: ['Exhibition design', 'Motion', 'Interactive tables'],
    summary: 'A travelling exhibition about the slowest library on earth.',
    brief:
      'The archive stores seeds for decades. They wanted visitors to feel that time scale in a fifteen-minute walk-through.',
    approach: [
      'The route is a woven timeline: each step forward on the floor graphic is one year of storage.',
      'Interactive tables run on a ten-second loop so the motion never rushes the reading.',
      'Every surface packs flat into four crates, so the show can travel by rail.',
    ],
    outcomes: [
      { value: '15', label: 'minute route, end to end' },
      { value: '4', label: 'flat-pack crates for the full show' },
      { value: '6', label: 'host venues on the sample tour' },
    ],
    art: 'weave',
    seed: 19,
  },
  {
    slug: 'noct-audio',
    title: 'Noct Audio',
    client: 'Noct Audio (fictional)',
    year: '2024',
    discipline: 'Launch film & motion',
    services: ['Motion identity', 'Launch film', 'Product UI'],
    summary: 'A launch system for headphones designed to be used with the lights off.',
    brief:
      'Noct’s first product dims every LED to near-invisible. The launch had to sell a product whose best feature is that you can’t see it.',
    approach: [
      'We shot nothing. The film is built from a single procedural flare that brightens with the audio.',
      'The motion rules are strict: one light source, one easing curve and no cut faster than half a second.',
      'Product UI inherits the flare as a volume indicator, so brand and interface are the same object.',
    ],
    outcomes: [
      { value: '1', label: 'light source in every frame' },
      { value: '0.5s', label: 'shortest cut in the film' },
      { value: '3', label: 'motion rules for the whole system' },
    ],
    art: 'flare',
    seed: 23,
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
export const nextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
