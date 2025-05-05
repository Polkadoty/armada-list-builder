import Cookies from 'js-cookie';

const getPrimaryApiUrl = () => process.env.NEXT_PUBLIC_PRIMARY_API_URL || 'https://api.swarmada.wiki';
const getBackupApiUrl = () => process.env.NEXT_PUBLIC_BACKUP_API_URL || 'https://api-backup.swarmada.wiki';

const checkApiHealth = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    return !!data.lastModified;
  } catch {
    return false;
  }
};

const getApiUrl = async (): Promise<string> => {
  const useBackup = process.env.NEXT_PUBLIC_USE_BACKUP_API === 'true';
  const primaryUrl = getPrimaryApiUrl();
  const backupUrl = getBackupApiUrl();

  if (useBackup) {
    return backupUrl;
  }

  // Check if primary API is healthy
  const isPrimaryHealthy = await checkApiHealth(primaryUrl);
  return isPrimaryHealthy ? primaryUrl : backupUrl;
};

export const checkAndFetchData = async (
  setIsLoading: (isLoading: boolean) => void,
  setLoadingProgress: (progress: number) => void,
  setLoadingMessage: (message: string) => void
) => {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(apiUrl);
    const data = await response.json();
    const lastModified = data.lastModified;
    const savedLastModified = Cookies.get('lastModified');
    const isDataMissing =
      !localStorage.getItem("ships") ||
      !localStorage.getItem("squadrons") ||
      !localStorage.getItem("objectives") ||
      !localStorage.getItem("upgrades") ||
      !localStorage.getItem("imageLinks") ||
      !localStorage.getItem("aliases")
      // !localStorage.getItem("updates")

    if (savedLastModified !== lastModified || isDataMissing) {
      setIsLoading(true);
      await fetchAndSaveData(setLoadingProgress, setLoadingMessage);
      Cookies.set('lastModified', lastModified, { expires: 7, sameSite: 'Strict' });
      setIsLoading(false);
    }
  } catch (error) {
    console.error('Error checking API status:', error);
  }
};

const fetchAndSaveData = async (
  setLoadingProgress: (progress: number) => void,
  setLoadingMessage: (message: string) => void
) => {
  const apiUrl = await getApiUrl();
  const enableLegacy = Cookies.get('enableLegacy') === 'true';
  const enableLegends = Cookies.get('enableLegends') === 'true';
  const enableNexus = Cookies.get('enableNexus') === 'true';
  const enableOldLegacy = Cookies.get('enableOldLegacy') === 'true';
  const enableArc = Cookies.get('enableArc') === 'true';
  // const enableAMG = Cookies.get('enableAMG') === 'true';

  const endpoints = [
    { name: 'ships', url: '/api/ships/' },
    { name: 'squadrons', url: '/api/squadrons/' },
    { name: 'objectives', url: '/api/objectives/' },
    { name: 'upgrades', url: '/api/upgrades/' },
    { name: 'aliases', url: '/aliases/' },
    { name: 'imageLinks', url: '/image-links/' },
    { name: 'errataKeys', url: '/errata-keys/' },
    { name: 'expansions', url: '/expansions/' },
    { name: 'releases', url: '/releases/' },
    { name: 'updates', url: '/updates/' },
  ];

  if (enableLegacy) {
    endpoints.push(
      { name: 'legacyShips', url: '/legacy/ships/' },
      { name: 'legacySquadrons', url: '/legacy/squadrons/' },
      { name: 'legacyUpgrades', url: '/legacy/upgrades/' }
    );
  }

  if (enableLegends) {
    endpoints.push(
      { name: 'legendsShips', url: '/legends/ships/' },
      { name: 'legendsSquadrons', url: '/legends/squadrons/' },
      { name: 'legendsUpgrades', url: '/legends/upgrades/' }
    );
  }

  if (enableNexus) {
    endpoints.push(
      { name: 'nexusShips', url: '/nexus/ships/' },
      { name: 'nexusSquadrons', url: '/nexus/squadrons/' },
      { name: 'nexusUpgrades', url: '/nexus/upgrades/' }
    );
  }

  if (enableOldLegacy) {
    endpoints.push(
      { name: 'oldLegacyShips', url: '/old-legacy/ships/' },
      { name: 'oldLegacySquadrons', url: '/old-legacy/squadrons/' },
      { name: 'oldLegacyUpgrades', url: '/old-legacy/upgrades/' }
    );
  }

  if (enableArc) {
    endpoints.push(
      { name: 'arcShips', url: '/arc/ships/' },
      { name: 'arcSquadrons', url: '/arc/squadrons/' },
      { name: 'arcUpgrades', url: '/arc/upgrades/' },
      { name: 'arcObjectives', url: '/arc/objectives/' }
    );
  }

  for (let i = 0; i < endpoints.length; i++) {
    const { name, url } = endpoints[i];
    setLoadingMessage(`Fetching ${name} data...`);
    setLoadingProgress((i / endpoints.length) * 100);

    try {
      const response = await fetch(`${apiUrl}${url}`);
      const data = await response.json();
      localStorage.setItem(name, JSON.stringify(data));
    } catch (error) {
      console.error(`Error fetching ${name} data:`, error);
    }
  }

  setLoadingProgress(100);
  setLoadingMessage('Data loading complete!');
};

export const flushCacheAndReload = async (setIsLoading: (isLoading: boolean) => void, setLoadingProgress: (progress: number) => void, setLoadingMessage: (message: string) => void) => {
  // Clear existing caches
  if ('caches' in window) {
    try {
      await caches.delete('optimized-images');
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }
  
  // Remove AMG cookie
  Cookies.remove('enableAMG');
  
  // Remove lastModified to force refresh
  Cookies.remove('lastModified');

  // Remove all localStorage items
  localStorage.removeItem('ships');
  localStorage.removeItem('squadrons');
  localStorage.removeItem('objectives');
  localStorage.removeItem('upgrades');
  localStorage.removeItem('imageLinks');
  localStorage.removeItem('aliases');
  localStorage.removeItem('errataKeys');
  localStorage.removeItem('expansions');
  localStorage.removeItem('releases');
  // localStorage.removeItem('updates');

  // Remove AMG-specific items
  localStorage.removeItem('amgShips');
  localStorage.removeItem('amgSquadrons');
  localStorage.removeItem('amgUpgrades');
  localStorage.removeItem('amgObjectives');

  // Remove other variant items
  localStorage.removeItem('legacyShips');
  localStorage.removeItem('legacySquadrons');
  localStorage.removeItem('legacyUpgrades');
  localStorage.removeItem('legendsShips');
  localStorage.removeItem('legendsSquadrons');
  localStorage.removeItem('legendsUpgrades');
  localStorage.removeItem('nexusShips');
  localStorage.removeItem('nexusSquadrons');
  localStorage.removeItem('nexusUpgrades');
  localStorage.removeItem('oldLegacyShips');
  localStorage.removeItem('oldLegacySquadrons');
  localStorage.removeItem('oldLegacyUpgrades');
  localStorage.removeItem('arcShips');
  localStorage.removeItem('arcSquadrons');
  localStorage.removeItem('arcUpgrades');
  localStorage.removeItem('arcObjectives');

  // Reset sorting state cookies
  Cookies.remove('sortState_ships');
  Cookies.remove('sortState_squadrons');
  Cookies.remove('sortState_upgrades');

  await checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
};

export const sanitizeImageUrl = (url: string): string => {
  if (!url) return url;
  
  const useBackup = process.env.NEXT_PUBLIC_USE_BACKUP_API === 'true';
  const useLowRes = Cookies.get('useLowResImages') === 'true';
  
  let sanitizedUrl = url;
  
  // If we're using the backup API, replace the URL
  if (useBackup) {
    sanitizedUrl = url.replace('api.swarmada.wiki', 'api-backup.swarmada.wiki');
  }
  
  // If low res mode is enabled, modify the URL
  if (useLowRes && sanitizedUrl.includes('/images/')) {
    sanitizedUrl = sanitizedUrl.replace('/images/', '/jpeg-images/').replace('.webp', '.jpg');
  }
  
  return sanitizedUrl;
};
