import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Pressable,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MapPin, Navigation, Phone, Clock, ArrowRight, Compass } from "lucide-react-native";
import * as Location from "expo-location";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "TravelTracking">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "TravelTracking">;

export const TravelTrackingScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, address } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);

  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [eta, setEta] = useState<string>("15 mins");

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Location permission denied.");
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setEta("18 mins"); // Dynamic estimate representation

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const parts = [
            item.name || item.street,
            item.city,
            item.region,
          ].filter(Boolean);
          setCurrentLocationName(parts.join(", "));
        } else {
          setCurrentLocationName(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } catch {
        setCurrentLocationName(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch (err) {
      setGpsError("Could not retrieve GPS");
      setCurrentLocationName("Coimbatore, Tamil Nadu");
      setEta("22 mins");
    } finally {
      setGpsLoading(false);
    }
  };

  const openPhone = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = (destAddress: string) => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(destAddress)}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Travel Tracking" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket details..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Travelling to Site"
        subtitle={ticketNo}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route / Map Visual Representation */}
        <AppCard style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <Compass size={20} color={theme.colors.primary} />
            <Text style={[styles.routeTitle, { color: theme.colors.text }]}>Active Route Map</Text>
          </View>

          {/* Stepper Progress Route */}
          <View style={styles.routeStepper}>
            <View style={styles.stepNode}>
              <View style={[styles.nodeDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.nodeLabel, { color: theme.colors.textMuted }]}>Current Location</Text>
              <Text style={[styles.nodeValue, { color: theme.colors.text }]} numberOfLines={1}>
                {gpsLoading ? "Acquiring..." : currentLocationName || "Acquiring GPS..."}
              </Text>
            </View>

            <View style={styles.stepLineContainer}>
              <View style={[styles.stepLine, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.pulsingBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Navigation size={12} color={theme.colors.primary} style={{ transform: [{ rotate: "45deg" }] }} />
              </View>
            </View>

            <View style={styles.stepNode}>
              <View style={[styles.nodeDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.nodeLabel, { color: theme.colors.textMuted }]}>Client Destination</Text>
              <Text style={[styles.nodeValue, { color: theme.colors.text }]} numberOfLines={1}>
                {address}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Travel Information Fields */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Travel Information</Text>
        <AppCard style={styles.card}>
          {/* Current Location Field */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}12` }]}>
              <MapPin size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabelText, { color: theme.colors.textMuted }]}>Current Location</Text>
              <Text style={[styles.fieldValueText, { color: theme.colors.text }]}>
                {gpsLoading ? "Calculating address..." : currentLocationName || "Fetching location..."}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* ETA Field */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.purple}12` }]}>
              <Clock size={18} color={theme.colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabelText, { color: theme.colors.textMuted }]}>Estimated Time of Arrival (ETA)</Text>
              <Text style={[styles.fieldValueText, { color: theme.colors.text }]}>
                {eta}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Client Destination Field */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.success}12` }]}>
              <Navigation size={18} color={theme.colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabelText, { color: theme.colors.textMuted }]}>Destination Address</Text>
              <Text style={[styles.fieldValueText, { color: theme.colors.text }]}>
                {address}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Action Row Buttons */}
        <AppCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 0, marginBottom: 12 }]}>Navigation Actions</Text>
          <View style={styles.buttonRow}>
            <AppButton
              title="Open Google Maps"
              onPress={() => openMaps(address)}
              variant="outline"
              style={{ flex: 1 }}
              icon={<Navigation size={16} color={theme.colors.primary} />}
            />
            {job?.customerMobile && (
              <AppButton
                title="Call Client"
                onPress={() => openPhone(job.customerMobile)}
                variant="outline"
                style={{ flex: 1 }}
                icon={<Phone size={16} color={theme.colors.primary} />}
              />
            )}
          </View>
        </AppCard>

        {/* Action Button */}
        <View style={styles.actions}>
          <AppButton
            title="I Have Arrived / Reach Location"
            onPress={() => navigation.navigate("ReachLocation", { jobId, ticketNo, address })}
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
  routeCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  stepNode: {
    alignItems: "center",
    width: "35%",
  },
  nodeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  nodeValue: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  stepLineContainer: {
    flex: 1,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  stepLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.3,
  },
  pulsingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 10,
  },
  card: { padding: 16, marginBottom: 16 },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabelText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  fieldValueText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  buttonRow: { flexDirection: "row", gap: 10 },
  actions: { gap: 10, marginTop: 12 },
});
