import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { Raindrop, RaindropType } from "../types";

interface RaindropListItemProps {
  raindrop: Raindrop;
  collectionTitle?: string;
  onFilterCycle?: () => void;
  onShowHelp?: () => void;
  onToggleDetail?: () => void;
  showDetail?: boolean;
}

function getTypeIcon(type: RaindropType): Icon {
  switch (type) {
    case "article":
      return Icon.Document;
    case "image":
      return Icon.Image;
    case "video":
      return Icon.Video;
    case "document":
      return Icon.BlankDocument;
    case "audio":
      return Icon.Music;
    case "link":
    default:
      return Icon.Link;
  }
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function RaindropListItem({
  raindrop,
  collectionTitle,
  onFilterCycle,
  onShowHelp,
  onToggleDetail,
  showDetail,
}: RaindropListItemProps) {
  const accessories: List.Item.Accessory[] = [];

  if (raindrop.important) {
    accessories.push({ icon: Icon.Star, tooltip: "Favorite" });
  }

  accessories.push({
    icon: getTypeIcon(raindrop.type),
    tooltip: raindrop.type,
  });

  if (raindrop.tags.length > 0) {
    raindrop.tags.slice(0, 1).forEach((tag) => {
      accessories.push({ tag: tag });
    });
  }

  if (collectionTitle) {
    accessories.push({ text: collectionTitle, tooltip: "Collection" });
  }

  const iconUrl = raindrop.cover || getFaviconUrl(raindrop.domain);

  const detailMetadata = (
    <List.Item.Detail.Metadata>
      {raindrop.tags.length > 0 && (
        <List.Item.Detail.Metadata.TagList title="Tags">
          {raindrop.tags.map((tag) => (
            <List.Item.Detail.Metadata.TagList.Item key={tag} text={tag} />
          ))}
        </List.Item.Detail.Metadata.TagList>
      )}
      {collectionTitle && (
        <List.Item.Detail.Metadata.Label
          title="Collection"
          text={collectionTitle}
        />
      )}
      <List.Item.Detail.Metadata.Label title="Domain" text={raindrop.domain} />
      <List.Item.Detail.Metadata.Label title="Type" text={raindrop.type} />
      {raindrop.important && (
        <List.Item.Detail.Metadata.Label title="Favorite" text="Yes" />
      )}
    </List.Item.Detail.Metadata>
  );

  return (
    <List.Item
      id={String(raindrop._id)}
      title={raindrop.title || raindrop.link}
      // subtitle={
      //   raindrop.excerpt ? raindrop.excerpt.substring(0, 200) : undefined
      // }
      icon={{ source: iconUrl, fallback: Icon.Globe }}
      accessories={accessories}
      detail={
        <List.Item.Detail
          markdown={
            raindrop.excerpt
              ? `# ${raindrop.title || raindrop.link}\n\n---\n\n${raindrop.excerpt}`
              : `# ${raindrop.title || raindrop.link}`
          }
          metadata={detailMetadata}
        />
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={raindrop.link} />
            <Action.OpenInBrowser
              title="Open in Raindrop"
              url={`https://app.raindrop.io/my/${raindrop.collection.$id}/item/${raindrop._id}`}
              shortcut={{ modifiers: ["ctrl"], key: "o" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            {onToggleDetail && (
              <Action
                title={showDetail ? "Hide Detail" : "Show Detail"}
                icon={showDetail ? Icon.EyeDisabled : Icon.Eye}
                onAction={onToggleDetail}
                shortcut={{ modifiers: ["ctrl"], key: "d" }}
              />
            )}
            {onFilterCycle && (
              <Action
                title="Switch Filter"
                onAction={onFilterCycle}
                shortcut={{ modifiers: [], key: "tab" }}
              />
            )}
            {onShowHelp && (
              <Action
                title="Show Help"
                icon={Icon.QuestionMark}
                onAction={onShowHelp}
                shortcut={{ modifiers: ["ctrl"], key: "h" }}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
