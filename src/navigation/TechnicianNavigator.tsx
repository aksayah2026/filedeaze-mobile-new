import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TechnicianStackParamList } from "../types/navigation.types";
import { ThemeProvider, technicianTheme } from "../theme";
import { TechnicianHomeScreen } from "../screens/technician/TechnicianHomeScreen";
import { TechnicianJobDetailsScreen } from "../screens/technician/TechnicianJobDetailsScreen";
import { TechnicianInvoiceListScreen } from "../screens/technician/TechnicianInvoiceListScreen";
import { AttendanceHistoryScreen } from "../screens/technician/AttendanceHistoryScreen";
import { AssignedJobsScreen } from "../screens/technician/AssignedJobsScreen";
// Batch 2
import { AcceptTicketScreen } from "../screens/technician/AcceptTicketScreen";
import { RejectTicketScreen } from "../screens/technician/RejectTicketScreen";
import { ReachLocationScreen } from "../screens/technician/ReachLocationScreen";
// Batch 3
import { StartJobScreen } from "../screens/technician/StartJobScreen";
import { MarkPendingScreen } from "../screens/technician/MarkPendingScreen";
// Batch 4
import { CompleteJobScreen } from "../screens/technician/CompleteJobScreen";
import { CustomerSignatureScreen } from "../screens/technician/CustomerSignatureScreen";
import { PaymentCollectionScreen } from "../screens/technician/PaymentCollectionScreen";
// Workflow Integration Screens
import { CheckOutScreen } from "../screens/technician/CheckOutScreen";
import { TravelTrackingScreen } from "../screens/technician/TravelTrackingScreen";
import { WorkTimerScreen } from "../screens/technician/WorkTimerScreen";
import { InvoiceGenerateScreen } from "../screens/technician/InvoiceGenerateScreen";
import { PostLoginSplashScreen } from "../screens/auth/PostLoginSplashScreen";
import { NotificationListScreen } from "../screens/shared/NotificationListScreen";

const Stack = createNativeStackNavigator<TechnicianStackParamList>();

export const TechnicianNavigator = () => {
  return (
    <ThemeProvider theme={technicianTheme}>
    <Stack.Navigator
      initialRouteName="PostLoginSplash"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="PostLoginSplash" component={PostLoginSplashScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="TechnicianHome" component={TechnicianHomeScreen} />
      <Stack.Screen name="TechnicianJobDetails" component={TechnicianJobDetailsScreen} />
      <Stack.Screen name="TechnicianInvoiceList" component={TechnicianInvoiceListScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="AssignedJobs" component={AssignedJobsScreen} />
      {/* Batch 2 */}
      <Stack.Screen name="AcceptTicket" component={AcceptTicketScreen} />
      <Stack.Screen name="RejectTicket" component={RejectTicketScreen} />
      <Stack.Screen name="ReachLocation" component={ReachLocationScreen} />
      {/* Batch 3 */}
      <Stack.Screen name="StartJob" component={StartJobScreen} />
      <Stack.Screen name="MarkPending" component={MarkPendingScreen} />
      {/* Batch 4 */}
      <Stack.Screen name="CompleteJob" component={CompleteJobScreen} />
      <Stack.Screen name="CustomerSignature" component={CustomerSignatureScreen} />
      <Stack.Screen name="PaymentCollection" component={PaymentCollectionScreen} />
      {/* Workflow Integration */}
      <Stack.Screen name="CheckOut" component={CheckOutScreen} />
      <Stack.Screen name="TravelTracking" component={TravelTrackingScreen} />
      <Stack.Screen name="WorkTimer" component={WorkTimerScreen} />
      <Stack.Screen name="InvoiceGenerate" component={InvoiceGenerateScreen} />
      <Stack.Screen name="NotificationList" component={NotificationListScreen} />
    </Stack.Navigator>
    </ThemeProvider>
  );
};
