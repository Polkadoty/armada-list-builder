import Cookies from 'js-cookie';

const getPrimaryApiUrl = () => process.env.NEXT_PUBLIC_PRIMARY_API_URL || 'https://api.swarmada.wiki';
const getBackupApiUrl = () => process.env.NEXT_PUBLIC_BACKUP_API_URL || 'https://api-backup.swarmada.wiki';

const checkApiHealth = async (url: string, bustCache: boolean = false): Promise<boolean> => {
  try {
    const fetchUrl = bustCache ? `${url}?_t=${Date.now()}` : url;
    const response = await fetch(fetchUrl, { 
      signal: AbortSignal.timeout(5000),
      cache: bustCache ? 'no-cache' : 'default',
      headers: bustCache ? { 'Cache-Control': 'no-cache' } : {}
    });
    const data = await response.json();
    return !!data.lastModified;
  } catch {
    return false;
  }
};

const getApiUrl = async (bustCache: boolean = false): Promise<string> => {
  const useBackup = process.env.NEXT_PUBLIC_USE_BACKUP_API === 'true';
  const primaryUrl = getPrimaryApiUrl();
  const backupUrl = getBackupApiUrl();

  if (useBackup) {
    return backupUrl;
  }

  // Check if primary API is healthy
  const isPrimaryHealthy = await checkApiHealth(primaryUrl, bustCache);
  return isPrimaryHealthy ? primaryUrl : backupUrl;
};

export const checkAndFetchData = async (
  setIsLoading: (isLoading: boolean) => void,
  setLoadingProgress: (progress: number) => void,
  setLoadingMessage: (message: string) => void,
  forceReload: boolean = false
) => {
  try {
    const apiUrl = await getApiUrl(forceReload);
    const fetchUrl = forceReload ? `${apiUrl}?_t=${Date.now()}` : apiUrl;
    const response = await fetch(fetchUrl, {
      cache: forceReload ? 'no-cache' : 'default',
      headers: forceReload ? { 'Cache-Control': 'no-cache' } : {}
    });
    const data = await response.json();
    const lastModified = data.lastModified;
    const savedLastModified = Cookies.get('lastModified');
    
    console.log('API lastModified:', lastModified);
    console.log('Saved lastModified:', savedLastModified);
    
    const isDataMissing =
      !localStorage.getItem("ships") ||
      !localStorage.getItem("squadrons") ||
      !localStorage.getItem("objectives") ||
      !localStorage.getItem("upgrades") ||
      !localStorage.getItem("imageLinks") ||
      !localStorage.getItem("aliases")
      // !localStorage.getItem("updates")

    if (forceReload || savedLastModified !== lastModified || isDataMissing) {
      console.log('Triggering data fetch:', { forceReload, lastModifiedChanged: savedLastModified !== lastModified, isDataMissing });
      setIsLoading(true);
      await fetchAndSaveData(setLoadingProgress, setLoadingMessage, forceReload);
      Cookies.set('lastModified', lastModified, { expires: 7, sameSite: 'Strict' });
      setIsLoading(false);
    } else {
      console.log('Data is up to date, skipping fetch');
    }
  } catch (error) {
    console.error('Error checking API status:', error);
  }
};

const fetchAndSaveData = async (
  setLoadingProgress: (progress: number) => void,
  setLoadingMessage: (message: string) => void,
  forceReload: boolean = false
) => {
  const apiUrl = await getApiUrl(forceReload);
  const enableLegacy = Cookies.get('enableLegacy') === 'true';
  const enableLegends = Cookies.get('enableLegends') === 'true';
  const enableNexus = Cookies.get('enableNexus') === 'true';
  const enableNexusExperimental = Cookies.get('enableNexusExperimental') === 'true';
  const enableLegacyBeta = Cookies.get('enableLegacyBeta') === 'true';
  const enableArc = Cookies.get('enableArc') === 'true';
  const enableArcBeta = Cookies.get('enableArcBeta') === 'true';
  const enableNaboo = Cookies.get('enableNaboo') === 'true';
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

  if (enableNexusExperimental) {
    endpoints.push(
      { name: 'nexusExperimentalShips', url: '/nexus-experimental/ships/' },
      { name: 'nexusExperimentalSquadrons', url: '/nexus-experimental/squadrons/' },
      { name: 'nexusExperimentalUpgrades', url: '/nexus-experimental/upgrades/' }
    );
  }

  if (enableLegacyBeta) {
    endpoints.push(
      { name: 'legacyBetaShips', url: '/legacy-beta/ships/' },
      { name: 'legacyBetaSquadrons', url: '/legacy-beta/squadrons/' },
      { name: 'legacyBetaUpgrades', url: '/legacy-beta/upgrades/' }
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

  if (enableArcBeta) {
    endpoints.push(
      { name: 'arcBetaShips', url: '/arc-beta/ships/' },
      { name: 'arcBetaSquadrons', url: '/arc-beta/squadrons/' },
      { name: 'arcBetaUpgrades', url: '/arc-beta/upgrades/' },
      { name: 'arcBetaObjectives', url: '/arc-beta/objectives/' }
    );
  }

  if (enableNaboo) {
    endpoints.push(
      { name: 'nabooShips', url: '/naboo/ships/' },
      { name: 'nabooSquadrons', url: '/naboo/squadrons/' },
      { name: 'nabooUpgrades', url: '/naboo/upgrades/' }
    );
  }

  const cacheBustParam = forceReload ? `?_t=${Date.now()}` : '';
  const fetchOptions = forceReload ? {
    cache: 'no-cache' as RequestCache,
    headers: { 'Cache-Control': 'no-cache' }
  } : {};

  for (let i = 0; i < endpoints.length; i++) {
    const { name, url } = endpoints[i];
    setLoadingMessage(`Fetching ${name} data...`);
    setLoadingProgress((i / endpoints.length) * 100);

    try {
      const fetchUrl = `${apiUrl}${url}${cacheBustParam}`;
      console.log(`Fetching ${name} from: ${fetchUrl}`);
      const response = await fetch(fetchUrl, fetchOptions);
      const data = await response.json();
      localStorage.setItem(name, JSON.stringify(data));
    } catch (error) {
      console.error(`Error fetching ${name} data:`, error);
    }
  }

  setLoadingProgress(100);
  setLoadingMessage('Data loading complete!');
};

export const flushCacheAndReload = async (
  setIsLoading: (isLoading: boolean) => void, 
  setLoadingProgress: (progress: number) => void, 
  setLoadingMessage: (message: string) => void
) => {
  console.log('Flush cache and reload triggered');
  
  // Clear existing caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('Cleared all browser caches');
    } catch (error) {
      console.error('Error clearing browser caches:', error);
    }
  }
  
  // Remove AMG cookie
  Cookies.remove('enableAMG');
  
  // Remove lastModified to force refresh
  Cookies.remove('lastModified');
  console.log('Removed lastModified cookie');

  // Remove all localStorage items
  const itemsToRemove = [
    'ships', 'squadrons', 'objectives', 'upgrades', 'imageLinks', 'aliases', 
    'errataKeys', 'expansions', 'releases', 'updates',
    'amgShips', 'amgSquadrons', 'amgUpgrades', 'amgObjectives',
    'legacyShips', 'legacySquadrons', 'legacyUpgrades',
    'oldLegacyShips', 'oldLegacySquadrons', 'oldLegacyUpgrades',
    'legendsShips', 'legendsSquadrons', 'legendsUpgrades',
    'nexusShips', 'nexusSquadrons', 'nexusUpgrades',
    'legacyBetaShips', 'legacyBetaSquadrons', 'legacyBetaUpgrades',
    'arcShips', 'arcSquadrons', 'arcUpgrades', 'arcObjectives',
    'nabooShips', 'nabooSquadrons', 'nabooUpgrades'
  ];

  itemsToRemove.forEach(item => {
    localStorage.removeItem(item);
  });

  // Reset sorting state cookies
  Cookies.remove('sortState_ships');
  Cookies.remove('sortState_squadrons');
  Cookies.remove('sortState_upgrades');

  console.log('Cleared all localStorage items and sorting cookies');

  // Force reload with cache busting
  await checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage, true);
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
