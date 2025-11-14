import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}>

      {/* 1. Pestaña INICIO (antes era el 'index' default) */}
      <Tabs.Screen
        name="dashboard" // <-- Debes crear el archivo dashboard.tsx
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="square.grid.2x2.fill" color={color} />
          ),
        }}
      />

      {/* 2. Pestaña COTIZACIONES (la que ya tenías) */}
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
        }}
      />
      
      {/* 3. Pestaña ORDENES */}
      <Tabs.Screen
        name="ordenes" // <-- Debes crear el archivo ordenes.tsx
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet.rectangle.fill" color={color} />,
        }}
      />
      
      {/* 4. Pestaña ESTADÍSTICAS */}
      <Tabs.Screen
        name="estadisticas" // <-- Debes crear el archivo estadisticas.tsx
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      
      {/* 5. Pestaña PERFIL */}
      <Tabs.Screen
        name="perfil" // <-- Debes crear el archivo perfil.tsx
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />

    </Tabs>
  );
}