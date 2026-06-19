import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { Info, CheckCircle, AlertTriangle } from "lucide-react-native";
import { useTheme } from "../theme";
import { AppButton } from "./AppButton";

interface CustomerPopupProps {
  visible: boolean;
  type?: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const CustomerPopup: React.FC<CustomerPopupProps> = ({
  visible,
  type = "info",
  title,
  message,
  confirmText = "Continue",
  cancelText = "Dismiss",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={32} color={theme.colors.success} />;
      case "warning":
        return <AlertTriangle size={32} color={theme.colors.warning} />;
      case "danger":
        return <AlertTriangle size={32} color={theme.colors.danger} />;
      default:
        return <Info size={32} color={theme.colors.primary} />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case "success":
        return `${theme.colors.success}10`;
      case "warning":
        return `${theme.colors.warning}10`;
      case "danger":
        return `${theme.colors.danger}10`;
      default:
        return `${theme.colors.primary}10`;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.borderLight }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getHeaderBg() }]}>
            {getIcon()}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {message}
          </Text>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            {onCancel && (
              <AppButton
                title={cancelText}
                variant="outline"
                onPress={onCancel}
                style={styles.btn}
                disabled={loading}
              />
            )}
            <AppButton
              title={confirmText}
              variant={type === "danger" ? "danger" : type === "success" ? "success" : "primary"}
              onPress={onConfirm}
              style={styles.btn}
              loading={loading}
            />
          </View>
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
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1.5,
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
  },
});
export default CustomerPopup;
