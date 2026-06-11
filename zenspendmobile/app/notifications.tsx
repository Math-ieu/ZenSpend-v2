import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card, EmptyState } from '../src/components/ui';
import { useFetch } from '../src/lib/useFetch';
import { notificationsApi } from '../src/api/resources';
import { formatDate } from '../src/lib/format';
import type { NotificationItem } from '../src/types';
import { colors, spacing, fontSize, radius } from '../src/theme';

export default function NotificationsScreen() {
  const { data, loading, error, refetch } = useFetch<NotificationItem[]>(
    () => notificationsApi.list(),
    [],
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const markRead = async (item: NotificationItem) => {
    if (item.is_read) return;
    setBusyId(item.id);
    try {
      await notificationsApi.markRead(item.id);
      await refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
      <View style={styles.content}>
        <ScreenHeader title="Notifications" />
        <FlatList
          data={data || []}
          keyExtractor={(n) => String(n.id)}
          onRefresh={refetch}
          refreshing={loading}
          renderItem={({ item }) => (
            <Pressable onPress={() => markRead(item)} disabled={busyId === item.id}>
              <Card style={[styles.card, !item.is_read && styles.unread]}>
                <View style={styles.row}>
                  <Ionicons
                    name={item.is_read ? 'notifications-outline' : 'notifications'}
                    size={20}
                    color={item.is_read ? colors.muted : colors.primary}
                  />
                  <View style={styles.flex}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                  </View>
                  {!item.is_read ? <View style={styles.dot} /> : null}
                </View>
              </Card>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={!data?.length && styles.emptyWrap}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={error || 'Aucune notification'}
                message={error ? undefined : 'Vous êtes à jour !'}
              />
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, padding: spacing.lg },
  flex: { flex: 1 },
  card: { paddingVertical: spacing.md },
  unread: { borderColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.foreground },
  message: { fontSize: fontSize.sm, color: colors.muted, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.muted, marginTop: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary, marginTop: 4 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
});
