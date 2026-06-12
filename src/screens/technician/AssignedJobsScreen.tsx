import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Calendar,
  MapPin,
  ChevronRight,
  ChevronDown,
  User,
  Clock,
  Filter,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useTechnicianJobs } from "../../hooks/useJobs";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppEmptyState } from "../../components/AppEmptyState";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { Ticket, TicketStatus } from "../../services/job.service";

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "AssignedJobs">;

type TabFilter = "ALL" | "ASSIGNED" | "ACTIVE" | "PENDING" | "COMPLETED";

const TAB_FILTERS: TabFilter[] = ["ALL", "ASSIGNED", "ACTIVE", "PENDING", "COMPLETED"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = [2025, 2026];

const ACTIVE_STATUSES: TicketStatus[] = ["ACCEPTED", "TRAVELLING", "REACHED", "IN_PROGRESS"];
const ASSIGNED_STATUSES: TicketStatus[] = ["ASSIGNED", "NEW"];
const PENDING_STATUSES: TicketStatus[] = ["PENDING", "RESCHEDULED"];
const COMPLETED_STATUSES: TicketStatus[] = ["COMPLETED", "CLOSED"];

export const AssignedJobsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const now = new Date();
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  const { data: allJobs = [], isLoading } = useTechnicianJobs();

  const allJobsList = Array.isArray(allJobs) ? allJobs : [];

  const filteredJobs = useMemo(() => {
    switch (activeTab) {
      case "ASSIGNED":
        return allJobsList.filter((j: Ticket) => ASSIGNED_STATUSES.includes(j.status));
      case "ACTIVE":
        return allJobsList.filter((j: Ticket) => ACTIVE_STATUSES.includes(j.status));
      case "PENDING":
        return allJobsList.filter((j: Ticket) => PENDING_STATUSES.includes(j.status));
      case "COMPLETED":
        return allJobsList.filter((j: Ticket) => COMPLETED_STATUSES.includes(j.status));
      default:
        return allJobsList;
    }
  }, [allJobsList, activeTab]);

  const tabCounts = useMemo(() => ({
    ALL: allJobsList.length,
    ASSIGNED: allJobsList.filter((j: Ticket) => ASSIGNED_STATUSES.includes(j.status)).length,
    ACTIVE: allJobsList.filter((j: Ticket) => ACTIVE_STATUSES.includes(j.status)).length,
    PENDING: allJobsList.filter((j: Ticket) => PENDING_STATUSES.includes(j.status)).length,
    COMPLETED: allJobsList.filter((j: Ticket) => COMPLETED_STATUSES.includes(j.status)).length,
  }), [allJobsList]);

  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case "URGENT": return "danger";
      case "HIGH":   return "warning";
      case "MEDIUM": return "primary";
      default:       return "secondary";
    }
  };

  const getStatusVariant = (status: TicketStatus) => {
    if (COMPLETED_STATUSES.includes(status)) return "success";
    if (ACTIVE_STATUSES.includes(status))    return "warning";
    if (PENDING_STATUSES.includes(status))   return "danger";
    return "primary";
  };

  const monthLabel = selectedMonth !== undefined && selectedYear !== undefined
    ? `${MONTHS[selectedMonth - 1].slice(0, 3)} ${selectedYear}`
    : "All Time";

  const renderItem = ({ item }: { item: Ticket }) => (
    <AppCard
      key={item.ticketNo}
      onPress={() => navigation.navigate("TechnicianJobDetails", { jobId: item.ticketNo })}
      style={styles.jobCard}
    >
      {/* Top row: ticket # + badges */}
      <View style={styles.cardTop}>
        <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{item.ticketNo}</Text>
        <View style={styles.badgesRow}>
          {item.priority && (
            <AppBadge label={item.priority} variant={getPriorityVariant(item.priority)} />
          )}
          <AppBadge label={item.status.replace("_", " ")} variant={getStatusVariant(item.status)} />
        </View>
      </View>

      {/* Service name */}
      <Text
        style={[
          styles.serviceName,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.semibold,
          },
        ]}
        numberOfLines={1}
      >
        {item.service}
      </Text>

      {/* Scheduled date/time */}
      <View style={styles.infoRow}>
        <Calendar size={14} color={theme.colors.textMuted} style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
          {item.scheduledDate}  ·  {item.scheduledTime}
        </Text>
      </View>

      {/* Address */}
      <View style={styles.infoRow}>
        <MapPin size={14} color={theme.colors.textMuted} style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {item.address}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

      {/* Footer: customer + cta */}
      <View style={styles.cardFooter}>
        <View style={styles.customerRow}>
          <User size={13} color={theme.colors.textLight} />
          <Text style={[styles.customerText, { color: theme.colors.textLight }]}>
            {item.customerName}
          </Text>
        </View>
        <View style={styles.viewLink}>
          <Text style={[styles.viewLinkText, { color: theme.colors.primary }]}>View Details</Text>
          <ChevronRight size={15} color={theme.colors.primary} />
        </View>
      </View>
    </AppCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Assigned Jobs"
        subtitle="Your dispatched service tickets"
        showBack
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => setMonthPickerVisible(true)}
            style={({ pressed }) => [
              styles.filterBtn,
              {
                backgroundColor: selectedMonth
                  ? `${theme.colors.primary}15`
                  : theme.colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Filter
              size={14}
              color={selectedMonth ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.filterBtnText,
                { color: selectedMonth ? theme.colors.primary : theme.colors.textMuted },
              ]}
            >
              {monthLabel}
            </Text>
            <ChevronDown
              size={14}
              color={selectedMonth ? theme.colors.primary : theme.colors.textMuted}
            />
          </Pressable>
        }
      />

      {/* Tab Filter Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <FlatList
          data={TAB_FILTERS}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
          renderItem={({ item: tab }) => {
            const isActive = tab === activeTab;
            return (
              <Pressable
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabItem,
                  isActive && {
                    borderBottomWidth: 2,
                    borderBottomColor: theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.textMuted,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {tab}
                </Text>
                {tabCounts[tab] > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: isActive ? "#ffffff" : theme.colors.textMuted },
                      ]}
                    >
                      {tabCounts[tab]}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <AppLoader message="Loading tickets..." />
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.ticketNo}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <AppEmptyState
              title="No Tickets Found"
              description={
                activeTab === "ALL"
                  ? `No tickets found for ${monthLabel}.`
                  : `No ${activeTab.toLowerCase()} tickets for ${monthLabel}.`
              }
            />
          }
          ListHeaderComponent={
            <Text style={[styles.resultsLabel, { color: theme.colors.textMuted }]}>
              {filteredJobs.length} ticket{filteredJobs.length !== 1 ? "s" : ""} · {monthLabel}
            </Text>
          }
        />
      )}

      {/* Month Picker Modal */}
      <Modal visible={monthPickerVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMonthPickerVisible(false)}
        >
          <Pressable
            style={[styles.pickerCard, { backgroundColor: theme.colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Filter by Month</Text>

            {/* All Time option */}
            <Pressable
              onPress={() => {
                setSelectedMonth(undefined);
                setSelectedYear(undefined);
                setMonthPickerVisible(false);
              }}
              style={[
                styles.allTimeBtn,
                {
                  backgroundColor:
                    selectedMonth === undefined
                      ? theme.colors.primary
                      : `${theme.colors.borderLight}80`,
                },
              ]}
            >
              <Text
                style={[
                  styles.allTimeBtnText,
                  { color: selectedMonth === undefined ? "#ffffff" : theme.colors.text },
                ]}
              >
                All Time
              </Text>
            </Pressable>

            {YEARS.map((year) => (
              <View key={year}>
                <Text style={[styles.yearHeader, { color: theme.colors.textMuted }]}>{year}</Text>
                <View style={styles.monthGrid}>
                  {MONTHS.map((m, idx) => {
                    const isSelected = idx + 1 === selectedMonth && year === selectedYear;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => {
                          setSelectedMonth(idx + 1);
                          setSelectedYear(year);
                          setMonthPickerVisible(false);
                        }}
                        style={[
                          styles.monthCell,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : `${theme.colors.borderLight}80`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthCellText,
                            { color: isSelected ? "#ffffff" : theme.colors.text },
                          ]}
                        >
                          {m.slice(0, 3)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Tab bar
  tabBar: {
    borderBottomWidth: 1,
  },
  tabList: {
    paddingHorizontal: 12,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginRight: 4,
  },
  tabText: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tabBadge: {
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  resultsLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Job Card
  jobCard: {
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketNo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 5,
  },
  serviceName: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  customerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewLinkText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  pickerCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    textAlign: "center",
  },
  allTimeBtn: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  allTimeBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  yearHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  monthCell: {
    width: "22%",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
