// utils/imagePreloader.ts
export function preloadImages(urls: string[]) {
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }