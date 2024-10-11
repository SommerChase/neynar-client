"use client";

import { NeynarAuthButton } from "@neynar/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FC } from "react";
import { useTheme } from "@/context/ThemeContext";
import { usePrivy } from "@privy-io/react-auth";

export const Header: FC = () => {
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { login, authenticated, user } = usePrivy();

  const themes = [
    { name: "Default", value: "default" },
    { name: "Nord", value: "nord" },
    { name: "Solarized", value: "solarized" },
    { name: "Dracula", value: "dracula" },
    { name: "Monokai", value: "monokai" },
  ];

  return (
    <header className="bg-primary shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-accent">
          NeynarClient
        </Link>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Go to profile"
            className="rounded-full py-2 px-4 bg-secondary text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={() => {
              console.log("searching for", username);
              router.push(`/profile/${username}`);
            }}
            className="bg-accent hover:bg-accent/80 text-white font-bold py-2 px-4 rounded-full transition-all duration-300"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="bg-secondary text-text rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.name}
              </option>
            ))}
          </select>
          {authenticated ? (
            <span className="text-text">Welcome, {user?.farcaster?.username}</span>
          ) : (
            <button
              onClick={login}
              className="bg-secondary hover:bg-secondary/80 text-text font-bold py-2 px-4 rounded-full transition-all duration-300"
            >
              Sign in with Farcaster
            </button>
          )}
          <NeynarAuthButton className="bg-secondary hover:bg-secondary/80 text-text font-bold py-2 px-4 rounded-full transition-all duration-300" />
        </div>
      </div>
    </header>
  );
};