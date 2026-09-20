import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";
const light = {
  surface: "#FAF8F5", onSurface: "#2C2A29", surfaceSecondary: "#F3EFEA", onSurfaceSecondary: "#3D3A38",
  surfaceTertiary: "#E9E3DC", onSurfaceTertiary: "#4E4945", surfaceInverse: "#1C1B1A", onSurfaceInverse: "#FAF8F5",
  brand: "#8C5E3C", onBrand: "#FAF8F5", brandPrimary: "#8C5E3C", onBrandPrimary: "#FAF8F5",
  brandSecondary: "#A67449", onBrandSecondary: "#FAF8F5", brandTertiary: "#D9C8B8", onBrandTertiary: "#3D3A38",
  success: "#4A6B5D", onSuccess: "#FAF8F5", warning: "#A67C37", onWarning: "#FAF8F5",
  error: "#8C3C3C", onError: "#FAF8F5", info: "#4A5D6B", onInfo: "#FAF8F5",
  border: "#E2DBD3", borderStrong: "#C8BCB0", divider: "#EFEAE3", muted: "#7A736D",
};
export type ThemeColors = typeof light;
export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };
export function setColorScheme(scheme: ColorScheme | null) { Appearance.setColorScheme?.(scheme ?? "unspecified"); }
setColorScheme(defaultScheme);
export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
