import { useState, useCallback, useEffect, useRef } from "react";
import { showToast, Toast } from "@raycast/api";
import { getRaindrops } from "../api/raindrops";
import { Raindrop } from "../types";

const PER_PAGE = 25;

interface UseRaindropsResult {
  raindrops: Raindrop[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

export function useRaindrops(
  collectionId: number,
  searchText: string,
  type?: string,
  sort?: string,
): UseRaindropsResult {
  const [raindrops, setRaindrops] = useState<Raindrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevParamsRef = useRef({ collectionId, searchText, type, sort });

  const fetchRaindrops = useCallback(
    async (pageNum: number, append: boolean) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);

      try {
        const nested = collectionId > 0;
        const response = await getRaindrops({
          collectionId,
          search: searchText || undefined,
          page: pageNum,
          perpage: PER_PAGE,
          nested,
          type: type || undefined,
          sort: sort || undefined,
        });

        if (append) {
          setRaindrops((prev) => [...prev, ...response.items]);
        } else {
          setRaindrops(response.items);
        }

        setTotalCount(response.count);
        setHasMore(
          response.items.length === PER_PAGE &&
            (pageNum + 1) * PER_PAGE < response.count,
        );
        setPage(pageNum);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          const isNetworkError =
            error.message.includes("fetch") ||
            error.message.includes("network");
          if (isNetworkError) {
            await showToast({
              style: Toast.Style.Failure,
              title: "Connection Error",
              message:
                "Unable to connect to Raindrop.io. Check your internet connection.",
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [collectionId, searchText, type, sort],
  );

  useEffect(() => {
    const paramsChanged =
      prevParamsRef.current.collectionId !== collectionId ||
      prevParamsRef.current.searchText !== searchText ||
      prevParamsRef.current.type !== type ||
      prevParamsRef.current.sort !== sort;

    if (paramsChanged) {
      prevParamsRef.current = { collectionId, searchText, type, sort };
      setRaindrops([]);
      setPage(0);
      setHasMore(true);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(
      () => {
        fetchRaindrops(0, false);
      },
      searchText ? 300 : 0,
    );

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [collectionId, searchText, type, sort, fetchRaindrops]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchRaindrops(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchRaindrops]);

  return {
    raindrops,
    isLoading,
    hasMore,
    loadMore,
    totalCount,
  };
}
