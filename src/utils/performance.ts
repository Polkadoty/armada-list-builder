export const measurePerformance = (component: string) => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    console.debug(`${component} render time: ${end - start}ms`);
  };
}; 