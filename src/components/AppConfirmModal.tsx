import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { useTheme } from "../theme";
import { AppButton } from "./AppButton";

interface AppConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: "primary" | "secondary" | "success" | "warning" | "danger";
  loading?: boolean;
  showCancel?: boolean;
}

export const AppConfirmModal: React.FC<AppConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "danger",
  loading = false,
  showCancel = true,
}) => {
  const theme = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Warning Icon Header */}
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.warning}15` }]}>
            <AlertTriangle size={28} color={theme.colors.warning} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textMuted }]}>
            {message}
          </Text>

          {/* Buttons Row */}
          <View style={styles.buttonRow}>
            {showCancel && (
              <AppButton
                title={cancelText}
                variant="ghost"
                onPress={onCancel}
                style={styles.btn}
                textStyle={{ color: theme.colors.textMuted }}
                disabled={loading}
              />
            )}
            <AppButton
              title={confirmText}
              variant={confirmVariant}
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
  },
});
