import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, ChevronRight, Inbox, Plus } from "lucide-react-native";
import { useTheme } from "../../theme";
import { useCustomerTickets } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "TicketHistory">;

export const TicketHistoryScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Query status mapping: "ALL" => undefined (or fetch all then filter, or fetch with API filter)
  const apiStatusParam = activeFilter === "ALL" ? undefined : activeFilter;
  const { data: tickets = [], isLoading, refetch, isFetching } = useCustomerTickets(apiStatusParam);

  const filters = [
    { label: "All", value: "ALL" },
    { label: "New", value: "NEW_TICKET" },
    { label: "Assigned", value: "ASSIGNED" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "En Route", value: "TRAVELLING" },
    { label: "Reached", value: "REACHED_LOCATION" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Closed", value: "TICKET_CLOSED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case "NEW_TICKET":
        return { label: "NEW", variant: "primary" as const };
      case "ASSIGNED":
        return { label: "ASSIGNED", variant: "warning" as const };
      case "ACCEPTED":
        return { label: "ACCEPTED", variant: "warning" as const };
      case "TRAVELLING":
        return { label: "EN ROUTE", variant: "warning" as const };
      case "REACHED_LOCATION":
        return { label: "ARRIVED", variant: "warning" as const };
      case "IN_PROGRESS":
        return { label: "IN PROGRESS", variant: "warning" as const };
      case "COMPLETED":
        return { label: "COMPLETED", variant: "success" as const };
      case "TICKET_CLOSED":
        return { label: "CLOSED", variant: "success" as const };
      case "CANCELLED":
        return { label: "CANCELLED", variant: "danger" as const };
      default:
        return { label: status, variant: "primary" as const };
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
      <AppHeader showBack onBackPress={() => navigation.navigate("CustomerDashboard")} title="Service History" />

      {/* Filter Chips */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.value;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.borderLight },
                  isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setActiveFilter(item.value)}
              >
                <Text style={[styles.filterLabel, { color: isActive ? "#ffffff" : theme.colors.textMuted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Tickets List */}
      {isLoading ? (
        <AppLoader message="Retrieving service requests..." />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => {
            const badge = getStatusBadgeProps(item.status);
            return (
              <AppCard
                style={styles.ticketCard}
                onPress={() => navigation.navigate("CustomerTicketDetails", { ticketId: item.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.ticketNo, { color: theme.colors.primary }]}>#{item.ticketNumber}</Text>
                  <AppBadge label={badge.label} variant={badge.variant} />
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.serviceValue, { color: theme.colors.text }]}>
                    {item.subCategory?.name || "General Service"}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.desc, { color: theme.colors.textMuted }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

                <View style={styles.cardFooter}>
                  <View style={styles.timeInfo}>
                    <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      Created: {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.actionLink}>
                    <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "700" }}>Details</Text>
                    <ChevronRight size={14} color={theme.colors.primary} />
                  </View>
                </View>
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Inbox size={48} color={theme.colors.textLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No tickets found for this filter.
              </Text>
              <AppButton
                title="Raise New Ticket"
                size="sm"
                onPress={() => navigation.navigate("RaiseTicket")}
                icon={<Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />}
              />
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
  filterWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  ticketCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ticketLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  ticketNo: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardBody: {
    marginBottom: 12,
  },
  serviceValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
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
    marginBottom: 8,
  },
});
