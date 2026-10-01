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
        forest: {
          50: "#f0f7f3",
          100: "#dbeef1",
          200: "#badfc7",
          300: "#8ac79f",
          400: "#55a774",
          500: "#348b54",
          600: "#246e41",
          700: "#1d5835",
          800: "#194a2e",
          900: "#153d26",
          950: "#0c2417",
        },
        biogreen: {
          light: "#eef6f1",
          accent: "#22c55e",
          main: "#194a32",
          dark: "#123724",
          pill: "#1a462f",
        },
      },
    },
  },
  plugins: [],
};
