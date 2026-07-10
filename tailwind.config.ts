import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        keptos: {
          navy: "#07192f",
          blue: "#1267d6",
          cyan: "#5bd0ff",
          mint: "#20c997",
          canvas: "#f3f7fb"
        }
      }
    }
  },
  plugins: []
};

export default config;
