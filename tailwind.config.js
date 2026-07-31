/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: "#0a0d16",
          sidebar: "#101423",
          activity: "#0b0e1a",
          card: "#161b30",
          border: "#1f2642",
          accent: "#06b6d4",
          status: "#0e1329",
          terminal: "#070911"
        },
        diff: {
          addBg: "#062b1a",
          addText: "#4ade80",
          delBg: "#3b1116",
          delText: "#f87171"
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};
