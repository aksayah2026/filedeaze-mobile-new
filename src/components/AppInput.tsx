import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useTheme } from "../theme";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppInput = React.forwardRef<TextInput, AppInputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      containerStyle,
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const localRef = React.useRef<TextInput>(null);

    React.useImperativeHandle(ref, () => localRef.current!);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: error
                  ? theme.colors.danger
                  : isFocused
                    ? theme.colors.primary
                    : theme.colors.textMuted,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {label}
          </Text>
        )}

        <View
          onTouchStart={() => {
            if (rest.editable !== false) {
              localRef.current?.focus();
            }
          }}
          style={[
            styles.inputContainer,
            {
              backgroundColor: isFocused
                ? theme.colors.card
                : theme.colors.background,
              borderRadius: 12,
              borderWidth: isFocused ? 1.5 : 1,
              borderColor: error
                ? theme.colors.danger
                : isFocused
                  ? theme.colors.primary
                  : theme.colors.borderLight,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        >
          {leftIcon && (
            <View pointerEvents="none" style={styles.leftIconContainer}>
              {leftIcon}
            </View>
          )}

          <TextInput
            ref={localRef}
            style={[
              styles.textInput,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                height: rest.multiline ? undefined : 52,
                minHeight: rest.multiline ? 100 : 52,
              },
              style,
            ]}
            placeholderTextColor={theme.colors.textLight}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {rightIcon && (
            <View style={styles.rightIconContainer}>{rightIcon}</View>
          )}
        </View>

        {error && (
          <Text
            style={[
              styles.errorText,
              {
                color: theme.colors.danger,
                fontSize: theme.typography.fontSize.xs - 1,
                marginTop: theme.spacing.xs,
                fontWeight: theme.typography.fontWeight.medium,
              },
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    paddingVertical: 0, // fixes vertical centering on android
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rightIconContainer: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    alignSelf: "flex-start",
  },
});
