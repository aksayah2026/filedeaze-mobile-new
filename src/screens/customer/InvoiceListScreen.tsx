import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  FileText,
  ChevronRight,
  Receipt,
  Calendar,
  Tag,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { useTheme } from "../../theme";
import { useCustomerInvoices } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { CustomerInvoice } from "../../services/customer.service";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "InvoiceList">;

export const InvoiceListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: invoices = [], isLoading, refetch, isFetching } = useCustomerInvoices();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    if (status === "COLLECTED" || status === "PAID") return theme.colors.success;
    if (status === "PENDING") return theme.colors.warning;
    return theme.colors.textMuted;
  };

  const renderInvoiceCard = ({ item }: { item: CustomerInvoice }) => {
    const isPaid = item.payment?.status === "COLLECTED" || item.payment?.status === "PAID";
    const paymentStatus = item.payment?.status || "PENDING";
    const paymentStatusColor = getPaymentStatusColor(paymentStatus);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.colors.card, opacity: pressed ? 0.95 : 1 },
        ]}
        onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: item.id })}
      >
        {/* Card Top Strip */}
        <View style={[styles.cardStrip, { backgroundColor: isPaid ? theme.colors.success : theme.colors.warning }]} />

        <View style={styles.cardBody}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.invoiceIconRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Receipt size={18} color={theme.colors.primary} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.invoiceNoLabel, { color: theme.colors.textMuted }]}>INVOICE</Text>
                <Text style={[styles.invoiceNo, { color: theme.colors.text }]}>#{item.invoiceNumber}</Text>
              </View>
            </View>
            {/* Payment Badge */}
            <View style={[styles.payBadge, { backgroundColor: `${paymentStatusColor}18` }]}>
              {isPaid ? (
                <CheckCircle2 size={11} color={paymentStatusColor} style={{ marginRight: 4 }} />
              ) : (
                <Clock size={11} color={paymentStatusColor} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.payBadgeText, { color: paymentStatusColor }]}>
                {isPaid ? "PAID" : paymentStatus}
              </Text>
            </View>
          </View>

          {/* Service Description */}
          <Text style={[styles.serviceText, { color: theme.colors.text }]} numberOfLines={1}>
            {item.ticket?.subCategory?.name || "General Service"}
          </Text>
          <Text style={[styles.categoryText, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.ticket?.subCategory?.category?.name || "Service"}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Info Row */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Tag size={11} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Ticket</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {" "}{item.ticket?.ticketNumber || "—"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Calendar size={11} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Date</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {" "}{formatDate(item.generatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            {/* Amount Block */}
            <View style={styles.amountBlock}>
              <View style={[styles.amountPill, { backgroundColor: `${theme.colors.primary}12` }]}>
                <IndianRupee size={13} color={theme.colors.primary} />
                <Text style={[styles.amountText, { color: theme.colors.primary }]}>
                  {Number(item.total).toLocaleString("en-IN")}
                </Text>
              </View>
              {item.payment?.method && (
                <View style={styles.methodRow}>
                  <CreditCard size={10} color={theme.colors.textMuted} style={{ marginRight: 3 }} />
                  <Text style={[styles.methodText, { color: theme.colors.textMuted }]}>
                    {item.payment.method}
                  </Text>
                </View>
              )}
            </View>

            {/* View Details */}
            <View style={styles.viewDetailsRow}>
              <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Invoice</Text>
              <ChevronRight size={15} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader showBack onBackPress={() => navigation.goBack()} title="My Invoices" />

      {isLoading ? (
        <AppLoader message="Retrieving invoices..." />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={renderInvoiceCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: `${theme.colors.primary}10` }]}>
                <FileText size={40} color={theme.colors.textLight} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Invoices Yet</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Your invoices will appear here once services are completed.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },

  card: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardStrip: { height: 4 },
  cardBody: { padding: 16 },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  invoiceIconRow: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceNoLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  invoiceNo: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 1,
  },

  payBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  payBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  serviceText: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    marginBottom: 4,
  },

  divider: { height: 1, marginVertical: 12 },

  infoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoItem: { flexDirection: "row", alignItems: "center" },
  infoLabel: { fontSize: 11, fontWeight: "600" },
  infoValue: { fontSize: 11, fontWeight: "700" },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountBlock: { gap: 4 },
  amountPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
  },
  amountText: { fontSize: 16, fontWeight: "800" },
  methodRow: { flexDirection: "row", alignItems: "center", marginLeft: 4 },
  methodText: { fontSize: 10 },

  viewDetailsRow: { flexDirection: "row", alignItems: "center" },
  viewDetailsText: { fontSize: 13, fontWeight: "700" },

  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});

export default InvoiceListScreen;
