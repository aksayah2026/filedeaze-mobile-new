import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { ClipboardList } from "lucide-react-native";
import { useTheme } from "../theme";
import { AppButton } from "./AppButton";

interface EmptyTicketsStateProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  style?: ViewStyle;
}

export const EmptyTicketsState: React.FC<EmptyTicketsStateProps> = ({
  onRefresh,
  isRefreshing = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}08` }]}>
        <ClipboardList size={48} color={theme.colors.textLight} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>No dispatched tickets yet</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        New assigned jobs will appear here.
      </Text>
      {onRefresh && (
        <AppButton
          title="Refresh List"
          onPress={onRefresh}
          variant="outline"
          size="sm"
          loading={isRefreshing}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    minWidth: 140,
  },
});
