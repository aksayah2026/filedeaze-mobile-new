import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../theme";
import { APP_CONFIG } from "../config/app.config";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  showTenantBranding?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  leftAction,
  showTenantBranding = true,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "ios" ? 8 : 12),
          backgroundColor: theme.colors.card,
          shadowColor: "rgba(15,23,42,0.08)",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 6,
          elevation: 4,
          zIndex: 10,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {leftAction && <View style={styles.leftActionContainer}>{leftAction}</View>}

        {showBack ? (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <ArrowLeft color={theme.colors.text} size={24} />
          </Pressable>
        ) : showTenantBranding && (APP_CONFIG as any).logo ? (
          <Image
            source={{ uri: (APP_CONFIG as any).logo }}
            style={[styles.logo, { borderColor: theme.colors.borderLight }]}
          />
        ) : showTenantBranding ? (
          <View style={[styles.initialsLogo, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.initialsText}>
              {APP_CONFIG.appName.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
            </Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={styles.textContainer}>
          {showTenantBranding && !title ? (
            <>
              <Text
                style={[
                  styles.tenantTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {APP_CONFIG.appName}
              </Text>
              <Text
                style={[
                  styles.tenantSubtitle,
                  {
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.fontSize.xs,
                  },
                ]}
              >
                Portal
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: theme.colors.textMuted,
                      fontSize: theme.typography.fontSize.xs,
                    },
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : (
          <View style={styles.rightActionPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    letterSpacing: -0.2,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 1,
    textAlign: "center",
  },
  tenantTitle: {
    letterSpacing: -0.2,
    textAlign: "center",
  },
  tenantSubtitle: {
    marginTop: 1,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  rightActionContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    minWidth: 40,
  },
  rightActionPlaceholder: {
    width: 40,
  },
  initialsLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  leftActionContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    marginRight: 6,
  },
});
export default AppHeader;
