import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

type IconColor = React.ComponentProps<typeof IconSymbol>['color'];
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const resolveTabColor = (color: unknown): IconColor =>
  (color ?? '#8E8E93') as IconColor;

function TabIcon({
  sfName,
  webName,
  color,
  size = 24,
}: {
  sfName: React.ComponentProps<typeof IconSymbol>['name'];
  webName: IoniconName;
  color: unknown;
  size?: number;
}) {
  const resolvedColor = resolveTabColor(color);

  if (Platform.OS === 'web') {
    return <Ionicons name={webName} size={size} color={String(resolvedColor)} />;
  }

  return <IconSymbol size={size} name={sfName} color={resolvedColor} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}>

      {/* 1. Pestaña INICIO */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <TabIcon sfName="square.grid.2x2.fill" webName="grid" color={color} />
          ),
        }}
      />

      {/* 2. Pestaña COTIZACIONES */}
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ color }) => (
            <TabIcon sfName="doc.text.fill" webName="document-text" color={color} />
          ),
        }}
      />

      {/* 3. Pestaña ORDENES */}
      <Tabs.Screen
        name="ordenes"
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ color }) => (
            <TabIcon sfName="list.bullet.rectangle.fill" webName="list" color={color} />
          ),
        }}
      />

      {/* 4. Pestaña ESTADÍSTICAS */}
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => (
            <TabIcon sfName="chart.bar.fill" webName="bar-chart" color={color} />
          ),
        }}
      />

      {/* 5. Pestaña PERFIL */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <TabIcon sfName="person.fill" webName="person" color={color} />
          ),
        }}
      />

    </Tabs>
  );
}