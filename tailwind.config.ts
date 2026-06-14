import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1e293b",
        muted: "#64748b",
        line: "#dde3ec",
        panel: "#f7f8fb",
        brand: "#123a6f",
        action: "#1f5fd4",
        verify: "#2f8f5b",
        accent: "#a4442b"
      },
      boxShadow: {
        soft: "0 14px 45px rgba(15, 23, 42, 0.08)"
      }
    },
  },
  plugins: [],
};

export default config;
