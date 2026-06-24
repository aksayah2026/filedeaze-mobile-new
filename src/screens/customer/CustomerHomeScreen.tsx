import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  LogOut,
  Calendar,
  ChevronRight,
  User,
  FileText,
  ClipboardList,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  Smartphone,
  Building,
  Hash,
  Edit2,
  Home,
  Search,
  Bell,
  Sparkles,
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const SCREEN_W = Dimensions.get("window").width;
  const CAT_CARD_W = Math.floor((SCREEN_W - 32 - 24) / 3);

  const getCatImage = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("electrical") || n.includes("power") || n.includes("wire"))
      return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop";
    if (n.includes("plumb") || n.includes("water") || n.includes("leak"))
      return "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=300&h=200&fit=crop";
    if (n.includes("ac") || n.includes("cool") || n.includes("heat") || n.includes("hvac"))
      return "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&h=200&fit=crop";
    if (n.includes("carpenter") || n.includes("wood") || n.includes("furniture"))
      return "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop";
    if (n.includes("paint"))
      return "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=300&h=200&fit=crop";
    if (n.includes("clean"))
      return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop";
    if (n.includes("pest"))
      return "https://images.unsplash.com/photo-1632921522769-8ca3f7c1e4e3?w=300&h=200&fit=crop";
    if (n.includes("appliance") || n.includes("repair") || n.includes("fix"))
      return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop";
    if (n.includes("salon") || n.includes("beauty") || n.includes("spa"))
      return "https://images.unsplash.com/photo-1560066984-138daaa0ad8a?w=300&h=200&fit=crop";
    return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop";
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        showTenantBranding
        leftAction={null}
      />

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
            {/* Location Bar */}
            <View style={[styles.locationBar, { backgroundColor: theme.colors.card }]}>
              <View style={styles.locationLeft}>
                <MapPin size={16} color={theme.colors.primary} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[styles.locationLabel, { color: theme.colors.textMuted }]}>Your Location</Text>
                  <Text style={[styles.locationAddr, { color: theme.colors.text }]} numberOfLines={1}>
                    {profile?.address
                      ? [profile.address, profile.city].filter(Boolean).join(", ")
                      : "Set your address"}
                  </Text>
                </View>
              </View>
              <View style={[styles.locationBellBtn, { backgroundColor: `${theme.colors.primary}14` }]}>
                <Bell size={19} color={theme.colors.primary} />
              </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.homeSearchWrap, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.homeSearchBar, { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight }]}>
                <Search size={17} color={theme.colors.textLight} />
                <Text style={[styles.homeSearchPlaceholder, { color: theme.colors.textLight }]}>Search for "Kitchen cleaning"</Text>
              </View>
            </View>

            {/* Hero Banner */}
            <View style={styles.heroBannerWrap}>
              <LinearGradient
                colors={["#1E293B", "#0F172A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroBanner}
              >
                <View style={styles.heroBannerLeft}>
                  <Text style={styles.heroBannerTag}>⭐ FEATURED</Text>
                  <Text style={styles.heroBannerTitle}>Professional{"\n"}Home Services</Text>
                  <Text style={styles.heroBannerSub}>Trusted experts at{"\n"}your doorstep</Text>
                  <Pressable
                    style={[styles.heroBannerBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => categories.length > 0 && navigation.navigate("RaiseTicket", { categoryId: categories[0].id, categoryName: categories[0].name })}
                  >
                    <Text style={styles.heroBannerBtnText}>Book Now</Text>
                  </Pressable>
                </View>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=260&fit=crop" }}
                  style={styles.heroBannerImg}
                  resizeMode="cover"
                />
              </LinearGradient>
            </View>

            {/* Promo Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoChipRow}>
              {[
                { label: "⚡ Quick Book", color: "#F97316" },
                { label: "🎁 20% OFF Today", color: "#7C3AED" },
                { label: "⭐ Top Rated", color: "#0EA5E9" },
                { label: "✅ Verified Pros", color: "#059669" },
              ].map((chip, i) => (
                <View key={i} style={[styles.promoChip, { backgroundColor: `${chip.color}14`, borderColor: `${chip.color}35` }]}>
                  <Text style={[styles.promoChipText, { color: chip.color }]}>{chip.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Services Grid */}
            <View style={styles.serviceSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Explore all services</Text>
                <Sparkles size={15} color={theme.colors.primary} />
              </View>
              {isCategoriesLoading ? (
                <AppLoader message="Loading..." />
              ) : (
                <View style={styles.catGridUC}>
                  {categories.map((cat: any) => (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [
                        styles.catCardUC,
                        { backgroundColor: theme.colors.card, width: CAT_CARD_W },
                        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                      ]}
                      onPress={() => navigation.navigate("RaiseTicket", { categoryId: cat.id, categoryName: cat.name })}
                    >
                      <View style={[styles.catImageWrap, { backgroundColor: theme.colors.background }]}>
                        <Image
                          source={{ uri: getCatImage(cat.name) }}
                          style={styles.catImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={[styles.catNameUC, { color: theme.colors.text }]} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Recent Booking Strip */}
            {tickets.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Recent Booking</Text>
                  <Pressable onPress={() => setActiveTab("TICKETS")}>
                    <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
                  </Pressable>
                </View>
                <AppCard
                  onPress={() => navigation.navigate("CustomerJobDetails", { jobId: tickets[0].id })}
                  style={styles.recentCard}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <ClipboardList size={15} color={theme.colors.textMuted} />
                      <Text style={[styles.ticketId, { color: theme.colors.textMuted, fontSize: 12 }]}>{tickets[0].ticketNumber}</Text>
                    </View>
                    <AppBadge label={getStatusLabel(tickets[0].status)} variant={getStatusVariant(tickets[0].status)} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: 15 }]}>
                    {tickets[0].subCategory?.name || tickets[0].subCategory?.category?.name || "—"}
                  </Text>
                  <View style={styles.timeInfo}>
                    <Calendar size={13} color={theme.colors.textMuted} style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>{formatDate(tickets[0].createdAt)}</Text>
                  </View>
                </AppCard>
              </View>
            )}
          </View>
        )}

        {activeTab === "TICKETS" && (
          <View style={{ paddingTop: 16 }}>

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
          <View style={{ paddingTop: 16 }}>
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
          <View style={{ paddingTop: 16 }}>
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
            style={{ flex: 1, paddingTop: 16 }}
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
  scrollContent: {
    paddingTop: 0,
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
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
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
  locationBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  locationLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  locationAddr: {
    fontSize: 13,
    fontWeight: "700" as const,
    maxWidth: 220,
  },
  locationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  homeSearchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  homeSearchBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  homeSearchPlaceholder: {
    fontSize: 14,
    flex: 1,
  },
  heroBannerWrap: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  heroBanner: {
    borderRadius: 18,
    overflow: "hidden" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingLeft: 20,
    paddingVertical: 20,
    minHeight: 155,
  },
  heroBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroBannerTag: {
    fontSize: 10,
    color: "rgba(255,255,255,0.60)",
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    marginBottom: 6,
  },
  heroBannerTitle: {
    fontSize: 19,
    fontWeight: "800" as const,
    color: "#ffffff",
    lineHeight: 26,
    marginBottom: 5,
  },
  heroBannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 18,
    marginBottom: 14,
  },
  heroBannerBtn: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
  },
  heroBannerBtnText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#ffffff",
  },
  heroBannerImg: {
    width: 120,
    height: 140,
    borderRadius: 12,
  },
  promoChipRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  promoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  promoChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.1,
  },
  serviceSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 0.1,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  catGridUC: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  catCardUC: {
    borderRadius: 14,
    overflow: "hidden" as const,
    alignItems: "center" as const,
    paddingBottom: 10,
    shadowColor: "rgba(15,23,42,0.09)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  catImageWrap: {
    width: "100%",
    height: 90,
    overflow: "hidden" as const,
  },
  catImage: {
    width: "100%",
    height: "100%",
  },
  catNameUC: {
    fontSize: 11.5,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    paddingHorizontal: 6,
    marginTop: 8,
    lineHeight: 16,
  },
  recentSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentCard: {
    borderRadius: 16,
    padding: 16,
  },
});

export default CustomerHomeScreen;
