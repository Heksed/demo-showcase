import type { Config } from "tailwindcss";

export default {
  theme: { 
    extend: {
      colors: {
        'custom-gray': '#5F686D',
      }
    } 
  },
  plugins: [require("tailwindcss-animate")], // jos käytät shadcn/ui-animatea
} satisfies Config;
