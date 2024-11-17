# Armada Legacy Fleet Builder

A modern web application for building and managing fleets for tabletop fleet combat games, with primary support for Star Wars: Armada and expanding support for other systems.

## Features

### Core Fleet Building
- Intuitive ship and squadron selection
- Real-time point calculation
- Upgrade card management
- Objective card selection
- Fleet import/export functionality
- Local storage fleet saving

### Supported Factions
- **Star Wars: Armada**
  - Rebel Alliance
  - Galactic Empire
  - Galactic Republic
  - Separatist Alliance
- **Legends Content**
  - UNSC (Halo)
  - Covenant Empire (Halo)
  - Colonial Fleet (Battlestar Galactica)
  - Cylon Alliance (Battlestar Galactica)

### Modern Web Features
- Dark/Light theme support
- Responsive design
- Mobile-friendly interface
- Print-friendly fleet lists
- User authentication (via Auth0)
- Cloud fleet storage (via Supabase)

## Getting Started

1. Install dependencies:
```bash
    npm install
``` 

2. Start the development server:
```bash
    npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology Stack

- **Framework**: Next.js 14
- **Styling**: 
  - Tailwind CSS
  - shadcn/ui components
  - Radix UI primitives
- **Authentication**: Auth0
- **Database**: Supabase
- **State Management**: React Hooks
- **Image Optimization**: Sharp & Blurhash
- **Analytics**: Vercel Analytics

## Project Structure

```
.
├── public/               # Static assets (images, icons, markdown)
│   ├── icons/           # Faction and upgrade type icons
│   ├── images/          # Ship and squadron artwork
│   └── faq.md          # FAQ content
├── scripts/             # Build and data generation scripts
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI components (shadcn/ui)
│   │   └── ...         # Feature-specific components
│   ├── generated/       # Auto-generated files
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and shared logic
│   ├── pages/          # Next.js pages and API routes
│   └── styles/         # Global styles and Tailwind config
├── templates/          # JSON templates for data structures
└── types/             # TypeScript type definitions
```

### Key Directories and Files

#### `/src/components`
- **Feature Components**: Main building blocks of the application
  - `FleetBuilder.tsx` - Core fleet building interface
  - `FactionSelection.tsx` - Faction selection component
  - `StarryBackground.tsx` - Animated background effect
- **UI Components**: Reusable UI elements built with shadcn/ui
  - `ui/button.tsx` - Button components
  - `ui/dialog.tsx` - Modal dialogs
  - `ui/toast.tsx` - Notification system

#### `/src/pages`
- **Main Routes**:
  - `index.tsx` - Homepage with faction selection
  - `[faction]/index.tsx` - Dynamic faction-specific fleet builder
  - `faq.tsx` - FAQ page
- **API Routes**: Backend endpoints for data fetching

#### `/src/hooks`
- Custom React hooks for:
  - Fleet management
  - Data persistence
  - Theme switching
  - Authentication

#### `/public`
- **Static Assets**:
  - Faction logos
  - Ship artwork
  - Squadron images
  - Documentation

#### `/templates`
- JSON templates defining:
  - Ship data structure
  - Upgrade card format
  - Squadron specifications
  - Objective card format

#### `/scripts`
- Build-time scripts:
  - Image optimization
  - Data generation
  - Placeholder generation for images

## Development

The project uses TypeScript for type safety and follows modern React patterns. Key directories:

- `/src/components` - Reusable React components
- `/src/pages` - Next.js pages and API routes
- `/src/styles` - Global styles and Tailwind configuration
- `/public` - Static assets and icons
- `/templates` - JSON templates for data structures

## Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/Polkadoty/armada-list-builder) to:
- Report bugs
- Submit feature requests
- Create pull requests

## Support

If you find this project helpful, consider:
- Supporting development on [Ko-fi](https://ko-fi.com/polkadoty)
- Reporting bugs through GitHub issues
- Contributing to the codebase

## License

This is a fan-made project and is not officially associated with Star Wars: Armada, Atomic Mass Games, Lucasfilm Limited, or its publishers.



This structure follows Next.js conventions while organizing feature-specific code into logical groupings. The separation of concerns allows for easy maintenance and scalability of the application.