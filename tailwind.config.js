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
          bg: "#1e1e1e",
          sidebar: "#252526",
          activity: "#333333",
          card: "#2d2d2d",
          border: "#3c3c3c",
          accent: "#007acc",
          status: "#007acc",
          terminal: "#181818"
        },
        diff: {
          addBg: "#143a22",
          addText: "#4ade80",
          delBg: "#4a151b",
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
