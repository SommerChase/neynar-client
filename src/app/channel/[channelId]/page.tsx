import { NeynarFeedList } from "@/components/Neynar";

export default async function Page({
  params: { channelId },
}: {
  params: { channelId: string };
}) {
  return (
    <main className="min-h-screen p-8 md:p-16 bg-gradient-to-br from-secondary to-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-accent">{channelId}</h1>
        <NeynarFeedList
          feedType="filter"
          channelId={channelId}
          viewerFid={2}
          limit={50}
          filterType="channel_id"
        />
      </div>
    </main>
  );
}
