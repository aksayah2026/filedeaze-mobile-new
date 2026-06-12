import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  TextInput,
  Pressable,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Path } from "react-native-svg";
import { PenLine, Trash2, User } from "lucide-react-native";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";

type RouteProps = RouteProp<TechnicianStackParamList, "CustomerSignature">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "CustomerSignature">;

type Point = { x: number; y: number };
type Stroke = Point[];

const PAD_HEIGHT = 200;

export const CustomerSignatureScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, customerName } = route.params;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke>([]);
  const [remarks, setRemarks] = useState("");
  const [hasSigned, setHasSigned] = useState(false);

  // PanResponder for signature capture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStroke.current = [{ x: locationX, y: locationY }];
        setHasSigned(true);
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStroke.current = [...currentStroke.current, { x: locationX, y: locationY }];
        // Force re-render by pushing current (will finish on release)
        setStrokes((prev) => {
          const copy = [...prev];
          copy[copy.length] = [...currentStroke.current];
          return copy;
        });
      },

      onPanResponderRelease: () => {
        if (currentStroke.current.length > 0) {
          setStrokes((prev) => [...prev, [...currentStroke.current]]);
          currentStroke.current = [];
        }
      },
    })
  ).current;

  const clearSignature = () => {
    setStrokes([]);
    currentStroke.current = [];
    setHasSigned(false);
  };

  const buildPath = (stroke: Stroke): string => {
    if (stroke.length < 2) return "";
    const [first, ...rest] = stroke;
    return [`M ${first.x} ${first.y}`, ...rest.map((p) => `L ${p.x} ${p.y}`)].join(" ");
  };

  const handleSaveAndContinue = () => {
    if (!hasSigned || strokes.length === 0) {
      Alert.alert("Signature Required", "Please ask the customer to sign on the pad above.");
      return;
    }

    // Navigate to payment collection
    navigation.navigate("PaymentCollection", {
      jobId,
      ticketNo,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="Customer Signature"
        subtitle={`Step 2 of 3 · ${ticketNo}`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {["Photos", "Signature", "Payment"].map((step, i) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        i < 1
                          ? theme.colors.success
                          : i === 1
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                    },
                  ]}
                >
                  <Text style={styles.stepDotText}>{i + 1}</Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color:
                        i === 1
                          ? theme.colors.primary
                          : i < 1
                          ? theme.colors.success
                          : theme.colors.textMuted,
                    },
                  ]}
                >
                  {step}
                </Text>
              </View>
              {i < 2 && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor:
                        i < 1 ? theme.colors.success : theme.colors.borderLight,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Customer Info */}
        <AppCard style={styles.card}>
          <View style={styles.customerRow}>
            <View
              style={[styles.avatarCircle, { backgroundColor: `${theme.colors.primary}15` }]}
            >
              <User size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.customerLabel, { color: theme.colors.textMuted }]}>
                Signature Requested From
              </Text>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {customerName}
              </Text>
              <Text style={[styles.ticketRef, { color: theme.colors.textMuted }]}>
                Ticket: {ticketNo}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Signature Pad */}
        <View style={styles.padHeader}>
          <View style={styles.padLabelRow}>
            <PenLine size={16} color={theme.colors.primary} />
            <Text style={[styles.padLabel, { color: theme.colors.text }]}>
              Customer Signature Pad
            </Text>
          </View>
          <Pressable
            onPress={clearSignature}
            style={({ pressed }) => [
              styles.clearBtn,
              { backgroundColor: `${theme.colors.danger}12`, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Trash2 size={14} color={theme.colors.danger} />
            <Text style={[styles.clearBtnText, { color: theme.colors.danger }]}>Clear</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.signaturePad,
            {
              borderColor: hasSigned ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Svg width="100%" height={PAD_HEIGHT} style={StyleSheet.absoluteFill}>
            {strokes.map((stroke, i) => (
              <Path
                key={i}
                d={buildPath(stroke)}
                stroke={theme.colors.text}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>

          {!hasSigned && (
            <View style={styles.padPlaceholder}>
              <PenLine size={28} color={theme.colors.borderLight} />
              <Text style={[styles.padPlaceholderText, { color: theme.colors.textLight }]}>
                Sign here
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.padHint, { color: theme.colors.textMuted }]}>
          Hand your device to the customer to sign above. Tap "Clear" to retry.
        </Text>

        {/* Remarks */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
          Customer Remarks <Text style={{ color: theme.colors.textLight }}>(optional)</Text>
        </Text>
        <View
          style={[
            styles.textAreaContainer,
            {
              borderColor: remarks ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder='e.g. "Very professional service, well done!"'
            placeholderTextColor={theme.colors.textLight}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { color: theme.colors.text }]}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Save & Continue to Payment →"
            onPress={handleSaveAndContinue}
            disabled={!hasSigned}
            variant="primary"
            size="lg"
          />
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase" },
  stepLine: { flex: 1, height: 2, marginBottom: 16 },
  card: { marginBottom: 16 },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  customerLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  customerName: { fontSize: 16, fontWeight: "700" },
  ticketRef: { fontSize: 12, marginTop: 2 },
  padHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  padLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  padLabel: { fontSize: 14, fontWeight: "700" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: { fontSize: 12, fontWeight: "700" },
  signaturePad: {
    height: PAD_HEIGHT,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  padPlaceholder: {
    alignItems: "center",
    gap: 8,
    opacity: 0.5,
  },
  padPlaceholderText: { fontSize: 14 },
  padHint: { fontSize: 11, textAlign: "center", marginBottom: 4, lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
    minHeight: 66,
  },
  actions: { gap: 10 },
});
