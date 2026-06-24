import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle2, Receipt, Share2, Download, Check } from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";
import { AppAlertModal } from "../../components/AppAlertModal";

type RouteProps = RouteProp<TechnicianStackParamList, "InvoiceGenerate">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "InvoiceGenerate">;

export const InvoiceGenerateScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, amount: initialAmount, paymentMethod: initialPaymentMethod, invoiceNo,
          invoiceSubtotal, invoiceGstAmount, invoiceGstPercent, invoiceTotal, invoiceGeneratedAt } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const [downloading, setDownloading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("success");

  const amount = initialAmount || job?.paymentCollection || 0;
  const paymentMethod = initialPaymentMethod || job?.paymentMethod || "CASH";

  const percent = job?.gstPercent && job.gstPercent > 0 ? job.gstPercent : 18;
  const fallbackBase = Math.round((amount / (1 + percent / 100)) * 100) / 100;
  const fallbackGst = Math.round((amount - fallbackBase) * 100) / 100;

  // Use real DB values from API; fallback to client-side estimate only if missing
  const baseAmount  = invoiceSubtotal  ?? fallbackBase;
  const gstAmount   = invoiceGstAmount ?? fallbackGst;
  const gstPercent  = invoiceGstPercent ?? percent;
  const totalAmount = invoiceTotal     ?? amount;
  const invoiceDate = invoiceGeneratedAt
    ? new Date(invoiceGeneratedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const gstLabel = gstPercent > 0 ? `GST (${gstPercent}%)` : "GST";

  const ticketBasePrice = job?.serviceCharge ?? job?.categoryPrice ?? 0;
  const sparesAmount = (ticketBasePrice > 0 && baseAmount > ticketBasePrice) 
    ? Math.round((baseAmount - ticketBasePrice) * 100) / 100 
    : 0;
  const displayBaseAmount = sparesAmount > 0 ? ticketBasePrice : baseAmount;

  const showAlert = (title: string, message: string, type: "success" | "error" | "warning" = "success") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const generatePDF = async () => {
    const customerName = job?.customerName || "Customer";
    const customerMobile = job?.customerMobile || "";
    const service = job?.service || "General Service";
    const category = job?.category || "Maintenance";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${invoiceNo}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          .invoice-card { max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
          .brand { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .status-paid { background-color: #d1fae5; color: #065f46; padding: 5px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .meta-table { width: 100%; margin-bottom: 20px; }
          .meta-table td { padding: 5px 0; font-size: 14px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .items-table th { background-color: #f3f4f6; text-align: left; padding: 10px; font-size: 14px; }
          .items-table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
          .totals { margin-top: 20px; text-align: right; }
          .totals table { margin-left: auto; }
          .totals td { padding: 5px 10px; font-size: 14px; }
          .totals .grand-total { font-size: 18px; font-weight: bold; color: #3b82f6; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div>
              <div class="brand">FIELDEAZE</div>
              <div style="font-size: 12px; color: #6b7280;">Reliable On-Demand Services</div>
            </div>
            <div class="status-paid">PAID</div>
          </div>
          
          <table class="meta-table">
            <tr>
              <td><strong>Invoice Number:</strong> #${invoiceNo}</td>
              <td style="text-align: right;"><strong>Date:</strong> ${invoiceDate}</td>
            </tr>
            <tr>
              <td><strong>Bill To:</strong> ${customerName}<br/>Mobile: ${customerMobile}</td>
              <td style="text-align: right; vertical-align: top;"><strong>Payment Method:</strong> ${paymentMethod}</td>
            </tr>
            <tr>
              <td><strong>Ticket Number:</strong> ${ticketNo}</td>
              <td></td>
            </tr>
          </table>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Service Item</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${service}</strong><br/>
                  <span style="font-size: 12px; color: #6b7280;">${category}</span>
                </td>
                <td style="text-align: right;">Rs.${displayBaseAmount.toLocaleString('en-IN')}</td>
              </tr>
              ${sparesAmount > 0 ? `
              <tr>
                <td>
                  <strong>Extra Charges / Spares</strong><br/>
                  <span style="font-size: 12px; color: #6b7280;">Additional parts or services</span>
                </td>
                <td style="text-align: right;">Rs.${sparesAmount.toLocaleString('en-IN')}</td>
              </tr>
              ` : ""}
            </tbody>
          </table>
          
          <div class="totals">
            <table>
              <tr>
                <td>Base Charges:</td>
                <td>Rs.${displayBaseAmount.toLocaleString('en-IN')}</td>
              </tr>
              ${sparesAmount > 0 ? `
              <tr>
                <td>Extra Charges / Spares:</td>
                <td>Rs.${sparesAmount.toLocaleString('en-IN')}</td>
              </tr>
              ` : ""}
              ${gstAmount > 0 ? `
              <tr>
                <td>${gstLabel}:</td>
                <td>Rs.${gstAmount.toLocaleString('en-IN')}</td>
              </tr>
              ` : ""}
              <tr class="grand-total">
                <td>Total Paid:</td>
                <td>Rs.${totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            Thank you for choosing FieldEaze!
          </div>
        </div>
      </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  };

  const handleShare = async () => {
    try {
      const uri = await generatePDF();
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Share Invoice #${invoiceNo}`,
        UTI: "com.adobe.pdf",
      });
    } catch (err: any) {
      showAlert("Share Failed", err.message || "Failed to share invoice details.", "error");
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const uri = await generatePDF();
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(uri);
      } else {
        await Print.printAsync({ uri });
      }
      showAlert("Download Initiated", `Invoice PDF for #${invoiceNo} is ready.`, "success");
    } catch (err: any) {
      showAlert("Download Failed", err.message || "Failed to download invoice.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Invoice Details" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading invoice..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Job Invoice"
        subtitle={ticketNo}
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Check Banner */}
        <View style={styles.centerCol}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.success}12` }]}>
            <CheckCircle2 size={54} color={theme.colors.success} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Payment & Job Closed</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            The job has been completed. The final invoice has been generated.
          </Text>
        </View>

        {/* Invoice Bill Format Sheet */}
        <AppCard style={[styles.invoiceSheet, { borderColor: theme.colors.border }]}>
          {/* Header Branding */}
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={[styles.brandName, { color: theme.colors.primary }]}>FIELDEAZE</Text>
              <Text style={[styles.brandSub, { color: theme.colors.textMuted }]}>Reliable On-Demand Services</Text>
            </View>
            <View style={[styles.paidBadge, { backgroundColor: `${theme.colors.success}15` }]}>
              <Check size={14} color={theme.colors.success} style={{ marginRight: 4 }} />
              <Text style={[styles.paidText, { color: theme.colors.success }]}>PAID</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Metadata Block */}
          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <View>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>INVOICE NUMBER</Text>
                <Text style={[styles.metaValue, { color: theme.colors.text }]}>#{invoiceNo}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>DATE</Text>
                <Text style={[styles.metaValue, { color: theme.colors.text }]}>
                  {invoiceDate}
                </Text>
              </View>
            </View>

            <View style={[styles.metaRow, { marginTop: 12 }]}>
              <View>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>BILL TO (CUSTOMER)</Text>
                <Text style={[styles.metaValue, { color: theme.colors.text }]}>{job?.customerName || "Customer"}</Text>
                <Text style={[styles.metaValueSub, { color: theme.colors.textMuted }]}>{job?.customerMobile}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>PAYMENT METHOD</Text>
                <Text style={[styles.metaValue, { color: theme.colors.text }]}>{paymentMethod}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Items Section */}
          <Text style={[styles.sectionHeading, { color: theme.colors.textMuted }]}>SERVICE ITEMS</Text>
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>{job?.service || "General Service"}</Text>
              <Text style={[styles.itemDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {job?.category || "Maintenance"}
              </Text>
            </View>
            <Text style={[styles.itemPrice, { color: theme.colors.text }]}>₹{displayBaseAmount.toLocaleString("en-IN")}</Text>
          </View>

          {sparesAmount > 0 && (
            <View style={[styles.itemRow, { marginTop: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>Extra Charges / Spares</Text>
                <Text style={[styles.itemDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  Additional parts or services
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: theme.colors.text }]}>₹{sparesAmount.toLocaleString("en-IN")}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Totals Breakdown */}
          <View style={styles.totalBlock}>
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 13, color: theme.colors.textMuted }}>Base Service Charge</Text>
              <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: "600" }}>Rs.{displayBaseAmount.toLocaleString("en-IN")}</Text>
            </View>
            {sparesAmount > 0 && (
              <View style={[styles.totalRow, { marginTop: 6 }]}>
                <Text style={{ fontSize: 13, color: theme.colors.textMuted }}>Extra Charges / Spares</Text>
                <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: "600" }}>Rs.{sparesAmount.toLocaleString("en-IN")}</Text>
              </View>
            )}
            {gstAmount > 0 && (
              <View style={[styles.totalRow, { marginTop: 6 }]}>
                <Text style={{ fontSize: 13, color: theme.colors.textMuted }}>{gstLabel}</Text>
                <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: "600" }}>Rs.{gstAmount.toLocaleString("en-IN")}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

            <View style={styles.totalRow}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>Total Paid</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.primary }}>
                Rs.{totalAmount.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Invoice Action Options */}
        <View style={styles.actions}>
          <View style={styles.btnRow}>
            <AppButton
              title={downloading ? "Downloading..." : "Download PDF"}
              onPress={handleDownload}
              variant="outline"
              style={{ flex: 1 }}
              loading={downloading}
              icon={<Download size={18} color={theme.colors.primary} />}
            />
            <AppButton
              title="Share Invoice"
              onPress={handleShare}
              variant="outline"
              style={{ flex: 1 }}
              icon={<Share2 size={18} color={theme.colors.primary} />}
            />
          </View>

          <AppButton
            title="Close & View Completed Jobs"
            onPress={() => navigation.navigate("AssignedJobs", { initialTab: "COMPLETED" })}
            variant="primary"
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>

      {/* Styled Alert popup modal */}
      <AppAlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centerCol: { alignItems: "center", marginBottom: 20, marginTop: 8 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  invoiceSheet: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  metaBlock: {
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  metaValueSub: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalBlock: {
    gap: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: { gap: 12 },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
});
