export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => `${basePath}${path}`;

export const site = {
  name: "Cartographier Le Chaos",
  tagline: "Mapping internal turbulence through literature and inquiry.",
  description:
    "A personal literary archive and blog mapping internal turbulence through literature and inquiry.",
} as const;
