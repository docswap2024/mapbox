import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brandDarker: '#2e3f6e',
        brandDark: '#3d528b',
        gray: '#566985',
        grayLight: '#F6F6F6',

      },
    },
  },
  plugins: [],
} satisfies Config;
