import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Switch,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import {
  IndianRupee,
  CreditCard,
  Banknote,
  CheckCircle2,
  Receipt,
  Smartphone,
  Trash2,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useCollectPayment, useCompleteJob, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "PaymentCollection">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "PaymentCollection">;

type PaymentMode = "CASH" | "UPI";

// UPI deep link for QR display
const buildUpiLink = (amount: number) =>
  `upi://pay?pa=fieldeaze@upi&pn=FieldEaze+Services&am=${amount}&cu=INR&tn=ServicePayment`;

export const PaymentCollectionScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, amount: initialAmount } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const collectMutation = useCollectPayment();
  const completeJobMutation = useCompleteJob();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [baseAmountStr, setBaseAmountStr] = useState(
    initialAmount !== undefined ? String(initialAmount) : ""
  );
  const [extraCharges, setExtraCharges] = useState<{ id: string; name: string; amountStr: string }[]>([]);
  const [transactionId, setTransactionId] = useState("");

  const addExtraCharge = () => {
    setExtraCharges((prev) => [...prev, { id: Math.random().toString(), name: "", amountStr: "" }]);
  };

  const removeExtraCharge = (id: string) => {
    setExtraCharges((prev) => prev.filter((item) => item.id !== id));
  };

  const updateExtraCharge = (id: string, field: "name" | "amountStr", value: string) => {
    setExtraCharges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  useEffect(() => {
    if (job && initialAmount === undefined && !baseAmountStr) {
      const defaultAmount = job.serviceCharge ?? job.categoryPrice ?? 0;
      setBaseAmountStr(String(defaultAmount));
    }
  }, [job, initialAmount, baseAmountStr]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const percent = 18;
  const baseAmount = parseFloat(baseAmountStr) || 0;
  const extraChargesSum = extraCharges.reduce((sum, item) => sum + (parseFloat(item.amountStr) || 0), 0);
  const totalBase = baseAmount + extraChargesSum;

  const gstAmount = Math.round(((totalBase * percent) / 100) * 100) / 100;
  const amount = Math.round((totalBase + gstAmount) * 100) / 100;

  const upiLink = buildUpiLink(amount);

  const handleSubmit = async () => {
    if (amount <= 0) {
      Alert.alert("Amount Required", "Please enter a valid payment amount.");
      return;
    }
    if (paymentMode === "UPI" && !transactionId.trim()) {
      Alert.alert("Transaction ID Required", "Please enter the UPI Transaction ID / Ref No.");
      return;
    }
    if (!paymentConfirmed) {
      Alert.alert("Confirm Payment", "Please toggle the payment confirmation before submitting.");
      return;
    }

    try {
      // 1. Collect payment (send total base amount to backend, which calculates GST on top of it)
      const payResult = await collectMutation.mutateAsync({
        ticketNo: jobId,
        amount: totalBase,
        paymentMethod: paymentMode,
      });

      // 2. Complete the job
      await completeJobMutation.mutateAsync({
        ticketNo: jobId,
        payload: {
          beforePhotos: job?.beforePhotos ?? [],
          afterPhotos: job?.afterPhotos ?? [],
          customerSignature: "captured",
          workNotes: (job?.workNotes ? job.workNotes : "Completed") + (transactionId.trim() ? ` | UPI Txn ID: ${transactionId.trim()}` : ""),
          duration: "—",
          paymentCollection: amount,
          paymentMethod: paymentMode,
        },
      });

      Alert.alert(
        "🎉 Job Completed!",
        `Invoice ${payResult.invoiceNo} generated.\nAmount collected: ₹${amount.toLocaleString("en-IN")}\nPayment Mode: ${paymentMode}\n\nJob ${ticketNo} is now CLOSED.`,
        [
          {
            text: "Back to Home",
            onPress: () => navigation.navigate("TechnicianHome"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to collect payment.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Payment Collection" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket..." />
      </View>
    );
  }

  const isLoading2 = collectMutation.isPending || completeJobMutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="Payment Collection"
        subtitle={`Step 3 of 3 · ${ticketNo}`}
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
                        i < 2
                          ? theme.colors.success
                          : theme.colors.primary,
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
                        i === 2
                          ? theme.colors.primary
                          : theme.colors.success,
                    },
                  ]}
                >
                  {step}
                </Text>
              </View>
              {i < 2 && (
                <View style={[styles.stepLine, { backgroundColor: theme.colors.success }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Ticket Summary */}
        <AppCard style={styles.card}>
          <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{ticketNo}</Text>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>{job?.service}</Text>
          <Text style={[styles.customer, { color: theme.colors.textMuted }]}>
            {job?.customerName}
          </Text>
        </AppCard>

        {/* Amount Input */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          Base Service Charge (Excl. GST)
        </Text>
        <View
          style={[
            styles.amountContainer,
            {
              borderColor: theme.colors.border,
              backgroundColor: `${theme.colors.card}80`,
            },
          ]}
        >
          <IndianRupee size={20} color={theme.colors.textMuted} />
          <TextInput
            value={baseAmountStr}
            onChangeText={setBaseAmountStr}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="decimal-pad"
            style={[styles.amountInput, { color: theme.colors.textMuted }]}
            editable={false}
          />
        </View>

        {/* Extra Charges Section */}
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginBottom: 0 }]}>
              Extra Charges
            </Text>
            <Pressable
              onPress={addExtraCharge}
              style={({ pressed }) => [
                styles.addExtraBtn,
                { backgroundColor: `${theme.colors.primary}12`, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.addExtraBtnText, { color: theme.colors.primary }]}>+ Add Item</Text>
            </Pressable>
          </View>

          {extraCharges.map((item) => (
            <View key={item.id} style={styles.extraRowInput}>
              <TextInput
                value={item.name}
                onChangeText={(val) => updateExtraCharge(item.id, "name", val)}
                placeholder="Charge Name (e.g. Spare Parts)"
                placeholderTextColor={theme.colors.textLight}
                style={[styles.extraNameInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
              />
              <View style={[styles.extraAmountWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>₹</Text>
                <TextInput
                  value={item.amountStr}
                  onChangeText={(val) => updateExtraCharge(item.id, "amountStr", val)}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="decimal-pad"
                  style={[styles.extraAmountInput, { color: theme.colors.text }]}
                />
              </View>
              <Pressable
                onPress={() => removeExtraCharge(item.id)}
                style={({ pressed }) => [
                  styles.removeExtraBtn,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Trash2 size={18} color={theme.colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* GST Breakdown */}
        {amount > 0 && (
          <AppCard style={[styles.breakdownCard, { marginTop: 14 }]}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textMuted }]}>
                Base Service Charge
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                ₹{baseAmount.toLocaleString("en-IN")}
              </Text>
            </View>

            {extraChargesSum > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: theme.colors.textMuted }]}>
                  Extra Charges Total
                </Text>
                <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                  ₹{extraChargesSum.toLocaleString("en-IN")}
                </Text>
              </View>
            )}


            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textMuted }]}>
                {percent > 0 ? `GST (${percent}%)` : "GST"}
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                ₹{gstAmount.toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total Amount</Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                ₹{amount.toLocaleString("en-IN")}
              </Text>
            </View>
          </AppCard>
        )}

        {/* Payment Mode Toggle */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
          Payment Mode
        </Text>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setPaymentMode("CASH")}
            style={[
              styles.modeBtn,
              {
                backgroundColor:
                  paymentMode === "CASH" ? `${theme.colors.success}15` : theme.colors.card,
                borderColor:
                  paymentMode === "CASH" ? theme.colors.success : theme.colors.borderLight,
              },
            ]}
          >
            <Banknote size={22} color={paymentMode === "CASH" ? theme.colors.success : theme.colors.textMuted} />
            <Text
              style={[
                styles.modeBtnText,
                { color: paymentMode === "CASH" ? theme.colors.success : theme.colors.text },
              ]}
            >
              Cash
            </Text>
            {paymentMode === "CASH" && (
              <CheckCircle2 size={16} color={theme.colors.success} />
            )}
          </Pressable>

          <Pressable
            onPress={() => setPaymentMode("UPI")}
            style={[
              styles.modeBtn,
              {
                backgroundColor:
                  paymentMode === "UPI" ? `${theme.colors.primary}15` : theme.colors.card,
                borderColor:
                  paymentMode === "UPI" ? theme.colors.primary : theme.colors.borderLight,
              },
            ]}
          >
            <Smartphone size={22} color={paymentMode === "UPI" ? theme.colors.primary : theme.colors.textMuted} />
            <Text
              style={[
                styles.modeBtnText,
                { color: paymentMode === "UPI" ? theme.colors.primary : theme.colors.text },
              ]}
            >
              UPI
            </Text>
            {paymentMode === "UPI" && (
              <CheckCircle2 size={16} color={theme.colors.primary} />
            )}
          </Pressable>
        </View>

        {/* UPI QR Code */}
        {paymentMode === "UPI" && amount > 0 && (
          <AppCard style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <CreditCard size={18} color={theme.colors.primary} />
              <Text style={[styles.qrTitle, { color: theme.colors.text }]}>
                Scan to Pay · ₹{amount.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.qrContainer}>
              <QRCode
                value={upiLink}
                size={180}
                backgroundColor="#ffffff"
                color="#0f172a"
              />
            </View>
            <Text style={[styles.qrHint, { color: theme.colors.textMuted }]}>
              UPI ID: fieldeaze@upi · Scan with any UPI app
            </Text>
            <Text style={[styles.qrLink, { color: theme.colors.textLight }]} numberOfLines={2}>
              {upiLink}
            </Text>
          </AppCard>
        )}

        {paymentMode === "UPI" && amount <= 0 && (
          <View
            style={[
              styles.qrPlaceholder,
              { backgroundColor: `${theme.colors.primary}08`, borderColor: theme.colors.borderLight },
            ]}
          >
            <Text style={[styles.qrPlaceholderText, { color: theme.colors.textMuted }]}>
              Enter amount above to generate QR code
            </Text>
          </View>
        )}

        {/* UPI Transaction ID Input */}
        {paymentMode === "UPI" && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
              UPI Transaction ID / Ref No. <Text style={{ color: theme.colors.danger }}>*</Text>
            </Text>
            <TextInput
              value={transactionId}
              onChangeText={setTransactionId}
              placeholder="Enter UPI Transaction ID / UTR"
              placeholderTextColor={theme.colors.textLight}
              style={{
                height: 48,
                borderWidth: 1.5,
                borderRadius: 10,
                paddingHorizontal: 14,
                fontSize: 15,
                color: theme.colors.text,
                borderColor: transactionId.trim() ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.card,
              }}
            />
          </View>
        )}

        {/* Payment Confirmation Toggle */}
        <View
          style={[
            styles.confirmRow,
            {
              backgroundColor: paymentConfirmed
                ? `${theme.colors.success}10`
                : theme.colors.card,
              borderColor: paymentConfirmed ? theme.colors.success : theme.colors.borderLight,
            },
          ]}
        >
          <View style={styles.confirmTextCol}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
              Confirm Payment Received
            </Text>
            <Text style={[styles.confirmSubtitle, { color: theme.colors.textMuted }]}>
              Toggle only after the customer has paid
            </Text>
          </View>
          <Switch
            value={paymentConfirmed}
            onValueChange={setPaymentConfirmed}
            trackColor={{ false: theme.colors.borderLight, true: `${theme.colors.success}60` }}
            thumbColor={paymentConfirmed ? theme.colors.success : theme.colors.textLight}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Generate Invoice & Close Job"
            onPress={handleSubmit}
            loading={isLoading2}
            disabled={!paymentConfirmed || amount <= 0}
            variant="success"
            size="lg"
            icon={<Receipt size={20} color="#ffffff" />}
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
  stepIndicator: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  stepDotText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase" },
  stepLine: { flex: 1, height: 2, marginBottom: 16 },
  card: { marginBottom: 12 },
  ticketNo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  serviceName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  customer: { fontSize: 13 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "800", paddingVertical: 12 },
  breakdownCard: { padding: 14 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  breakdownLabel: { fontSize: 13 },
  breakdownValue: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "800" },
  modeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modeBtnText: { fontSize: 15, fontWeight: "700" },
  qrCard: { alignItems: "center", padding: 20, marginBottom: 16 },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  qrTitle: { fontSize: 15, fontWeight: "700" },
  qrContainer: {
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrHint: { fontSize: 12, marginBottom: 6, textAlign: "center" },
  qrLink: { fontSize: 9, textAlign: "center" },
  qrPlaceholder: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  qrPlaceholderText: { fontSize: 13 },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 12,
  },
  confirmTextCol: { flex: 1 },
  confirmTitle: { fontSize: 14, fontWeight: "700" },
  confirmSubtitle: { fontSize: 12, marginTop: 2 },
  actions: { gap: 10 },
  addExtraBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addExtraBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  extraRowInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 6,
  },
  extraNameInput: {
    flex: 1.8,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  extraAmountWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  extraAmountInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: "600",
  },
  removeExtraBtn: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
