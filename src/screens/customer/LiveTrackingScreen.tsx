import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  MapPin,
  Clock,
  User,
  Phone,
  RefreshCw,
  Navigation2,
  CheckCircle2,
  Ticket,
  Star,
} from "lucide-react-native";
import Svg, { Path, Circle, Line, Rect, Polygon } from "react-native-svg";
import { useTheme } from "../../theme";
import { useTrackCustomerTicket } from "../../hooks/useCustomer";
import { CustomerStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "LiveTracking">;
type RouteProps = RouteProp<CustomerStackParamList, "LiveTracking">;

// ─── Journey step definition ────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "En Route",   statuses: ["TRAVELLING", "REACHED_LOCATION", "IN_PROGRESS", "COMPLETED", "TICKET_CLOSED"] },
  { id: 2, label: "Arrived",    statuses: ["REACHED_LOCATION", "IN_PROGRESS", "COMPLETED", "TICKET_CLOSED"] },
  { id: 3, label: "In Progress",statuses: ["IN_PROGRESS", "COMPLETED", "TICKET_CLOSED"] },
  { id: 4, label: "Completed",  statuses: ["COMPLETED", "TICKET_CLOSED"] },
];

// ─── Status display helpers ──────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  TRAVELLING:       "En Route",
  REACHED_LOCATION: "Arrived",
  IN_PROGRESS:      "In Progress",
  COMPLETED:        "Completed",
  TICKET_CLOSED:    "Closed",
};

// ─── Active progress width per status ───────────────────────────────────────
const progressWidth = (status: string) => {
  if (status === "COMPLETED" || status === "TICKET_CLOSED") return "96%";
  if (status === "IN_PROGRESS")      return "64%";
  if (status === "REACHED_LOCATION") return "32%";
  if (status === "TRAVELLING")       return "8%";
  return "0%";
};

export const LiveTrackingScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { ticketId, ticketNumber } = route.params;

  const { data: tracking, isLoading, refetch, isFetching } =
    useTrackCustomerTicket(ticketId, { refetchInterval: 20_000 });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Live Tracking" />
        <AppLoader message="Connecting to technician GPS..." />
      </View>
    );
  }

  const tech   = tracking?.technician;
  const status = tracking?.status || "TRAVELLING";
  const displayStatus = STATUS_LABEL[status] || status.replace(/_/g, " ");

  // ETA calculation
  const techLat    = tech?.currentLat ?? 28.615;
  const techLng    = tech?.currentLng ?? 77.208;
  const custLat    = 28.6139;
  const custLng    = 77.209;
  const latDiff    = Math.abs(techLat - custLat);
  const lngDiff    = Math.abs(techLng - custLng);
  const distanceKm = Math.max(0.2, parseFloat(((latDiff + lngDiff) * 111).toFixed(1)));
  const etaMinutes = Math.max(1, Math.round(distanceKm * 2.5));

  // Status color
  const isCompleted = ["COMPLETED", "TICKET_CLOSED"].includes(status);
  const statusColor = isCompleted ? theme.colors.success : theme.colors.primary;

  const handleCall = () => {
    if (tech?.phone) Linking.openURL(`tel:${tech.phone}`);
  };

  // Initials from technician name
  const initials = tech?.name
    ? tech.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        showBack
        onBackPress={() => navigation.goBack()}
        title="Live Tracking"
        rightAction={
          <Pressable onPress={() => refetch()} style={styles.refreshBtn}>
            <RefreshCw
              size={18}
              color={isFetching ? theme.colors.primary : theme.colors.textMuted}
            />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ticket Info Hero Card ─────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: theme.colors.card }]}>
          {/* Left: ticket number + status */}
          <View style={styles.heroLeft}>
            <View style={styles.heroTicketRow}>
              <Ticket size={15} color={theme.colors.primary} />
              <Text style={[styles.heroTicketLabel, { color: theme.colors.textMuted }]}>
                Ticket Number
              </Text>
            </View>
            <Text style={[styles.heroTicketNum, { color: theme.colors.text }]}>
              {ticketNumber ? `#${ticketNumber}` : `#${ticketId.slice(-8).toUpperCase()}`}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}40` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {displayStatus}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.heroVertDivider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Right: ETA + distance */}
          <View style={styles.heroRight}>
            <View style={styles.heroMetric}>
              <Clock size={16} color={theme.colors.primary} />
              <View>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.textMuted }]}>ETA</Text>
                <Text style={[styles.heroMetricVal, { color: theme.colors.text }]}>{etaMinutes} min</Text>
              </View>
            </View>
            <View style={[styles.heroDividerH, { backgroundColor: theme.colors.borderLight }]} />
            <View style={styles.heroMetric}>
              <MapPin size={16} color={theme.colors.primary} />
              <View>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.textMuted }]}>Distance</Text>
                <Text style={[styles.heroMetricVal, { color: theme.colors.text }]}>{distanceKm} km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Map Area ─────────────────────────────────────────────────── */}
        <View style={[styles.mapCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.mapLabelRow}>
            <Navigation2 size={13} color={theme.colors.primary} />
            <Text style={[styles.mapLabel, { color: theme.colors.textMuted }]}>
              Real-Time Route Map
            </Text>
          </View>

          <View style={styles.svgWrapper}>
            <Svg height="100%" width="100%" viewBox="0 0 400 300">
              {/* Background */}
              <Rect x="0" y="0" width="400" height="300" fill="#f1f5f9" />

              {/* Horizontal roads */}
              <Rect x="0"   y="130" width="400" height="28" fill="#cbd5e1" rx="2" />
              <Rect x="0"   y="240" width="400" height="20" fill="#cbd5e1" rx="2" />
              {/* Vertical roads */}
              <Rect x="60"  y="0"   width="22"  height="300" fill="#cbd5e1" rx="2" />
              <Rect x="185" y="0"   width="22"  height="300" fill="#cbd5e1" rx="2" />
              <Rect x="320" y="0"   width="22"  height="300" fill="#cbd5e1" rx="2" />

              {/* Road center dashes */}
              <Line x1="0" y1="144" x2="400" y2="144" stroke="#ffffff" strokeWidth="2" strokeDasharray="12,8" />
              <Line x1="71" y1="0"  x2="71"  y2="300" stroke="#ffffff" strokeWidth="2" strokeDasharray="12,8" />
              <Line x1="196" y1="0" x2="196" y2="300" stroke="#ffffff" strokeWidth="2" strokeDasharray="12,8" />
              <Line x1="331" y1="0" x2="331" y2="300" stroke="#ffffff" strokeWidth="2" strokeDasharray="12,8" />

              {/* Blocks (buildings) */}
              <Rect x="95"  y="10"  width="80"  height="110" fill="#e2e8f0" rx="4" />
              <Rect x="220" y="10"  width="90"  height="110" fill="#e2e8f0" rx="4" />
              <Rect x="95"  y="165" width="80"  height="65"  fill="#e2e8f0" rx="4" />
              <Rect x="220" y="165" width="90"  height="65"  fill="#e2e8f0" rx="4" />

              {/* Route path: Tech ➜ road ➜ Customer */}
              <Path
                d="M 71 40 L 71 130 L 330 130 L 330 250"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="10,6"
                opacity="0.85"
              />

              {/* Customer pin (teardrops) */}
              <Circle cx="330" cy="260" r="14" fill={`${theme.colors.success}25`} />
              <Circle cx="330" cy="260" r="8"  fill={theme.colors.success} />
              <Circle cx="330" cy="260" r="3"  fill="#ffffff" />

              {/* Technician pin */}
              <Circle cx="71" cy="40" r="18" fill={`${theme.colors.primary}25`} />
              <Circle cx="71" cy="40" r="11" fill={theme.colors.primary} />
              <Circle cx="71" cy="40" r="4"  fill="#ffffff" />
            </Svg>

            {/* Floating labels */}
            <View style={[styles.pinLabel, { top: 8, left: 96, backgroundColor: theme.colors.primary }]}>
              <Text style={styles.pinLabelText}>Technician</Text>
            </View>
            <View style={[styles.pinLabel, { bottom: 30, right: 10, backgroundColor: theme.colors.success }]}>
              <Text style={styles.pinLabelText}>Your Location</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.mapLegendRow}>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Technician</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Your Location</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendLine, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Route</Text>
            </View>
          </View>
        </View>

        {/* ── Journey Progress ──────────────────────────────────────────── */}
        <View style={[styles.journeyCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.journeyTitle, { color: theme.colors.textMuted }]}>
            Service Journey
          </Text>

          {/* Progress track */}
          <View style={styles.progressTrack}>
            {/* Gray background bar */}
            <View style={[styles.trackBg, { backgroundColor: theme.colors.borderLight }]} />
            {/* Active fill bar */}
            <View
              style={[
                styles.trackFill,
                { backgroundColor: theme.colors.primary, width: progressWidth(status) },
              ]}
            />

            {/* Step dots */}
            {STEPS.map((step, idx) => {
              const isActive    = step.statuses.includes(status);
              const isCurrent   = !isActive && STEPS[idx - 1]?.statuses.includes(status);
              const leftPercent = (idx / (STEPS.length - 1)) * 100;

              return (
                <View
                  key={step.id}
                  style={[styles.stepNode, { left: `${leftPercent}%` as any }]}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      isActive
                        ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    ]}
                  >
                    {isActive ? (
                      <CheckCircle2 size={13} color="#ffffff" />
                    ) : (
                      <Text style={[styles.stepNum, { color: isActive ? "#ffffff" : theme.colors.textMuted }]}>
                        {step.id}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: isActive ? theme.colors.primary : theme.colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Technician Card ───────────────────────────────────────────── */}
        {tech ? (
          <View style={[styles.techCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.techLeft}>
              {/* Avatar circle with initials */}
              <View style={[styles.techAvatar, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Text style={[styles.techInitials, { color: theme.colors.primary }]}>{initials}</Text>
              </View>
              <View style={styles.techInfo}>
                <Text style={[styles.techName, { color: theme.colors.text }]} numberOfLines={1}>
                  {tech.name}
                </Text>
                <Text style={[styles.techRole, { color: theme.colors.textMuted }]}>
                  Field Technician
                </Text>
                {tech.rating ? (
                  <View style={styles.ratingRow}>
                    <Star size={11} color={theme.colors.warning} fill={theme.colors.warning} />
                    <Text style={[styles.ratingText, { color: theme.colors.textMuted }]}>
                      {tech.rating.toFixed(1)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Call Button */}
            <Pressable
              style={[styles.callBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleCall}
            >
              <Phone size={16} color="#ffffff" />
              <Text style={styles.callBtnText}>Call</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.techCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.techLeft}>
              <View style={[styles.techAvatar, { backgroundColor: theme.colors.borderLight }]}>
                <User size={20} color={theme.colors.textLight} />
              </View>
              <View style={styles.techInfo}>
                <Text style={[styles.techName, { color: theme.colors.textLight }]}>
                  Assigning Technician...
                </Text>
                <Text style={[styles.techRole, { color: theme.colors.textLight }]}>
                  We'll notify you once assigned
                </Text>
              </View>
            </View>
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  refreshBtn: {
    padding: 8,
  },

  // ── Hero card ────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 16,
    flexDirection: "row",
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  heroLeft: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  heroTicketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroTicketLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTicketNum: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroVertDivider: {
    width: 1,
    marginHorizontal: 16,
    borderRadius: 2,
  },
  heroRight: {
    justifyContent: "center",
    gap: 10,
  },
  heroMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroMetricVal: {
    fontSize: 16,
    fontWeight: "800",
  },
  heroDividerH: {
    height: 1,
    borderRadius: 2,
  },

  // ── Map ──────────────────────────────────────────────────────────────────
  mapCard: {
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  mapLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  mapLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  svgWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  pinLabel: {
    position: "absolute",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    elevation: 3,
  },
  pinLabelText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
  },
  mapLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },
  mapLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // ── Journey stepper ──────────────────────────────────────────────────────
  journeyCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  journeyTitle: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 24,
  },
  progressTrack: {
    position: "relative",
    height: 60,
    marginBottom: 8,
    marginHorizontal: 14,
  },
  trackBg: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  trackFill: {
    position: "absolute",
    top: 14,
    left: 0,
    height: 4,
    borderRadius: 2,
    zIndex: 2,
  },
  stepNode: {
    position: "absolute",
    alignItems: "center",
    zIndex: 3,
    width: 60,
    marginLeft: -30,
    top: 0,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "800",
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── Technician card ──────────────────────────────────────────────────────
  techCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  techLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  techAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  techInitials: {
    fontSize: 18,
    fontWeight: "800",
  },
  techInfo: {
    flex: 1,
    gap: 2,
  },
  techName: {
    fontSize: 15,
    fontWeight: "700",
  },
  techRole: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  callBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
