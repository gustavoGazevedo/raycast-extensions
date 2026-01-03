export interface Raindrop {
  _id: number;
  title: string;
  link: string;
  excerpt: string;
  cover: string;
  domain: string;
  type: "link" | "article" | "image" | "video" | "document" | "audio";
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

export interface Collection {
  _id: number;
  title: string;
  count: number;
  cover: string[];
  color: string;
  view: string;
  public: boolean;
  expanded: boolean;
  sort: number;
  parent?: {
    $id: number;
  };
  created: string;
  lastUpdate: string;
}

export interface RaindropsResponse {
  result: boolean;
  items: Raindrop[];
  count: number;
  collectionId: number;
}

export interface CollectionsResponse {
  result: boolean;
  items: Collection[];
}

export interface CollectionNode extends Collection {
  children: CollectionNode[];
  level: number;
}

export type RaindropType = Raindrop["type"];
