import { apiRequest } from "./client";
import { RaindropsResponse } from "../types";

export interface GetRaindropsParams {
  collectionId: number;
  search?: string;
  page?: number;
  perpage?: number;
  sort?: string;
  nested?: boolean;
  type?: string;
}

export async function getRaindrops(
  params: GetRaindropsParams,
): Promise<RaindropsResponse> {
  const {
    collectionId,
    search,
    page = 0,
    perpage = 25,
    sort,
    nested,
    type,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    perpage,
  };

  let searchQuery = search || "";

  if (type && type !== "all") {
    if (searchQuery && !searchQuery.includes("type:")) {
      searchQuery += ` type:${type}`;
    } else if (!searchQuery) {
      searchQuery = `type:${type}`;
    }
  }

  if (searchQuery) {
    queryParams.search = searchQuery;
  }

  if (sort) {
    if (sort === "relevance") {
      if (searchQuery) {
        queryParams.sort = "score";
      } else {
        queryParams.sort = "-created";
      }
    } else {
      queryParams.sort = sort;
    }
  } else {
    if (searchQuery) {
      queryParams.sort = "score";
    } else {
      queryParams.sort = "-created";
    }
  }

  if (nested !== undefined) {
    queryParams.nested = nested;
  }

  return apiRequest<RaindropsResponse>(
    `/raindrops/${collectionId}`,
    queryParams,
  );
}
