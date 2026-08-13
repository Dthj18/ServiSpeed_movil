import { apiFetch } from '@/services/apiClient';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import OrdenesScreen from '../app/(tabs)/ordenes';

// --- 1. MOCKS GLOBALES ---

// A. Mocks de Navegación
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn() }),
}));

// B. Mocks de Iconos (Para evitar el error rojo de act(...) en consola)
jest.mock('@expo/vector-icons', () => {
  return new Proxy({}, { get: () => 'Icon' });
});
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: '',
}));

// C. Mocks de Componentes Nativos y Almacenamiento
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      return null;
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve('fake-token')),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// D. MOCK CRUCIAL DE APIFETCH (Para evitar el TypeError de mockResolvedValue)
jest.mock('@/services/apiClient', () => ({
  apiFetch: jest.fn(),
}));

// --- 2. PREPARACIÓN DE FECHAS DINÁMICAS ---
const today = new Date();
const year = today.getFullYear();
const month = (today.getMonth() + 1).toString().padStart(2, '0');
const day = today.getDate().toString().padStart(2, '0');
const fechaHoyIso = `${year}-${month}-${day}`; // Ej: "2026-08-12"

describe('OrdenesScreen', () => {

  // Datos de prueba con FECHA DE HOY simulando la paginación del backend
  const mockOrdenes = [
    {
      idOrden: 101,
      nombreCliente: "Cliente Feliz",
      fecha: "Hoy",
      productoPrincipal: "Lona 3x3",
      estatus: "Entregada",
      claveEstatus: "ORD_ENTREGADA",
      fechaIso: fechaHoyIso,
      nombreEncargado: "Juan",
      montoTotal: 500.00,
      fechaEntrega: fechaHoyIso,
      descripcionEstatus: "Entregado al cliente",
      detallesJson: JSON.stringify([{ cantidad: 1, descripcion: "Lona" }])
    },
    {
      idOrden: 102,
      nombreCliente: "Cliente Cancelado",
      fecha: "Hoy",
      productoPrincipal: "Tarjetas",
      estatus: "Cancelada",
      claveEstatus: "ORD_CANCELADA",
      fechaIso: fechaHoyIso,
      nombreEncargado: "Pedro",
      montoTotal: 150.00,
      fechaEntrega: fechaHoyIso,
      descripcionEstatus: "Cancelado por falta de pago",
      detallesJson: JSON.stringify([{ cantidad: 100, descripcion: "Tarjetas" }])
    }
  ];

  beforeEach(() => {
    // Limpiamos el mock de apiFetch antes de cada test para no cruzar datos
    (apiFetch as jest.Mock).mockClear();
    // Silenciar errores de consola molestos durante el test
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('Renderiza la lista de órdenes correctamente (Happy Path)', async () => {
    // Usamos apiFetch devolviendo el objeto con 'content' (Paginación)
    (apiFetch as jest.Mock).mockResolvedValueOnce({
      content: mockOrdenes,
      last: true
    });

    const { getByText } = render(<OrdenesScreen />);

    await waitFor(() => {
      expect(getByText('Cliente Feliz')).toBeTruthy();
      expect(getByText('Cliente Cancelado')).toBeTruthy();
      expect(getByText('Lona 3x3')).toBeTruthy();
    });
  });

  it('Filtra las órdenes al presionar los botones de filtro (Chips)', async () => {
    // Usamos mockResolvedValue (sin Once) para que sobreviva al cambio de filtro
    (apiFetch as jest.Mock).mockResolvedValue({
      content: [
        {
          idOrden: 101,
          nombreCliente: 'Cliente Feliz',
          claveEstatus: 'ORD_ENTREGADA',
          estatus: 'Completado',
          fechaIso: fechaHoyIso,
          productoPrincipal: "Lona",
          montoTotal: 500.00,
          detallesJson: JSON.stringify([{ cantidad: 1, descripcion: "Lona" }])
        }
      ],
      last: true
    });

    const { getByText, queryByText } = render(<OrdenesScreen />);

    // Simula el click en el filtro
    fireEvent.press(getByText('Completadas'));

    await waitFor(() => {
      expect(getByText('Cliente Feliz')).toBeTruthy();
      expect(queryByText('Cliente Cancelado')).toBeNull(); // Verificamos que desapareció
    });
  });

  it('Abre el Modal de detalle al presionar una tarjeta', async () => {
    (apiFetch as jest.Mock).mockResolvedValueOnce({
      content: mockOrdenes,
      last: true
    });

    const { getByText } = render(<OrdenesScreen />);

    await waitFor(() => expect(getByText('Cliente Feliz')).toBeTruthy());

    // Presionamos la tarjeta
    fireEvent.press(getByText('Cliente Feliz'));

    // Verificamos que el modal se abrió buscando una etiqueta única de su interior
    await waitFor(() => {
      expect(getByText('Total de Venta')).toBeTruthy();
    });
  });

  it('Maneja correctamente una respuesta de error del servidor', async () => {
    (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Error de red"));

    const { getByText } = render(<OrdenesScreen />);

    // Verificamos que la pantalla renderice la cabecera sin crashear
    await waitFor(() => {
      expect(getByText('Filtro de Órdenes')).toBeTruthy();
    });
  });

});