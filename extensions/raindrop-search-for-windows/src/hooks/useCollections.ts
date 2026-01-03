import { useCachedPromise } from "@raycast/utils";
import { getAllCollections } from "../api/collections";
import {
  buildCollectionTree,
  flattenCollectionTree,
} from "../utils/collections";
import { CollectionNode } from "../types";

export interface CollectionDropdownItem {
  id: string;
  title: string;
  collectionId: number;
}

export function useCollections() {
  const { data, isLoading, error, revalidate } = useCachedPromise(
    async () => {
      const collections = await getAllCollections();
      const tree = buildCollectionTree(collections);
      const flatList = flattenCollectionTree(tree);
      return flatList;
    },
    [],
    {
      keepPreviousData: true,
    },
  );

  const dropdownItems: CollectionDropdownItem[] = [
    { id: "all", title: "All Bookmarks", collectionId: 0 },
    { id: "unsorted", title: "Unsorted", collectionId: -1 },
    { id: "trash", title: "Trash", collectionId: -99 },
  ];

  if (data) {
    data.forEach((node: CollectionNode) => {
      const indent = node.level > 0 ? "  ".repeat(node.level) + "→ " : "";
      dropdownItems.push({
        id: String(node._id),
        title: `${indent}${node.title}`,
        collectionId: node._id,
      });
    });
  }

  return {
    collections: data || [],
    dropdownItems,
    isLoading,
    error,
    revalidate,
  };
}
