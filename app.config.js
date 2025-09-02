export default {
  expo: {
    name: "Tikiti",
    slug: "tikiti",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    description: "Discover, create, and manage events with Tikiti - the modern event platform for organizers and attendees.",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0EA5E9"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tikiti.eventapp",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Tikiti needs camera access to scan QR codes for event tickets and to upload event photos.",
        NSPhotoLibraryUsageDescription: "Tikiti needs photo library access to select and upload event images.",
        NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0EA5E9"
      },
      package: "com.tikiti.eventapp",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-camera",
      "expo-image-picker"
    ],
    scheme: "tikiti",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "tikiti.com"
          },
          {
            scheme: "tikiti"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ],
    extra: {
      eas: {
        projectId: "4a3d499a-fee7-465b-b0c6-3c9ba76073bc"
      },
      sendgridApiKey: process.env.EXPO_PUBLIC_SENDGRID_API_KEY
    }
  }
};