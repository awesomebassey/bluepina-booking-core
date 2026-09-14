import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

config({
  path: resolve(process.cwd(), "../../.env"),
});

const nextConfig: NextConfig = {};
export default nextConfig;
