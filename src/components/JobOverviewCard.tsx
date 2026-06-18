import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme";

interface JobOverviewCardProps {
  count: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  style?: ViewStyle;
}

export const JobOverviewCard: React.FC<JobOverviewCardProps> = ({
  count,
  label,
  icon,
  color,
  style,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderLight,
        },
        style,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.count, { color: theme.colors.text }]}>{count}</Text>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  count: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
