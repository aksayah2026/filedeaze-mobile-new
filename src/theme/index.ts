import { APP_CONFIG } from "../config/app.config";

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  textLight: string;
  border: string;
  borderLight: string;
  shadow: string;
  purple: string;
  amber: string;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface Typography {
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    h1: number;
    h2: number;
  };
  fontWeight: {
    regular: "400";
    medium: "500";
    semibold: "600";
    bold: "700";
  };
}

export interface AppTheme {
  colors: ThemeColors;
  spacing: Spacing;
  typography: Typography;
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: (APP_CONFIG as any).primaryColor || "#4F6FE8",
  secondary: "#6B8FF5",
  success: "#0EA873",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F4F5F9",
  card: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  shadow: "rgba(15, 23, 42, 0.09)",
  purple: "#7C3AED",
  amber: "#F59E0B",
};

export const SPACING: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const TYPOGRAPHY: Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    h1: 32,
    h2: 24,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  round: 9999,
};

export const theme: AppTheme = {
  colors: DEFAULT_THEME_COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
};

/**
 * Hook to retrieve the current active theme.
 */
export function useTheme(): AppTheme {
  return theme;
}
