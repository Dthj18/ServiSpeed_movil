import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import CotizacionesScreen from '../app/(tabs)/cotizaciones';

// 1. Mocks Globales
// Mock para fetch
global.fetch = jest.fn();

// Mock para expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: jest.fn(() => null),
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock para FontAwesome
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

// Mock para DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const MockDateTimePicker = (props: any) => {
    return React.createElement('DateTimePicker', props);
  };
  return MockDateTimePicker;
});

// Mock para la Gráfica (PieChart) porque Canvas da problemas en tests
jest.mock("react-native-chart-kit", () => ({
  PieChart: () => {
    const { Text } = require("react-native");
    return <Text>Gráfica de Pastel Simulada</Text>;
  },
}));

describe('CotizacionesScreen', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Limpiar mocks antes de cada test
  });

  it('Muestra los datos correctamente cuando la API responde (Happy Path)', async () => {
    // 1. Simulamos una respuesta exitosa del backend
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datosPastel: [
          { categoria: 'Aprobadas', cantidad: 10 },
          { categoria: 'Canceladas', cantidad: 5 },
        ],
        datosRadar: [
          { etiqueta: 'Precio alto', valor: 4 },
          { etiqueta: 'Tiempo de entrega', valor: 2 },
        ],
      }),
    });

    const { getByText, queryByText } = render(<CotizacionesScreen />);

    // 2. Verificamos que cargue los textos clave del NUEVO DISEÑO
    await waitFor(() => {
      // Título de la tarjeta 1
      expect(getByText("Estado General")).toBeTruthy();

      // Título de la tarjeta 2 (CORREGIDO: Antes era "Razones de Rechazo")
      expect(getByText("Motivos de Cancelación")).toBeTruthy();

      // Datos simulados
      expect(getByText("Precio alto")).toBeTruthy();
      expect(getByText("Tiempo de entrega")).toBeTruthy();

      // Total de movimientos (10 + 5)
      expect(getByText(/Total: 15 Movimientos/)).toBeTruthy();
    });
  });

  it('Maneja datos vacíos correctamente', async () => {
    // 1. Simulamos respuesta vacía
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datosPastel: [],
        datosRadar: [],
      }),
    });

    const { getByText } = render(<CotizacionesScreen />);

    // 2. Esperamos los textos de "estado vacío" del NUEVO DISEÑO
    await waitFor(() => {
      expect(getByText("Estado General")).toBeTruthy();

      // Mensaje de vacío en pastel
      expect(getByText("No hay datos en este periodo.")).toBeTruthy();

      // Mensaje de vacío en razones (CORREGIDO: Antes era "No hay cancelaciones...")
      expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
    });
  });

  it('Maneja error de la API correctamente', async () => {
    // 1. Simulamos error 500
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Error de red"));

    // Espiar console.error para que no ensucie la terminal
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

    const { getByText } = render(<CotizacionesScreen />);

    // 2. Aunque falle, la app no debe crashear, debe mostrar estados vacíos
    await waitFor(() => {
      expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
    });

    // Verificamos que se llamó al fetch
    expect(fetch).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('Cambia el filtro de tiempo al presionar los tabs', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ datosPastel: [], datosRadar: [] }),
    });

    const { getByText } = render(<CotizacionesScreen />);

    // Buscamos los botones del nuevo diseño (Segmented Control)
    const btnSemana = getByText("Semana");
    const btnMes = getByText("Mes");



  });

});