# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run format` - Format code with Prettier

## Code Style Guidelines
- Use ES modules (import/export)
- Format with Prettier (runs via `npm run format`)
- Follow Prettier config: 120 char line width, 2 space indent, double quotes, no semicolons
- Keep functions small and focused on a single responsibility
- Use descriptive variable/function names
- Organize imports: built-ins first, then external packages, then local imports
- Handle errors with try/catch blocks for async operations
- Prefer const over let, avoid var
- Use arrow functions for callbacks and anonymous functions
- Document complex logic with clear comments
- Use camelCase for variables/functions, PascalCase for classes