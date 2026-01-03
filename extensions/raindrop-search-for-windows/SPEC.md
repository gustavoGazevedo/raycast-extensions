# Raindrop Raycast Extension

A Raycast extension for searching and browsing bookmarks from Raindrop.io.

## Overview

This extension provides a unified search interface for Raindrop.io bookmarks with collection-based filtering, rich result display, and infinite scroll pagination.

> **Note:** This extension was created because no Windows version exists for the official Raindrop extension. This provides Windows users with a way to access their Raindrop.io bookmarks through Raycast.

## Authentication

- **Method**: Test token authentication
- **Storage**: Stored securely in Raycast preferences
- **Scope**: Personal use (single user)

### How to Get Your Test Token

1. Go to https://app.raindrop.io/settings/integrations
2. Click "Create new app" in the App Management Console (or open an existing app)
3. In your application settings, find and copy the **Test token**
4. Paste the token into the extension preferences in Raycast

### Preferences

| Preference | Type | Required | Description |
|------------|------|----------|-------------|
| `testToken` | password | Yes | Raindrop.io test token for API authentication |

## Commands

### Search Bookmarks (Main Command)

The primary and only command for the extension.

#### Initial State

When the extension opens (before any search query is entered), display the most recently saved bookmarks from the user's Raindrop account.

#### Search Behavior

- Uses Raindrop API's default full-text search
- Searches across title, URL, description, and cached page content
- No local caching - always fetches fresh data from API
- Debounce search input to avoid excessive API calls (300ms recommended)

#### Dropdown Filter

A dropdown in the search bar allows filtering by collection:

1. **All Bookmarks** (default) - searches across all bookmarks
2. **Unsorted** (special collection ID: -1) - bookmarks not in any collection
3. **Trash** (special collection ID: -99) - deleted bookmarks
4. **User Collections** - all user-created collections displayed with hierarchy

Collection hierarchy is shown with indentation or path notation:
- `Work`
- `  -> Design Resources`
- `  -> Development`
- `    -> Frontend`

#### Nested Collections

When filtering by a parent collection, include bookmarks from all nested child collections using the `nested=true` query parameter.

#### Pagination

- Implement infinite scroll (load more results as user scrolls)
- Fetch 25 items per page (max 50 allowed by API)
- Show loading indicator when fetching next page

## Result Display

Each bookmark in the results list displays:

| Element | Source | Display |
|---------|--------|---------|
| Title | `raindrop.title` | List item title |
| Favicon | `raindrop.cover` or domain favicon | List item icon |
| Type Icon | `raindrop.type` | Accessory icon (link/article/image/video/document/audio) |
| Favorite | `raindrop.important` | Star accessory if marked as favorite |
| URL | `raindrop.domain` | Accessory text (hostname only) |
| Tags | `raindrop.tags[]` | Accessories (tag icons) |
| Collection | `raindrop.collection.title` | Accessory text |
| Excerpt | `raindrop.excerpt` | Subtitle (truncated) |

### Empty State

When search returns no results, display a simple "No results found" message with the EmptyView component.

## Actions

### Primary Action (Enter)

Open the bookmark URL in the user's default browser.

```
Action: Open in Browser
Shortcut: Enter
```

### Secondary Actions

| Action | Shortcut | Description |
|--------|----------|-------------|
| Open in Raindrop | Cmd+O | Opens the bookmark in Raindrop.io web app |

## API Integration

### Base URL

```
https://api.raindrop.io/rest/v1
```

### Authentication Header

```
Authorization: Bearer {testToken}
```

### Rate Limiting

- **Limit**: 120 requests per minute per authenticated user
- **Response Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed per minute
  - `RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: UTC epoch seconds when the limit resets
- **Error Response**: HTTP 429 Too Many Requests when limit exceeded
- **Handling**: Display toast notification asking user to wait before retrying

### Endpoints Used

#### Get Raindrops (Search/List)

```
GET /raindrops/{collectionId}
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search query string (full-text search) |
| `page` | integer | Page number (0-indexed) |
| `perpage` | integer | Items per page (max 50, use 25) |
| `sort` | string | Sort order (see below) |
| `nested` | boolean | Include bookmarks from nested collections |

**Sort Options:**

| Value | Description |
|-------|-------------|
| `-created` | By date descending (default) |
| `created` | By date ascending |
| `score` | By relevancy (only when search is specified) |
| `-sort` | By manual order |
| `title` | By title ascending |
| `-title` | By title descending |
| `domain` | By hostname ascending |
| `-domain` | By hostname descending |

**Collection IDs:**

| ID | Description |
|----|-------------|
| `0` | All bookmarks (except Trash) |
| `-1` | Unsorted |
| `-99` | Trash |
| `{id}` | Specific collection ID |

#### Get Collections

```
GET /collections
```

Returns root-level collections (collections without a parent).

```
GET /collections/childrens
```

Returns all nested/child collections (collections with a `parent.$id`).

To build the full collection hierarchy:
1. Fetch root collections from `/collections`
2. Fetch child collections from `/collections/childrens`
3. Build tree structure using `parent.$id` to link children to parents

### Type Definitions

```typescript
interface Raindrop {
  _id: number;
  title: string;
  link: string;
  excerpt: string;
  cover: string;
  domain: string;
  type: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';
  tags: string[];
  important: boolean;
  broken: boolean;
  note: string;
  media: Array<{ link: string }>;
  collection: {
    $id: number;
  };
  created: string;
  lastUpdate: string;
}

interface Collection {
  _id: number;
  title: string;
  count: number;
  cover: string[];
  color: string;
  view: string;
  public: boolean;
  expanded: boolean;
  sort: number;
  parent: {
    $id: number;
  };
  created: string;
  lastUpdate: string;
}

interface RaindropsResponse {
  result: boolean;
  items: Raindrop[];
  count: number;
  collectionId: number;
}

interface CollectionsResponse {
  result: boolean;
  items: Collection[];
}
```

## Technical Stack

- **Framework**: Raycast Extension API
- **Language**: TypeScript
- **HTTP Client**: Raycast's built-in `fetch` or `useFetch` hook
- **State Management**: React hooks (`useState`, `useEffect`)

## Component Structure

```
src/
├── search-bookmarks.tsx    # Main command component
├── api/
│   ├── client.ts           # API client with auth and rate limit handling
│   ├── raindrops.ts        # Raindrop fetching functions
│   └── collections.ts      # Collection fetching functions
├── hooks/
│   ├── useRaindrops.ts     # Hook for fetching bookmarks with pagination
│   └── useCollections.ts   # Hook for fetching and building collection tree
├── components/
│   └── RaindropListItem.tsx # List item component for bookmarks
├── utils/
│   └── collections.ts      # Helper to build collection hierarchy
└── types.ts                # TypeScript interfaces
```

## Error Handling

| Error | Response | User Message |
|-------|----------|--------------|
| 401 Unauthorized | Invalid/expired token | "Invalid test token. Please check your token in extension preferences." |
| 429 Too Many Requests | Rate limit exceeded | "Rate limit exceeded. Please wait a moment and try again." |
| Network Error | Connection failed | "Unable to connect to Raindrop.io. Check your internet connection." |
| 5xx Server Error | Server issue | "Raindrop.io is temporarily unavailable. Please try again later." |

Display errors using Raycast Toast notifications with appropriate styling (failure style).

## Package Configuration

```json
{
  "name": "raindrop",
  "title": "Raindrop",
  "description": "Search your Raindrop.io bookmarks",
  "icon": "raindrop-icon.png",
  "author": "your-name",
  "categories": ["Productivity", "Web"],
  "license": "MIT",
  "commands": [
    {
      "name": "search-bookmarks",
      "title": "Search Bookmarks",
      "description": "Search and browse your Raindrop.io bookmarks",
      "mode": "view"
    }
  ],
  "preferences": [
    {
      "name": "testToken",
      "title": "Test Token",
      "description": "Your Raindrop.io test token from app.raindrop.io/settings/integrations",
      "type": "password",
      "required": true
    }
  ],
  "dependencies": {
    "@raycast/api": "^1.0.0"
  },
  "devDependencies": {
    "@raycast/eslint-config": "^1.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Not In Scope

The following features are explicitly excluded from this version:

- OAuth 2.0 authentication flow
- Quick add bookmark command
- Dedicated tag browser command
- Copy URL to clipboard action
- Copy as Markdown link action
- Edit tags action
- Move to collection action
- Delete bookmark action
- Local caching/offline support
- Background sync
