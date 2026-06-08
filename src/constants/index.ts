export const APP_CONSTANTS = {
  storageKeys: {
    authToken: "@fieldeaze:auth_token", // main auth token
    tenantCode: "@fieldeaze:tenant_code",
    themeMode: "@fieldeaze:theme_mode",
  },
  support: {
    phone: "+1 (555) 999-0000",
    email: "support@fieldeaze.com",
    hours: "24/7 Dispatch Availability",
  },
  regex: {
    email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    phone: /^\+?[1-9]\d{1,14}$/,
  },
};
export default APP_CONSTANTS;
