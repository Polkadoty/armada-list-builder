import { decode } from 'blurhash';
import fs from 'fs';
import path from 'path';
import Sharp from 'sharp';

async function fetchImageLinks() {
  const baseUrl = process.env.NEXT_PUBLIC_USE_BACKUP_API === 'true' 
    ? 'https://api-backup.swarmada.wiki'
    : 'https://api.swarmada.wiki';
    
  const response = await fetch(`${baseUrl}/image-links/`);
  return response.json();
}

async function decodeBlurhash(blurhash: string, width: number, height: number): Promise<string> {
  const pixels = decode(blurhash, width, height);
  
  // Create a raw RGB buffer from the pixels
  const raw = Buffer.from(new Uint8Array(pixels.buffer));
  
  // Use Sharp to convert the raw buffer to a base64 PNG
  const image = Sharp(raw, {
    raw: {
      width,
      height,
      channels: 4
    }
  });

  const buffer = await image.png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generatePlaceholderMap() {
  const imageLinks = await fetchImageLinks();
  const placeholderMap: Record<string, string> = {};

  // Process blurhashes in parallel for better performance
  await Promise.all(
    Object.entries(imageLinks).map(async ([key, value]: [string, any]) => {
      if (value.blurhash) {
        // Store with just the filename, no extension
        const imageKey = key.split('/').pop()?.split('.')[0] || key;
        placeholderMap[imageKey] = await decodeBlurhash(value.blurhash, 32, 32);
      }
    })
  );

  const outputPath = path.join(process.cwd(), 'src/generated/placeholderMap.ts');
  const fileContent = `// Generated placeholder map
export const placeholderMap: Record<string, string> = ${JSON.stringify(placeholderMap, null, 2)};`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent);
}

generatePlaceholderMap().catch(console.error);