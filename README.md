<p align="center">
  <img width="100" src="/readme-assets/logo-circle.png" alt="e2b logo">
</p>

# E2B Dashboard

## Overview
Our Dashboard is a modern, feature-rich web application built to manage and monitor E2B services. Built with Next.js 15 and React 19, it provides a seamless user experience for managing sandboxes, API keys, and usage analytics.

## Features
- 🚀 **Modern Stack**: Built with Next.js 15, React 19, and TypeScript
- 🎨 **Beautiful UI**: Crafted with Radix UI and Shadcn components
- 📊 **Real-time Analytics**: Monitor your sandbox usage and performance
- 🔐 **Authentication**: Secure authentication powered by Supabase
- 📱 **Responsive Design**: Works seamlessly across all devices
- 📖 **Documentation**: Integrated MDX documentation support
- 🔄 **State Management**: Efficient state handling with Zustand, SWR, and React Query
- 🎯 **Type Safety**: Full TypeScript support throughout the codebase

## Getting Started

### Prerequisites
- Node.js 18+ or Bun 1.2+
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/e2b-dev/dashboard.git
cd dashboard
```

2. Install dependencies
```bash
bun install
# or
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in the required environment variables in `.env.local`

4. Start the development server
```bash
bun dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

## Development

### Available Scripts
- `bun run dev` - Start development server
- `bun run build` - Create production build
- `bun run start` - Start production server
- `bun run storybook` - Launch Storybook for component development

### Project Structure
```
src/
├── app/          # Next.js app router pages
├── features/     # Feature-specific components
├── ui/           # Reusable UI components
├── lib/          # Utility functions and shared logic
├── styles/       # Global styles and Tailwind config
└── types/        # TypeScript type definitions
└── server/       # Server only logic & actions 
```

## Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License
This project is licensed under the terms specified in [LICENSE](LICENSE).

## Support
- Documentation: [E2B Docs](https://e2b.dev/docs)
- Issues: [GitHub Issues](https://github.com/e2b-dev/dashboard/issues)
- Discord: [Join our Community](https://discord.gg/e2b)