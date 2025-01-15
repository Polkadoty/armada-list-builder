import { Squadron, ContentSource } from '@/components/FleetBuilder';

interface SquadronData {
  name: string;
  faction: string;
  squadron_type: string;
  ace_name?: string;
  hull: number;
  speed: number;
  points: number;
  tokens: {
    def_scatter?: number;
    def_evade?: number;
    def_brace?: number;
  };
  armament: {
    'anti-squadron': [number, number, number];
    'anti-ship': [number, number, number];
  };
  abilities: Record<string, boolean | number>;
  ability?: string;
  unique: boolean;
  ace: boolean;
  unique_class: string[];
  irregular?: boolean;
  cardimage?: string;
}

export function transformSquadronForDB(squadronData: SquadronData) {
  return {
    name: squadronData.name,
    faction: squadronData.faction,
    squadron_type: squadronData.squadron_type,
    ace_name: squadronData.ace_name,
    hull: squadronData.hull,
    speed: squadronData.speed,
    points: squadronData.points,
    tokens: squadronData.tokens,
    armament: squadronData.armament,
    abilities: squadronData.abilities,
    ability: squadronData.ability,
    unique: squadronData.unique,
    ace: squadronData.ace,
    unique_class: squadronData.unique_class,
    irregular: squadronData.irregular,
    cardimage: squadronData.cardimage
  };
}

export function transformDBToSquadron(dbData: SquadronData): Squadron {
  const abilityText = Object.entries(dbData.abilities)
    .filter(([_, value]) => value !== 0 && value !== false)
    .map(([key, value]) => typeof value === 'boolean' ? key : `${key} ${value}`)
    .join(' ');

  const armamentText = Object.entries(dbData.armament)
    .map(([key, value]) => {
      const diceColors = ['red', 'blue', 'black'];
      return value.map((dice: number, index: number) => 
        dice > 0 ? `${key} ${diceColors[index]}` : ''
      ).filter(Boolean);
    }).flat().join(' ');

  return {
    id: dbData.name,
    name: dbData.name,
    'ace-name': dbData.ace_name || '',
    squadron_type: dbData.squadron_type,
    points: dbData.points,
    cardimage: dbData.cardimage || '',
    faction: dbData.faction,
    hull: dbData.hull,
    speed: dbData.speed,
    unique: dbData.unique,
    count: 1,
    ace: dbData.ace,
    abilities: dbData.abilities,
    tokens: dbData.tokens,
    armament: dbData.armament,
    'unique-class': dbData.unique_class,
    source: 'community' as ContentSource,
    searchableText: JSON.stringify({
      ...dbData,
      abilities: abilityText,
      armament: armamentText
    }).toLowerCase()
  };
} 