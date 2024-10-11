import neynarClient from "@/lib/neynarClient";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "Missing fid parameter" }, { status: 400 });
    }

    const channels = await neynarClient.fetchUserChannels(Number(fid));

    return NextResponse.json(channels, { status: 200 });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching channels" },
      { status: 500 },
    );
  }
};
