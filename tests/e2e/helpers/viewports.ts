export const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 1024, height: 768 },
  narrow: { width: 390, height: 844 }
} as const;

export type ViewportName = keyof typeof VIEWPORTS;
