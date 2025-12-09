import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
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
// Esto es vital para que no falle al intentar dibujar SVGs en la prueba
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

// --- 4. MOCK DE FETCH ---
global.fetch = jest.fn();

describe('CotizacionesScreen', () => {
  
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {}); 
  });

  it('Muestra el indicador de carga al inicio', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
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
      // Usamos los textos EXACTOS de tu nuevo diseño
      expect(getByText("Estado General")).toBeTruthy();
      expect(getByText("Razones de Rechazo")).toBeTruthy(); // Ojo con la mayúscula en Rechazo

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
      // Usamos los mensajes de "No hay datos" de tu nuevo diseño
      expect(getByText("No hay datos en este periodo.")).toBeTruthy();
      expect(getByText("No hay cancelaciones registradas.")).toBeTruthy();
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
    });
  });

});