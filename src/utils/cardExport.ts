// import { ImagePool } from '@squoosh/lib';
// import { cpus } from 'os';

// export async function exportCardAsWebP(
//   cardElement: HTMLElement,
//   quality = 75
// ): Promise<Blob> {
//   // Convert DOM to canvas
//   const canvas = await html2canvas(cardElement, {
//     scale: 2,
//     useCORS: true,
//     allowTaint: true,
//   });

//   // Use squoosh to compress
//   const imagePool = new ImagePool(cpus().length);
//   const image = imagePool.ingestImage(canvas.toDataURL('image/png'));

//   await image.encode({
//     webp: {
//       quality
//     }
//   });

//   const { binary } = await image.encodedWith.webp;
//   await imagePool.close();

//   return new Blob([binary], { type: 'image/webp' });
// } 