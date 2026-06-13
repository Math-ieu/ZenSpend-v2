import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { MotionView } from '../../src/components/motion';
import { Card } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, fontSize, radius } from '../../src/theme';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href };

const ITEMS: Item[] = [
  { icon: 'flag-outline', label: 'Objectifs', href: '/goals' },
  { icon: 'trending-down-outline', label: 'Dettes', href: '/debts' },
  { icon: 'notifications-outline', label: 'Notifications', href: '/notifications' },
  { icon: 'person-outline', label: 'Profil', href: '/profile' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <MotionView index={0}>
          <ScreenHeader title="Plus" subtitle={user?.email} />
        </MotionView>

        <MotionView index={1}>
        <Card style={styles.menuCard}>
          {ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href)}
              style={[styles.row, i < ITEMS.length - 1 && styles.rowBorder]}
            >
              <View style={styles.iconBubble}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}
        </Card>
        </MotionView>

        <MotionView index={2}>
          <Pressable style={styles.logout} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>
        </MotionView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { padding: spacing.lg },
  menuCard: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.foreground },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  logoutText: { color: colors.error, fontSize: fontSize.md, fontWeight: '700' },
});
