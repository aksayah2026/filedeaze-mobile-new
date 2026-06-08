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
  primary: APP_CONFIG.primaryColor || "#2563EB",
  secondary: "#0f172a", // Default secondary (slate-900)
  success: "#10b981", // Emerald-500
  warning: "#f59e0b", // Amber-500
  danger: "#ef4444", // Rose-500
  background: "#f8fafc", // Slate-50
  card: "#ffffff", // Pure white
  text: "#0f172a", // Slate-900
  textMuted: "#64748b", // Slate-500
  textLight: "#94a3b8", // Slate-400
  border: "#cbd5e1", // Slate-300
  borderLight: "#e2e8f0", // Slate-200
  shadow: "rgba(15, 23, 42, 0.08)",
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
