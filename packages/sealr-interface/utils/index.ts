import { toUtf8Bytes, hexlify } from "ethers";

export function renderTime(timestamp: number | string | bigint): string {
  let ts: number;

  if (typeof timestamp === "bigint") {
    ts = Number(timestamp);
  } else if (typeof timestamp === "string") {
    ts = new Date(timestamp).getTime();
  } else {
    ts = timestamp;
  }

  if (!ts || isNaN(ts)) return "";

  if (ts < 1e12) {
    ts = ts * 1000;
  }

  const now = Date.now();
  const diffMs = now - ts;

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return "Just now";
  if (min < 60) return `${min} minute${min !== 1 ? "s" : ""} ago`;
  if (hour < 24) return `${hour} hour${hour !== 1 ? "s" : ""} ago`;
  if (day === 1) {
    const d = new Date(ts);
    return `Yesterday at ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} ${d
      .getHours()
      .toString()
      .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function stringToBigInt(str: string): bigint {
  const bytes = toUtf8Bytes(str);
  const hex = hexlify(bytes).substring(2);

  return BigInt("0x" + hex);
}

export function stringToBigInts(str: string): bigint[] {
  const bytes = toUtf8Bytes(str);
  const chunks: bigint[] = [];

  for (let i = 0; i < bytes.length; i += 31) {
    const chunk = bytes.slice(i, i + 31);
    chunks.push(stringToBigInt(Buffer.from(chunk).toString()));
  }

  return chunks;
}

export function bigIntToString(bn: bigint): string {
  let hex = bn.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;

  return Buffer.from(hex, "hex").toString("utf8");
}
