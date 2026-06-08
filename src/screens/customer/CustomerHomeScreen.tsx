import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  LogOut,
  Calendar,
  ChevronRight,
  User,
  Plus,
  FileText,
  Activity,
  ClipboardList,
  AlertCircle,
  Camera,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import {
  useCustomerTickets,
  useCustomerInvoices,
  useRaiseTicket,
} from "../../hooks/useJobs";
import { mapToCustomerStatus } from "../../mock/data";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppEmptyState } from "../../components/AppEmptyState";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "CustomerHome">;
type CustomerTab = "TICKETS" | "RAISE_TICKET" | "INVOICES" | "PROFILE";

export const CustomerHomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const customerMobile = user?.mobile || "";
  const { data: tickets = [], isLoading: isTicketsLoading, refetch: refetchTickets } = useCustomerTickets(customerMobile);
  const { data: invoices = [], isLoading: isInvoicesLoading, refetch: refetchInvoices } = useCustomerInvoices(customerMobile);
  const raiseTicketMutation = useRaiseTicket();

  const [activeTab, setActiveTab] = useState<CustomerTab>("TICKETS");

  // Form State
  const [category, setCategory] = useState("Appliance Repair");
  const [subCategory, setSubCategory] = useState("AC Service");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("Flat 402, Royal Residency, Sector 62, Noida");
  const [images, setImages] = useState<string[]>([]);

  const handleRaiseTicket = async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Please describe your issue.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Required", "Please provide a service location address.");
      return;
    }

    try {
      await raiseTicketMutation.mutateAsync({
        customerName: user?.name || "Client",
        customerMobile,
        category,
        subCategory,
        description,
        address,
        images,
      });

      // Reset form
      setDescription("");
      setImages([]);
      Alert.alert("Ticket Raised", "Your service request has been logged successfully.");
      setActiveTab("TICKETS");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit request.");
    }
  };

  const simulateAddImage = () => {
    setImages(["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200"]);
    Alert.alert("Photo Attached", "Simulated issue photo attached.");
  };

  const getStatusVariant = (status: string) => {
    const customerStatus = mapToCustomerStatus(status as any);
    switch (customerStatus) {
      case "COMPLETED":
      case "CLOSED":
        return "success";
      case "WORK IN PROGRESS":
      case "TECHNICIAN ASSIGNED":
      case "TECHNICIAN EN ROUTE":
        return "warning";
      case "PENDING":
      case "RESCHEDULED":
        return "danger";
      default:
        return "primary";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        showTenantBranding
        rightAction={
          <Pressable
            onPress={logout}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
          >
            <LogOut color={theme.colors.danger} size={20} />
          </Pressable>
        }
      />

      {/* Customer Profile Banner */}
      <View
        style={[
          styles.profileBanner,
          {
            backgroundColor: theme.colors.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
          <User color={theme.colors.primary} size={24} />
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.welcomeText, { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.xs }]}>
            Customer Account
          </Text>
          <Text
            style={[
              styles.nameText,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
          >
            {user?.name} ({user?.mobile})
          </Text>
        </View>
      </View>

      {/* Bottom Tabs Selection */}
      <View style={[styles.navigationGrid, { backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight }]}>
        <Pressable
          onPress={() => setActiveTab("TICKETS")}
          style={[styles.navItem, activeTab === "TICKETS" && { borderBottomColor: theme.colors.primary }]}
        >
          <ClipboardList size={18} color={activeTab === "TICKETS" ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.navLabel, { color: activeTab === "TICKETS" ? theme.colors.primary : theme.colors.textMuted }]}>
            My Tickets
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("RAISE_TICKET")}
          style={[styles.navItem, activeTab === "RAISE_TICKET" && { borderBottomColor: theme.colors.primary }]}
        >
          <Plus size={18} color={activeTab === "RAISE_TICKET" ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.navLabel, { color: activeTab === "RAISE_TICKET" ? theme.colors.primary : theme.colors.textMuted }]}>
            Raise Ticket
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("INVOICES")}
          style={[styles.navItem, activeTab === "INVOICES" && { borderBottomColor: theme.colors.primary }]}
        >
          <FileText size={18} color={activeTab === "INVOICES" ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.navLabel, { color: activeTab === "INVOICES" ? theme.colors.primary : theme.colors.textMuted }]}>
            Invoices
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("PROFILE")}
          style={[styles.navItem, activeTab === "PROFILE" && { borderBottomColor: theme.colors.primary }]}
        >
          <User size={18} color={activeTab === "PROFILE" ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.navLabel, { color: activeTab === "PROFILE" ? theme.colors.primary : theme.colors.textMuted }]}>
            Profile
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "TICKETS" && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Service History</Text>
              <AppButton
                title="Raise New Ticket"
                onPress={() => setActiveTab("RAISE_TICKET")}
                size="sm"
                icon={<Plus size={12} color="#ffffff" style={{ marginRight: 2 }} />}
              />
            </View>

            {isTicketsLoading ? (
              <AppLoader message="Retrieving requests..." />
            ) : tickets.length === 0 ? (
              <AppEmptyState
                title="No Active Requests"
                description="You haven't logged any service tickets yet. Click above to raise your first AC/appliance support request."
              />
            ) : (
              tickets.map((item) => (
                <AppCard
                  key={item.ticketNo}
                  onPress={() => navigation.navigate("CustomerJobDetails", { jobId: item.ticketNo })}
                  style={styles.ticketCard}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.ticketId, { color: theme.colors.textMuted }]}>{item.ticketNo}</Text>
                    <AppBadge label={mapToCustomerStatus(item.status)} variant={getStatusVariant(item.status)} />
                  </View>

                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.service}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 }} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

                  <View style={styles.cardFooter}>
                    <View style={styles.timeInfo}>
                      <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        Scheduled: {item.scheduledDate}
                      </Text>
                    </View>
                    <View style={styles.actionLink}>
                      <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "700" }}>Track Ticket</Text>
                      <ChevronRight size={14} color={theme.colors.primary} />
                    </View>
                  </View>
                </AppCard>
              ))
            )}
          </View>
        )}

        {activeTab === "RAISE_TICKET" && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Raise Support Ticket</Text>
            <AppCard style={styles.formCard}>
              <AppInput label="Category" value={category} onChangeText={setCategory} />
              <AppInput label="Sub Category" value={subCategory} onChangeText={setSubCategory} />
              <AppInput
                label="Problem Description"
                placeholder="Describe details like error codes, rattling noise, leak issues..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
              <AppInput label="Service Address" value={address} onChangeText={setAddress} />

              <Text style={styles.formLabel}>Attach Problem Images</Text>
              <View style={styles.photoContainer}>
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <Image key={idx} source={{ uri: img }} style={styles.thumbnail} />
                  ))
                ) : (
                  <Pressable onPress={simulateAddImage} style={styles.uploadBtn}>
                    <Camera size={24} color={theme.colors.primary} />
                    <Text style={{ fontSize: 11, color: theme.colors.primary, marginTop: 4 }}>Add Image</Text>
                  </Pressable>
                )}
              </View>

              <AppButton
                title="Submit Support Request"
                onPress={handleRaiseTicket}
                loading={raiseTicketMutation.isPending}
                style={{ marginTop: 12 }}
              />
            </AppCard>
          </View>
        )}

        {activeTab === "INVOICES" && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>My Invoices</Text>
            {isInvoicesLoading ? (
              <AppLoader message="Retrieving invoices..." />
            ) : invoices.length === 0 ? (
              <AppEmptyState
                title="No Invoices Found"
                description="Completed services requiring payment will generate dynamic invoices listed here."
              />
            ) : (
              invoices.map((inv) => (
                <AppCard key={inv.invoiceNo} style={styles.ticketCard}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.ticketId, { color: theme.colors.textMuted }]}>{inv.invoiceNo}</Text>
                    <AppBadge label={inv.paymentStatus} variant="success" />
                  </View>
                  <Text style={[styles.invoiceTitle, { color: theme.colors.text }]}>
                    Ticket Ref: <Text style={{ fontWeight: "700" }}>{inv.ticketNo}</Text>
                  </Text>
                  <View style={styles.invoiceBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Base Amount:</Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>₹{inv.amount}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>GST (18%):</Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>₹{inv.gst}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: "700" }}>Total Paid:</Text>
                      <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: "700" }}>₹{inv.total}</Text>
                    </View>
                  </View>
                </AppCard>
              ))
            )}
          </View>
        )}

        {activeTab === "PROFILE" && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>My Account Profile</Text>
            <AppCard style={styles.formCard}>
              <View style={styles.profileDetailRow}>
                <Text style={[styles.profileLabel, { color: theme.colors.textLight }]}>Name:</Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>{user?.name}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={[styles.profileLabel, { color: theme.colors.textLight }]}>Mobile:</Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>{user?.mobile}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={[styles.profileLabel, { color: theme.colors.textLight }]}>Role Access:</Text>
                <Text style={[styles.profileValue, { color: theme.colors.text }]}>{user?.role}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={[styles.profileLabel, { color: theme.colors.textLight }]}>Default Address:</Text>
                <Text style={[styles.profileValue, { color: theme.colors.text, flex: 1 }]}>{address}</Text>
              </View>
            </AppCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileText: {
    flex: 1,
  },
  welcomeText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nameText: {
    marginTop: 1,
  },
  navigationGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginVertical: 12,
  },
  ticketCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
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
  },
  formCard: {
    padding: 16,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
    marginTop: 8,
  },
  photoContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  uploadBtn: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  invoiceTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  invoiceBreakdown: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileDetailRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: "600",
    minWidth: 120,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: "700",
  },
});
