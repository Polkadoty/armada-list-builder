import Cookies from 'js-cookie';
import { checkAndFetchData, flushCacheAndReload } from './dataFetcher';

interface ContentState {
  enableLegacy: boolean;
  enableLegends: boolean;
  enableLegacyBeta: boolean;
  enableArc: boolean;
  enableNexus: boolean;
  enableProxy: boolean;
}

// Track the last loaded content state
let lastLoadedContentState: ContentState | null = null;

// Get current content state from cookies
function getCurrentContentState(): ContentState {
  return {
    enableLegacy: Cookies.get('enableLegacy') === 'true',
    enableLegends: Cookies.get('enableLegends') === 'true',
    enableLegacyBeta: Cookies.get('enableLegacyBeta') === 'true',
    enableArc: Cookies.get('enableArc') === 'true',
    enableNexus: Cookies.get('enableNexus') === 'true',
    enableProxy: Cookies.get('enableProxy') === 'true',
  };
}

// Check if content state has changed
function hasContentStateChanged(current: ContentState, previous: ContentState | null): boolean {
  if (!previous) return true;
  
  return (
    current.enableLegacy !== previous.enableLegacy ||
    current.enableLegends !== previous.enableLegends ||
    current.enableLegacyBeta !== previous.enableLegacyBeta ||
    current.enableArc !== previous.enableArc ||
    current.enableNexus !== previous.enableNexus ||
    current.enableProxy !== previous.enableProxy
  );
}

// Store the content state that was loaded
function setLoadedContentState(state: ContentState) {
  lastLoadedContentState = { ...state };
  // Store in localStorage for persistence across page loads
  localStorage.setItem('loadedContentState', JSON.stringify(state));
}

// Load the previously loaded content state from localStorage
function loadPreviousContentState(): ContentState | null {
  try {
    const stored = localStorage.getItem('loadedContentState');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading previous content state:', error);
  }
  return null;
}

// Initialize the content manager
function initializeContentManager() {
  lastLoadedContentState = loadPreviousContentState();
}

// Smart content loading that only reloads when content toggles change
export async function smartCheckAndFetchData(
  setIsLoading: (isLoading: boolean) => void,
  setLoadingProgress: (progress: number) => void,
  setLoadingMessage: (message: string) => void,
  forceReload: boolean = false
): Promise<void> {
  // Initialize if not already done
  if (lastLoadedContentState === null) {
    initializeContentManager();
  }

  const currentState = getCurrentContentState();
  const previousState = lastLoadedContentState;

  // Check if we need to reload content
  const contentStateChanged = hasContentStateChanged(currentState, previousState);
  
  // Check if essential data is missing (first time load)
  const isDataMissing =
    !localStorage.getItem("ships") ||
    !localStorage.getItem("squadrons") ||
    !localStorage.getItem("objectives") ||
    !localStorage.getItem("upgrades") ||
    !localStorage.getItem("imageLinks") ||
    !localStorage.getItem("aliases");
  
  if (forceReload || contentStateChanged || isDataMissing) {
    if (forceReload) {
      console.log('Force reload requested, fetching data...');
    } else if (isDataMissing) {
      console.log('Essential data missing (first time load), fetching data...');
    } else {
      console.log('Content state changed, fetching data...');
      console.log('Previous state:', previousState);
      console.log('Current state:', currentState);
    }
    
    await checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage, forceReload);
    setLoadedContentState(currentState);
  } else {
    console.log('Content state unchanged, skipping data fetch entirely');
    // Content state is the same, so we can skip loading entirely
    // Just do a quick check for API updates without showing loading screen
    await checkForApiUpdatesOnly();
  }
}

// Lightweight check for API updates without triggering loading screens
async function checkForApiUpdatesOnly(): Promise<void> {
  try {
    // Use primary API URL for quick lastModified check
    const primaryApiUrl = process.env.NEXT_PUBLIC_PRIMARY_API_URL || 'https://api.swarmada.wiki';
    const response = await fetch(primaryApiUrl, {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = await response.json();
    const lastModified = data.lastModified;
    const savedLastModified = Cookies.get('lastModified');
    
    // Only update the lastModified cookie if API has newer data
    // but don't trigger a reload since content toggles haven't changed
    if (savedLastModified !== lastModified) {
      console.log('API has newer data, but content toggles unchanged - updating lastModified only');
      Cookies.set('lastModified', lastModified, { expires: 7, sameSite: 'Strict' });
    }
  } catch (error) {
    console.error('Error checking API updates:', error);
  }
}

// Force reload content and update state tracking
export async function forceReloadContent(
  setIsLoading: (isLoading: boolean) => void,
  setLoadingProgress: (progress: number) => void,
  setLoadingMessage: (message: string) => void
): Promise<void> {
  console.log('Force reloading content...');
  
  // Check if we really need to reload
  const currentState = getCurrentContentState();
  const previousState = lastLoadedContentState;
  
  // Only reload if the content state actually changed or essential data is missing
  const contentStateChanged = hasContentStateChanged(currentState, previousState);
  const isDataMissing =
    !localStorage.getItem("ships") ||
    !localStorage.getItem("squadrons") ||
    !localStorage.getItem("objectives") ||
    !localStorage.getItem("upgrades") ||
    !localStorage.getItem("imageLinks") ||
    !localStorage.getItem("aliases");
  
  if (contentStateChanged || isDataMissing) {
    await flushCacheAndReload(setIsLoading, setLoadingProgress, setLoadingMessage);
  } else {
    console.log('Content state unchanged, skipping reload');
  }
  
  setLoadedContentState(currentState);
}

// Update content state when toggles change (for use in ContentToggleButton)
export function updateContentStateAfterToggle() {
  const currentState = getCurrentContentState();
  setLoadedContentState(currentState);
}

// Reset content state tracking (useful for debugging)
export function resetContentStateTracking() {
  lastLoadedContentState = null;
  localStorage.removeItem('loadedContentState');
} 