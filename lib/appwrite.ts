import { Account, Avatars, Client, OAuthProvider } from "react-native-appwrite";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

export const config = {
  platform: "com.obaid.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
};

export const client = new Client();
client.setEndpoint(config.endpoint).setProject(config.projectId).setPlatform(config.platform);

export const avatar = new Avatars(client);
export const account = new Account(client);

const deepLink = makeRedirectUri({ preferLocalhost: true });
const scheme = `${new URL(deepLink).protocol}//`; // Ensure URL object is used properly

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");

    const loginUrl = await account.createOAuth2Token(OAuthProvider.Google, deepLink);

    const browserResult = await WebBrowser.openAuthSessionAsync(`${loginUrl}`, redirectUri);
    if (browserResult.type !== "success") throw new Error("OAuth login failed");

    const url = new URL(browserResult.url);
    const secret = url.searchParams.get("secret");
    const userId = url.searchParams.get("userId");

    if (!secret || !userId) throw new Error("OAuth token retrieval failed");

    const session = await account.createOAuth2Token(OAuthProvider.Google, secret, userId);
    console.log("Session created:", session);
    return true;
  } catch (error) {
    console.error(error);
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
