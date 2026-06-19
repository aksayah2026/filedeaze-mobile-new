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
import { Calendar, CreditCard, ChevronRight, Inbox } from "lucide-react-native";
import { useTheme } from "../../theme";
import { useCustomerPayments, useCustomerInvoices } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "PaymentHistory">;

export const PaymentHistoryScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: payments = [], isLoading, refetch, isFetching } = useCustomerPayments();
  const { data: invoices = [] } = useCustomerInvoices();

  const getStatusVariant = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PAID" || s === "COMPLETED" || s === "SUCCESS") return "success";
    if (s === "PENDING" || s === "PROCESSING") return "warning";
    return "danger";
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
      <AppHeader showBack onBackPress={() => navigation.goBack()} title="Payment History" />

      {isLoading ? (
        <AppLoader message="Retrieving transactions..." />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <AppCard
              style={styles.paymentCard}
              onPress={() => {
                if (item.invoice?.invoiceNumber) {
                  // Direct to invoice details
                  const matchingInvoice = invoices.find(inv => inv.invoiceNumber === item.invoice?.invoiceNumber);
                  navigation.navigate("InvoiceDetails", { invoiceId: matchingInvoice?.id || item.id });
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Payment ID</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={[styles.valueId, { color: theme.colors.text }]}>: {item.id.substring(0, 8).toUpperCase()}</Text>
                </View>
                <AppBadge label={item.status} variant={getStatusVariant(item.status)} />
              </View>

              <View style={styles.detailRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Ticket Number</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>: {item.invoice?.invoiceNumber || "—"}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Amount</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={[styles.valueAmount, { color: theme.colors.primary }]}>: ₹{item.amount}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

              <View style={styles.cardFooter}>
                <View style={styles.timeInfo}>
                  <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Date</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.text, fontWeight: "600" }}>
                    : {formatDate(item.createdAt)}
                  </Text>
                </View>
                {item.invoice?.invoiceNumber ? (
                  <View style={styles.actionLink}>
                    <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "700" }}>Invoice</Text>
                    <ChevronRight size={14} color={theme.colors.primary} />
                  </View>
                ) : null}
              </View>
            </AppCard>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CreditCard size={48} color={theme.colors.textLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No transaction records found.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  paymentCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  valueId: {
    fontSize: 13,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
  },
  valueAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
