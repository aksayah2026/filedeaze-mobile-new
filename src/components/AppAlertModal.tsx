import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react-native";
import { useTheme } from "../theme";

interface AppAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

export const AppAlertModal: React.FC<AppAlertModalProps> = ({
  visible,
  title,
  message,
  type = "warning",
  onClose,
}) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={32} color={theme.colors.success} />;
      case "error":
        return <AlertCircle size={32} color={theme.colors.danger} />;
      case "warning":
        return <AlertTriangle size={32} color={theme.colors.warning} />;
      default:
        return <Info size={32} color={theme.colors.primary} />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case "success":
        return `${theme.colors.success}15`;
      case "error":
        return `${theme.colors.danger}15`;
      case "warning":
        return `${theme.colors.warning}15`;
      default:
        return `${theme.colors.primary}15`;
    }
  };

  const getButtonBg = () => {
    switch (type) {
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.danger;
      case "warning":
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.borderLight }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.iconContainer, { backgroundColor: getHeaderBg() }]}>
            {getIcon()}
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: getButtonBg(),
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.closeBtnText}>Okay</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  closeBtn: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
