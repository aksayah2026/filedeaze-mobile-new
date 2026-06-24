import { Platform } from "react-native";

import Constants from "expo-constants";

const getDevUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return Platform.OS === "android" ? "http://10.0.2.2:3000/api/v1" : "http://localhost:3000/api/v1";
  }
  const host = hostUri.split(":")[0];
  return `http://${host}:3000/api/v1`;
};

const devUrl = getDevUrl();

export const APP_CONFIG = {
  tenantId: "1b9f53fc-6548-4aa6-97ee-c909ad9ad444",
  tenantCode: "abc",
  appName: "ABC Services Ltd",
  apiBaseUrl: devUrl,
  timeoutMs: 15000,
};

