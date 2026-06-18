import React from "react";
import { View, StyleSheet, ViewStyle, Image } from "react-native";
import { TicketStatus } from "../services/job.service";

interface StatusBadgeProps {
  status: TicketStatus;
  style?: ViewStyle;
}

const statusGifs: Record<string, any> = {
  COMPLETED: require("../assets/status/completed.gif"),
  CLOSED: require("../assets/status/closed.gif"),
  IN_PROGRESS: require("../assets/status/in_progress.gif"),
  ACCEPTED: require("../assets/status/accepted.gif"),
  TRAVELLING: require("../assets/status/travelling.gif"),
  REACHED: require("../assets/status/reached.gif"),
  PENDING: require("../assets/status/pending.gif"),
  RESCHEDULED: require("../assets/status/pending.gif"),
  ASSIGNED: require("../assets/status/new.gif"),
  NEW: require("../assets/status/new.gif"),
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const gifSource = statusGifs[status] || statusGifs.NEW;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={gifSource}
        style={{ width: 32, height: 32 }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
