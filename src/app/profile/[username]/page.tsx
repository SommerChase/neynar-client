import { NeynarProfileCard, NeynarFeedList } from "@/components/Neynar";
import neynarClient from "@/lib/neynarClient";

async function getData(username: string) {
  try {
    const user = await neynarClient.lookupUserByUsername(username);
    return { user: user.result.user };
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Failed to fetch user data");
  }
}

export default async function Page({
  params: { username },
}: {
  params: { username: string };
}) {
  try {
    const { user } = await getData(username);

    return (
      <main className="min-h-screen p-8 md:p-16 bg-gradient-to-br from-secondary to-background">
        <div className="max-w-4xl mx-auto">
          <NeynarProfileCard fid={user.fid} />
          <NeynarFeedList
            feedType="filter"
            fid={user.fid}
            fids={`${user.fid}`}
            withRecasts={false}
            limit={50}
          />
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-between p-24">
        <h1 className="text-2xl font-bold">Error loading profile</h1>
        <p>An error occurred while fetching the user profile. Please try again later.</p>
      </main>
    );
  }
}
