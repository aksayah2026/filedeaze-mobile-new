import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme";
import { TicketPriority } from "../services/job.service";

interface PriorityBadgeProps {
  priority: TicketPriority;
  style?: ViewStyle;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, style }) => {
  const theme = useTheme();

  const getColors = () => {
    let bg = theme.colors.primary;
    let text = "#ffffff";

    switch (priority) {
      case "URGENT":
      case "HIGH":
        bg = `${theme.colors.danger}15`;
        text = theme.colors.danger;
        break;
      case "MEDIUM":
        bg = `${theme.colors.amber}15`;
        text = theme.colors.amber;
        break;
      case "LOW":
        bg = `${theme.colors.success}15`;
        text = theme.colors.success;
        break;
    }

    return { bg, text };
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: theme.typography.fontSize.xs - 1,
            fontWeight: theme.typography.fontWeight.semibold,
          },
        ]}
      >
        {priority}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  text: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
