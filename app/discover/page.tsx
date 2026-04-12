// Discover route alias that reuses the shared search page implementation.
// This keeps browse and search entry points on the same server-rendered code path.

import SearchPage from "../search/page";

export const dynamic = "force-dynamic";

// Delegates discover rendering to the search page.
export default async function DiscoverPage(
  props: Parameters<typeof SearchPage>[0],
) {
  return SearchPage(props);
}
