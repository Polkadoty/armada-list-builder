export const ICON_MAP = {
  // Keywords
  adept: '\u006E',
  ai: '\u0071',
  assault: '\u0069',
  bomber: '\u0065',
  cloak: '\u006A',
  counter: '\u0067',
  dodge: '\u006F',
  escort: '\u0064',
  grit: '\u0062',
  heavy: '\u0068',
  intel: '\u0061',
  relay: '\u006B',
  rogue: '\u0063',
  scout: '\u0070',
  screen: '\u0072',
  snipe: '\u006D',
  strategic: '\u006C',
  swarm: '\u0066',

  // Commands
  squad: '\u0038',
  con_fire: '\u0039',
  repair: '\u0030',
  navigate: '\u0037',
  squad_raid: '\u002A',
  con_fire_raid: '\u0028',
  repair_raid: '\u0029',
  navigate_raid: '\u0026',

  // Dice
  hit: '\u0053',
  crit: '\u0054',
  accuracy: '\u0055',

  // Defense Tokens
  evade: '\u0034',
  brace: '\u0033',
  scatter: '\u0031',
  redirect: '\u0032',
  contain: '\u0035',
  salvo: '\u0036',

  // Tokens
  objective: '\u0021',
  grav: '\u003A',
  grav_used: '\u003B',
  assault_obj: '\u003D',
  defense_obj: '\u003E',
  navigation_obj: '\u003C',
  base_obj: '\u003F',
  base2_obj: '\u0040',

  // Upgrades
  title: '\u0041',
  commander: '\u0042',
  officer: '\u0043',
  turbolaser: '\u0044',
  ion_cannon: '\u0045',
  ordnance: '\u0046',
  offensive_retro: '\u0047',
  defensive_retro: '\u0048',
  weapons_team: '\u0049',
  support_team: '\u004A',
  fleet_support: '\u004B',
  experimental_retro: '\u004C',
  fleet_command: '\u004D',
  superweapon: '\u004E',

  // Card
  speed: '\u0057',
  hull: '\u0058',
  armament: '\u0059',
  battery: '\u005A',
  unique: '\u0078',

  // Other
  recur: '\u0022',
  nonrecur: '\u0023',
  squadron_symbol: '\u0024',
  aurek: '\u0025',
  besh: '\u0026',
  droid: '\u004F',
  any_dial: '\u0051',
  any_token: '\u0052',
  one_token: '\u00A1',
  two_token: '\u00A2',
  three_token: '\u00A3',
  four_token: '\u00A4',
  five_token: '\u00A5',
  six_token: '\u00A6',
  die: '\u0077',
  dash: '\u0076',

  // Faction
  rebel: '\u005B',
  empire: '\u005C',
  empire_two: '\u005D',
  scum: '\u007B',
  republic: '\u007C',
  separatist: '\u007D',

  // Add more icon mappings as needed
} as const;

// Helper function to convert :shortcode: to icon character
export function replaceIconShortcodes(text: string): string {
  return text.replace(/:([a-z-]+):/g, (match, code) => {
    const icon = ICON_MAP[code as keyof typeof ICON_MAP];
    return icon || match; // Return original text if no mapping found
  });
} 