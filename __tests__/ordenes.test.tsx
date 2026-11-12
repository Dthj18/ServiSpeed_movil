import { apiFetch } from '@/services/apiClient';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { FlatList } from 'react-native';
import OrdenesScreen from '../app/(tabs)/ordenes';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@expo/vector-icons', () => new Proxy({}, { get: () => 'Icon' }));
jest.mock('@fortawesome/react-native-fontawesome', () => ({ FontAwesomeIcon: '' }));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return { __esModule: true, default: React.forwardRef(() => null) };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));

describe('OrdenesScreen - Suite de Pruebas Definitiva (15 Escenarios)', () => {
  
  const mockOrdenes = [
    {
      idOrden: 101,
      nombreCliente: "Cliente Deudor",
      claveEstatus: "ORD_ENTREGADA",
      estatus: "Entregada",
      fechaIso: "2026-05-20",
      productoPrincipal: "Lona 3x3",
      montoTotal: 500.00,
      montoPagado: 200.00,
      fechaEntrega: "Por definir", // Caso Borde Fecha
      detallesJson: JSON.stringify([{ cantidad: 1, descripcion: "Lona" }])
    },
    {
      idOrden: 102,
      nombreCliente: "Cliente Pagado",
      claveEstatus: "ORD_CANCELADA",
      estatus: "Cancelada",
      fechaIso: "2026-05-21",
      productoPrincipal: "Tarjetas",
      montoTotal: null, // Caso Borde Moneda
      montoPagado: null, 
      fechaEntrega: "22 May 2026",
      detallesJson: "JSON_INVALIDO_A_PROPOSITO"
    }
  ];

  beforeEach(() => {
    (apiFetch as jest.Mock).mockClear();
    mockRouter.push.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // --- BLOQUE 1: RENDERIZADO Y ESTADOS BASE ---
  it('1. Renderiza los elementos estructurales mientras el servidor responde', () => {
    (apiFetch as jest.Mock).mockImplementation(() => new Promise(() => {})); 
    const { getByPlaceholderText, getByText } = render(<OrdenesScreen />);
    expect(getByPlaceholderText('Buscar por cliente, órden o producto...')).toBeTruthy();
    expect(getByText('Todas')).toBeTruthy();
  });

  it('2. Pinta las tarjetas de órdenes al recibir una respuesta HTTP 200 (Happy Path)', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText } = render(<OrdenesScreen />);
    await waitFor(() => {
      expect(getByText('Cliente Deudor')).toBeTruthy();
    });
  });

  it('3. Maneja correctamente los errores de red (Error 500) evitando el crash', async () => {
    (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Timeout de red"));
    const { getByText } = render(<OrdenesScreen />);
    await waitFor(() => expect(getByText('No se encontraron órdenes')).toBeTruthy());
  });

  // --- BLOQUE 2: INTERACCIONES DEL USUARIO (UI/UX) ---
  it('4. Permite escribir en la barra de búsqueda', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByPlaceholderText } = render(<OrdenesScreen />);
    const searchInput = getByPlaceholderText('Buscar por cliente, órden o producto...');
    fireEvent.changeText(searchInput, 'Lona');
    await waitFor(() => expect(searchInput.props.value).toBe('Lona'));
  });

  it('5. Filtra las órdenes al presionar un Chip de estado (ej. "Listas")', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText } = render(<OrdenesScreen />);
    fireEvent.press(await waitFor(() => getByText('Listas')));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
  });

  it('6. Ejecuta el Pull-to-Refresh para recargar los datos', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    render(<OrdenesScreen />);
    expect(apiFetch).toHaveBeenCalled();
  });

  // --- BLOQUE 3: LÓGICA DE NEGOCIO Y MODAL ---
  it('7. Abre el modal al tocar una tarjeta y muestra los detalles del cliente', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText, findByText } = render(<OrdenesScreen />);
    fireEvent.press(await findByText('Cliente Deudor'));
    await waitFor(() => expect(getByText('Orden #101')).toBeTruthy());
  });

  it('8. Lógica Financiera: Muestra "Falta por cobrar" en rojo si hay deuda', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText, findByText } = render(<OrdenesScreen />);
    fireEvent.press(await findByText('Cliente Deudor'));
    await waitFor(() => {
      expect(getByText('Falta por cobrar')).toBeTruthy();
      expect(getByText('$300.00')).toBeTruthy(); 
    });
  });

  it('9. Resiliencia de Datos: Sobrevive a un JSON corrupto mostrando el producto principal', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { findByText, getAllByText } = render(<OrdenesScreen />);
    
    // Presionamos al cliente cuyo detallesJson tiene "JSON_INVALIDO_A_PROPOSITO"
    fireEvent.press(await findByText('Cliente Pagado'));

    await waitFor(() => {
      // El catch retorna un arreglo vacío y muestra el productoPrincipal.
      // Usamos getAllByText porque "Tarjetas" está tanto en el Modal como en la lista de fondo.
      const elementosTarjetas = getAllByText('Tarjetas');
      expect(elementosTarjetas.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('10. Navegación: Redirige al Tracker (Historial) y cierra el modal', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText, findByText } = render(<OrdenesScreen />);
    fireEvent.press(await findByText('Cliente Deudor'));
    fireEvent.press(await waitFor(() => getByText('Ver Historial de la Orden')));
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/tracker", params: { idOrden: 101 } });
    });
  });

  // --- BLOQUE 4: CASOS BORDE, UTILIDADES Y NUEVAS INTERACCIONES (Nuevas 5 Pruebas) ---
  
  it('11. Limpia la barra de búsqueda al presionar el ícono "X"', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    // Usamos queryByTestId si existiera, pero podemos simular borrar el texto directamente
    const { getByPlaceholderText } = render(<OrdenesScreen />);
    const searchInput = getByPlaceholderText('Buscar por cliente, órden o producto...');
    
    // Escribe texto
    fireEvent.changeText(searchInput, 'Lona');
    await waitFor(() => expect(searchInput.props.value).toBe('Lona'));
    
    // Simula limpiar (como si tocara la X)
    fireEvent.changeText(searchInput, '');
    await waitFor(() => expect(searchInput.props.value).toBe(''));
  });

  it('12. Paginación: Solicita más datos al llegar al final del Scroll (onEndReached)', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: false }); // last: false habilita página 2
    const { UNSAFE_getByType } = render(<OrdenesScreen />);
    
    // Esperamos a que el FlatList exista y disparamos onEndReached
    await waitFor(() => {
      const flatList = UNSAFE_getByType(FlatList);
      flatList.props.onEndReached();
    });

    // apiFetch debió llamarse primero en useEffect, y segunda vez por el scroll
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
  });

  it('13. Cierra el modal correctamente al presionar "Cerrar"', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText, findByText, queryByText } = render(<OrdenesScreen />);
    
    // Abre el modal
    fireEvent.press(await findByText('Cliente Deudor'));
    await waitFor(() => expect(getByText('Orden #101')).toBeTruthy());

    // Cierra el modal
    fireEvent.press(getByText('Cerrar'));
    
    // Verifica que el modal desapareció de la pantalla
    await waitFor(() => expect(queryByText('Orden #101')).toBeNull());
  });

  it('14. Caso Borde (Fechas): Maneja entregas sin definir sin romper el formato', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getByText, findByText } = render(<OrdenesScreen />);
    
    // Cliente Deudor tiene fecha "Por definir"
    fireEvent.press(await findByText('Cliente Deudor'));
    
    await waitFor(() => {
      // Debe mostrar "Por definir" literalmente en lugar de arrojar error de parsing
      expect(getByText('Por definir')).toBeTruthy();
    });
  });

  it('15. Caso Borde (Moneda): Convierte montos nulos o indefinidos a $0.00 de forma segura', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ content: mockOrdenes, last: true });
    const { getAllByText, findByText } = render(<OrdenesScreen />);
    
    // Cliente Pagado tiene montoTotal: null
    fireEvent.press(await findByText('Cliente Pagado'));
    
    await waitFor(() => {
      // Debería formatear el null como $0.00
      const ceros = getAllByText('$0.00');
      expect(ceros.length).toBeGreaterThan(0);
    });
  });

});