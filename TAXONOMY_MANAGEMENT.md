# Taxonomy Management Guide

## Overview
The Creative Tech Taxonomy now uses a **multi-file system** for better maintainability. Individual categories are stored in separate JSON files and merged into a single file for the application.

## Directory Structure
```
taxonomy-data/
├── _metadata.json                    # Root taxonomy metadata
├── _index.json                       # Category order and filenames
├── creative-code-frameworks.json     # Enhanced with descriptions/links
├── game-engines-and-real-time-3d.json # Ready for enhancement
├── web-and-networking-tools.json
├── sensors-and-interaction-methods.json
├── physical-computing.json
├── display-tech-and-video.json
├── professional-av-tools.json
├── ai-machine-learning.json
├── mobile-technology.json
├── asset-creation.json
├── physical-output-and-digital-fabrication.json
└── uncategorized-tools-and-utilities.json
```

## Available Scripts

### `npm run build:taxonomy`
Merges all category files into `public/Creative_Tech_Taxonomy_data.json`
```bash
npm run build:taxonomy
```

### `npm run extract:categories`  
Extracts categories from main file back into separate files
```bash
npm run extract:categories
```

### `npm run dev`
Automatically builds taxonomy then starts dev server
```bash
npm run dev
```

### `npm run build`
Automatically builds taxonomy then builds for production
```bash
npm run build
```

## Workflow for Content Enhancement

### 1. Working on Individual Categories
```bash
# Edit any category file directly
vim taxonomy-data/game-engines-and-real-time-3d.json

# Build and test
npm run build:taxonomy
npm run dev
```

### 2. Adding New Content
1. **Edit the category file** in `taxonomy-data/`
2. **Follow LINKING_GUIDELINES.md** for consistency
3. **Build and test** with `npm run build:taxonomy`
4. **Commit both** the category file and built output

### 3. Collaborative Development
- **Different people** can work on different category files
- **Reduced git conflicts** since files are separate
- **Easier code review** for category-specific changes
- **Clear change tracking** per category

## File Formats

### Category Files
Each category file contains a complete category object:
```json
{
  "name": {
    "en": "Category Name",
    "ja": "日本語名"
  },
  "description": "Category description",
  "tags": ["tag1"],
  "links": {
    "Wikipedia": "https://en.wikipedia.org/wiki/..."
  },
  "children": [...]
}
```

### Metadata File (`_metadata.json`)
Root taxonomy information:
```json
{
  "name": {"en": "Creative Tech Taxonomy", "ja": "..."},
  "description": "Root description",
  "tags": [],
  "links": {}
}
```

### Index File (`_index.json`)
Category order and filenames:
```json
[
  {"name": "Creative Code Frameworks", "filename": "creative-code-frameworks.json", "order": 0},
  {"name": "Game Engines and Real-Time 3D", "filename": "game-engines-and-real-time-3d.json", "order": 1}
]
```

## Benefits of This System

### ✅ Maintainability
- **Smaller files** easier to edit and review
- **Clear organization** by topic area
- **Reduced complexity** when working on specific categories

### ✅ Collaboration  
- **Multiple contributors** can work simultaneously
- **Fewer git conflicts** on large files
- **Category ownership** possible for subject matter experts

### ✅ Content Quality
- **Focused enhancements** per category following guidelines
- **Easier review process** for category-specific changes
- **Systematic enhancement** across all categories

### ✅ Future-Proofing
- **Potential for lazy loading** individual categories
- **API-ready structure** for dynamic content
- **Easier internationalization** and localization

## Migration Notes

- **All existing content preserved** during extraction
- **No changes to d3 code required** - still loads single file
- **Build process automatic** via npm scripts
- **Backward compatible** with existing workflow

## Best Practices

1. **Always run build** before testing changes
2. **Follow linking guidelines** for consistency
3. **Test locally** before committing
4. **Commit category files** along with built output
5. **Use descriptive commit messages** for category changes

---

*This system makes the taxonomy much more manageable while preserving all existing functionality.*