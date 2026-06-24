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
  Zap,
  Wrench,
  Flame,
  Hammer,
  Droplet,
  Settings,
  Home,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import {
  useCustomerTickets,
  useCustomerInvoices,
  useCustomerProfile,
  useUpdateCustomerProfile,
  useCustomerPayments,
  useCategories,
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
import { LinearGradient } from "expo-linear-gradient";

type NavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  "CustomerHome"
>;
type CustomerTab = "HOME" | "TICKETS" | "INVOICES" | "PROFILE" | "PAYMENTS";

export const CustomerHomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<CustomerTab>("HOME");
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Queries
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
    isFetching: isFetchingTickets,
  } = useCustomerTickets();
  const {
    data: invoices = [],
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
    isFetching: isFetchingInvoices,
  } = useCustomerInvoices();
  const {
    data: payments = [],
    isLoading: isPaymentsLoading,
    refetch: refetchPayments,
    isFetching: isFetchingPayments,
  } = useCustomerPayments();
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useCustomerProfile();
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

  // Removed drawer logic

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
        },
      },
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
    if (activeTab === "HOME") {
      // refetchCategories is not destructured, no need to refresh categories
    } else if (activeTab === "TICKETS") refetchTickets();
    else if (activeTab === "INVOICES") refetchInvoices();
    else if (activeTab === "PAYMENTS") refetchPayments();
    else refetchProfile();
  };

  const isRefreshing = () => {
    if (activeTab === "HOME") return isCategoriesLoading;
    if (activeTab === "TICKETS") return isFetchingTickets;
    if (activeTab === "INVOICES") return isFetchingInvoices;
    if (activeTab === "PAYMENTS") return isFetchingPayments;
    return isProfileLoading;
  };

  const getCatColor = (name: string): { bg: string; icon: string } => {
    const n = name.toLowerCase();
    if (n.includes("electrical") || n.includes("power") || n.includes("wire"))
      return { bg: "#FFF7ED", icon: "#F97316" };
    if (n.includes("plumb") || n.includes("water") || n.includes("leak"))
      return { bg: "#EFF6FF", icon: "#3B82F6" };
    if (n.includes("ac") || n.includes("cool") || n.includes("heat") || n.includes("hvac"))
      return { bg: "#F0F9FF", icon: "#0EA5E9" };
    if (n.includes("carpenter") || n.includes("wood") || n.includes("furniture"))
      return { bg: "#FFFBEB", icon: "#D97706" };
    if (n.includes("paint"))
      return { bg: "#FDF4FF", icon: "#A855F7" };
    if (n.includes("clean"))
      return { bg: "#ECFDF5", icon: "#10B981" };
    if (n.includes("home") && !n.includes("appliance"))
      return { bg: "#FFF1F2", icon: "#F43F5E" };
    if (n.includes("appliance") || n.includes("repair") || n.includes("fix"))
      return { bg: "#F0FDF4", icon: "#22C55E" };
    const PALETTE = [
      { bg: "#FFF7ED", icon: "#F97316" },
      { bg: "#EFF6FF", icon: "#3B82F6" },
      { bg: "#F0FDF4", icon: "#22C55E" },
      { bg: "#FDF4FF", icon: "#A855F7" },
      { bg: "#FFF1F2", icon: "#F43F5E" },
      { bg: "#F0F9FF", icon: "#0EA5E9" },
    ];
    return PALETTE[name.charCodeAt(0) % PALETTE.length];
  };

  const getCategoryIconEl = (name: string, color: string, size: number) => {
    const n = name.toLowerCase();
    if (n.includes("electrical") || n.includes("power") || n.includes("wire")) {
      return <Zap size={size} color={color} />;
    }
    if (n.includes("plumb") || n.includes("water") || n.includes("leak")) {
      return <Droplet size={size} color={color} />;
    }
    if (n.includes("ac") || n.includes("cool") || n.includes("heat") || n.includes("hvac")) {
      return <Flame size={size} color={color} />;
    }
    if (n.includes("carpenter") || n.includes("wood") || n.includes("furniture")) {
      return <Hammer size={size} color={color} />;
    }
    if (n.includes("repair") || n.includes("fix") || n.includes("appliance")) {
      return <Wrench size={size} color={color} />;
    }
    return <Settings size={size} color={color} />;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        showTenantBranding
        leftAction={null}
      />

      {/* Premium Customer Profile Banner */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.profileBanner,
          {
            paddingBottom: 22,
            paddingTop: 14,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          },
        ]}
      >
        <View style={[styles.avatarRing, { borderColor: "rgba(255,255,255,0.35)" }]}>
          <View style={[styles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
            <User color="#ffffff" size={26} />
          </View>
        </View>
        <View style={styles.profileText}>
          <Text
            style={[
              styles.welcomeText,
              {
                color: "rgba(255,255,255,0.72)",
                fontSize: theme.typography.fontSize.xs,
                textTransform: "uppercase",
                letterSpacing: 1,
              },
            ]}
          >
            Customer Account
          </Text>
          <Text
            style={[
              styles.nameText,
              {
                color: "#ffffff",
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
              },
            ]}
          >
            {profile?.name || user?.name || "Customer"}
          </Text>
        </View>
      </LinearGradient>

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

      {/* Drawer Removed */}

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
        {activeTab === "HOME" && (
          <View>
            {/* Service Categories Grid */}
            <View style={{ marginBottom: 24, paddingHorizontal: theme.spacing.md }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginTop: 0 }]}>Select Service Category</Text>
              {isCategoriesLoading ? (
                <AppLoader message="Loading categories..." />
              ) : (
                <View style={styles.catGrid}>
                  {categories.map((cat: any) => (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [
                        styles.catCard,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.borderLight },
                        pressed && { opacity: 0.88, transform: [{ scale: 0.95 }] }
                      ]}
                      onPress={() => {
                        navigation.navigate("RaiseTicket", { categoryId: cat.id, categoryName: cat.name });
                      }}
                    >
                      <View style={[styles.catIconCircle, { backgroundColor: getCatColor(cat.name).bg }]}>
                        {getCategoryIconEl(cat.name, getCatColor(cat.name).icon, 28)}
                      </View>
                      <Text style={[styles.catName, { color: theme.colors.text }]} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === "TICKETS" && (
          <View>

            <View style={[styles.tabHeader, { paddingHorizontal: theme.spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
                Recent Service History
              </Text>
            </View>

            {isTicketsLoading ? (
              <AppLoader message="Retrieving requests..." />
            ) : tickets.length === 0 ? (
              <AppEmptyState
                title="No Active Requests"
                description="You haven't logged any service tickets yet. Tap a category above to request appliance support."
              />
            ) : (
              tickets.map((item) => (
                <AppCard
                  key={item.id}
                  onPress={() =>
                    navigation.navigate("CustomerJobDetails", {
                      jobId: item.id,
                    })
                  }
                  style={[styles.ticketCard, { marginHorizontal: theme.spacing.md }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <ClipboardList size={16} color={theme.colors.textMuted} />
                      <Text
                        style={[
                          styles.ticketId,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {item.ticketNumber}
                      </Text>
                    </View>
                    <AppBadge
                      label={getStatusLabel(item.status)}
                      variant={getStatusVariant(item.status)}
                    />
                  </View>

                  <Text
                    style={[styles.cardTitle, { color: theme.colors.text, fontSize: 16, marginTop: 4 }]}
                  >
                    {item.subCategory?.name || "—"}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: 14,
                      marginBottom: 16,
                      lineHeight: 20,
                    }}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  />

                  <View style={styles.cardFooter}>
                    <View style={styles.timeInfo}>
                      <Calendar
                        size={14}
                        color={theme.colors.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.textMuted,
                          fontWeight: "500",
                        }}
                      >
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.actionLink,
                        { backgroundColor: `${theme.colors.primary}15` },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.primary,
                          fontWeight: "700",
                          marginRight: 4,
                        }}
                      >
                        Details
                      </Text>
                      <ChevronRight size={16} color={theme.colors.primary} />
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
                  style={[styles.ticketCard, { marginHorizontal: theme.spacing.md }]}
                  onPress={() =>
                    navigation.navigate("InvoiceDetails", { invoiceId: inv.id })
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <FileText size={16} color={theme.colors.textMuted} />
                      <Text
                        style={[
                          styles.ticketId,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {inv.invoiceNumber}
                      </Text>
                    </View>
                    <AppBadge
                      label={inv.payment?.status || "UNPAID"}
                      variant="success"
                    />
                  </View>
                  <Text
                    style={[styles.invoiceTitle, { color: theme.colors.text }]}
                  >
                    Ticket Ref:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {inv.ticket?.ticketNumber || "—"}
                    </Text>
                  </Text>
                  <View style={styles.invoiceBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text
                        style={{ color: theme.colors.textMuted, fontSize: 13 }}
                      >
                        Base Amount:
                      </Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                        ₹{inv.subtotal}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text
                        style={{ color: theme.colors.textMuted, fontSize: 13 }}
                      >
                        {inv.gstPercent > 0
                          ? `GST (${inv.gstPercent}%):`
                          : "GST:"}
                      </Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                        ₹{inv.gstAmount}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.colors.borderLight },
                      ]}
                    />
                    <View style={styles.breakdownRow}>
                      <Text
                        style={{
                          color: theme.colors.text,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        Total:
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.primary,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        ₹{inv.total}
                      </Text>
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
                      const matchingInvoice = invoices.find(
                        (inv) =>
                          inv.invoiceNumber === item.invoice?.invoiceNumber,
                      );
                      navigation.navigate("InvoiceDetails", {
                        invoiceId: matchingInvoice?.id || item.id,
                      });
                    }
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                    >
                      <Text
                        style={[
                          styles.label,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        Payment ID
                      </Text>
                      <Text
                        style={[styles.valueId, { color: theme.colors.text }]}
                      >
                        {item.id.substring(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <AppBadge
                      label={item.status}
                      variant={getPaymentStatusVariant(item.status)}
                    />
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, { color: theme.colors.textMuted }]}
                    >
                      Invoice No.
                    </Text>
                    <Text style={[styles.value, { color: theme.colors.text }]}>
                      {item.invoice?.invoiceNumber || "—"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.label, { color: theme.colors.textMuted }]}
                    >
                      Amount
                    </Text>
                    <Text
                      style={[
                        styles.valueAmount,
                        { color: theme.colors.primary },
                      ]}
                    >
                      ₹{item.amount}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  />

                  <View style={styles.cardFooter}>
                    <View style={styles.timeInfo}>
                      <Calendar
                        size={14}
                        color={theme.colors.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.text,
                          fontWeight: "600",
                        }}
                      >
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    {item.invoice?.invoiceNumber ? (
                      <View
                        style={[
                          styles.actionLink,
                          { backgroundColor: `${theme.colors.primary}15` },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: theme.colors.primary,
                            fontWeight: "700",
                            marginRight: 4,
                          }}
                        >
                          Invoice
                        </Text>
                        <ChevronRight size={16} color={theme.colors.primary} />
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
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={[
                    styles.drawerSectionTitle,
                    { color: theme.colors.textMuted, marginVertical: 0 },
                  ]}
                >
                  Profile Details
                </Text>
                <Pressable
                  onPress={() => setIsEditingProfile(!isEditingProfile)}
                  style={({ pressed }) => [
                    styles.editToggleBtn,
                    {
                      backgroundColor: isEditingProfile
                        ? `${theme.colors.danger}15`
                        : `${theme.colors.primary}15`,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Edit2
                    size={14}
                    color={
                      isEditingProfile
                        ? theme.colors.danger
                        : theme.colors.primary
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.editToggleText,
                      {
                        color: isEditingProfile
                          ? theme.colors.danger
                          : theme.colors.primary,
                      },
                    ]}
                  >
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
                leftIcon={
                  <Smartphone size={16} color={theme.colors.textMuted} />
                }
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

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: theme.colors.borderLight,
                    marginVertical: 16,
                  },
                ]}
              />

              <Text
                style={[
                  styles.drawerSectionTitle,
                  { color: theme.colors.textMuted, marginBottom: 16 },
                ]}
              >
                Address Details
              </Text>

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

              <Pressable
                onPress={() => setLogoutPopupVisible(true)}
                style={({ pressed }) => [
                  styles.profileLogoutBtn,
                  { backgroundColor: `${theme.colors.danger}15`, marginTop: 32 },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
              >
                <LogOut size={20} color={theme.colors.danger} />
                <Text
                  style={[
                    styles.profileLogoutText,
                    { color: theme.colors.danger },
                  ]}
                >
                  Logout
                </Text>
              </Pressable>
            </AppCard>
          </KeyboardAvoidingView>
        )}
      </ScrollView>

      {/* Sticky Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.borderLight }]}>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("HOME")}>
          <View style={[styles.navIconWrap, activeTab === "HOME" && { backgroundColor: `${theme.colors.primary}18` }]}>
            <Home size={22} color={activeTab === "HOME" ? theme.colors.primary : theme.colors.textMuted} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === "HOME" ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === "HOME" ? "700" : "500" }]}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("TICKETS")}>
          <View style={[styles.navIconWrap, activeTab === "TICKETS" && { backgroundColor: `${theme.colors.primary}18` }]}>
            <ClipboardList size={22} color={activeTab === "TICKETS" ? theme.colors.primary : theme.colors.textMuted} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === "TICKETS" ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === "TICKETS" ? "700" : "500" }]}>Tickets</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("PAYMENTS")}>
          <View style={[styles.navIconWrap, activeTab === "PAYMENTS" && { backgroundColor: `${theme.colors.primary}18` }]}>
            <CreditCard size={22} color={activeTab === "PAYMENTS" ? theme.colors.primary : theme.colors.textMuted} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === "PAYMENTS" ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === "PAYMENTS" ? "700" : "500" }]}>Payments</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("INVOICES")}>
          <View style={[styles.navIconWrap, activeTab === "INVOICES" && { backgroundColor: `${theme.colors.primary}18` }]}>
            <FileText size={22} color={activeTab === "INVOICES" ? theme.colors.primary : theme.colors.textMuted} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === "INVOICES" ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === "INVOICES" ? "700" : "500" }]}>Invoices</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setActiveTab("PROFILE")}>
          <View style={[styles.navIconWrap, activeTab === "PROFILE" && { backgroundColor: `${theme.colors.primary}18` }]}>
            <User size={22} color={activeTab === "PROFILE" ? theme.colors.primary : theme.colors.textMuted} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === "PROFILE" ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === "PROFILE" ? "700" : "500" }]}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "rgba(79,111,232,0.3)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 8,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerRaiseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  bannerRaiseBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  profileText: {
    flex: 1,
  },
  welcomeText: {
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: "600",
  },
  nameText: {
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginVertical: 12,
  },
  ticketCard: {
    marginBottom: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: "rgba(15,23,42,0.08)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  invoiceTitle: {
    fontSize: 15,
    marginBottom: 12,
    fontWeight: "500",
  },
  invoiceBreakdown: {
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.015)",
    padding: 12,
    borderRadius: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRaiseTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRaiseTicketText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawerContent: {
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  drawerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 20,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  drawerSection: {
    gap: 12,
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
  },
  drawerLogoutText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  formCard: {
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "rgba(15,23,42,0.07)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    width: 110,
  },
  valueId: {
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    textAlign: "left",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
    textAlign: "left",
  },
  editToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  catCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "rgba(15,23,42,0.07)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  catIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  catName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 10,
    backgroundColor: "#ffffff",
    shadowColor: "rgba(15,23,42,0.10)",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 12,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 3,
  },
  navIconWrap: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  profileLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  profileLogoutText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default CustomerHomeScreen;
