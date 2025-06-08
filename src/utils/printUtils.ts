import { Ship, Squadron, Objective, ContentSource, DAMAGE_DECK } from '../types/fleet';
import { factionLogos } from '../pages/[faction]';

export interface PrintSettings {
  paperSize: 'letter' | 'a4';
  showPrintRestrictions: boolean;
  showPrintObjectives: boolean;
  showCardBacks: boolean;
  showDamageDeck: boolean;
  expandCardBacks: boolean;
}

// Helper function to format source tags
export const formatSource = (source: ContentSource) => {
  switch (source) {
    case 'legacy':
      return '[Legacy]';
    case 'legends':
      return '[Legends]';
    case 'legacyBeta':
      return '[LegacyBeta]';
    case 'arc':
      return '[ARC]';
    case 'nexus':
      return '[Nexus]';
    default:
      return '';
  }
};

// Helper to check if a ship is huge
export const isHugeShip = (ship: Ship) => ship.size === 'huge' || ship.size === '280-huge';

// Helper function to chunk ships for optimal layout
export const chunkShipsForLayout = (ships: Ship[]) => {
  const chunks: Ship[][] = [];
  let currentChunk: Ship[] = [];

  ships.forEach(ship => {
    if (isHugeShip(ship)) {
      // If we have normal ships pending, add them as a chunk
      if (currentChunk.length > 0) {
        chunks.push([...currentChunk]);
        currentChunk = [];
      }
      // Add huge ship as its own chunk
      chunks.push([ship]);
    } else {
      currentChunk.push(ship);
      // If we have 4 normal ships, create a chunk
      if (currentChunk.length === 4) {
        chunks.push([...currentChunk]);
        currentChunk = [];
      }
    }
  });

  // Add any remaining ships
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

// Generate basic print content (fleet list)
export const generatePrintContent = (
  selectedShips: Ship[],
  selectedSquadrons: Squadron[],
  selectedAssaultObjectives: Objective[],
  selectedDefenseObjectives: Objective[],
  selectedNavigationObjectives: Objective[],
  faction: string,
  fleetName: string,
  points: number,
  fleetViolations: string[],
  settings: PrintSettings
) => {
  const factionLogo = factionLogos[faction as keyof typeof factionLogos];

  const content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${fleetName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        
        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.5;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #f9f9f9;
        }

        .header {
          display: grid;
          grid-template-columns: 1fr 40px 1fr;
          align-items: center;
          gap: 20px;
          margin-bottom: 1.25em;
        }

        .fleet-name {
          font-size: 28px;
          font-weight: bold;
          text-align: right;
        }

        .total-points {
          font-size: 28px;
          font-weight: bold;
          text-align: left;
        }

        .logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .grid {
          border-top: 1px solid #ddd;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1em;
          padding-top: 1.5em;
          margin-bottom: 1.5em;
        }

        .section {
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1em;
        }

        .objectives {
          display: flex;
          justify-content: space-between;
          gap: 1em;
          margin-top: 1.5em;
          border-top: 1px solid #ddd;
          padding-top: 1.5em;
        }

        .objective-card {
          flex: 1;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: .5em;
          padding: .5em;
          text-align: center;
        }

        .objective-card h4 {
          margin: 0px;
          font-size: 18px;
          font-weight: bold;
        }

        .objective-card p {
          margin: 0;
          font-size: 1em;
          color: #666;
        }

        .tournament-info {
          margin-top: 1.5em;
          border-top: 1px solid #ddd;
          padding-top: 1.5em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="fleet-name">${fleetName}</div>
        <img src="${factionLogo}" alt="Faction logo" class="logo">
        <div class="total-points">${points} points</div>
      </div>

      <div class="grid">
        ${selectedShips.map((ship) => `
          <div class="section">
            <strong>${ship.name}</strong> (${ship.points} points)
            ${ship.assignedUpgrades.map((upgrade) => `
              <div class="upgrade">
                <div style="display: flex; align-items: center; gap: 0.25em;">
                  <img src="/icons/${upgrade.type}.svg" style="width: 16px; height: 16px;"/>
                  ${upgrade.name} (${upgrade.points} points)
                </div>
              </div>
            `).join("")}
            <div><strong>Total:</strong> ${ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)} points</div>
          </div>
        `).join("")}
      </div>

      ${selectedSquadrons.length > 0 ? `
        <div class="grid">
          ${selectedSquadrons.map((squadron) => `
            <div class="section">
              <strong>${squadron["ace-name"] || squadron.name}</strong> (${squadron.points} points)${squadron.count > 1 ? ` x${squadron.count}` : ""}
            </div>
          `).join("")}
        </div>
      ` : ''}

      ${settings.showPrintObjectives ? `
        <div class="objectives">
          <div class="objective-card">
            <h4>Assault</h4>
            <p>${selectedAssaultObjectives.length > 0 ? selectedAssaultObjectives.map(obj => obj.name).join(", ") : "None"}</p>
          </div>
          <div class="objective-card">
            <h4>Defense</h4>
            <p>${selectedDefenseObjectives.length > 0 ? selectedDefenseObjectives.map(obj => obj.name).join(", ") : "None"}</p>
          </div>
          <div class="objective-card">
            <h4>Navigation</h4>
            <p>${selectedNavigationObjectives.length > 0 ? selectedNavigationObjectives.map(obj => obj.name).join(", ") : "None"}</p>
          </div>
        </div>
      ` : ''}

      ${settings.showPrintRestrictions ? `
        <div class="tournament-info">
          <h3>Restrictions:</h3>
          ${fleetViolations.length === 0
            ? "<p>This list complies with restrictions.</p>"
            : `
              <p>This list does not comply with restrictions:</p>
              <ul>
                ${fleetViolations.map((violation) => `<li>${violation}</li>`).join("")}
              </ul>
            `}
        </div>
      ` : ''}
    </body>
    </html>`;

  return content;
};

// Generate damage deck content for print
export const generateDamageDeckContent = (settings: PrintSettings) => {
  if (!settings.showDamageDeck) return '';
  
  const damageDeckCards = DAMAGE_DECK.flatMap(card => 
    Array(card.count).fill({
      name: card.name,
      cardimage: `https://api.swarmada.wiki/images/${card.name.toLowerCase().replace(/ /g, '-')}.webp`
    })
  );

  const damagePagesNeeded = Math.ceil(damageDeckCards.length / 9);

  return Array.from({ length: damagePagesNeeded }).map((_, pageIndex) => {
    const startIndex = pageIndex * 9;
    const pageCards = damageDeckCards.slice(startIndex, startIndex + 9);

    return pageCards.length > 0 ? `
      <!-- Damage Cards Front -->
      <div class="page">
        <div class="grid poker-grid">
          ${pageCards.map(card => `
            <div class="poker-card">
              <div class="card-container">
                <img class="card-background" src="${card.cardimage}" alt="" />
                <img class="card-image" src="${card.cardimage}" alt="${card.name}" />
              </div>
            </div>
          `).join('')}
          ${Array.from({ length: 9 - pageCards.length }).map(() => `
            <div class="poker-card">
              <div class="card-container"></div>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${settings.showCardBacks ? `
        <!-- Damage Cards Back -->
        <div class="page">
          <div class="grid poker-grid">
            ${Array.from({ length: 9 }).map((_, index) => {
              const row = Math.floor(index / 3);
              const col = index % 3;
              const reversedCol = 2 - col;
              const reversedIndex = (row * 3) + reversedCol;
              const reversedCard = reversedIndex < pageCards.length ? pageCards[reversedIndex] : null;
              
              if (!reversedCard) {
                return `
                  <div class="poker-card">
                    <div class="card-container"></div>
                  </div>
                `;
              }
              
              return `
                <div class="poker-card" style="transform: scaleX(-1)">
                  <div class="card-container">
                    <img class="card-image" 
                        src="https://api.swarmada.wiki/images/damage-rear.webp" 
                        alt="Damage card back" />
                        style="${settings.expandCardBacks ? 'transform: scale(1.075);' : ''}" />
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    ` : '';
  }).join('');
};

// Calculate optimal layout for ships
const calculateOptimalLayout = (ships: Ship[], settings: PrintSettings) => {
  // Separate huge ships and regular ships
  const hugeShips = ships.filter(ship => isHugeShip(ship));
  const regularShips = ships.filter(ship => !isHugeShip(ship));

  // Define base token sizes in millimeters (actual physical sizes)
  const baseTokenSizes = {
    small: { width: '38.75mm', height: '70.45mm' },
    medium: { width: '58.5mm', height: '101.5mm' },
    large: { width: '73.0mm', height: '128.5mm' },
    huge: { width: '73mm', height: '355mm' },
    '280-huge': { width: '73mm', height: '280mm' }
  };

  // Create individual pages for huge ships
  const hugePages = hugeShips.map(ship => ({
    rows: [{
      ships: [ship],
      height: baseTokenSizes[ship.size as keyof typeof baseTokenSizes].height
    }]
  }));

  // Process regular ships with existing logic
  const regularPages = processRegularShips(regularShips, settings);

  // Combine huge ship pages with regular ship pages
  return [...hugePages, ...regularPages];
};

// Helper function to process regular ships using existing logic
const processRegularShips = (ships: Ship[], settings: PrintSettings) => {
  const margin = 0.5; // inches
  const pageWidth = settings.paperSize === 'letter' ? 8.5 : 210/25.4; // convert mm to inches for A4
  const pageHeight = settings.paperSize === 'letter' ? 11 : 297/25.4;
  const usableWidth = pageWidth - (2 * margin);
  const usableHeight = pageHeight - (2 * margin);
  
  // Convert mm to inches with proper sizes
  const tokenSizes = {
    small: { width: 38.75/25.4, height: 70.45/25.4 },
    medium: { width: 58.5/25.4, height: 101.5/25.4 },
    large: { width: 73.0/25.4, height: 128.5/25.4 },
    huge: { width: 73/25.4, height: 355/25.4 },
    '280-huge': { width: 73/25.4, height: 280/25.4 }
  };

  // Add spacing between tokens (10mm = ~0.394 inches)
  const tokenSpacing = 10/25.4;

  // Sort ships by size (large to small) for better packing
  const sortedShips = [...ships].sort((a, b) => {
    const sizeOrder = { large: 3, medium: 2, small: 1 };
    return sizeOrder[b.size as keyof typeof sizeOrder] - sizeOrder[a.size as keyof typeof sizeOrder];
  });

  const pages: { rows: { ships: Ship[]; height: number }[] }[] = [{ rows: [] }];
  let currentRow: Ship[] = [];
  let currentRowWidth = 0;
  let currentPageHeight = 0;

  sortedShips.forEach(ship => {
    const tokenSize = tokenSizes[ship.size as keyof typeof tokenSizes] || tokenSizes.small;
    const widthWithSpacing = tokenSize.width + tokenSpacing;
    
    if (currentRowWidth + widthWithSpacing > usableWidth && currentRow.length > 0) {
      // Calculate height of current row
      const maxHeight = Math.max(...currentRow.map(s => 
        tokenSizes[s.size as keyof typeof tokenSizes]?.height || tokenSizes.small.height
      ));

      // Check if adding this row would exceed usable height
      if (currentPageHeight + maxHeight + tokenSpacing > usableHeight) {
        // Start new page
        pages.push({ rows: [] });
        currentPageHeight = 0;
      }

      // Add row to current page
      pages[pages.length - 1].rows.push({ ships: currentRow, height: maxHeight });
      currentPageHeight += maxHeight + tokenSpacing;
      
      // Start new row
      currentRow = [];
      currentRowWidth = 0;
    }
    
    currentRow.push(ship);
    currentRowWidth += widthWithSpacing;
  });

  // Handle remaining ships
  if (currentRow.length > 0) {
    const maxHeight = Math.max(...currentRow.map(s => 
      tokenSizes[s.size as keyof typeof tokenSizes]?.height || tokenSizes.small.height
    ));

    if (currentPageHeight + maxHeight + tokenSpacing > usableHeight) {
      pages.push({ rows: [] });
    }

    pages[pages.length - 1].rows.push({ ships: currentRow, height: maxHeight });
  }

  return pages;
};

// Generate print and play content
export const generatePrintnPlayContent = (
  selectedShips: Ship[],
  selectedSquadrons: Squadron[],
  selectedAssaultObjectives: Objective[],
  selectedDefenseObjectives: Objective[],
  selectedNavigationObjectives: Objective[],
  faction: string,
  fleetName: string,
  settings: PrintSettings
) => {
  // Calculate number of pages needed for poker cards
  const allCards = [
    ...selectedSquadrons,
    ...selectedShips.flatMap(ship => ship.assignedUpgrades),
    ...[...selectedAssaultObjectives, ...selectedDefenseObjectives, ...selectedNavigationObjectives].filter((obj): obj is Objective => obj !== null)
  ];
  
  const pokerPagesNeeded = Math.ceil(allCards.length / 9); // 9 cards per page

  // Define base token sizes in millimeters (actual physical sizes)
  const baseTokenSizes = {
    small: { width: '38.75mm', height: '70.45mm' },
    medium: { width: '58.5mm', height: '101.5mm' },
    large: { width: '73.0mm', height: '128.5mm' },
    huge: { width: '73mm', height: '355mm' },
    '280-huge': { width: '73mm', height: '280mm' }
  };

  // Generate base tokens
  const baseTokensHTML = selectedShips
    .filter(ship => !ship.name.includes('Dummy'))  // Filter out dummy ships
    .length > 0 
    ? calculateOptimalLayout(selectedShips.filter(ship => !ship.name.includes('Dummy')), settings)
      .map(page => `
        <div class="page">
          <div class="base-token-grid" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: ${settings.paperSize === 'letter' ? '11in' : '297mm'};
            width: ${settings.paperSize === 'letter' ? '8.5in' : '210mm'};
            margin: 0;
            padding: 0.5in;
            box-sizing: border-box;
          ">
            ${page.rows.map(row => `
              <div style="
                display: flex; 
                justify-content: center; 
                align-items: center;
                margin-bottom: 10mm;
                width: 100%;
                gap: 4mm;  /* Add horizontal spacing between bases */
              ">
                ${row.ships.map(ship => {
                  const baseTokenUrl = ship.cardimage.replace('.webp', '-base.webp');
                  
                  // Handle huge and 280-huge ships differently
                  if (ship.size === 'huge' || ship.size === '280-huge') {
                    const baseHeight = ship.size === 'huge' ? '355mm' : '280mm';
                    const halfHeight = Math.floor(parseInt(baseHeight) / 2) + 'mm';
                    return `
                      <div style="display: flex; flex-direction: row; gap: 4mm;">
                        <!-- Top half -->
                        <div class="base-token" style="
                          width: 73mm;
                          height: ${halfHeight};
                          overflow: hidden;
                          position: relative;
                        ">
                          <img 
                            src="${baseTokenUrl}" 
                            alt="${ship.name} Base Token Top" 
                            style="
                              position: absolute;
                              top: 0;
                              left: 0;
                              width: 73mm;
                              height: ${baseHeight};
                              object-fit: cover;
                              object-position: top;
                            "
                          />
                        </div>
                        <!-- Bottom half -->
                        <div class="base-token" style="
                          width: 73mm;
                          height: ${halfHeight};
                          overflow: hidden;
                          position: relative;
                        ">
                          <img 
                            src="${baseTokenUrl}" 
                            alt="${ship.name} Base Token Bottom" 
                            style="
                              position: absolute;
                              bottom: 0;
                              left: 0;
                              width: 73mm;
                              height: ${baseHeight};
                              object-fit: cover;
                              object-position: bottom;
                            "
                          />
                        </div>
                      </div>
                    `;
                  }
                  
                  // Regular base token rendering for other ships
                  return `
                    <div class="base-token" style="
                      width: ${baseTokenSizes[ship.size as keyof typeof baseTokenSizes]?.width || baseTokenSizes.small.width};
                      height: ${baseTokenSizes[ship.size as keyof typeof baseTokenSizes]?.height || baseTokenSizes.small.height};
                      margin: 0;
                    ">
                      <img 
                        src="${baseTokenUrl}" 
                        alt="${ship.name} Base Token" 
                        style="width: 100%; height: 100%; object-fit: contain;"
                      />
                    </div>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('') 
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Print & Play - ${fleetName}</title>
        <style>
          @page {
            size: ${settings.paperSize};
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .page {
            position: relative;
            width: ${settings.paperSize === 'letter' ? '8.5in' : '210mm'};
            height: ${settings.paperSize === 'letter' ? '11in' : '297mm'};
            display: flex;
            justify-content: center;
            align-items: center;
            page-break-after: always;
          }

          .grid {
            display: grid;
          }

          .tarot-grid {
            grid-template-columns: repeat(2, 2.75in);
            grid-template-rows: repeat(2, 4.75in);
            font-size: 0; /* Removes any potential whitespace */
          }

          .poker-grid {
            grid-template-columns: repeat(3, 2.5in);
            grid-template-rows: repeat(3, 3.5in);
            font-size: 0;
            margin: 0.4in;
          }

          .tarot-card {
            width: 2.75in;
            height: 4.75in;
            position: relative;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .poker-card {
            width: 2.5in;
            height: 3.5in;
            position: relative;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .card-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden; // Add this to ensure the scaled background stays within bounds
          }

          .card-background {
            position: absolute;
            width: 105%;  // Increased from 100% to 105%
            height: 105%; // Increased from 100% to 105%
            top: -2.5%;   // Center the scaled image
            left: -2.5%;  // Center the scaled image
            filter: blur(8px);
            z-index: 1;
            object-fit: cover;
            transform: scale(1.05); // Additional scaling to ensure full coverage
          }

          .card-image {
            position: absolute;
            width: 100%;
            height: 100%;
            object-fit: fill;
            z-index: 2;
          }

          .card-back {
            transform: scaleX(-1);
          }

          .card-back-expanded {
            transform: scaleX(-1) scale(1.075);
            transform-origin: center;
          }

        </style>
    </head>
    <body>
      ${selectedShips.filter(ship => !ship.name.includes('Dummy')).length > 0 ? `
        ${chunkShipsForLayout(selectedShips.filter(ship => !ship.name.includes('Dummy')))
          .map(shipGroup => `
            <!-- Ship Cards Front -->
            <div class="page">
              <div class="grid tarot-grid">
                ${shipGroup.length === 1 && isHugeShip(shipGroup[0]) 
                  ? `
                    <div class="tarot-card" style="
                      width: 5in;
                      height: 4in;
                      grid-column: 1 / span 2;
                      justify-self: center;
                    ">
                      <div class="card-container">
                        <img class="card-background" src="${shipGroup[0].cardimage}" alt="" />
                        <img class="card-image" src="${shipGroup[0].cardimage}" alt="${shipGroup[0].name}" />
                      </div>
                    </div>
                  `
                  : shipGroup.map(ship => `
                    <div class="tarot-card" style="width: 2.75in; height: 4.75in;">
                      <div class="card-container">
                        <img class="card-background" src="${ship.cardimage}" alt="" />
                        <img class="card-image" src="${ship.cardimage}" alt="${ship.name}" />
                      </div>
                    </div>
                  `).join('')
                }
                ${shipGroup.length < 4 && !isHugeShip(shipGroup[0]) 
                  ? Array.from({ length: 4 - shipGroup.length }).map(() => `
                    <div class="tarot-card">
                      <div class="card-container"></div>
                    </div>
                  `).join('')
                  : ''
                }
              </div>
            </div>
            
            ${settings.showCardBacks ? `
              <!-- Ship Cards Back -->
              <div class="page">
                <div class="grid tarot-grid">
                  ${shipGroup.length === 1 && isHugeShip(shipGroup[0])
                    ? `
                      <div class="tarot-card" style="
                        transform: scaleX(-1);
                        width: 5in;
                        height: 4in;
                        grid-column: 1 / span 2;
                        justify-self: center;
                      ">
                        <div class="card-container">
                          <img class="card-image" 
                              src="https://api.swarmada.wiki/images/${shipGroup[0].faction}-ship-huge-rear.webp" 
                              alt="${shipGroup[0].name} back" />
                        </div>
                      </div>
                    `
                    : Array.from({ length: 4 }).map((_, index) => {
                      const row = Math.floor(index / 2);
                      const col = index % 2;
                      const reversedCol = 1 - col;
                      const reversedIndex = (row * 2) + reversedCol;
                      const reversedShip = reversedIndex < shipGroup.length ? shipGroup[reversedIndex] : null;
                      
                      if (!reversedShip) {
                        return `
                          <div class="tarot-card">
                            <div class="card-container"></div>
                          </div>
                        `;
                      }
                      
                      return `
                        <div class="tarot-card" style="transform: scaleX(-1)">
                          <div class="card-container">
                            <img class="card-image" 
                                src="https://api.swarmada.wiki/images/${reversedShip.faction}-ship-rear.webp" 
                                alt="${reversedShip.name} back" />
                          </div>
                        </div>
                      `;
                    }).join('')
                  }
                </div>
              </div>
            ` : ''}
          `).join('')}
      ` : ''}

      ${Array.from({ length: pokerPagesNeeded }).map((_, pageIndex) => {
        const startIndex = pageIndex * 9;
        const pageCards = allCards.slice(startIndex, startIndex + 9);

        return pageCards.length > 0 ? `
          <!-- Poker Cards Front -->
          <div class="page">
            <div class="grid poker-grid">
              ${pageCards.map(card => `
                <div class="poker-card">
                  <div class="card-container">
                    <img class="card-background" src="${card.cardimage}" alt="" />
                    <img class="card-image" src="${card.cardimage}" alt="${card.name}" />
                  </div>
                </div>
              `).join('')}
              ${Array.from({ length: 9 - pageCards.length }).map(() => `
                <div class="poker-card">
                  <div class="card-container"></div>
                </div>
              `).join('')}
            </div>
          </div>
          
          ${settings.showCardBacks ? `
            <!-- Poker Cards Back -->
            <div class="page">
              <div class="grid poker-grid">
                ${Array.from({ length: 9 }).map((_, index) => {
                  const row = Math.floor(index / 3);
                  const col = index % 3;
                  const reversedCol = 2 - col;
                  const reversedIndex = (row * 3) + reversedCol;
                  const reversedCard = reversedIndex < pageCards.length ? pageCards[reversedIndex] : null;
                  
                  if (!reversedCard) {
                    return `
                      <div class="poker-card">
                        <div class="card-container"></div>
                      </div>
                    `;
                  }
                  
                  let rearImage;
                  if ('squadron_type' in reversedCard) {
                    rearImage = `${reversedCard.faction}-squadron-rear`;
                  } 
                  else if ('restrictions' in reversedCard) {
                    rearImage = `${reversedCard.type}-rear`;
                  }
                  else {
                    rearImage = 'objective-rear';
                  }
                  
                  return `
                    <div class="poker-card" style="transform: scaleX(-1)">
                      <div class="card-container">
                        <img class="card-image" 
                             src="https://api.swarmada.wiki/images/${rearImage}.webp" 
                             alt="Card back" />
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        ` : '';
      }).join('')}
      ${generateDamageDeckContent(settings)}
      ${baseTokensHTML}
    </body>
    </html>
  `;
}; 