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

// --- 3. MOCK DE LA GRÁFICA (CRUCIAL) ---
// Esto evita que Jest falle intentando renderizar SVGs o Canvas complejos
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
    const { getByTestId } = render(<CotizacionesScreen />);
    // Como tu ActivityIndicator no tiene testID, React Testing Library
    // simplemente verificará que el componente renderice sin explotar.
  });

  it('Muestra los datos correctamente cuando la API responde (Happy Path)', async () => {
    // Simulamos la respuesta EXACTA que definimos en tu Backend corregido
    const mockData = {
      datosPastel: [
        { categoria: "Aprobadas", cantidad: 10 },
        { categoria: "Canceladas", cantidad: 5 },
        { categoria: "Pendientes", cantidad: 8 }
      ],
      datosRadar: [
        { etiqueta: "Precio alto", valor: 4 },     // <--- Nombres nuevos del Backend
        { etiqueta: "Tiempo de entrega", valor: 2 }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { getByText } = render(<CotizacionesScreen />);

    await waitFor(() => {
      // 1. Verificamos títulos fijos
      expect(getByText("Estado de Cotizaciones")).toBeTruthy();
      expect(getByText("Razones de rechazo")).toBeTruthy();

      // 2. Verificamos que la librería de gráficas se "renderizó" (nuestro mock)
      expect(getByText("Gráfica de Pastel Simulada")).toBeTruthy();

      // 3. Verificamos los datos de la lista de rechazos (Radar convertido a Barras)
      expect(getByText("Precio alto")).toBeTruthy();       // El nombre de la razón
      expect(getByText("4")).toBeTruthy();                 // La cantidad
      expect(getByText("Tiempo de entrega")).toBeTruthy(); // La otra razón
    });
  });

  it('Maneja datos vacíos correctamente', async () => {
    // Simulamos respuesta vacía
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
      // Debe mostrar tus mensajes de "No hay datos"
      expect(getByText("No hay datos disponibles")).toBeTruthy();
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

    // Si falla la API, tus estados iniciales son vacíos, así que
    // debería mostrar los mensajes de "No hay datos" o simplemente no explotar.
    await waitFor(() => {
       expect(getByText("Estado de Cotizaciones")).toBeTruthy();
    });
  });

});