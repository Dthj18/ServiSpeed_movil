import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';

type IconColor = React.ComponentProps<typeof IconSymbol>['color'];

const resolveTabColor = (color: unknown): IconColor =>
  (color ?? '#8E8E93') as IconColor;

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
            <IconSymbol size={28} name="square.grid.2x2.fill" color={resolveTabColor(color)} />
          ),
        }}
      />

      {/* 2. Pestaña COTIZACIONES */}
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="doc.text.fill" color={resolveTabColor(color)} />
          ),
        }}
      />

      {/* 3. Pestaña ORDENES */}
      <Tabs.Screen
        name="ordenes"
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet.rectangle.fill" color={resolveTabColor(color)} />
          ),
        }}
      />

      {/* 4. Pestaña ESTADÍSTICAS */}
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={resolveTabColor(color)} />
          ),
        }}
      />

      {/* 5. Pestaña PERFIL */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={resolveTabColor(color)} />
          ),
        }}
      />

    </Tabs>
  );
}