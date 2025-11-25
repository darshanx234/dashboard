import { useEffect, useRef, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
    /**
     * Callback function to fetch more data
     */
    fetchMore: () => Promise<void> | void;

    /**
     * Whether there is more data to load
     */
    hasMore: boolean;

    /**
     * Whether data is currently being loaded
     */
    loading: boolean;

    /**
     * Root margin for Intersection Observer
     * Positive values trigger loading before reaching the sentinel
     * @default '200px'
     */
    rootMargin?: string;

    /**
     * Threshold for Intersection Observer
     * @default 0.1
     */
    threshold?: number;
}

/**
 * Custom hook for implementing infinite scroll using Intersection Observer
 * 
 * @example
 * ```tsx
 * const sentinelRef = useInfiniteScroll({
 *   fetchMore: loadMorePhotos,
 *   hasMore: hasMorePhotos,
 *   loading: isLoadingMore,
 *   rootMargin: '200px'
 * });
 * 
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={sentinelRef} />
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
    fetchMore,
    hasMore,
    loading,
    rootMargin = '200px',
    threshold = 0.1,
}: UseInfiniteScrollOptions) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Memoize the fetch callback to prevent unnecessary observer recreations
    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;

            // Only fetch if:
            // 1. Sentinel is intersecting (visible)
            // 2. Not currently loading
            // 3. There is more data to load
            if (entry.isIntersecting && !loading && hasMore) {
                fetchMore();
            }
        },
        [fetchMore, loading, hasMore]
    );

    useEffect(() => {
        // Don't create observer if there's no more data
        if (!hasMore) {
            return;
        }

        const sentinel = sentinelRef.current;
        if (!sentinel) {
            return;
        }

        // Create Intersection Observer
        observerRef.current = new IntersectionObserver(handleIntersection, {
            root: null, // viewport
            rootMargin,
            threshold,
        });

        // Start observing
        observerRef.current.observe(sentinel);

        // Cleanup
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleIntersection, hasMore, rootMargin, threshold]);

    return sentinelRef;
}
