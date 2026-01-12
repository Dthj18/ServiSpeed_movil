import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import OrdenesScreen from '../app/(tabs)/ordenes'; // ⚠️ Verifica que la ruta sea correcta

// --- 1. MOCKS GLOBALES (Para que no fallen las librerías externas) ---

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      return null;
    }),
  };
});

// Mock de Fetch Global
global.fetch = jest.fn();

// --- 2. PREPARACIÓN DE FECHAS DINÁMICAS ---
// Esto es vital: Calculamos la fecha de HOY para que el filtro de "Mes Actual"
// de tu pantalla no oculte los datos de prueba.
const today = new Date();
const year = today.getFullYear();
const month = (today.getMonth() + 1).toString().padStart(2, '0');
const day = today.getDate().toString().padStart(2, '0');
const fechaHoyIso = `${year}-${month}-${day}`; // Ej: "2026-01-12"

describe('OrdenesScreen', () => {

  // Datos de prueba con FECHA DE HOY
  const mockOrdenes = [
    {
      idOrden: 101,
      nombreCliente: "Cliente Feliz",
      fecha: "Hoy",
      productoPrincipal: "Lona 3x3",
      estatus: "Entregada",
      claveEstatus: "ORD_ENTREGADA",
      fechaIso: fechaHoyIso, // <--- ¡AQUÍ ESTÁ EL TRUCO!
      nombreEncargado: "Juan",
      montoTotal: 500.00,
      fechaEntrega: fechaHoyIso,
      descripcionEstatus: "Entregado al cliente",
      detallesJson: JSON.stringify([{ cantidad: 1, descripcion: "Lona" }]) // JSON válido
    },
    {
      idOrden: 102,
      nombreCliente: "Cliente Cancelado",
      fecha: "Hoy",
      productoPrincipal: "Tarjetas",
      estatus: "Cancelada",
      claveEstatus: "ORD_CANCELADA", // Asegúrate que coincida con tu filtro
      fechaIso: fechaHoyIso, // <--- ¡AQUÍ TAMBIÉN!
      nombreEncargado: "Pedro",
      montoTotal: 150.00,
      fechaEntrega: fechaHoyIso,
      descripcionEstatus: "Cancelado por falta de pago",
      detallesJson: JSON.stringify([{ cantidad: 100, descripcion: "Tarjetas" }])
    }
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    // Silenciar errores de consola molestos durante el test
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('Renderiza la lista de órdenes correctamente (Happy Path)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrdenes,
    });

    const { getByText } = render(<OrdenesScreen />);

    await waitFor(() => {
      // Ahora sí los va a encontrar porque la fecha coincide con el mes actual
      expect(getByText('Cliente Feliz')).toBeTruthy();
      expect(getByText('Cliente Cancelado')).toBeTruthy();
      expect(getByText('Lona 3x3')).toBeTruthy();
    });
  });

  it('Filtra las órdenes al presionar los botones de filtro (Chips)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrdenes,
    });

    const { getByText, queryByText } = render(<OrdenesScreen />);

    // Esperamos a que cargue
    await waitFor(() => expect(getByText('Cliente Feliz')).toBeTruthy());

    // 1. Presionamos el filtro "Completadas"
    const btnCompletadas = getByText('Completadas');
    fireEvent.press(btnCompletadas);

    // 2. Debería mostrar solo la orden entregada
    await waitFor(() => {
      expect(getByText('Cliente Feliz')).toBeTruthy();
      expect(queryByText('Cliente Cancelado')).toBeNull(); // Debe desaparecer
    });

    // 3. Presionamos el filtro "Canceladas"
    const btnCanceladas = getByText('Canceladas');
    fireEvent.press(btnCanceladas);

    // 4. Debería mostrar solo la cancelada
    await waitFor(() => {
      expect(queryByText('Cliente Feliz')).toBeNull(); // Debe desaparecer
      expect(getByText('Cliente Cancelado')).toBeTruthy();
    });
  });

  it('Abre el Modal de detalle al presionar una tarjeta', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrdenes,
    });

    const { getByText } = render(<OrdenesScreen />);

    await waitFor(() => expect(getByText('Cliente Feliz')).toBeTruthy());

    // Presionamos la tarjeta
    fireEvent.press(getByText('Cliente Feliz'));

    // Verificamos algo que solo sale en el modal (según tu código)
    // Asegúrate que tu modal muestre "Total de Venta" o el ID
    await waitFor(() => {
      expect(getByText('Total de Venta')).toBeTruthy();
    });
  });

  it('Maneja correctamente una respuesta de error del servidor', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Error de red"));

    const { getByText } = render(<OrdenesScreen />);

    // Verificamos que la pantalla renderice al menos el título y no explote
    await waitFor(() => {
      expect(getByText('Filtro de Órdenes')).toBeTruthy();
    });
  });

});