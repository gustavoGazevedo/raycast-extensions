import { apiRequest } from "./client";
import { Collection, CollectionsResponse } from "../types";

export async function getRootCollections(): Promise<Collection[]> {
  const response = await apiRequest<CollectionsResponse>("/collections");
  return response.items;
}

export async function getChildCollections(): Promise<Collection[]> {
  const response = await apiRequest<CollectionsResponse>(
    "/collections/childrens",
  );
  return response.items;
}

export async function getAllCollections(): Promise<Collection[]> {
  const [rootCollections, childCollections] = await Promise.all([
    getRootCollections(),
    getChildCollections(),
  ]);
  return [...rootCollections, ...childCollections];
}
