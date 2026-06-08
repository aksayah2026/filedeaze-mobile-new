import React from "react";
import { Pressable, StyleSheet, ViewStyle, View, ViewProps } from "react-native";
import { useTheme } from "../theme";

interface AppCardProps extends ViewProps {
  onPress?: () => void;
  elevation?: boolean;
  border?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  elevation = true,
  border = false,
  padding = "md",
  style,
  ...rest
}) => {
  const theme = useTheme();

  const getPaddingValue = (): number => {
    switch (padding) {
      case "none":
        return 0;
      case "sm":
        return theme.spacing.sm;
      case "lg":
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: getPaddingValue(),
    borderWidth: border ? 1.5 : 0,
    borderColor: theme.colors.borderLight,
    // Shadow for iOS
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: elevation ? 1 : 0,
    shadowRadius: 12,
    // Elevation for Android
    elevation: elevation ? 4 : 0,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
          style,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
};
