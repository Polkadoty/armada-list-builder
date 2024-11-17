export type LocalContentType = 'ships' | 'squadrons' | 'upgrades' | 'objectives';

interface LocalContent {
  ships: Record<string, any>;
  squadrons: Record<string, any>;
  upgrades: Record<string, any>;
  objectives: Record<string, any>;
}

export const saveLocalContent = (type: LocalContentType, content: any) => {
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