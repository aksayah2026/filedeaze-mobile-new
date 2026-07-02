import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  TextInput,
  Switch,
  PanResponder,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Path } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import {
  Camera,
  ImagePlus,
  MapPin,
  FileText,
  CheckCircle2,
  IndianRupee,
  CreditCard,
  Banknote,
  Receipt,
  Smartphone,
  PenLine,
  Trash2,
  User,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useCollectPayment, useCompleteJob, useJobDetails } from "../../hooks/useJobs";
import { JobService } from "../../services/job.service";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";
import { AppSuccessModal } from "../../components/AppSuccessModal";
import { AppAlertModal } from "../../components/AppAlertModal";

type RouteProps = RouteProp<TechnicianStackParamList, "CompleteJob">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "CompleteJob">;

type Point = { x: number; y: number };
type Stroke = Point[];
const PAD_HEIGHT = 200;

type PaymentMode = "CASH" | "UPI";

const buildUpiLink = (amount: number) =>
  `upi://pay?pa=fieldeaze@upi&pn=FieldEaze+Services&am=${amount}&cu=INR&tn=ServicePayment`;

export const CompleteJobScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, customerName } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const collectMutation = useCollectPayment();
  const completeJobMutation = useCompleteJob();

  // Wizard Step State: 1 = Photos & Notes, 2 = Customer Signature, 3 = Payment Collection
  const [step, setStep] = useState<number>(1);

  // ==========================================
  // STEP 1 STATE: PHOTOS & NOTES
  // ==========================================
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [workNotes, setWorkNotes] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // ==========================================
  // STEP 2 STATE: CUSTOMER SIGNATURE
  // ==========================================
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);
  const currentStrokeRef = useRef<Stroke>([]);
  const [remarks, setRemarks] = useState("");
  const [hasSigned, setHasSigned] = useState(false);

  // ==========================================
  // STEP 3 STATE: PAYMENT
  // ==========================================
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [amountStr, setAmountStr] = useState("");
  const [extraCharges, setExtraCharges] = useState<{ id: string; name: string; amountStr: string }[]>([]);
  const [transactionId, setTransactionId] = useState("");
  const [transactionIdError, setTransactionIdError] = useState("");

  const validateTransactionId = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const regex = /^[a-zA-Z0-9]{8,35}$/;
    return regex.test(trimmed);
  };

  const addExtraCharge = () => {
    setExtraCharges((prev) => [...prev, { id: Math.random().toString(), name: "", amountStr: "" }]);
  };

  const removeExtraCharge = (id: string) => {
    setExtraCharges((prev) => prev.filter((item) => item.id !== id));
  };

  const updateExtraCharge = (id: string, field: "name" | "amountStr", value: string) => {
    setExtraCharges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedInvoiceNo, setGeneratedInvoiceNo] = useState("");

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

  // Auto-populate price when job data loads
  useEffect(() => {
    if (job && !amountStr) {
      const defaultAmount = job.serviceCharge ?? job.categoryPrice ?? 0;
      if (defaultAmount > 0) {
        setAmountStr(String(defaultAmount));
      }
    }
  }, [job, amountStr]);

  const fetchGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setGpsCoords({
          lat: parseFloat(loc.coords.latitude.toFixed(6)),
          lng: parseFloat(loc.coords.longitude.toFixed(6)),
        });
      } else {
        setGpsCoords({ lat: 28.6139, lng: 77.209 }); // fallback
      }
    } catch {
      setGpsCoords({ lat: 28.6139, lng: 77.209 }); // fallback
    } finally {
      setGpsLoading(false);
    }
  };

  const pickAfterFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Denied", "Please allow camera access in your device settings to take photos.", "error");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setAfterPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const pickAfterFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setAfterPhotos((p) => [...p, ...result.assets.map((a) => a.uri)]);
    }
  };

  // PanResponder for signature capture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentStrokeRef.current = [pt];
        setCurrentStroke([pt]);
        setHasSigned(true);
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentStrokeRef.current = [...currentStrokeRef.current, pt];
        setCurrentStroke([...currentStrokeRef.current]);
      },

      onPanResponderRelease: () => {
        if (currentStrokeRef.current.length > 0) {
          const finishedStroke = [...currentStrokeRef.current];
          setStrokes((prev) => [...prev, finishedStroke]);
        }
        currentStrokeRef.current = [];
        setCurrentStroke([]);
      },
      onPanResponderTerminate: () => {
        if (currentStrokeRef.current.length > 0) {
          const finishedStroke = [...currentStrokeRef.current];
          setStrokes((prev) => [...prev, finishedStroke]);
        }
        currentStrokeRef.current = [];
        setCurrentStroke([]);
      },
    })
  ).current;

  const clearSignature = () => {
    setStrokes([]);
    currentStrokeRef.current = [];
    setCurrentStroke([]);
    setHasSigned(false);
  };

  const buildPath = (stroke: Stroke): string => {
    if (stroke.length < 2) return "";
    const [first, ...rest] = stroke;
    return [`M ${first.x} ${first.y}`, ...rest.map((p) => `L ${p.x} ${p.y}`)].join(" ");
  };

  // ==========================================
  // NAVIGATION / ACTIONS HANDLERS
  // ==========================================
  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleStep1Proceed = () => {
    if (afterPhotos.length === 0) {
      showAlert("After Photos Required", "Please capture at least 1 after photo showing completed work.", "warning");
      return;
    }
    if (!workNotes.trim()) {
      showAlert("Work Notes Required", "Please enter a work summary / resolution note.", "warning");
      return;
    }
    if (!gpsCoords) {
      showAlert("GPS Required", "Location is still being acquired. Please wait.", "warning");
      return;
    }
    setStep(2);
  };

  const handleStep2Proceed = () => {
    if (!hasSigned || strokes.length === 0) {
      showAlert("Signature Required", "Please ask the customer to sign on the pad above.", "warning");
      return;
    }
    setStep(3);
  };

  const base = (!amountStr || isNaN(parseFloat(amountStr)) || parseFloat(amountStr) <= 0) ? 0 : parseFloat(amountStr);
  const extraChargesSum = extraCharges.reduce((sum, item) => {
    const name = item.name.trim();
    const val = parseFloat(item.amountStr);
    if (name !== "" && !isNaN(val) && val > 0) {
      return sum + val;
    }
    return sum;
  }, 0);
  const totalBase = base + extraChargesSum;

  const gstRate = 0.18;
  const gstAmount = base > 0 ? Math.round((base * gstRate) * 100) / 100 : 0;
  const amount = Math.round((totalBase + gstAmount) * 100) / 100;
  const upiLink = buildUpiLink(amount);

  const handleStep3Submit = async () => {
    if (amount <= 0) {
      showAlert("Amount Required", "Please enter a valid payment amount.", "warning");
      return;
    }

    // Validate extra charges rows
    for (const item of extraCharges) {
      const name = item.name.trim();
      const val = parseFloat(item.amountStr);
      const isFullyEmpty = name === "" && item.amountStr.trim() === "";
      if (isFullyEmpty) {
        continue;
      }
      if (name !== "" && (isNaN(val) || val <= 0)) {
        showAlert("Validation Error", `Please enter a valid amount greater than 0 for extra charge: "${name}"`, "warning");
        return;
      }
      if (name === "" && !isNaN(val) && val > 0) {
        showAlert("Validation Error", `Please enter a charge name for the amount: ₹${item.amountStr}`, "warning");
        return;
      }
    }

    if (paymentMode === "UPI") {
      const trimmedTxn = transactionId.trim();
      if (!trimmedTxn) {
        setTransactionIdError("Please enter a valid UPI transaction ID.");
        showAlert("Transaction ID Required", "Please enter a valid UPI transaction ID.", "warning");
        return;
      }
      if (!validateTransactionId(trimmedTxn)) {
        setTransactionIdError("Please enter a valid UPI transaction ID.");
        showAlert("Invalid Transaction ID", "Please enter a valid UPI transaction ID.", "warning");
        return;
      }
    }
    if (!paymentConfirmed) {
      showAlert("Confirm Payment", "Please toggle the payment confirmation before submitting.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload all after photos to the backend first (de-duplicated)
      const uniqueAfterPhotos = Array.from(new Set(afterPhotos));
      for (const uri of uniqueAfterPhotos) {
        if (!uri.startsWith("http")) {
          await JobService.uploadTicketImage(jobId, uri, "AFTER");
        }
      }

      // 2. Complete the job first (transitions status from IN_PROGRESS to COMPLETED)
      await completeJobMutation.mutateAsync({
        ticketNo: jobId,
        payload: {
          beforePhotos: job?.beforePhotos ?? [],
          afterPhotos: uniqueAfterPhotos,
          customerSignature: "captured",
          workNotes: workNotes + (remarks.trim() ? ` | Customer Remarks: ${remarks}` : "") + (transactionId.trim() ? ` | UPI Txn ID: ${transactionId.trim()}` : ""),
          duration: "—",
          paymentCollection: amount,
          paymentMethod: paymentMode,
          lat: gpsCoords?.lat,
          lng: gpsCoords?.lng,
        },
      });

      // 3. Collect payment second (transitions status from COMPLETED to INVOICE_GENERATED)
      const payResult = await collectMutation.mutateAsync({
        ticketNo: jobId,
        amount: totalBase,
        paymentMethod: paymentMode,
      });

      setGeneratedInvoiceNo(payResult.invoiceNo);
      setSuccessMessage(
        `Invoice ${payResult.invoiceNo} generated.\nAmount collected: ₹${amount.toLocaleString("en-IN")}\nPayment Mode: ${paymentMode}\n\nJob ${ticketNo} is now CLOSED.`
      );
      setSuccessModalVisible(true);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to collect payment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Complete Job" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket details..." />
      </View>
    );
  }

  const beforePhotos = job?.beforePhotos ?? [];
  const isPendingSubmit = collectMutation.isPending || completeJobMutation.isPending || submitting;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="Complete Job"
        subtitle={`Step ${step} of 3 · ${ticketNo}`}
        showBack
        onBackPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={step !== 2}
      >
        {/* Sticky-like Step Indicator */}
        <View style={styles.stepIndicator}>
          {["Photos", "Signature", "Payment"].map((stepItem, i) => {
            const isPassed = i + 1 < step;
            const isActive = i + 1 === step;
            return (
              <React.Fragment key={stepItem}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: isPassed
                          ? theme.colors.success
                          : isActive
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={styles.stepDotText}>{i + 1}</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isPassed
                          ? theme.colors.success
                          : isActive
                          ? theme.colors.primary
                          : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {stepItem}
                  </Text>
                </View>
                {i < 2 && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor: isPassed ? theme.colors.success : theme.colors.borderLight,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* ==========================================
            STEP 1 VIEW: PHOTOS & NOTES
            ========================================== */}
        {step === 1 && (
          <View style={styles.stepContent}>
            {/* GPS Status */}
            <View
              style={[
                styles.gpsBar,
                {
                  backgroundColor: gpsCoords
                    ? `${theme.colors.success}10`
                    : `${theme.colors.warning}10`,
                  borderColor: gpsCoords ? theme.colors.success : theme.colors.warning,
                },
              ]}
            >
              <MapPin size={15} color={gpsCoords ? theme.colors.success : theme.colors.warning} />
              <Text
                style={[
                  styles.gpsText,
                  { color: gpsCoords ? theme.colors.success : theme.colors.warning },
                ]}
              >
                {gpsLoading
                  ? "Acquiring GPS..."
                  : gpsCoords
                  ? `GPS Ready: ${gpsCoords.lat}, ${gpsCoords.lng}`
                  : "GPS unavailable"}
              </Text>
            </View>

            {/* Before Photos */}
            {beforePhotos.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
                  Before Photos (Captured)
                </Text>
                <View style={styles.photoRow}>
                  {Array.from(new Set(beforePhotos)).map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.photoThumb} />
                  ))}
                </View>
              </>
            )}

            {/* After Photos */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 8 }]}>
              After Photos <Text style={{ color: theme.colors.danger }}>*</Text>
            </Text>
            <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
              Capture work-completed state — showing the resolved issue
            </Text>
            <View style={styles.photoRow}>
              {Array.from(new Set(afterPhotos)).map((uri, i) => (
                <Pressable
                  key={i}
                  onLongPress={() => setAfterPhotos((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Image source={{ uri }} style={styles.photoThumb} />
                </Pressable>
              ))}
            </View>
            <View style={styles.photoBtnRow}>
              <Pressable
                onPress={pickAfterFromCamera}
                style={({ pressed }) => [
                  styles.photoActionBtn,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Camera size={22} color={theme.colors.primary} />
                <Text style={[styles.photoActionLabel, { color: theme.colors.text }]}>Camera</Text>
              </Pressable>
              <Pressable
                onPress={pickAfterFromGallery}
                style={({ pressed }) => [
                  styles.photoActionBtn,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ImagePlus size={22} color={theme.colors.primary} />
                <Text style={[styles.photoActionLabel, { color: theme.colors.text }]}>Gallery</Text>
              </Pressable>
            </View>

            {afterPhotos.length > 0 && (
              <View
                style={[
                  styles.photoStatus,
                  { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success, marginBottom: 12 },
                ]}
              >
                <CheckCircle2 size={16} color={theme.colors.success} />
                <Text style={[styles.photoStatusText, { color: theme.colors.success }]}>
                  {afterPhotos.length} after photo{afterPhotos.length > 1 ? "s" : ""} captured
                </Text>
              </View>
            )}

            {/* Work Notes */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 8 }]}>
              Work Summary & Resolution Notes <Text style={{ color: theme.colors.danger }}>*</Text>
            </Text>
            <View
              style={[
                styles.textAreaContainer,
                {
                  borderColor: workNotes.trim() ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
            >
              <FileText size={16} color={theme.colors.textLight} style={{ marginBottom: 6 }} />
              <TextInput
                value={workNotes}
                onChangeText={setWorkNotes}
                placeholder="e.g. Replaced faulty capacitor, cleaned filters, tested for 5 min..."
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={4}
                style={[styles.textArea, { color: theme.colors.text }]}
              />
            </View>

            {/* Step 1 Actions */}
            <View style={styles.actions}>
              <AppButton
                title="Proceed to Customer Signature →"
                onPress={handleStep1Proceed}
                disabled={afterPhotos.length === 0 || !workNotes.trim() || !gpsCoords}
                variant="primary"
                size="lg"
              />
              <AppButton
                title="Go Back"
                onPress={handleBack}
                variant="outline"
                size="lg"
              />
            </View>
          </View>
        )}

        {/* ==========================================
            STEP 2 VIEW: CUSTOMER SIGNATURE
            ========================================== */}
        {step === 2 && (
          <View style={styles.stepContent}>
            {/* Customer Info Card */}
            <AppCard style={styles.card}>
              <View style={styles.customerRow}>
                <View
                  style={[styles.avatarCircle, { backgroundColor: `${theme.colors.primary}15` }]}
                >
                  <User size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={[styles.customerLabel, { color: theme.colors.textMuted }]}>
                    Signature Requested From
                  </Text>
                  <Text style={[styles.customerName, { color: theme.colors.text }]}>
                    {job?.customerName ?? customerName ?? "Customer"}
                  </Text>
                  <Text style={[styles.ticketRef, { color: theme.colors.textMuted }]}>
                    Ticket: {ticketNo}
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Signature Pad */}
            <View style={styles.padHeader}>
              <View style={styles.padLabelRow}>
                <PenLine size={16} color={theme.colors.primary} />
                <Text style={[styles.padLabel, { color: theme.colors.text }]}>
                  Customer Signature Pad
                </Text>
              </View>
              <Pressable
                onPress={clearSignature}
                style={({ pressed }) => [
                  styles.clearBtn,
                  { backgroundColor: `${theme.colors.danger}12`, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Trash2 size={14} color={theme.colors.danger} />
                <Text style={[styles.clearBtnText, { color: theme.colors.danger }]}>Clear</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.signaturePad,
                {
                  borderColor: hasSigned ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Svg pointerEvents="none" width="100%" height={PAD_HEIGHT} style={StyleSheet.absoluteFill}>
                {strokes.map((stroke, i) => (
                  <Path
                    key={i}
                    d={buildPath(stroke)}
                    stroke={theme.colors.text}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                {currentStroke.length > 0 && (
                  <Path
                    d={buildPath(currentStroke)}
                    stroke={theme.colors.text}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Svg>

              {!hasSigned && (
                <View style={styles.padPlaceholder} pointerEvents="none">
                  <PenLine size={28} color={theme.colors.borderLight} />
                  <Text style={[styles.padPlaceholderText, { color: theme.colors.textLight }]}>
                    Sign here
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.padHint, { color: theme.colors.textMuted }]}>
              Hand your device to the customer to sign above. Tap "Clear" to retry.
            </Text>

            {/* Remarks */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
              Customer Remarks <Text style={{ color: theme.colors.textLight }}>(optional)</Text>
            </Text>
            <View
              style={[
                styles.textAreaContainer,
                {
                  borderColor: remarks ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card,
                  minHeight: 90,
                },
              ]}
            >
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder='e.g. "Very professional service, well done!"'
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={3}
                style={[styles.textArea, { color: theme.colors.text, minHeight: 66 }]}
              />
            </View>

            {/* Step 2 Actions */}
            <View style={styles.actions}>
              <AppButton
                title="Proceed to Payment Collection →"
                onPress={handleStep2Proceed}
                disabled={!hasSigned}
                variant="primary"
                size="lg"
              />
              <AppButton
                title="Go Back"
                onPress={handleBack}
                variant="outline"
                size="lg"
              />
            </View>
          </View>
        )}

        {/* ==========================================
            STEP 3 VIEW: PAYMENT COLLECTION
            ========================================== */}
        {step === 3 && (
          <View style={styles.stepContent}>
            {/* Ticket Summary */}
            <AppCard style={styles.card}>
              <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{ticketNo}</Text>
              <Text style={[styles.serviceName, { color: theme.colors.text }]}>{job?.service}</Text>
              <Text style={[styles.customer, { color: theme.colors.textMuted }]}>
                {job?.customerName ?? customerName}
              </Text>
            </AppCard>

            {/* Amount Input */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
              Base Service Charge (Excl. GST)
            </Text>
            <View
              style={[
                styles.amountContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: `${theme.colors.card}80`,
                },
              ]}
            >
              <IndianRupee size={20} color={theme.colors.textMuted} />
              <TextInput
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textLight}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: theme.colors.textMuted }]}
                editable={false}
              />
            </View>

            {/* Extra Charges Section */}
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginBottom: 0 }]}>
                  Extra Charges
                </Text>
                <Pressable
                  onPress={addExtraCharge}
                  style={({ pressed }) => [
                    styles.addExtraBtn,
                    { backgroundColor: `${theme.colors.primary}12`, opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <Text style={[styles.addExtraBtnText, { color: theme.colors.primary }]}>+ Add Item</Text>
                </Pressable>
              </View>

              {extraCharges.map((item) => (
                <View key={item.id} style={styles.extraRowInput}>
                  <TextInput
                    value={item.name}
                    onChangeText={(val) => updateExtraCharge(item.id, "name", val)}
                    placeholder="Charge Name (e.g. Spare Parts)"
                    placeholderTextColor={theme.colors.textLight}
                    style={[styles.extraNameInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                  />
                  <View style={[styles.extraAmountWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>₹</Text>
                    <TextInput
                      value={item.amountStr}
                      onChangeText={(val) => updateExtraCharge(item.id, "amountStr", val)}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textLight}
                      keyboardType="decimal-pad"
                      style={[styles.extraAmountInput, { color: theme.colors.text }]}
                    />
                  </View>
                  <Pressable
                    onPress={() => removeExtraCharge(item.id)}
                    style={({ pressed }) => [
                      styles.removeExtraBtn,
                      { opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <Trash2 size={18} color={theme.colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* GST Breakdown */}
            {amount > 0 && (
              <AppCard style={[styles.breakdownCard, { marginTop: 14 }]}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: theme.colors.textMuted }]}>
                    Base Service Charge
                  </Text>
                  <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                    ₹{base.toLocaleString("en-IN")}
                  </Text>
                </View>

                {extraChargesSum > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: theme.colors.textMuted }]}>
                      Extra Charges Total
                    </Text>
                    <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                      ₹{extraChargesSum.toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}


                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: theme.colors.textMuted }]}>
                    GST (18%)
                  </Text>
                  <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                    ₹{gstAmount.toLocaleString("en-IN")}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
                <View style={styles.breakdownRow}>
                  <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total Amount</Text>
                  <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                    ₹{amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              </AppCard>
            )}

            {/* Payment Mode Toggle */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
              Payment Mode
            </Text>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setPaymentMode("CASH")}
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor:
                      paymentMode === "CASH" ? `${theme.colors.success}15` : theme.colors.card,
                    borderColor:
                      paymentMode === "CASH" ? theme.colors.success : theme.colors.borderLight,
                  },
                ]}
              >
                <Banknote size={22} color={paymentMode === "CASH" ? theme.colors.success : theme.colors.textMuted} />
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: paymentMode === "CASH" ? theme.colors.success : theme.colors.text },
                  ]}
                >
                  Cash
                </Text>
                {paymentMode === "CASH" && (
                  <CheckCircle2 size={16} color={theme.colors.success} />
                )}
              </Pressable>

              <Pressable
                onPress={() => setPaymentMode("UPI")}
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor:
                      paymentMode === "UPI" ? `${theme.colors.primary}15` : theme.colors.card,
                    borderColor:
                      paymentMode === "UPI" ? theme.colors.primary : theme.colors.borderLight,
                  },
                ]}
              >
                <Smartphone size={22} color={paymentMode === "UPI" ? theme.colors.primary : theme.colors.textMuted} />
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: paymentMode === "UPI" ? theme.colors.primary : theme.colors.text },
                  ]}
                >
                  UPI
                </Text>
                {paymentMode === "UPI" && (
                  <CheckCircle2 size={16} color={theme.colors.primary} />
                )}
              </Pressable>
            </View>

            {/* UPI QR Code */}
            {paymentMode === "UPI" && amount > 0 && (
              <AppCard style={styles.qrCard}>
                <View style={styles.qrHeader}>
                  <CreditCard size={18} color={theme.colors.primary} />
                  <Text style={[styles.qrTitle, { color: theme.colors.text }]}>
                    Scan to Pay · ₹{amount.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={upiLink}
                    size={180}
                    backgroundColor="#ffffff"
                    color="#0f172a"
                  />
                </View>
                <Text style={[styles.qrHint, { color: theme.colors.textMuted }]}>
                  UPI ID: fieldeaze@upi · Scan with any UPI app
                </Text>
                <Text style={[styles.qrLink, { color: theme.colors.textLight }]} numberOfLines={2}>
                  {upiLink}
                </Text>
              </AppCard>
            )}

            {paymentMode === "UPI" && amount <= 0 && (
              <View
                style={[
                  styles.qrPlaceholder,
                  { backgroundColor: `${theme.colors.primary}08`, borderColor: theme.colors.borderLight },
                ]}
              >
                <Text style={[styles.qrPlaceholderText, { color: theme.colors.textMuted }]}>
                  Enter amount above to generate QR code
                </Text>
              </View>
            )}

            {/* UPI Transaction ID Input */}
            {paymentMode === "UPI" && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
                  UPI Transaction ID / Ref No. <Text style={{ color: theme.colors.danger }}>*</Text>
                </Text>
                <TextInput
                  value={transactionId}
                  onChangeText={(text) => {
                    setTransactionId(text);
                    const trimmed = text.trim();
                    if (trimmed === "") {
                      setTransactionIdError("");
                    } else if (!validateTransactionId(text)) {
                      setTransactionIdError("Please enter a valid UPI transaction ID.");
                    } else {
                      setTransactionIdError("");
                    }
                  }}
                  placeholder="Enter UPI Transaction ID / UTR"
                  placeholderTextColor={theme.colors.textLight}
                  style={{
                    height: 48,
                    borderWidth: 1.5,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    fontSize: 15,
                    color: theme.colors.text,
                    borderColor: transactionIdError ? theme.colors.danger : (transactionId.trim() ? theme.colors.primary : theme.colors.border),
                    backgroundColor: theme.colors.card,
                  }}
                />
                {transactionIdError ? (
                  <Text style={{ color: theme.colors.danger, fontSize: 12, marginTop: 4 }}>
                    {transactionIdError}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Payment Confirmation Toggle */}
            <View
              style={[
                styles.confirmRow,
                {
                  backgroundColor: paymentConfirmed
                    ? `${theme.colors.success}10`
                    : theme.colors.card,
                  borderColor: paymentConfirmed ? theme.colors.success : theme.colors.borderLight,
                },
              ]}
            >
              <View style={styles.confirmTextCol}>
                <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
                  Confirm Payment Received
                </Text>
                <Text style={[styles.confirmSubtitle, { color: theme.colors.textMuted }]}>
                  Toggle only after the customer has paid
                </Text>
              </View>
              <Switch
                value={paymentConfirmed}
                onValueChange={setPaymentConfirmed}
                trackColor={{ false: theme.colors.borderLight, true: `${theme.colors.success}60` }}
                thumbColor={paymentConfirmed ? theme.colors.success : theme.colors.textLight}
              />
            </View>

            {/* Step 3 Actions */}
            <View style={styles.actions}>
              <AppButton
                title="Generate Invoice & Close Job"
                onPress={handleStep3Submit}
                loading={isPendingSubmit}
                disabled={
                  !paymentConfirmed ||
                  amount <= 0 ||
                  (paymentMode === "UPI" && (!transactionId.trim() || !!transactionIdError))
                }
                variant="success"
                size="lg"
                icon={<Receipt size={20} color="#ffffff" />}
              />
              <AppButton
                title="Go Back"
                onPress={handleBack}
                variant="outline"
                size="lg"
              />
            </View>
          </View>
        )}
      </ScrollView>

      <AppSuccessModal
        visible={successModalVisible}
        title="🎉 Job Completed!"
        message={successMessage}
        onClose={() => {
          setSuccessModalVisible(false);
          navigation.navigate("TechnicianHome");
          // Reset local completion state after navigation
          setStep(1);
          setAfterPhotos([]);
          setWorkNotes("");
          setGpsCoords(null);
          setStrokes([]);
          setCurrentStroke([]);
          setRemarks("");
          setHasSigned(false);
          setPaymentMode("CASH");
          setAmountStr("");
          setExtraCharges([]);
          setTransactionId("");
          setTransactionIdError("");
          setPaymentConfirmed(false);
        }}
        autoCloseDelay={5000}
      />

      {/* Custom Alert/Warning Modal */}
      <AppAlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase" },
  stepLine: { flex: 1, height: 2, marginBottom: 16 },
  stepContent: { width: "100%" },
  gpsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  gpsText: { fontSize: 12, fontWeight: "600", flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  hint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  photoThumb: { width: 90, height: 90, borderRadius: 8 },
  photoBtnRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  photoActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  photoActionLabel: { fontSize: 14, fontWeight: "600" },
  photoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoStatusText: { fontSize: 13, fontWeight: "600" },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
    minHeight: 80,
  },
  actions: { gap: 10, marginTop: 10 },
  card: { marginBottom: 16 },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  customerLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  customerName: { fontSize: 16, fontWeight: "700" },
  ticketRef: { fontSize: 12, marginTop: 2 },
  padHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  padLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  padLabel: { fontSize: 14, fontWeight: "700" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: { fontSize: 12, fontWeight: "700" },
  signaturePad: {
    height: PAD_HEIGHT,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  padPlaceholder: {
    alignItems: "center",
    gap: 8,
    opacity: 0.5,
  },
  padPlaceholderText: { fontSize: 14 },
  padHint: { fontSize: 11, textAlign: "center", marginBottom: 4, lineHeight: 18 },
  ticketNo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  serviceName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  customer: { fontSize: 13 },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "800", paddingVertical: 12 },
  breakdownCard: { padding: 14 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  breakdownLabel: { fontSize: 13 },
  breakdownValue: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "800" },
  modeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modeBtnText: { fontSize: 15, fontWeight: "700" },
  qrCard: { alignItems: "center", padding: 20, marginBottom: 16 },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  qrTitle: { fontSize: 15, fontWeight: "700" },
  qrContainer: {
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrHint: { fontSize: 12, marginBottom: 6, textAlign: "center" },
  qrLink: { fontSize: 9, textAlign: "center" },
  qrPlaceholder: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  qrPlaceholderText: { fontSize: 13 },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 12,
  },
  confirmTextCol: { flex: 1 },
  confirmTitle: { fontSize: 14, fontWeight: "700" },
  confirmSubtitle: { fontSize: 12, marginTop: 2 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  alertCloseBtn: {
    marginTop: 20,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  alertCloseBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  addExtraBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addExtraBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  extraRowInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 6,
  },
  extraNameInput: {
    flex: 1.8,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  extraAmountWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  extraAmountInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: "600",
  },
  removeExtraBtn: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
