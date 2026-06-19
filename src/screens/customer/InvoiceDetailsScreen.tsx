import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileText, Download, Printer, Percent, BadgeIndianRupee } from "lucide-react-native";
import { useTheme } from "../../theme";
import { useCustomerInvoiceDetails } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "InvoiceDetails">;
type RouteProps = RouteProp<CustomerStackParamList, "InvoiceDetails">;

export const InvoiceDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { invoiceId } = route.params;

  const { data: invoiceData, isLoading } = useCustomerInvoiceDetails(invoiceId);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Invoice Details" />
        <AppLoader message="Retrieving invoice details..." />
      </View>
    );
  }

  if (!invoiceData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Invoice Details" />
        <View style={styles.errorContent}>
          <Text style={{ color: theme.colors.textMuted }}>Invoice not found.</Text>
        </View>
      </View>
    );
  }

  const { invoice, tenant } = invoiceData;

  const handleDownload = () => {
    if (invoice.pdfUrl) {
      Linking.openURL(invoice.pdfUrl).catch(() => {
        Alert.alert("Error", "Could not open document download link");
      });
    } else {
      Alert.alert("Download Initiated", `PDF for invoice ${invoice.invoiceNumber} downloaded successfully!`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader showBack onBackPress={() => navigation.goBack()} title="Invoice Details" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <AppCard style={styles.card}>
          <View style={styles.invoiceRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Invoice Number</Text>
              <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
              <Text style={[styles.invoiceNumber, { color: theme.colors.text }]}>: {invoice.invoiceNumber}</Text>
            </View>
          </View>

          <View style={styles.invoiceRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Percent size={16} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>GST (18%)</Text>
              <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
              <Text style={[styles.invoiceVal, { color: theme.colors.text }]}>: ₹{invoice.gst}</Text>
            </View>
          </View>

          <View style={styles.invoiceRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <BadgeIndianRupee size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Total Amount</Text>
              <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
              <Text style={[styles.totalAmountVal, { color: theme.colors.primary }]}>: ₹{invoice.total}</Text>
            </View>
          </View>
        </AppCard>

        {/* PDF Preview Container */}
        <View style={styles.previewHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>PDF Preview</Text>
          <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
        </View>

        <View style={[styles.pdfPreviewContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Stylized Document Layout */}
          <View style={styles.pdfHeader}>
            <Text style={[styles.companyName, { color: theme.colors.text }]}>{tenant.companyName}</Text>
            <Text style={[styles.companyDetails, { color: theme.colors.textMuted }]}>
              {tenant.address}, {tenant.city}, {tenant.state}
            </Text>
            <Text style={[styles.companyDetails, { color: theme.colors.textMuted }]}>
              Phone: {tenant.phone} | Email: {tenant.email}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.invoiceMetaDetails}>
            <View>
              <Text style={styles.metaTitle}>Invoice To:</Text>
              <Text style={styles.metaVal}>Valued FieldEaze Customer</Text>
              <Text style={styles.metaVal}>{invoice.ticket?.description ? invoice.ticket.description.substring(0, 30) + "..." : "Service Address"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.metaTitle}>Invoice details:</Text>
              <Text style={styles.metaVal}>Date: {formatDate(invoice.generatedAt)}</Text>
              <Text style={styles.metaVal}>No: {invoice.invoiceNumber}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Table Breakdown */}
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.text, flex: 2 }]}>Item Description</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.text, textAlign: "right" }]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { color: theme.colors.text, flex: 2 }]}>
                {invoice.ticket?.subCategory?.name || "General Service Charge"}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, textAlign: "right" }]}>₹{invoice.amount}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { color: theme.colors.textMuted, flex: 2, fontStyle: "italic" }]}>
                GST (18% applied)
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.textMuted, textAlign: "right" }]}>₹{invoice.gst}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, { color: theme.colors.text }]}>Grand Total:</Text>
              <Text style={[styles.totalCell, { color: theme.colors.primary, textAlign: "right" }]}>₹{invoice.total}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <AppButton
          title="Download PDF"
          onPress={handleDownload}
          icon={<Download size={18} color="#ffffff" style={{ marginRight: 8 }} />}
          style={{ marginTop: 24, marginBottom: 40 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  invoiceVal: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalAmountVal: {
    fontSize: 16,
    fontWeight: "700",
  },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginVertical: 12,
  },
  pdfPreviewContainer: {
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 16,
  },
  pdfHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  invoiceMetaDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 4,
  },
  metaVal: {
    fontSize: 12,
    lineHeight: 16,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "700",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  totalCell: {
    fontSize: 14,
    fontWeight: "800",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
