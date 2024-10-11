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
    <main className="min-h-screen p-8 md:p-16 bg-gradient-to-br from-secondary to-background">
      <div className="max-w-4xl mx-auto">
        {/* Farcaster sign-in section */}
        <div className="mb-12 bg-primary rounded-lg p-8 shadow-lg">
          {!farcasterUser?.status && (
            <button
              className="bg-accent hover:bg-accent/80 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in with Farcaster"
              )}
            </button>
          )}

          {farcasterUser?.status === "pending_approval" && farcasterUser?.signer_approval_url && (
            <div className="mt-6 text-center">
              <QRCodeSVG value={farcasterUser.signer_approval_url} className="mx-auto" />
              <div className="my-4 text-lg font-semibold">OR</div>
              <a
                href={farcasterUser.signer_approval_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 underline transition-colors duration-300"
              >
                Click here to view the signer URL (on mobile)
              </a>
            </div>
          )}

          {farcasterUser?.status === "approved" && (
            <div className="mt-6">
              <div className="text-2xl font-bold mb-6">Hello {farcasterUser.fid} 👋</div>
              <div className="space-y-4">
                <textarea
                  className="w-full p-4 rounded-lg bg-secondary text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300"
                  placeholder="What's on your mind?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                />
                <button
                  className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md"
                  onClick={handleCast}
                  disabled={isCasting}
                >
                  {isCasting ? "Casting..." : "Cast"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {user ? (
            <div className="md:w-1/3">
              <h1 className="text-3xl font-bold mb-6">Channels</h1>
              <div className="space-y-2">
                {channels && channels.channels && channels.channels.map((channel: Channel) => (
                  <Link
                    key={channel.url}
                    href={`/channel/${channel.id}`}
                    className="block bg-secondary hover:bg-secondary/80 rounded-lg p-4 transition-colors duration-300"
                  >
                    {channel.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="md:w-1/3 bg-secondary rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-primary rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-primary rounded"></div>
                ))}
              </div>
            </div>
          )}

          <div className="md:w-2/3">
            <NeynarFeedList
              feedType="filter"
              fid={user?.fid}
              filterType="global_trending"
            />
          </div>
        </div>
      </div>
    </main>
  );
}