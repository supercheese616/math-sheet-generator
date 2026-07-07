import type { Rng } from "./types";

// xmur3 字符串散列 + mulberry32：同一卷号永远生成同一份题目（可复现试卷的基础）
const xmur3 = (input: string) => {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
};

const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const rngFromSeed = (seed: string): Rng => mulberry32(xmur3(seed.trim().toUpperCase() || "0")());

// 去掉 0/O/1/I/L 等易混淆字符，卷号抄写不出错
const SEED_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const randomSeed = () =>
  Array.from({ length: 6 }, () => SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)]).join("");

export const normalizeSeed = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 8);
