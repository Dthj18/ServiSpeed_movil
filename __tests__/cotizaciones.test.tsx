import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
// Asegúrate de que esta ruta sea la correcta hacia tu archivo
import CotizacionesScreen from '../app/(tabs)/cotizaciones';

// --- 1. MOCK DE EXPO ROUTER ---
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn() }),
}));

// --- 2. MOCK DE ASYNC STORAGE ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(JSON.stringify({ idUsuario: 2, nombre: "Admin" }))),
  setItem: jest.fn(() => Promise.resolve()),
}));

// --- 3. MOCK DE LA GRÁFICA ---
// Usamos require dentro para evitar errores de referencia
jest.mock("react-native-chart-kit", () => ({
  PieChart: () => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>Gráfica de Pastel Simulada</Text>
      </View>
    );
  }
}));

// --- 4. MOCK DE ICONOS (FontAwesome) ---
// NECESARIO: Si no mockeas esto, la prueba falla al intentar renderizar el ícono SVG
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

// --- 5. MOCK DE DATETIMEPICKER ---
// NECESARIO: Usamos require('react') dentro para evitar "Invalid variable access: React"
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const MockDateTimePicker = (props: any) => {
    return React.createElement('View', null);
  };
  return MockDateTimePicker;
});

// --- 6. MOCK DE FETCH ---
global.fetch = jest.fn();

describe('CotizacionesScreen', () => {

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('Muestra el indicador de carga al inicio', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { }));
    render(<CotizacionesScreen />);
  });

  it('Muestra los datos correctamente cuando la API responde (Happy Path)', async () => {
    const mockData = {
      datosPastel: [
        { categoria: "Aprobadas", cantidad: 10 },
        { categoria: "Canceladas", cantidad: 5 }
      ],
      datosRadar: [
        { etiqueta: "Precio alto", valor: 4 },
        { etiqueta: "Tiempo de entrega", valor: 2 }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { getByText } = render(<CotizacionesScreen />);

    await waitFor(() => {
      // Títulos principales
      expect(getByText("Estado General")).toBeTruthy();

      // CAMBIO IMPORTANTE: Actualizado al nuevo texto del diseño
      expect(getByText("Motivos de Cancelación")).toBeTruthy();

      // Verificamos el mock de la gráfica
      expect(getByText("Gráfica de Pastel Simulada")).toBeTruthy();

      // Verificamos datos de la lista
      expect(getByText("Precio alto")).toBeTruthy();
      expect(getByText("4")).toBeTruthy();
    });
  });

  it('Maneja datos vacíos correctamente', async () => {
    const mockDataVacia = {
      datosPastel: [],
      datosRadar: []
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataVacia,
    });

    const { getByText } = render(<CotizacionesScreen />);

    await waitFor(() => {
      // Mensajes de estado vacío del NUEVO diseño
      expect(getByText("No hay datos en este periodo.")).toBeTruthy();

      // CAMBIO IMPORTANTE: Actualizado de "No hay cancelaciones..." a "Sin cancelaciones..."
      expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
    });
  });

  it('Maneja error del servidor (500)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { getByText } = render(<CotizacionesScreen />);

    await waitFor(() => {
      // Verificamos que al menos cargue el título principal
      expect(getByText("Estado General")).toBeTruthy();

      // Al fallar, debería mostrar el estado vacío o mensaje por defecto
      expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
    });
  });

});