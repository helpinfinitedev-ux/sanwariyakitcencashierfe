import React from 'react';
import { Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native-web';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  info: string | null;
}

/**
 * Catches JavaScript errors anywhere in the child tree and shows them instead
 * of letting the app hard-crash to the home screen (which is what happens with
 * an uncaught render error in a production/preview bundle — no red box). Also
 * surfaces the message + stack so a crash can actually be diagnosed on-device.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Keep it in the console/Metro terminal too.
    console.error('Caught by ErrorBoundary:', error, info.componentStack);
    this.setState({ info: info.componentStack });
  }

  reset = () => this.setState({ hasError: false, error: null, info: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The screen hit an error but the app stayed open. Details below:
        </Text>

        <Text style={styles.sectionLabel}>Error</Text>
        <Text style={styles.mono}>{error?.message || String(error)}</Text>

        {error?.stack ? (
          <>
            <Text style={styles.sectionLabel}>Stack</Text>
            <Text style={styles.mono}>{error.stack}</Text>
          </>
        ) : null}

        {info ? (
          <>
            <Text style={styles.sectionLabel}>Component tree</Text>
            <Text style={styles.mono}>{info}</Text>
          </>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Dismiss</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 24 },
  title: { color: '#F87171', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { color: '#CBD5E1', fontSize: 13, marginBottom: 16 },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
  },
  mono: { color: '#E2E8F0', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  button: {
    marginTop: 24,
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
});
