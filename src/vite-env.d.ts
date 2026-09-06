/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-native-web' {
  import type React from 'react';

  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;
  export type StyleProp<T> = T | readonly StyleProp<T>[] | false | null | undefined;

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const TouchableWithoutFeedback: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const TextInput: React.ComponentType<{
    value?: string;
    onChangeText?: (value: string) => void;
    [key: string]: any;
  }>;
  export const ActivityIndicator: React.ComponentType<any>;
  export const Switch: React.ComponentType<{
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    [key: string]: any;
  }>;
  export const StatusBar: React.ComponentType<any>;
  export const Platform: { OS: 'web'; select: <T>(values: Record<string, T>) => T };
  export const Linking: {
    canOpenURL: (url: string) => Promise<boolean>;
    openURL: (url: string) => Promise<unknown>;
  };
  export function useWindowDimensions(): {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  };
  export function FlatList<T>(props: {
    data: readonly T[];
    renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
    keyExtractor?: (item: T, index: number) => string;
    [key: string]: any;
  }): React.ReactElement;
  export const StyleSheet: {
    create<T extends Record<string, any>>(styles: T): T;
    flatten(style: any): Record<string, any>;
    absoluteFill: Record<string, any>;
    absoluteFillObject: Record<string, any>;
  };
}
