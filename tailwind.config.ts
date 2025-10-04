// tailwind.config.ts (juuressa)
import type { Config } from "tailwindcss";

export default {
  theme: { extend: {} },
  plugins: [require("tailwindcss-animate")], // jos käytät shadcn/ui-animatea
} satisfies Config;
