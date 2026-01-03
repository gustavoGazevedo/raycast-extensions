import { Collection, CollectionNode } from "../types";

export function buildCollectionTree(
  collections: Collection[],
): CollectionNode[] {
  const collectionsMap = new Map<number, CollectionNode>();

  collections.forEach((collection) => {
    collectionsMap.set(collection._id, {
      ...collection,
      children: [],
      level: 0,
    });
  });

  const rootNodes: CollectionNode[] = [];

  collectionsMap.forEach((node) => {
    if (node.parent?.$id) {
      const parent = collectionsMap.get(node.parent.$id);
      if (parent) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  function setLevels(nodes: CollectionNode[], level: number): void {
    nodes.forEach((node) => {
      node.level = level;
      if (node.children.length > 0) {
        node.children.sort((a, b) => a.sort - b.sort);
        setLevels(node.children, level + 1);
      }
    });
  }

  rootNodes.sort((a, b) => a.sort - b.sort);
  setLevels(rootNodes, 0);

  return rootNodes;
}

export function flattenCollectionTree(
  nodes: CollectionNode[],
): CollectionNode[] {
  const result: CollectionNode[] = [];

  function traverse(node: CollectionNode): void {
    result.push(node);
    node.children.forEach(traverse);
  }

  nodes.forEach(traverse);
  return result;
}

export function getCollectionDisplayTitle(node: CollectionNode): string {
  if (node.level === 0) {
    return node.title;
  }

  const indent = "  ".repeat(node.level);
  return `${indent}→ ${node.title}`;
}
