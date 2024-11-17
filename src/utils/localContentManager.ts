import { ShipModel } from "@/components/ShipSelector";
import { Upgrade } from "@/components/FleetBuilder";
import { Squadron } from "@/components/FleetBuilder";
import { Objective } from "@/components/FleetBuilder";

export type LocalContentType = 'ships' | 'squadrons' | 'upgrades' | 'objectives';

interface ContentData {
  ships?: Record<string, ShipModel>;
  upgrades?: Record<string, Upgrade>;
  squadrons?: Record<string, Squadron>;
  objectives?: Record<string, Objective>;
}

interface LocalContent {
  ships: ContentData['ships'];
  upgrades: ContentData['upgrades'];
  squadrons: ContentData['squadrons'];
  objectives: ContentData['objectives'];
}

export const saveLocalContent = (content: ContentData, type: keyof LocalContent) => {
  const storageKey = `local${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const existingContent = localStorage.getItem(storageKey);
  let newContent;

  if (existingContent) {
    const parsed = JSON.parse(existingContent);
    newContent = { ...parsed, ...content };
  } else {
    newContent = content;
  }

  localStorage.setItem(storageKey, JSON.stringify(newContent));
};

export const getLocalContent = (type: LocalContentType): Record<string, any> => {
  const storageKey = `local${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const content = localStorage.getItem(storageKey);
  return content ? JSON.parse(content) : {};
};

export const clearLocalContent = (type: LocalContentType) => {
  const storageKey = `local${type.charAt(0).toUpperCase() + type.slice(1)}`;
  localStorage.removeItem(storageKey);
}; 