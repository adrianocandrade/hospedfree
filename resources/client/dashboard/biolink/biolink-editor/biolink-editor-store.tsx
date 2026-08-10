import {Biolink} from '@app/gen/schemas/biolink';
import {createContext, ReactNode, use, useState} from 'react';
import {create} from 'zustand';
import {useStoreWithEqualityFn} from 'zustand/traditional';

type Appearance = Required<Biolink>['appearance']['config'];

interface UpdateAppearanceOptions {
  markThemeModified?: boolean;
}

interface BiolinkEditorState {
  appearance: Appearance;
  appearanceIsDirty: boolean;
  pendingFileCleanup: string[];
  pendingFileRollback: string[];
  content: NonNullable<Biolink['content']>;
  setAppearanceIsDirty: (isDirty: boolean) => void;
  queueFileCleanup: (path: string) => void;
  consumeFileCleanup: (path: string) => void;
  queueFileRollback: (path: string) => void;
  consumeFileRollback: (path: string) => void;
  biolink: Omit<Biolink, 'appearance' | 'content'>;
  updateAppearance: (
    payload: Appearance,
    options?: UpdateAppearanceOptions,
  ) => void;
  overrideContent: (content: Biolink['content']) => void;
  getState: () => BiolinkEditorState;
}

const defaultAppearance: Appearance = {
  bgConfig: {
    backgroundColor: '',
    color: '',
  },
};

export const createBiolinkEditorStore = (biolink: Biolink) => {
  return create<BiolinkEditorState>()((set, get) => ({
    getState: () => get(),
    appearance: biolink.appearance?.config ?? defaultAppearance,
    appearanceIsDirty: false,
    pendingFileCleanup: [],
    pendingFileRollback: [],
    setAppearanceIsDirty: (isDirty: boolean) => {
      set(() => ({appearanceIsDirty: isDirty}));
    },
    queueFileCleanup: path => {
      set(state => ({
        pendingFileCleanup: state.pendingFileCleanup.includes(path)
          ? state.pendingFileCleanup
          : [...state.pendingFileCleanup, path],
      }));
    },
    consumeFileCleanup: path => {
      set(state => ({
        pendingFileCleanup: state.pendingFileCleanup.filter(
          item => item !== path,
        ),
      }));
    },
    queueFileRollback: path => {
      set(state => ({
        pendingFileRollback: state.pendingFileRollback.includes(path)
          ? state.pendingFileRollback
          : [...state.pendingFileRollback, path],
      }));
    },
    consumeFileRollback: path => {
      set(state => ({
        pendingFileRollback: state.pendingFileRollback.filter(
          item => item !== path,
        ),
      }));
    },
    biolink: {
      ...biolink,
      appearance: null,
      content: null,
    },
    content: biolink.content ?? [],
    overrideContent: content => {
      set(() => ({content}));
    },
    updateAppearance(payload: Appearance, options?: UpdateAppearanceOptions) {
      set(state => ({
        appearanceIsDirty: true,
        appearance: {
          ...state.appearance,
          ...payload,
          theme:
            options?.markThemeModified &&
            state.appearance.theme &&
            !state.appearance.theme.locked &&
            !payload.theme
              ? {
                  ...state.appearance.theme,
                  modified: true,
                }
              : (payload.theme ?? state.appearance.theme),
        },
      }));
    },
  }));
};

// export const useBiolinkEditorStore = create<BiolinkEditorState>()(
//   immer((set, get) => ({
//     appearance: defaultAppearance,
//     appearanceIsDirty: false,
//     setAppearanceIsDirty: (isDirty: boolean) => {
//       set(state => {
//         state.appearanceIsDirty = isDirty;
//       });
//     },
//     biolink: null,
//     setBiolink: biolink => {
//       set(state => {
//         state.biolink = biolink;
//         // don't override user appearance changes in the editor when biolink reloads from backend
//         if (!state.appearanceIsDirty) {
//           state.appearance = biolink.appearance?.config || defaultAppearance;
//         }
//       });
//     },
//     updateAppearance(payload: BiolinkAppearance) {
//       set(state => {
//         state.appearanceIsDirty = true;
//         state.appearance = {
//           ...state.appearance,
//           ...payload,
//         };
//       });
//     },
//   })),
// );

type BiolinkEditorStore = ReturnType<typeof createBiolinkEditorStore>;
export const BiolinkEditorStoreContext = createContext<BiolinkEditorStore>(
  null!,
);

export function useBiolinkEditorStore<T>(
  selector: (s: BiolinkEditorState) => T,
  equalityFn?: (left: T, right: T) => boolean,
): T {
  const store = use(BiolinkEditorStoreContext);
  return useStoreWithEqualityFn(store, selector, equalityFn);
}

export interface BiolinkEditorStoreProviderProps {
  children: ReactNode;
  data: Biolink;
}
export function BiolinkEditorStoreProvider({
  children,
  data,
}: BiolinkEditorStoreProviderProps) {
  //lazily create store object only once
  const [store] = useState(() => {
    return createBiolinkEditorStore(data);
  });

  return (
    <BiolinkEditorStoreContext.Provider value={store}>
      {children}
    </BiolinkEditorStoreContext.Provider>
  );
}
