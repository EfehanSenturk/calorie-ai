import { useAuthContext } from "@/lib/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EmailLogin = { email: string; password: string; username?: never };
type UsernameLogin = { username: string; password: string; email?: never };

type SignInParams = EmailLogin | UsernameLogin;

async function signIn(params: SignInParams) {
  try {
    const response = await fetch("http://localhost:3000/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error("Failed to sign in");
    }
    const data = await response.json();
    console.log("Sign-in successful:", data);
    return data;
  } catch (error) {
    //@ts-ignore
    throw new Error(`Sign-in error: ${error.message}`);
  }
}

const SignIn = () => {
  const { setIsLoggedIn, setUser } = useAuthContext();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      alert("Username or Password Field Dont be an empty");
      return;
    }
    setIsLoading(true);

    try {
      const loginParams: SignInParams = identifier.includes("@")
        ? { email: identifier, password }
        : { username: identifier, password };

      const result = await signIn(loginParams);

      if (result?.response.accessToken) {
        const token = result.response.accessToken;
        await SecureStore.setItemAsync("token", token);

        const userData = await fetch("http://localhost:3000/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userData.ok) {
          const user = await userData.json();
          setUser(user);
        }

        setIsLoggedIn(true);
        router.push("/");
      } else {
        alert("Login Failed Try Again");
      }
    } catch (error: any) {
      alert(error.message || "An Error Occured");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome To Calorie Ai</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              placeholderTextColor="#aaa"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Signing-in...." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpLink}
          onPress={() => {
            router.push("/sign-up");
          }}
        >
          <Text style={styles.signUpText}>
            Don't have an account?{" "}
            <Text style={styles.signUpHighlight}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#f8f9fa",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    paddingRight: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  forgotPasswordText: {
    color: "#4f46e5",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpLink: {
    marginTop: 24,
    alignItems: "center",
  },
  signUpText: {
    color: "#666",
    fontSize: 15,
  },
  signUpHighlight: {
    color: "#4f46e5",
    fontWeight: "600",
  },
});

export default SignIn;
