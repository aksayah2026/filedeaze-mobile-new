import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme";

interface AppBadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = "primary",
  size = "sm",
  style,
}) => {
  const theme = useTheme();

  const getColors = () => {
    let bg = theme.colors.primary;
    let text = "#ffffff";

    switch (variant) {
      case "primary":
        bg = `${theme.colors.primary}15`; // 8% opacity
        text = theme.colors.primary;
        break;
      case "secondary":
        bg = `${theme.colors.secondary}15`;
        text = theme.colors.secondary;
        break;
      case "success":
        bg = `${theme.colors.success}15`;
        text = theme.colors.success;
        break;
      case "warning":
        bg = `${theme.colors.warning}15`;
        text = theme.colors.warning;
        break;
      case "danger":
        bg = `${theme.colors.danger}15`;
        text = theme.colors.danger;
        break;
    }

    return { bg, text, border: `${text}40` };
  };

  const { bg, text, border } = getColors();

  const paddingHorizontal = size === "sm" ? theme.spacing.sm : theme.spacing.md;
  const paddingVertical = size === "sm" ? 4 : 6;
  const fontSize =
    size === "sm"
      ? theme.typography.fontSize.xs - 1
      : theme.typography.fontSize.xs;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal,
          paddingVertical,
          borderRadius: theme.borderRadius.round,
          borderWidth: 1,
          borderColor: border,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: text,
          fontSize,
          fontWeight: theme.typography.fontWeight.bold,
          textTransform: "uppercase",
          letterSpacing: 0.7,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
});
