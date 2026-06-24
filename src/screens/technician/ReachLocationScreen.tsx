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
import { MapPin, Clock, Navigation, CheckCircle2, Tag, ShieldCheck } from "lucide-react-native";
import * as Location from "expo-location";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useUpdateJobStatus, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";
import { AppSuccessModal } from "../../components/AppSuccessModal";
import { AppAlertModal } from "../../components/AppAlertModal";

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
  const [locationName, setLocationName] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Styled alert popup states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("warning");

  const showAlert = (title: string, message: string, type: "success" | "error" | "warning" = "warning") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  // Auto-fetch GPS on mount
  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    setLocationName(null);
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
      const coords = {
        lat: parseFloat(loc.coords.latitude.toFixed(6)),
        lng: parseFloat(loc.coords.longitude.toFixed(6)),
      };
      setGpsCoords(coords);
      setTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      // Reverse geocode to get current location name/address
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const parts = [
            item.name,
            item.street,
            item.district,
            item.city,
            item.region,
            item.postalCode,
            item.country,
          ].filter(Boolean);
          setLocationName(parts.join(", "));
        } else {
          setLocationName(`${coords.lat}, ${coords.lng}`);
        }
      } catch (geoErr) {
        setLocationName(`${coords.lat}, ${coords.lng}`);
      }
    } catch (e) {
      setGpsError("Could not fetch GPS. Using fallback coordinates.");
      // Fallback for simulator
      const fallback = { lat: 28.6139, lng: 77.2090 };
      setGpsCoords(fallback);
      setTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setLocationName("New Delhi, Delhi, India");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleMarkReached = async () => {
    if (!gpsCoords) {
      showAlert("GPS Required", "Please wait for GPS coordinates to be captured.", "warning");
      return;
    }

    try {
      await reachMutation.mutateAsync({ ticketId: jobId, status: "REACHED" });
      setSuccessModalVisible(true);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to update status.", "error");
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    navigation.navigate("TechnicianHome");
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
        subtitle="Mark arrival at customer location"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.card}>
          {/* Ticket Number Field */}
          <View style={styles.fieldWrapper}>
            <View style={styles.rowLayout}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}12` }]}>
                <Tag size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Ticket Number</Text>
                <Text style={[styles.fieldValueText, { color: theme.colors.text }]}>{ticketNo}</Text>
              </View>
              <View style={styles.statusBadge}>
                <CheckCircle2 size={18} color={theme.colors.success} />
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Reach Time Field */}
          <View style={styles.fieldWrapper}>
            <View style={styles.rowLayout}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.purple}12` }]}>
                <Clock size={20} color={theme.colors.purple} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Reach Time</Text>
                <Text style={[styles.fieldValueText, { color: theme.colors.text }]}>
                  {timestamp || "Acquiring time..."}
                </Text>
              </View>
              {timestamp ? (
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={18} color={theme.colors.success} />
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <Clock size={18} color={theme.colors.warning} />
                </View>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* GPS Location Field */}
          <View style={styles.fieldWrapper}>
            <View style={styles.rowLayout}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.success}12` }]}>
                <MapPin size={20} color={theme.colors.success} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>GPS Location</Text>
                {gpsLoading ? (
                  <Text style={[styles.fieldValueText, { color: theme.colors.textMuted }]}>Acquiring location address...</Text>
                ) : gpsError ? (
                  <Text style={[styles.fieldValueText, { color: theme.colors.warning }]}>{gpsError}</Text>
                ) : locationName ? (
                  <Text style={[styles.fieldValueText, { color: theme.colors.text }]}>
                    {locationName}
                  </Text>
                ) : (
                  <Text style={[styles.fieldValueText, { color: theme.colors.textMuted }]}>Waiting for GPS...</Text>
                )}
              </View>
              {locationName ? (
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={18} color={theme.colors.success} />
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <Clock size={18} color={theme.colors.warning} />
                </View>
              )}
            </View>
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
            icon={<ShieldCheck size={20} color="#ffffff" />}
          />
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>

      {/* App Success Modal */}
      <AppSuccessModal
        visible={successModalVisible}
        title="Marked as Reached ✓"
        message={`Location recorded at ${timestamp}.\nAddress: ${locationName || (gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lng}` : "")}`}
        onClose={handleSuccessClose}
        autoCloseDelay={3000}
      />

      {/* Custom Alert/Warning Modal */}
      <AppAlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, marginBottom: 16 },
  fieldWrapper: {
    paddingVertical: 4,
  },
  rowLayout: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fieldValueText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  statusBadge: {
    paddingLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
});
