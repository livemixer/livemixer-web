# Contributing Guide

Contributions to LiveMixer Web are welcome! This guide covers how to set up the development environment, coding standards, and contribution workflow.

## Development Setup

### Prerequisites

- **Node.js** >= 18
- **pnpm** (install with `npm install -g pnpm`)

### Clone and Install

```sh
git clone https://github.com/livemixer/livemixer-web.git
cd livemixer-web
pnpm install
```

### Start Development Server

```sh
pnpm run dev
```

The application will be available at `http://localhost:5173` with hot module replacement.

## Project Structure

```
livemixer-web/
├── docs/               # Documentation
├── protocol/           # Protocol specification (JSON schemas)
├── public/             # Static assets
├── src/
│   ├── components/     # React UI components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── locales/        # i18n translation files
│   ├── plugins/        # Plugin implementations
│   │   └── builtin/    # Built-in plugins
│   ├── services/       # Business logic services
│   ├── store/          # Zustand state stores
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   ├── index.ts        # Library entry point
│   └── main.tsx        # Application entry point
├── package.json
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── biome.json          # Biome linter/formatter config
└── tailwind.config.js  # Tailwind CSS configuration
```

## Coding Standards

### Linting & Formatting

The project uses [Biome](https://biomejs.dev/) for linting and formatting:

```sh
# Check for issues
pnpm run lint

# Auto-fix issues
pnpm run lint:fix

# Format code
pnpm run format
```

### TypeScript

- All code must be written in TypeScript
- Use strict mode (configured in `tsconfig.json`)
- Avoid `any` types where possible; use proper type definitions
- New types should be defined in `src/types/` for shared types

### React

- Use functional components with hooks
- Use `useCallback` and `useMemo` for performance-critical callbacks and computed values
- Keep component state local when possible; lift to Zustand stores only when shared
- Follow the component file naming convention: `kebab-case.tsx`

### CSS

- Use Tailwind CSS v4 utility classes
- Avoid custom CSS unless absolutely necessary
- Custom CSS goes in `src/index.css` or component-level `.css` files

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case` | `audio-mixer-panel.tsx` |
| Components | `PascalCase` | `PropertyPanel` |
| Hooks | `camelCase` with `use` prefix | `useI18n` |
| Services | `camelCase` with `Service` suffix | `StreamingService` |
| Stores | `camelCase` with `use` prefix and `Store` suffix | `useProtocolStore` |
| Types/Interfaces | `PascalCase` with `I` prefix for interfaces | `IPluginContext` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_HISTORY_SIZE` |

## Common Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run build` | Build standalone web app |
| `pnpm run build:lib` | Build library (ES + UMD) |
| `pnpm run preview` | Preview production build |
| `pnpm run lint` | Check code with Biome |
| `pnpm run lint:fix` | Auto-fix code issues |
| `pnpm run format` | Format code with Biome |

## Branch Strategy

- `main` - Stable release branch
- `develop` - Integration branch for ongoing development
- Feature branches: `feature/<description>`
- Bug fix branches: `fix/<description>`

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch from `develop`
3. **Develop** your changes with proper tests
4. **Lint** your code: `pnpm run lint:fix && pnpm run format`
5. **Commit** with clear, descriptive messages
6. **Push** your branch and create a Pull Request against `develop`
7. **Review** - Address any feedback from code review
8. **Merge** - Once approved, maintainers will merge

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

Types:

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build or tooling changes |

Examples:

```
feat(canvas): add grid overlay support
fix(streaming): resolve canvas capture stream freeze on disconnect
docs(plugin): update plugin development guide
refactor(store): simplify undo/redo implementation
```

## Adding New Features

### Adding a New Source Type

1. Define the plugin in `src/plugins/builtin/` or as an external package
2. Implement the `ISourcePlugin` interface
3. Register the plugin in the application entry point
4. Add i18n resources for the source type
5. Update the documentation

### Adding a New UI Component

1. Create the component file in `src/components/`
2. Use Radix UI primitives from `src/components/ui/` for accessible interactions
3. Apply Tailwind CSS for styling
4. Export from `src/index.ts` if it should be part of the library API

### Adding a New Service

1. Create the service file in `src/services/`
2. Export as a singleton instance
3. Document the API in the [Architecture](./architecture.md) page
4. If the service needs to be used by plugins, integrate with the Plugin Context system

## Reporting Issues

When reporting a bug, please include:

1. **Environment** - Browser, OS, Node.js version
2. **Steps to reproduce** - Clear, step-by-step instructions
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Console errors** - Any relevant error messages from the browser console

## License

By contributing to LiveMixer Web, you agree that your contributions will be licensed under the [Apache-2.0 License](../LICENSE).
