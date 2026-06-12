import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Pressable,
} from "react-native";
import { useTheme } from "../theme";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const theme = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
    };

    // Height sizing
    let height = 48;
    if (size === "sm") height = 36;
    if (size === "lg") height = 56;

    // Variants
    let backgroundColor = theme.colors.primary;
    let borderColor = "transparent";
    let borderWidth = 0;

    switch (variant) {
      case "primary":
        backgroundColor = theme.colors.primary;
        break;
      case "secondary":
        backgroundColor = theme.colors.secondary;
        break;
      case "success":
        backgroundColor = theme.colors.success;
        break;
      case "warning":
        backgroundColor = theme.colors.warning;
        break;
      case "danger":
        backgroundColor = theme.colors.danger;
        break;
      case "outline":
        backgroundColor = "transparent";
        borderColor = theme.colors.primary;
        borderWidth = 1.5;
        break;
      case "ghost":
        backgroundColor = "transparent";
        break;
    }

    if (disabled) {
      backgroundColor = variant === "outline" || variant === "ghost" ? "transparent" : theme.colors.border;
      borderColor = variant === "outline" ? theme.colors.border : "transparent";
    }

    return {
      ...baseStyle,
      height,
      backgroundColor,
      borderColor,
      borderWidth,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.textLight;

    switch (variant) {
      case "outline":
      case "ghost":
        return theme.colors.primary;
      default:
        return "#ffffff";
    }
  };

  const getFontSize = (): number => {
    if (size === "sm") return theme.typography.fontSize.xs;
    if (size === "lg") return theme.typography.fontSize.lg;
    return theme.typography.fontSize.md;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getButtonStyles(),
        pressed && !disabled && { opacity: 0.82, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <Text
            style={[
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: theme.typography.fontWeight.semibold,
                marginLeft: icon ? theme.spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};
