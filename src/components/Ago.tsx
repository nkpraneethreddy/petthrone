"use client";

import { useEffect, useState } from "react";
import { reignLabel, timeAgo } from "@/lib/time";

export function Ago({ iso }: { iso: string | null }) {
  const [label, setLabel] = useState("…");
  useEffect(() => {
    setLabel(timeAgo(iso));
    const t = setInterval(() => setLabel(timeAgo(iso)), 10000);
    return () => clearInterval(t);
  }, [iso]);
  return <>{label}</>;
}

export function Reign({ iso }: { iso: string | null }) {
  const [label, setLabel] = useState("on the throne");
  useEffect(() => {
    setLabel(reignLabel(iso));
    const t = setInterval(() => setLabel(reignLabel(iso)), 10000);
    return () => clearInterval(t);
  }, [iso]);
  return <>{label}</>;
}
