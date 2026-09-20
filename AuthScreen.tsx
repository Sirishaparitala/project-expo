import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme } from "@/src/theme";

type AuthMode = "login" | "register" | "forgot";
type Props = { mode: AuthMode; busy: boolean; error: string; onModeChange: (mode: AuthMode) => void; onSubmit: (values: { name: string; email: string; password: string }) => void };

export function AuthScreen({ mode, busy, error, onModeChange, onSubmit }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const title = mode === "register" ? "Make room for more beauty." : mode === "forgot" ? "Find your way back." : "A quieter way to browse.";
  const subtitle = mode === "register" ? "Create a personal gallery for the images that stay with you." : mode === "forgot" ? "Enter your email and we’ll send a secure reset link." : "Fast, focused image discovery from the open web.";
  const submit = () => { Keyboard.dismiss(); onSubmit({ name: name.trim(), email: email.trim(), password }); };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
    <View style={styles.mark}><Ionicons name="sparkles-outline" size={20} color={colors.onBrandPrimary} /><Text style={styles.markText}>AURA</Text></View>
    <View style={styles.hero}><Text style={styles.eyebrow}>PICSUM GALLERY</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>
    <View style={styles.form}>
      {mode === "register" && <Field label="YOUR NAME" value={name} onChangeText={setName} placeholder="Ada Lovelace" icon="person-outline" />}
      <Field label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
      {mode !== "forgot" && <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="8 characters minimum" icon="lock-closed-outline" secureTextEntry />}
      {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={18} color={colors.onError} /><Text style={styles.errorText}>{error}</Text></View> : null}
      <Pressable onPress={submit} disabled={busy} accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}>
        {busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.primaryText}>{mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Enter the gallery"}</Text>}
      </Pressable>
    </View>
    <View style={styles.footer}>
      {mode === "login" && <Pressable onPress={() => onModeChange("forgot")} hitSlop={10}><Text style={styles.link}>Forgot password?</Text></Pressable>}
      <Pressable onPress={() => onModeChange(mode === "register" ? "login" : "register")} hitSlop={10}><Text style={styles.switchText}>{mode === "register" ? "Already have an account? " : "New here? "}<Text style={styles.link}>{mode === "register" ? "Sign in" : "Create one"}</Text></Text></Pressable>
      {mode === "forgot" && <Pressable onPress={() => onModeChange("login")} hitSlop={10}><Text style={styles.link}>Back to sign in</Text></Pressable>}
    </View>
  </KeyboardAvoidingView>;
}

function Field({ label, icon, ...props }: { label: string; icon: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputWrap}><Ionicons name={icon} size={18} color={colors.muted} /><TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} /></View></View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 28, justifyContent: "space-between" },
  mark: { alignSelf: "flex-start", flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: colors.brandPrimary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  markText: { color: colors.onBrandPrimary, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  hero: { marginTop: 28, marginBottom: 22 }, eyebrow: { color: colors.brand, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.onSurface, fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 35, lineHeight: 42, marginTop: 12 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 330 },
  form: { gap: 16 }, field: { gap: 7 }, label: { color: colors.onSurfaceSecondary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: colors.borderStrong, minHeight: 50 },
  input: { flex: 1, color: colors.onSurface, fontSize: 16, paddingVertical: 12 },
  primary: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.brandPrimary, marginTop: 6 },
  primaryText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "800" }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.65 },
  error: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: colors.error, borderRadius: 10, padding: 12 }, errorText: { flex: 1, color: colors.onError, fontSize: 13, lineHeight: 18 },
  footer: { alignItems: "center", gap: 17, paddingTop: 20 }, switchText: { color: colors.muted, fontSize: 14 }, link: { color: colors.brand, fontWeight: "800", fontSize: 14 },
}));
