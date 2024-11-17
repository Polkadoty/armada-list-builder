import { decode } from 'blurhash';
import fs from 'fs';
import path from 'path';
import Sharp from 'sharp';

async function fetchImageLinks() {
  const response = await fetch('https://api.swarmada.wiki/image-links/');
  return response.json();
}

async function decodeBlurhash(blurhash: string, width: number, height: number): Promise<string> {
  const pixels = decode(blurhash, width, height);
  
  // Create a raw RGB buffer from the pixels
  const raw = Buffer.from(pixels);
  
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
        placeholderMap[key] = await decodeBlurhash(value.blurhash, 32, 32);
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