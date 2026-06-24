import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  ClipboardList,
  MapPin,
  CreditCard,
  X,
  Mail,
  Phone,
  Smartphone,
  Building,
  Hash,
  Menu,
  Edit2,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import {
  useCustomerTickets,
  useCustomerInvoices,
  useCustomerProfile,
  useUpdateCustomerProfile,
  useCustomerPayments,
} from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppEmptyState } from "../../components/AppEmptyState";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { CustomerPopup } from "../../components/CustomerPopup";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "CustomerHome">;
type CustomerTab = "TICKETS" | "INVOICES" | "PROFILE" | "PAYMENTS";

export const CustomerHomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<CustomerTab>("TICKETS");
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Queries
  const { data: tickets = [], isLoading: isTicketsLoading, refetch: refetchTickets, isFetching: isFetchingTickets } = useCustomerTickets();
  const { data: invoices = [], isLoading: isInvoicesLoading, refetch: refetchInvoices, isFetching: isFetchingInvoices } = useCustomerInvoices();
  const { data: payments = [], isLoading: isPaymentsLoading, refetch: refetchPayments, isFetching: isFetchingPayments } = useCustomerPayments();
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useCustomerProfile();
  const updateProfileMutation = useUpdateCustomerProfile();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  // Sync form states with profile data
  React.useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAlternatePhone(profile.alternatePhone || "");
      setAddress(profile.address || "");
      setCity(profile.city || "");
      setPincode(profile.pincode || "");
    }
  }, [profile]);

  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth * 0.85;

  const [slideAnim] = useState(new Animated.Value(-drawerWidth));

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -drawerWidth,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
    });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(
      {
        name,
        email: email || null,
        phone,
        alternatePhone: alternatePhone || null,
        address: address || null,
        city: city || null,
        pincode: pincode || null,
      },
      {
        onSuccess: () => {
          setIsEditingProfile(false);
          Alert.alert("Success", "Profile updated successfully!");
        },
        onError: (err: any) => {
          Alert.alert("Error", err.message || "Failed to update profile");
        }
      }
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "INVOICE_GENERATED":
      case "TICKET_CLOSED":
      case "CLOSED":
        return "success";
      case "IN_PROGRESS":
      case "ASSIGNED":
      case "ACCEPTED":
      case "TRAVELLING":
      case "REACHED":
      case "REACHED_LOCATION":
        return "warning";
      case "CANCELLED":
        return "danger";
      default:
        return "primary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW_TICKET":
        return "NEW";
      case "REACHED":
      case "REACHED_LOCATION":
        return "ARRIVED";
      case "TRAVELLING":
        return "EN ROUTE";
      case "TICKET_CLOSED":
      case "CLOSED":
        return "CLOSED";
      default:
        return status.replace("_", " ");
    }
  };

  const getPaymentStatusVariant = (status: string) => {
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

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case "PROFILE":
        return "My Account Profile";
      case "INVOICES":
        return "My Invoices";
      case "PAYMENTS":
        return "Payment Transactions";
      default:
        return "Service History";
    }
  };

  const handleRefresh = () => {
    if (activeTab === "TICKETS") refetchTickets();
    else if (activeTab === "INVOICES") refetchInvoices();
    else if (activeTab === "PAYMENTS") refetchPayments();
    else refetchProfile();
  };

  const isRefreshing = () => {
    if (activeTab === "TICKETS") return isFetchingTickets;
    if (activeTab === "INVOICES") return isFetchingInvoices;
    if (activeTab === "PAYMENTS") return isFetchingPayments;
    return isProfileLoading;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        showTenantBranding
        leftAction={
          <Pressable
            onPress={openDrawer}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
          >
            <Menu color={theme.colors.text} size={24} />
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
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: `${theme.colors.primary}15` }
          ]}
        >
          <User color={theme.colors.primary} size={24} />
        </View>
        <View style={styles.profileText}>
          <View>
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
              {profile?.name || user?.name || "Customer"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("RaiseTicket")}
          style={({ pressed }) => [
            styles.topRaiseTicketBtn,
            { backgroundColor: `${theme.colors.primary}12` },
            pressed && { opacity: 0.7 }
          ]}
        >
          <Plus size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.topRaiseTicketText, { color: theme.colors.primary }]}>Raise Ticket</Text>
        </Pressable>
      </View>

      {/* Reusable Customer Logout Popup */}
      <CustomerPopup
        visible={logoutPopupVisible}
        type="warning"
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={() => {
          setLogoutPopupVisible(false);
          logout();
        }}
        onCancel={() => setLogoutPopupVisible(false)}
      />

      {/* Left Sidebar Profile Drawer */}
      <Modal
        transparent
        visible={drawerVisible}
        onRequestClose={closeDrawer}
        animationType="none"
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.backdropPressable} onPress={closeDrawer} />
          
          <Animated.View
            style={[
              styles.drawerContent,
              {
                width: drawerWidth,
                transform: [{ translateX: slideAnim }],
                backgroundColor: theme.colors.card,
              },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.borderLight }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={[styles.drawerAvatarCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <User color={theme.colors.primary} size={20} />
                  </View>
                  <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>Menu</Text>
                </View>
                <Pressable onPress={closeDrawer} style={styles.closeBtn}>
                  <X size={20} color={theme.colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.menuContainer}>
                <ScrollView
                  style={styles.drawerScroll}
                  contentContainerStyle={styles.drawerScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Pressable
                    onPress={() => {
                      setActiveTab("PROFILE");
                      closeDrawer();
                    }}
                    style={({ pressed }) => [
                      styles.menuItemRow,
                      activeTab === "PROFILE" && { backgroundColor: `${theme.colors.primary}08` },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <User size={20} color={activeTab === "PROFILE" ? theme.colors.primary : theme.colors.textMuted} />
                      <Text style={[styles.menuItemLabel, { color: activeTab === "PROFILE" ? theme.colors.primary : theme.colors.text }]}>My Profile</Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setActiveTab("TICKETS");
                      closeDrawer();
                    }}
                    style={({ pressed }) => [
                      styles.menuItemRow,
                      activeTab === "TICKETS" && { backgroundColor: `${theme.colors.primary}08` },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <ClipboardList size={20} color={activeTab === "TICKETS" ? theme.colors.primary : theme.colors.textMuted} />
                      <Text style={[styles.menuItemLabel, { color: activeTab === "TICKETS" ? theme.colors.primary : theme.colors.text }]}>Service History</Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setActiveTab("PAYMENTS");
                      closeDrawer();
                    }}
                    style={({ pressed }) => [
                      styles.menuItemRow,
                      activeTab === "PAYMENTS" && { backgroundColor: `${theme.colors.primary}08` },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <CreditCard size={20} color={activeTab === "PAYMENTS" ? theme.colors.primary : theme.colors.textMuted} />
                      <Text style={[styles.menuItemLabel, { color: activeTab === "PAYMENTS" ? theme.colors.primary : theme.colors.text }]}>Payment History</Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setActiveTab("INVOICES");
                      closeDrawer();
                    }}
                    style={({ pressed }) => [
                      styles.menuItemRow,
                      activeTab === "INVOICES" && { backgroundColor: `${theme.colors.primary}08` },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <FileText size={20} color={activeTab === "INVOICES" ? theme.colors.primary : theme.colors.textMuted} />
                      <Text style={[styles.menuItemLabel, { color: activeTab === "INVOICES" ? theme.colors.primary : theme.colors.text }]}>Invoice List</Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
                  </Pressable>
                </ScrollView>

                <View style={[styles.drawerFooter, { borderTopColor: theme.colors.borderLight }]}>
                  <Pressable
                    onPress={() => {
                      closeDrawer();
                      setLogoutPopupVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.drawerLogoutBtn,
                      { borderColor: theme.colors.danger },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <LogOut size={18} color={theme.colors.danger} />
                    <Text style={[styles.drawerLogoutText, { color: theme.colors.danger }]}>Logout</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* Main Content View below header & Customer Account Banner */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing()}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.tabHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{getActiveTabTitle()}</Text>
        </View>

        {activeTab === "TICKETS" && (
          <View>
            {isTicketsLoading ? (
              <AppLoader message="Retrieving requests..." />
            ) : tickets.length === 0 ? (
              <AppEmptyState
                title="No Active Requests"
                description="You haven't logged any service tickets yet. Tapping Raise Ticket at the top right to request appliance support."
              />
            ) : (
              tickets.map((item) => (
                <AppCard
                  key={item.id}
                  onPress={() => navigation.navigate("CustomerJobDetails", { jobId: item.id })}
                  style={styles.ticketCard}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.ticketId, { color: theme.colors.textMuted }]}>{item.ticketNumber}</Text>
                    <AppBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />
                  </View>

                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {item.subCategory?.name || "—"}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 }} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

                  <View style={styles.cardFooter}>
                    <View style={styles.timeInfo}>
                      <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        Date: {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.actionLink}>
                      <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "700" }}>Details</Text>
                      <ChevronRight size={14} color={theme.colors.primary} />
                    </View>
                  </View>
                </AppCard>
              ))
            )}
          </View>
        )}

        {activeTab === "INVOICES" && (
          <View>
            {isInvoicesLoading ? (
              <AppLoader message="Retrieving invoices..." />
            ) : invoices.length === 0 ? (
              <AppEmptyState
                title="No Invoices Found"
                description="Completed services requiring payment will generate dynamic invoices listed here."
              />
            ) : (
              invoices.map((inv) => (
                <AppCard
                  key={inv.id}
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: inv.id })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.ticketId, { color: theme.colors.textMuted }]}>{inv.invoiceNumber}</Text>
                    <AppBadge label={inv.payment?.status || "UNPAID"} variant="success" />
                  </View>
                  <Text style={[styles.invoiceTitle, { color: theme.colors.text }]}>
                    Ticket Ref: <Text style={{ fontWeight: "700" }}>{inv.ticket?.ticketNumber || "—"}</Text>
                  </Text>
                  <View style={styles.invoiceBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Base Amount:</Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>₹{inv.subtotal}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                        {inv.gstPercent > 0 ? `GST (${inv.gstPercent}%):` : 'GST:'}
                      </Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>₹{inv.gstAmount}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: "700" }}>Total:</Text>
                      <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: "700" }}>₹{inv.total}</Text>
                    </View>
                  </View>
                </AppCard>
              ))
            )}
          </View>
        )}

        {activeTab === "PAYMENTS" && (
          <View>
            {isPaymentsLoading ? (
              <AppLoader message="Retrieving transactions..." />
            ) : payments.length === 0 ? (
              <AppEmptyState
                title="No transaction records found"
                description="Your service payment records will be documented here once transaction processes."
              />
            ) : (
              payments.map((item) => (
                <AppCard
                  key={item.id}
                  style={styles.ticketCard}
                  onPress={() => {
                    if (item.invoice?.invoiceNumber) {
                      const matchingInvoice = invoices.find(inv => inv.invoiceNumber === item.invoice?.invoiceNumber);
                      navigation.navigate("InvoiceDetails", { invoiceId: matchingInvoice?.id || item.id });
                    }
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.label, { color: theme.colors.textMuted }]}>Payment ID</Text>
                      <Text style={[styles.valueId, { color: theme.colors.text }]}>: {item.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <AppBadge label={item.status} variant={getPaymentStatusVariant(item.status)} />
                  </View>

                  <View style={styles.detailRow}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.label, { color: theme.colors.textMuted }]}>Ticket Number</Text>
                      <Text style={[styles.value, { color: theme.colors.text }]}>: {item.invoice?.invoiceNumber || "—"}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.label, { color: theme.colors.textMuted }]}>Amount</Text>
                      <Text style={[styles.valueAmount, { color: theme.colors.primary }]}>: ₹{item.amount}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

                  <View style={styles.cardFooter}>
                    <View style={styles.timeInfo}>
                      <Calendar size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Date</Text>
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
              ))
            )}
          </View>
        )}

        {activeTab === "PROFILE" && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <AppCard style={styles.formCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={[styles.drawerSectionTitle, { color: theme.colors.textMuted, marginVertical: 0 }]}>Profile Details</Text>
                <Pressable
                  onPress={() => setIsEditingProfile(!isEditingProfile)}
                  style={({ pressed }) => [
                    styles.editToggleBtn,
                    { backgroundColor: isEditingProfile ? `${theme.colors.danger}15` : `${theme.colors.primary}15` },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Edit2 size={14} color={isEditingProfile ? theme.colors.danger : theme.colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.editToggleText, { color: isEditingProfile ? theme.colors.danger : theme.colors.primary }]}>
                    {isEditingProfile ? "Cancel" : "Edit"}
                  </Text>
                </Pressable>
              </View>
              
              <AppInput
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                editable={isEditingProfile}
                leftIcon={<User size={16} color={theme.colors.textMuted} />}
                style={!isEditingProfile && { opacity: 0.7 }}
              />

              <AppInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditingProfile}
                leftIcon={<Mail size={16} color={theme.colors.textMuted} />}
                style={!isEditingProfile && { opacity: 0.7 }}
              />

              <AppInput
                label="Primary Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter mobile phone number"
                keyboardType="phone-pad"
                editable={false}
                leftIcon={<Smartphone size={16} color={theme.colors.textMuted} />}
                style={{ opacity: 0.6 }}
              />

              <AppInput
                label="Alternate Phone"
                value={alternatePhone}
                onChangeText={setAlternatePhone}
                placeholder="Enter alternate phone number"
                keyboardType="phone-pad"
                editable={isEditingProfile}
                leftIcon={<Phone size={16} color={theme.colors.textMuted} />}
                style={!isEditingProfile && { opacity: 0.7 }}
              />

              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight, marginVertical: 16 }]} />

              <Text style={[styles.drawerSectionTitle, { color: theme.colors.textMuted, marginBottom: 16 }]}>Address Details</Text>
              
              <AppInput
                label="Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter street address"
                editable={isEditingProfile}
                leftIcon={<MapPin size={16} color={theme.colors.textMuted} />}
                style={!isEditingProfile && { opacity: 0.7 }}
              />

              <AppInput
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
                editable={isEditingProfile}
                leftIcon={<Building size={16} color={theme.colors.textMuted} />}
                style={!isEditingProfile && { opacity: 0.7 }}
              />

              <AppInput
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                placeholder="Enter pincode"
                keyboardType="numeric"
                editable={isEditingProfile}
                leftIcon={<Hash size={16} color={theme.colors.textMuted} />}
                style={!isEditingProfile && { opacity: 0.7 }}
              />

              {isEditingProfile && (
                <AppButton
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  loading={updateProfileMutation.isPending}
                  style={{ marginTop: 24 }}
                />
              )}
            </AppCard>
          </KeyboardAvoidingView>
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
  topRaiseTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
  },
  topRaiseTicketText: {
    fontSize: 12,
    fontWeight: "700",
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdropPressable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawerContent: {
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  drawerAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  drawerSection: {
    gap: 12,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addressBookItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  addressBookText: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    width: "100%",
  },
  drawerLogoutText: {
    fontSize: 14,
    fontWeight: "700",
  },
  formCard: {
    padding: 16,
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
  editToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default CustomerHomeScreen;
