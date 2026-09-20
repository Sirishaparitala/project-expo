import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthScreen } from "@/src/components/AuthScreen";
import { HomeScreen } from "@/src/components/HomeScreen";
import { api, GalleryItem, TOKEN_KEY, User } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { useTheme, makeStyles } from "@/src/theme";

type AuthMode = "login" | "register" | "forgot";
const CACHE_KEY = "aura_gallery_cache_v1";
const FAVORITES_KEY = "aura_favorites_v1";
const PROFILE_KEY = "aura_profile_v1";
type Tokens = { access_token: string; refresh_token: string };
type Profile = { name: string; bio: string };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const value = await storage.getItem(key, null);
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) { void storage.setItem(key, JSON.stringify(value)); }

export default function Index() {
  const router = useRouter(); const styles = useStyles(); const { colors } = useTheme();
  const [booting, setBooting] = useState(true); const [user, setUser] = useState<User | null>(null); const [mode, setMode] = useState<AuthMode>("login"); const [authError, setAuthError] = useState(""); const [authBusy, setAuthBusy] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]); const [favorites, setFavorites] = useState<GalleryItem[]>([]); const [profile, setProfile] = useState<Profile>({ name: "", bio: "" }); const [loading, setLoading] = useState(false); const [refreshing, setRefreshing] = useState(false); const [galleryError, setGalleryError] = useState(""); const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0); const loadingRef = useRef(false); const generationRef = useRef(0); const abortRef = useRef<AbortController | null>(null);

  const loadPage = async (page: number, refresh = false) => {
    if (loadingRef.current || (!hasMore && page > 1)) return;
    loadingRef.current = true; if (refresh) setRefreshing(true); else setLoading(true); setGalleryError(""); const generation = ++generationRef.current; abortRef.current?.abort(); const controller = new AbortController(); abortRef.current = controller;
    try { const response = await api.gallery(page, controller.signal); if (generation !== generationRef.current) return; setItems((current) => { const incoming = page === 1 ? response.items : [...current, ...response.items]; const unique = Array.from(new Map(incoming.map((item) => [item.id, item])).values()); writeJson(CACHE_KEY, unique.slice(0, 90)); return unique; }); pageRef.current = page; setHasMore(response.has_more); }
    catch (error) { if ((error as Error).name !== "AbortError") setGalleryError(items.length ? "You’re offline. Cached images are still available." : "The gallery could not load right now."); }
    finally { loadingRef.current = false; setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { let alive = true; (async () => { const [tokens, cached, saved, localProfile] = await Promise.all([storage.secureGet<Tokens | null>(TOKEN_KEY, null), readJson<GalleryItem[]>(CACHE_KEY, []), readJson<GalleryItem[]>(FAVORITES_KEY, []), readJson<Profile>(PROFILE_KEY, { name: "", bio: "" })]); if (!alive) return; setItems(cached); setFavorites(saved); setProfile(localProfile); if (!tokens) { setBooting(false); return; } try { const restored = await api.me(); if (!alive) return; setUser(restored); setProfile((current) => ({ ...current, name: current.name || restored.name })); setBooting(false); void loadPage(1); } catch { await storage.secureRemove(TOKEN_KEY); if (alive) setBooting(false); } })(); return () => { alive = false; abortRef.current?.abort(); }; }, []);
  const onAuth = async (values: { name: string; email: string; password: string }) => { setAuthError(""); setAuthBusy(true); try { if (mode === "forgot") { await api.forgotPassword(values.email); setAuthError("If an account exists, a reset link is on its way."); setMode("login"); } else { const response = mode === "register" ? await api.register(values.name, values.email, values.password) : await api.login(values.email, values.password); await storage.secureSet(TOKEN_KEY, { access_token: response.access_token, refresh_token: response.refresh_token }); setUser(response.user); setProfile((current) => ({ ...current, name: current.name || response.user.name })); void loadPage(1); } } catch (error) { setAuthError((error as Error).message); } finally { setAuthBusy(false); } };
  const logout = async () => { await storage.secureRemove(TOKEN_KEY); abortRef.current?.abort(); setUser(null); setItems([]); setMode("login"); setAuthError(""); };
  const toggleFavorite = (item: GalleryItem) => { setFavorites((current) => { const next = current.some((saved) => saved.id === item.id) ? current.filter((saved) => saved.id !== item.id) : [item, ...current]; writeJson(FAVORITES_KEY, next); return next; }); };
  const saveProfile = (next: Profile) => { setProfile(next); writeJson(PROFILE_KEY, next); };

  if (booting) return <View style={styles.boot}><ActivityIndicator color={colors.brand} /><Text style={styles.bootText}>Opening your gallery…</Text></View>;
  if (!user) return <AuthScreen mode={mode} busy={authBusy} error={authError} onModeChange={(next) => { setMode(next); setAuthError(""); }} onSubmit={onAuth} />;
  return <HomeScreen user={user} items={items} favorites={favorites} profile={profile.name ? profile : { ...profile, name: user.name }} loading={loading} refreshing={refreshing} error={galleryError} hasMore={hasMore} onLoadMore={() => loadPage(pageRef.current + 1)} onRefresh={() => loadPage(1, true)} onOpen={(item) => router.push({ pathname: "/details", params: { id: item.id, author: item.author, width: String(item.width), height: String(item.height), url: item.url, download_url: item.download_url, thumbnail_url: item.thumbnail_url } })} onToggleFavorite={toggleFavorite} onSaveProfile={saveProfile} onLogout={logout} />;
}

const useStyles = makeStyles((colors) => ({ boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, gap: 12 }, bootText: { color: colors.muted, fontSize: 14 } }));
