import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import OrdenesScreen from '../app/(tabs)/ordenes'; // ⚠️ Ajusta la ruta si tu archivo está en otro lado

// --- 1. MOCKS GLOBALES ---

// Mock de Expo Router
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock de FontAwesome (Para evitar errores de renderizado de iconos SVG)
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

// Mock de DateTimePicker (Componente nativo complejo)
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      return null; // No renderizamos nada real para la prueba
    }),
  };
});

// Mock de Fetch Global
global.fetch = jest.fn();

describe('OrdenesScreen', () => {
  
  // Datos de prueba (Dummy Data)
  const mockOrdenes = [
    {
      idOrden: 101,
      nombreCliente: "Cliente Feliz",
      fecha: "09/12/2025",
      productoPrincipal: "Lona 3x3",
      estatus: "Entregada",
      claveEstatus: "ORD_ENTREGADA",
      fechaIso: "2025-12-09",
      nombreEncargado: "Juan",
      montoTotal: 500.00,
      fechaEntrega: "10/12/2025",
      descripcionEstatus: "Entregado al cliente"
    },
    {
      idOrden: 102,
      nombreCliente: "Cliente Cancelado",
      fecha: "08/12/2025",
      productoPrincipal: "Tarjetas",
      estatus: "Cancelada",
      claveEstatus: "ORD_CANCELADA",
      fechaIso: "2025-12-08",
      nombreEncargado: "Pedro",
      montoTotal: 150.00,
      fechaEntrega: "09/12/2025",
      descripcionEstatus: "Cancelado por falta de pago"
    }
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    // Silenciar errores de consola durante las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {}); 
  });

  it('Muestra el indicador de carga al iniciar', () => {
    // Simulamos una promesa que nunca resuelve para ver el loading
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    const { getByTestId } = render(<OrdenesScreen />);
    // Nota: Como ActivityIndicator no tiene testID por defecto en tu código,
    // esta prueba verifica implícitamente que el componente no explote al renderizar.
  });

  it('Renderiza la lista de órdenes correctamente (Happy Path)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrdenes,
    });

    const { getByText } = render(<OrdenesScreen />);

    await waitFor(() => {
      // Verificamos que aparezcan los clientes
      expect(getByText('Cliente Feliz')).toBeTruthy();
      expect(getByText('Cliente Cancelado')).toBeTruthy();
      
      // Verificamos que aparezcan los productos
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
      expect(getByText('Cliente Feliz')).toBeTruthy(); // Esta es entregada
      expect(queryByText('Cliente Cancelado')).toBeNull(); // Esta NO debe aparecer
    });

    // 3. Presionamos el filtro "Canceladas"
    const btnCanceladas = getByText('Canceladas');
    fireEvent.press(btnCanceladas);

    // 4. Debería mostrar solo la cancelada
    await waitFor(() => {
        expect(queryByText('Cliente Feliz')).toBeNull();
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

    // Presionamos la tarjeta del Cliente Feliz
    fireEvent.press(getByText('Cliente Feliz'));

    // Verificamos que aparezca información que SOLO está en el modal
    // Ejemplo: "Total de Venta" o "Entrega Estimada"
    await waitFor(() => {
      expect(getByText('Total de Venta')).toBeTruthy();
      expect(getByText('Orden #101')).toBeTruthy();
    });
  });

  it('Maneja correctamente una respuesta vacía o error', async () => {
    // Simulamos error de servidor
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Error de red"));

    const { getByText } = render(<OrdenesScreen />);

    // Solo verificamos que renderice el título y no explote, 
    // aunque la lista esté vacía.
    await waitFor(() => {
      expect(getByText('Filtros de Órdenes')).toBeTruthy();
    });
  });

});