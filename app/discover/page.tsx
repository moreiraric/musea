import SearchPage from "../search/page";

export const dynamic = "force-dynamic";

export default async function DiscoverPage(
  props: Parameters<typeof SearchPage>[0],
) {
  return SearchPage(props);
}
