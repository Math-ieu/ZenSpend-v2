import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, fontSize, radius } from '../src/theme';

const STEPS = [
  {
    icon: 'wallet-outline' as const,
    title: 'Suivez vos comptes',
    text: 'Regroupez tous vos comptes et gardez un œil sur votre solde global.',
  },
  {
    icon: 'pie-chart-outline' as const,
    title: 'Maîtrisez vos budgets',
    text: 'Définissez des budgets par catégorie et évitez les mauvaises surprises.',
  },
  {
    icon: 'flag-outline' as const,
    title: 'Atteignez vos objectifs',
    text: "Fixez des objectifs d'épargne et suivez votre progression.",
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setFinishing(true);
    try {
      await completeOnboarding();
      // The root guard routes to the tabs once onboarding is completed.
    } catch {
      setFinishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconBubble}>
          <Ionicons name={current.icon} size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={isLast ? 'Commencer' : 'Suivant'} onPress={next} loading={finishing} />
        {!isLast ? (
          <Button title="Passer" variant="ghost" onPress={() => setStep(STEPS.length - 1)} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconBubble: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground, textAlign: 'center' },
  text: {
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  footer: { padding: spacing.xl, gap: spacing.sm },
});
