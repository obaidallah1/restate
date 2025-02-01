import { Account, Avatars, Client, OAuthProvider } from "react-native-appwrite";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useContext } from "react";
import { useGlobalContext } from "./global-provider";

export const config = {
  platform: "com.obaid.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
};

export const client = new Client();
client.setEndpoint(config.endpoint).setProject(config.projectId).setPlatform(config.platform);

export const avatar = new Avatars(client);
export const account = new Account(client);

// Debug log

export async function login() {
  try {
    const deepLink = makeRedirectUri({ native: "exp://192.168.1.102:8081" });
    console.log("Deep Link:", deepLink);
    
    const scheme = Linking.createURL("/"); // Generates a proper deep link
    console.log("Scheme:", scheme);
    const redirectUri = Linking.createURL("/");

    const loginUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      deepLink, // Success
      deepLink  // Failure
    );
    console.log("OAuth URL:", loginUrl); // Debug log

    const browserResult = await WebBrowser.openAuthSessionAsync(`${loginUrl}`, scheme);
    console.log("Browser Result:", browserResult);
    if (browserResult.type !== "success") throw new Error("OAuth login failed");

    const url = new URL(browserResult.url);
    const secret = url.searchParams.get("secret");
    const userId = url.searchParams.get("userId");

    if (!secret || !userId) throw new Error("OAuth token retrieval failed");

    const session = await account.createOAuth2Token(OAuthProvider.Google, secret, userId);
    console.log("Session created:", session);
    return true;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const response = await account.get();
    if (response?.$id) {
      return {
        ...response,
        avatar: avatar.getInitials(response.name).toString(),
      };
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
