import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?:
    'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  inputStyle,
  editable = true,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
          },
          !editable && { opacity: 0.6 },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.textInput, { color: colors.textPrimary }, inputStyle]}
        />
      </View>
    </View>
  );
};

// ----------------------------------------------------
// SEARCH INPUT COMPONENT
// ----------------------------------------------------
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search products...',
  value,
  onChangeText,
  onClear,
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name="magnify" size={24} color={colors.textMuted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        style={[styles.searchInput, { color: colors.textPrimary }]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ----------------------------------------------------
// NOTES INPUT COMPONENT
// ----------------------------------------------------
interface NotesInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  label = 'Order Notes',
  placeholder = 'Add special instructions (e.g., Less spicy, no onion)...',
  value,
  onChangeText,
  style,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.notesWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
          },
        ]}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          multiline
          numberOfLines={4}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlignVertical="top"
          style={[styles.notesInput, { color: colors.textPrimary }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xxs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: SPACING.sm,
  },
  leftIcon: {
    marginRight: SPACING.xs,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  // Search Input Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    height: 52,
    paddingHorizontal: SPACING.md,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.sizes.md,
    marginLeft: SPACING.xs,
  },
  clearButton: {
    padding: 2,
  },
  // Notes Input Styles
  notesWrapper: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    height: 100,
  },
  notesInput: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.sizes.md,
    paddingTop: 0,
  },
});
