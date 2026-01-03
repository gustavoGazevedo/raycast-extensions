import { useState, useMemo } from "react";
import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCollections } from "./hooks/useCollections";
import { useRaindrops } from "./hooks/useRaindrops";
import { RaindropListItem } from "./components/RaindropListItem";

const HELP_MARKDOWN = `
# Search Help

## Dropdown Filters
Press **Tab** to cycle between filter dropdowns:
- **Collection**: Filter by collection
- **Type**: Filter by bookmark type
- **Sort**: Change sort order

## Search Operators
Type these in the search box:

| Operator | Example | Description |
|----------|---------|-------------|
| \`#tag\` | \`#design\` | Filter by tag |
| \`-#tag\` | \`-#archive\` | Exclude tag |
| \`type:\` | \`type:article\` | Filter by type (link, article, image, video, document, audio) |
| \`created:\` | \`created:2024-01-01\` | Filter by creation date |
| \`created:>\` | \`created:>2024-01-01\` | Created after date |
| \`created:<\` | \`created:<2024-01-01\` | Created before date |
| \`link:\` | \`link:github.com\` | Filter by URL/domain |
| \`title:\` | \`title:React\` | Search in title only |
| \`❤️\` or \`important\` | \`❤️\` | Show favorites only |
| \`match:OR\` | \`react match:OR vue\` | Match any term (default is AND) |
| \`"phrase"\` | \`"exact phrase"\` | Exact phrase match |

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| **Enter** | Open in browser |
| **Ctrl+O** | Open in Raindrop.io |
| **Tab** | Switch filter dropdown |
| **Ctrl+H** | Show this help |
| **Ctrl+D** | Toggle detail panel |

## Examples
- \`#design type:article\` - Articles tagged "design"
- \`react -#old created:>2024-01-01\` - React bookmarks, not tagged "old", from 2024
- \`link:github.com type:link\` - GitHub links
`;

type FilterType = "collection" | "type" | "sort";
type TypeFilter =
  | "all"
  | "link"
  | "article"
  | "image"
  | "video"
  | "document"
  | "audio";
type SortFilter =
  | "relevance"
  | "-created"
  | "created"
  | "title"
  | "-title"
  | "domain"
  | "-domain";

export default function SearchBookmarks() {
  const [searchText, setSearchText] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedType, setSelectedType] = useState<TypeFilter>("all");
  const [selectedSort, setSelectedSort] = useState<SortFilter>("relevance");
  const [activeFilter, setActiveFilter] = useState<FilterType>("collection");
  const [showHelp, setShowHelp] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const {
    dropdownItems,
    isLoading: collectionsLoading,
    collections,
  } = useCollections();

  const collectionId = useMemo(() => {
    const item = dropdownItems.find((item) => item.id === selectedCollection);
    return item?.collectionId ?? 0;
  }, [selectedCollection, dropdownItems]);

  const typeFilter = selectedType !== "all" ? selectedType : undefined;
  const sortFilter = selectedSort !== "relevance" ? selectedSort : undefined;

  const {
    raindrops,
    isLoading: raindropsLoading,
    hasMore,
    loadMore,
  } = useRaindrops(collectionId, searchText, typeFilter, sortFilter);

  const collectionsMap = useMemo(() => {
    const map = new Map<number, string>();
    collections.forEach((c) => {
      map.set(c._id, c.title);
    });
    map.set(-1, "Unsorted");
    map.set(-99, "Trash");
    return map;
  }, [collections]);

  const isLoading = collectionsLoading || raindropsLoading;

  const cycleFilter = () => {
    const filters: FilterType[] = ["collection", "type", "sort"];
    const currentIndex = filters.indexOf(activeFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setActiveFilter(filters[nextIndex]);
  };

  if (showHelp) {
    return (
      <List
        isShowingDetail
        searchText=""
        onSearchTextChange={() => {}}
        searchBarPlaceholder="Press Enter or Escape to go back"
      >
        <List.Item
          title="Search Help"
          icon={Icon.QuestionMark}
          detail={<List.Item.Detail markdown={HELP_MARKDOWN} />}
          actions={
            <ActionPanel>
              <Action
                title="Back to Search"
                icon={Icon.ArrowLeft}
                onAction={() => setShowHelp(false)}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search... (#tag, type:article, Ctrl+H for help)"
      throttle
      isShowingDetail={showDetail}
      searchBarAccessory={
        activeFilter === "collection" ? (
          <List.Dropdown
            tooltip={`Collection Filter (Tab to switch)`}
            value={selectedCollection}
            onChange={setSelectedCollection}
            isLoading={collectionsLoading}
          >
            {dropdownItems.map((item) => (
              <List.Dropdown.Item
                key={item.id}
                title={item.title}
                value={item.id}
              />
            ))}
          </List.Dropdown>
        ) : activeFilter === "type" ? (
          <List.Dropdown
            tooltip={`Type Filter (Tab to switch)`}
            value={selectedType}
            onChange={(value) => setSelectedType(value as TypeFilter)}
          >
            <List.Dropdown.Item title="All Types" value="all" />
            <List.Dropdown.Item title="Link" value="link" />
            <List.Dropdown.Item title="Article" value="article" />
            <List.Dropdown.Item title="Image" value="image" />
            <List.Dropdown.Item title="Video" value="video" />
            <List.Dropdown.Item title="Document" value="document" />
            <List.Dropdown.Item title="Audio" value="audio" />
          </List.Dropdown>
        ) : (
          <List.Dropdown
            tooltip={`Sort Filter (Tab to switch)`}
            value={selectedSort}
            onChange={(value) => setSelectedSort(value as SortFilter)}
          >
            <List.Dropdown.Item title="Relevance" value="relevance" />
            <List.Dropdown.Item title="Newest First" value="-created" />
            <List.Dropdown.Item title="Oldest First" value="created" />
            <List.Dropdown.Item title="Title A-Z" value="title" />
            <List.Dropdown.Item title="Title Z-A" value="-title" />
            <List.Dropdown.Item title="Domain A-Z" value="domain" />
            <List.Dropdown.Item title="Domain Z-A" value="-domain" />
          </List.Dropdown>
        )
      }
      pagination={
        hasMore
          ? {
              onLoadMore: loadMore,
              hasMore: hasMore,
              pageSize: 25,
            }
          : undefined
      }
    >
      {raindrops.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No results found"
          description="Try a different search term or collection (Ctrl+H for help)"
          actions={
            <ActionPanel>
              <Action
                title="Switch Filter"
                onAction={cycleFilter}
                shortcut={{ modifiers: [], key: "tab" }}
              />
              <Action
                title="Show Help"
                icon={Icon.QuestionMark}
                onAction={() => setShowHelp(true)}
                shortcut={{ modifiers: ["ctrl"], key: "h" }}
              />
            </ActionPanel>
          }
        />
      ) : (
        raindrops.map((raindrop) => (
          <RaindropListItem
            key={raindrop._id}
            raindrop={raindrop}
            collectionTitle={collectionsMap.get(raindrop.collection.$id)}
            onFilterCycle={cycleFilter}
            onShowHelp={() => setShowHelp(true)}
            onToggleDetail={() => setShowDetail(!showDetail)}
            showDetail={showDetail}
          />
        ))
      )}
    </List>
  );
}
