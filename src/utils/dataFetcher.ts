import Cookies from 'js-cookie';

export const checkAndFetchData = async (setIsLoading: (isLoading: boolean) => void, setLoadingProgress: (progress: number) => void, setLoadingMessage: (message: string) => void) => {
  try {
    const response = await fetch('https://api.swarmada.wiki');
    const data = await response.json();
    const lastModified = data.lastModified;
    const savedLastModified = Cookies.get('lastModified');
    const isDataMissing = !localStorage.getItem('ships') || !localStorage.getItem('squadrons') || !localStorage.getItem('objectives') || !localStorage.getItem('upgrades');

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

const fetchAndSaveData = async (setLoadingProgress: (progress: number) => void, setLoadingMessage: (message: string) => void) => {
  const endpoints = [
    { name: 'ships', url: '/api/ships/' },
    { name: 'squadrons', url: '/api/squadrons/' },
    { name: 'objectives', url: '/api/objectives/' },
    { name: 'upgrades', url: '/api/upgrades/' },
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const { name, url } = endpoints[i];
    setLoadingMessage(`Fetching ${name} data...`);
    setLoadingProgress((i / endpoints.length) * 100);

    try {
      const response = await fetch(`https://api.swarmada.wiki${url}`);
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
  Cookies.remove('lastModified');
  localStorage.removeItem('ships');
  localStorage.removeItem('squadrons');
  localStorage.removeItem('objectives');
  localStorage.removeItem('upgrades');
  await checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
};
