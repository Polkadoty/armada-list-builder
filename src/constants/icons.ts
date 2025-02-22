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
  relay: '\uE00A',
  rogue: '\uE00B',
  scout: '\uE00C',
  screen: '\uE00D',
  snipe: '\uE00E',
  strategic: '\uE00F',
  swarm: '\uE010',

  // Commands
  squad: '\uE100',
  con_fire: '\uE101',
  repair: '\uE102',
  navigate: '\uE103',
  squad_raid: '\uE104',
  con_fire_raid: '\uE105',
  repair_raid: '\uE106',
  navigate_raid: '\uE107',
  // Dice
  hit: '\uE108',
  crit: '\uE109',
  accuracy: '\uE110',

  // Defense Tokens
  evade: '\uE111',
  brace: '\uE112',
  scatter: '\uE110',
  redirect: '\uE113',
  contain: '\uE114',
  salvo: '\uE115',

  // Add more icon mappings as needed
} as const;

// Helper function to convert :shortcode: to icon character
export function replaceIconShortcodes(text: string): string {
  return text.replace(/:([a-z-]+):/g, (match, code) => {
    const icon = ICON_MAP[code as keyof typeof ICON_MAP];
    return icon || match; // Return original text if no mapping found
  });
} 