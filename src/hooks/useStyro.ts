import { useMemo } from 'react';
import { useStyro } from '@/lib/store';

export function useStyroSettings() {
  const { state, updateSettings, theme } = useStyro();
  return { settings: state.settings, updateSettings, theme };
}

export function useAppCatalog() {
  const styro = useStyro();
  return styro;
}

export function useFavorites() {
  const { state, toggleFavorite, moveFavorite, restoreFavorites, setPinned } = useStyro();
  const page = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];
  const favorites = useMemo(
    () =>
      page.pinnedIds
        .map((id) => state.apps.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => !!a && !a.isHidden),
    [page.pinnedIds, state.apps],
  );
  return { favorites, page, toggleFavorite, moveFavorite, restoreFavorites, setPinned };
}

export function useFolders() {
  const { state, addFolder, renameFolder, deleteFolder, addAppToFolder, removeAppFromFolder } = useStyro();
  return { folders: state.folders, addFolder, renameFolder, deleteFolder, addAppToFolder, removeAppFromFolder };
}

export function useReducedMotion() {
  const { reducedMotion, state } = useStyro();
  return { reducedMotion, motionLevel: state.settings.motionLevel };
}
