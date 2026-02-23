export default {
  expo: {
    name: "Tikiti",
    slug: "tikiti",
    version: "1.8.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    description: "Discover, create, and manage events with Tikiti - the modern event platform for organizers and attendees.",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tikiti.eventapp",
      buildNumber: "10",
      infoPlist: {
        NSCameraUsageDescription: "Tikiti needs camera access to scan QR codes for event tickets and to upload event photos.",
        NSPhotoLibraryUsageDescription: "Tikiti needs photo library access to select and upload event images.",
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.tikiti.eventapp",
      versionCode: 10,
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
      "expo-image-picker",
      "expo-font"
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
      brevoApiKey: process.env.EXPO_PUBLIC_BREVO_API_KEY
    }
  }
};