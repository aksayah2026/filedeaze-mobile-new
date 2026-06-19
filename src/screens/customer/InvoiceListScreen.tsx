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
import { FileText, Download, ChevronRight, Inbox } from "lucide-react-native";
import { useTheme } from "../../theme";
import { useCustomerInvoices } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "InvoiceList">;

export const InvoiceListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: invoices = [], isLoading, refetch, isFetching } = useCustomerInvoices();

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
      <AppHeader showBack onBackPress={() => navigation.goBack()} title="My Invoices" />

      {isLoading ? (
        <AppLoader message="Retrieving invoices..." />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <AppCard
              style={styles.invoiceCard}
              onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FileText size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Invoice Number</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={[styles.valueInvoiceNo, { color: theme.colors.text }]}>: {item.invoiceNumber}</Text>
                </View>
                <Pressable
                  style={styles.downloadBtn}
                  onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: item.id })}
                >
                  <Download size={18} color={theme.colors.primary} />
                </Pressable>
              </View>

              <View style={styles.detailRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Ticket Number</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>: {item.ticket?.ticketNumber || "—"}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Amount</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={[styles.valueAmount, { color: theme.colors.primary }]}>: ₹{item.total}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

              <View style={styles.cardFooter}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Invoice Date</Text>
                  <Text style={{ color: theme.colors.danger, fontWeight: "bold" }}> *</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.text, fontWeight: "600" }}>
                    : {formatDate(item.generatedAt)}
                  </Text>
                </View>
                <View style={styles.actionLink}>
                  <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "700" }}>View Details</Text>
                  <ChevronRight size={14} color={theme.colors.primary} />
                </View>
              </View>
            </AppCard>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color={theme.colors.textLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No invoice records found.
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
  invoiceCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  valueInvoiceNo: {
    fontSize: 14,
    fontWeight: "700",
  },
  downloadBtn: {
    padding: 6,
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
    fontSize: 14,
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
