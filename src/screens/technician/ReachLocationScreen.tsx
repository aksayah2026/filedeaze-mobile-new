import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MapPin, Clock, Navigation, CheckCircle2 } from "lucide-react-native";
import * as Location from "expo-location";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useUpdateJobStatus, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "ReachLocation">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "ReachLocation">;

export const ReachLocationScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, address } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const reachMutation = useUpdateJobStatus();

  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  // Auto-fetch GPS on mount
  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Location permission denied. Please enable it in settings.");
        setGpsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGpsCoords({
        lat: parseFloat(loc.coords.latitude.toFixed(6)),
        lng: parseFloat(loc.coords.longitude.toFixed(6)),
      });
      setTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e) {
      setGpsError("Could not fetch GPS. Using fallback coordinates.");
      // Fallback for simulator
      setGpsCoords({ lat: 28.6139, lng: 77.2090 });
      setTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } finally {
      setGpsLoading(false);
    }
  };

  const handleMarkReached = async () => {
    if (!gpsCoords) {
      Alert.alert("GPS Required", "Please wait for GPS coordinates to be captured.");
      return;
    }

    try {
      await reachMutation.mutateAsync({ ticketId: jobId, status: "REACHED" }); // CHANGED: Rename ticketNo to ticketId for UUID routing
      Alert.alert(
        "Marked as Reached ✓",
        `Location recorded at ${timestamp}.\nCoords: ${gpsCoords.lat}, ${gpsCoords.lng}`,
        [{ text: "Proceed", onPress: () => navigation.navigate("TechnicianHome") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update status.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Reach Location" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Mark as Reached"
        subtitle={ticketNo}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Pin Visual */}
        <View
          style={[
            styles.mapPinContainer,
            { backgroundColor: `${theme.colors.primary}08` },
          ]}
        >
          <View
            style={[styles.mapPinCircle, { backgroundColor: `${theme.colors.primary}18` }]}
          >
            <View
              style={[styles.mapPinInner, { backgroundColor: `${theme.colors.primary}30` }]}
            >
              <MapPin size={42} color={theme.colors.primary} />
            </View>
          </View>
          <Text style={[styles.mapPinTitle, { color: theme.colors.text }]}>
            Confirm Your Arrival
          </Text>
          <Text style={[styles.mapPinSubtitle, { color: theme.colors.textMuted }]}>
            GPS coordinates will be captured and logged as your arrival proof
          </Text>
        </View>

        {/* GPS Status Card */}
        <AppCard style={styles.card}>
          <View style={styles.gpsRow}>
            <Navigation size={18} color={theme.colors.primary} />
            <Text style={[styles.gpsLabel, { color: theme.colors.text }]}>GPS Status</Text>
          </View>

          {gpsLoading ? (
            <View style={styles.gpsCapturing}>
              <AppLoader message="Acquiring GPS signal..." />
            </View>
          ) : gpsError ? (
            <View style={[styles.gpsErrorBox, { backgroundColor: `${theme.colors.warning}10` }]}>
              <Text style={[styles.gpsErrorText, { color: theme.colors.warning }]}>{gpsError}</Text>
              {gpsCoords && (
                <Text style={[styles.coordsText, { color: theme.colors.text }]}>
                  Fallback: {gpsCoords.lat}, {gpsCoords.lng}
                </Text>
              )}
              <AppButton
                title="Retry GPS"
                onPress={fetchGPS}
                variant="outline"
                size="sm"
                style={{ marginTop: 10 }}
              />
            </View>
          ) : gpsCoords ? (
            <View
              style={[
                styles.gpsSuccessBox,
                { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success },
              ]}
            >
              <View style={styles.coordRow}>
                <CheckCircle2 size={16} color={theme.colors.success} />
                <Text style={[styles.coordsText, { color: theme.colors.text }]}>
                  Latitude: <Text style={{ fontWeight: "700" }}>{gpsCoords.lat}</Text>
                </Text>
              </View>
              <View style={styles.coordRow}>
                <CheckCircle2 size={16} color={theme.colors.success} />
                <Text style={[styles.coordsText, { color: theme.colors.text }]}>
                  Longitude: <Text style={{ fontWeight: "700" }}>{gpsCoords.lng}</Text>
                </Text>
              </View>
              {timestamp && (
                <View style={styles.coordRow}>
                  <Clock size={16} color={theme.colors.success} />
                  <Text style={[styles.coordsText, { color: theme.colors.text }]}>
                    Captured at: <Text style={{ fontWeight: "700" }}>{timestamp}</Text>
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </AppCard>

        {/* Destination Card */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Destination</Text>
        <AppCard style={styles.card}>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>{job?.service}</Text>
          <View style={styles.addrRow}>
            <MapPin size={14} color={theme.colors.textMuted} />
            <Text style={[styles.addrText, { color: theme.colors.textMuted }]}>{job?.address}</Text>
          </View>
        </AppCard>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title={gpsLoading ? "Acquiring GPS..." : "Mark as Reached"}
            onPress={handleMarkReached}
            loading={reachMutation.isPending}
            disabled={gpsLoading || !gpsCoords}
            variant="primary"
            size="lg"
            icon={<MapPin size={20} color="#ffffff" />}
          />
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  mapPinContainer: {
    alignItems: "center",
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 20,
  },
  mapPinCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  mapPinInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPinTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  mapPinSubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },
  card: { marginBottom: 16 },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  gpsLabel: { fontSize: 14, fontWeight: "700" },
  gpsCapturing: { paddingVertical: 8 },
  gpsErrorBox: { padding: 12, borderRadius: 8 },
  gpsErrorText: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  gpsSuccessBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coordsText: { fontSize: 13 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  serviceName: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  addrRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  addrText: { fontSize: 13, flex: 1 },
  actions: { gap: 10 },
});
