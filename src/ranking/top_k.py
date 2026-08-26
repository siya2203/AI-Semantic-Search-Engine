import heapq

def get_top_k(results, k=5):
    heap = []

    for result in results:
        score = result["score"]
        document = result["document"]

        heapq.heappush(
            heap,
            (score, document)
        )

        if len(heap) > k:
            heapq.heappop(heap)

    return sorted(
        heap, 
        reverse=True
    )