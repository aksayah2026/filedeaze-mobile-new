import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme";

interface AppLoaderProps {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  message = "Loading...",
  fullScreen = false,
  style,
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = fullScreen
    ? {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(248, 250, 252, 0.85)", // Light semi-transparent background
        zIndex: 999,
      }
    : {
        flex: 1,
      };

  return (
    <View style={[styles.centerContainer, containerStyle, style]}>
      <View
        style={[
          styles.innerBox,
          fullScreen && {
            backgroundColor: theme.colors.card,
            padding: theme.spacing.lg,
            borderRadius: theme.borderRadius.lg,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 10,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {message && (
          <Text
            style={[
              styles.messageText,
              {
                color: theme.colors.textMuted,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                marginTop: theme.spacing.sm,
              },
            ]}
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  innerBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
