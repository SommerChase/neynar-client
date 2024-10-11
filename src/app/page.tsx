"use client";

import { Channel } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { NeynarFeedList, useNeynarContext } from "@neynar/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

interface FarcasterUser {
  signer_uuid: string;
  public_key: string;
  status: string;
  signer_approval_url?: string;
  fid?: number;
}

export default function Home() {
  const { user } = useNeynarContext();
  const [channels, setChannels] = useState<{ channels: Channel[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [castText, setCastText] = useState("");
  const [text, setText] = useState<string>("");
  const [isCasting, setIsCasting] = useState<boolean>(false);

  const LOCAL_STORAGE_KEYS = {
    FARCASTER_USER: "farcasterUser",
  };

  const fetchChannels = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(`/api/channels?fid=${user.fid}`);
      const data = await response.json();
      console.log('Fetched channels data:', data);
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user]);

  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.FARCASTER_USER);
    if (storedData) {
      const user: FarcasterUser = JSON.parse(storedData);
      setFarcasterUser(user);
    }
  }, []);

  useEffect(() => {
    if (farcasterUser && farcasterUser.status === "pending_approval") {
      let intervalId: NodeJS.Timeout;

      const startPolling = () => {
        intervalId = setInterval(async () => {
          try {
            const response = await axios.get(
              `/api/signer?signer_uuid=${farcasterUser?.signer_uuid}`
            );
            const user = response.data as FarcasterUser;

            if (user?.status === "approved") {
              localStorage.setItem(
                LOCAL_STORAGE_KEYS.FARCASTER_USER,
                JSON.stringify(user)
              );

              setFarcasterUser(user);
              clearInterval(intervalId);
            }
          } catch (error) {
            console.error("Error during polling", error);
          }
        }, 2000);
      };

      const stopPolling = () => {
        clearInterval(intervalId);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopPolling();
        } else {
          startPolling();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      startPolling();

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        clearInterval(intervalId);
      };
    }
  }, [farcasterUser]);

  const handleSignIn = async () => {
    setLoading(true);
    await createAndStoreSigner();
    setLoading(false);
  };

  const createAndStoreSigner = async () => {
    try {
      const response = await axios.post("/api/signer");
      if (response.status === 200) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.FARCASTER_USER, JSON.stringify(response.data));
        setFarcasterUser(response.data);
      }
    } catch (error) {
      console.error("API Call failed", error);
    }
  };

  const handleCastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farcasterUser || !farcasterUser.signer_uuid) return;

    try {
      const response = await axios.post("/api/cast", {
        signer_uuid: farcasterUser.signer_uuid,
        text: castText,
      });
      if (response.status === 200) {
        console.log("Cast published successfully");
        setCastText("");
      }
    } catch (error) {
      console.error("Error publishing cast:", error);
    }
  };

  const handleCast = async () => {
    setIsCasting(true);
    const castText = text.length === 0 ? "gm" : text;
    try {
      const response = await axios.post("/api/cast", {
        text: castText,
        signer_uuid: farcasterUser?.signer_uuid,
      });
      if (response.status === 200) {
        setText(""); // Clear the text field
        alert("Cast successful");
      }
    } catch (error) {
      console.error("Could not send the cast", error);
    } finally {
      setIsCasting(false); // Re-enable the button
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-16">
      {/* Farcaster sign-in section */}
      <div className="mb-8">
        {!farcasterUser?.status && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? "Loading..." : "Sign in with Farcaster"}
          </button>
        )}

        {farcasterUser?.status === "pending_approval" && farcasterUser?.signer_approval_url && (
          <div className="mt-4">
            <QRCodeSVG value={farcasterUser.signer_approval_url} />
            <div className="my-2 text-center">OR</div>
            <a
              href={farcasterUser.signer_approval_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              Click here to view the signer URL (on mobile)
            </a>
          </div>
        )}

        {farcasterUser?.status === "approved" && (
          <div className="mt-4">
            <div className="text-xl font-bold mb-4">Hello {farcasterUser.fid} 👋</div>
            <div className="flex flex-col gap-4">
              <textarea
                className="p-2 rounded-lg text-black"
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
              />
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleCast}
                disabled={isCasting}
              >
                {isCasting ? "Casting..." : "Cast"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {user ? (
          <div className="flex flex-col mr-8">
            <h1 className="text-3xl font-bold mb-4">Channels</h1>
            <div className="flex flex-col">
              {channels && channels.channels && channels.channels.map((channel: Channel) => (
                <div key={channel.url} className="rounded-lg p-2">
                  <Link href={`/channel/${channel.id}`}>{channel.name}</Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>Loading user data...</div>
        )}

        <div className="flex-grow">
          <NeynarFeedList
            feedType={user?.fid ? "following" : "filter"}
            fid={user?.fid}
            filterType="global_trending"
          />
        </div>
      </div>
    </main>
  );
}