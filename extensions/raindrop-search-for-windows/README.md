# Raindrop.io for Raycast

Search and browse your Raindrop.io bookmarks directly from Raycast.

> **Note:** This extension was created because no Windows version exists for the official Raindrop extension. This provides Windows users with a way to access their Raindrop.io bookmarks through Raycast.

## Features

- Search across all your bookmarks with full-text search
- Filter by collection with hierarchical dropdown
- Infinite scroll pagination
- Open bookmarks in browser or Raindrop.io web app
- Shows bookmark metadata: favicon, type, tags, collection, and domain

## Setup

1. Get your Raindrop.io test token:
   - Go to https://app.raindrop.io/settings/integrations
   - Click "Create new app" (or open an existing app)
   - Copy the **Test token**

2. Open Raycast and search for "Search Bookmarks"
3. Enter your test token when prompted

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
npm run fix-lint
```

## Publishing

Before publishing to the Raycast Store:
1. Update the `author` field in `package.json` with your Raycast store username
2. Run `npm run publish`

## Commands

| Command | Description |
|---------|-------------|
| Search Bookmarks | Search and browse your Raindrop.io bookmarks |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Open bookmark in browser |
| Cmd+O | Open bookmark in Raindrop.io web app |

