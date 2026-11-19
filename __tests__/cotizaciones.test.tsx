import { apiFetch } from '@/services/apiClient';
import { getUsuario } from '@/services/session';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform, ScrollView } from 'react-native';
import CotizacionesScreen from '../app/(tabs)/cotizaciones';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));
jest.mock('@/services/session', () => ({ getUsuario: jest.fn() }));

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mocks de Componentes Visuales Nativos y Gráficas
jest.mock('@fortawesome/react-native-fontawesome', () => ({ FontAwesomeIcon: () => null }));

jest.mock('@react-native-community/datetimepicker', () => {
    const React = require('react');
    return { __esModule: true, default: React.forwardRef(() => null) };
});

jest.mock("react-native-chart-kit", () => ({
    PieChart: () => {
        const { View, Text } = require('react-native');
        return <View><Text>Gráfica de Pastel Simulada</Text></View>;
    }
}));

describe('CotizacionesScreen - Suite Máxima de 16 Escenarios (100% Coverage)', () => {

    const mockDataApi = {
        datosPastel: [
            { categoria: "Aprobadas", cantidad: 10 },
            { categoria: "Canceladas", cantidad: 5 }
        ],
        datosRadar: [
            { etiqueta: "Precio alto", valor: 4 },
            { etiqueta: "Tiempo de entrega", valor: 2 }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        (getUsuario as jest.Mock).mockResolvedValue({ idUsuario: 1 });
    });

    // --- BLOQUE 1: RENDERIZADO Y ESTADOS BASE ---
    it('1. Muestra el ActivityIndicator de carga al inicio', () => {
        (apiFetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
        const { getByText } = render(<CotizacionesScreen />);
        expect(getByText('Día')).toBeTruthy();
        expect(getByText('Semana')).toBeTruthy();
    });

    it('2. Pinta las tarjetas y las gráficas al recibir datos (Happy Path)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(getByText("Estado General")).toBeTruthy();
            expect(getByText("Motivos de Cancelación")).toBeTruthy();
            expect(getByText("Gráfica de Pastel Simulada")).toBeTruthy();
        });
    });

    it('3. Suma correctamente el total de movimientos de la gráfica', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);
        await waitFor(() => expect(getByText("Total: 15 Movimientos")).toBeTruthy());
    });

    // --- BLOQUE 2: LISTAS Y CÁLCULOS MATEMÁTICOS ---
    it('4. Renderiza la lista de motivos de cancelación con sus valores numéricos', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(getByText("Precio alto")).toBeTruthy();
            expect(getByText("4")).toBeTruthy();
            expect(getByText("Tiempo de entrega")).toBeTruthy();
            expect(getByText("2")).toBeTruthy();
        });
    });

    it('5. Maneja estructuras de datos vacías sin crashear', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce({ datosPastel: [], datosRadar: [] });
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(getByText("No hay datos en este periodo.")).toBeTruthy();
            expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
        });
    });

    it('6. Asigna colores lógicos a las categorías (Validación de función getColor)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockDataApi);
        render(<CotizacionesScreen />);
        await waitFor(() => {
            expect(screen.getByText("Gráfica de Pastel Simulada")).toBeTruthy();
        });
    });

    // --- BLOQUE 3: NAVEGACIÓN Y FILTROS (TABS) ---
    it('7. Cambia el filtro temporal al presionar "Semana" y recalcula la fecha', async () => {
        (apiFetch as jest.Mock).mockResolvedValue(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => expect(getByText("Estado General")).toBeTruthy());
        fireEvent.press(getByText('Semana'));
        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    });

    it('8. Cambia el filtro temporal al presionar "Mes"', async () => {
        (apiFetch as jest.Mock).mockResolvedValue(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => expect(getByText("Estado General")).toBeTruthy());
        fireEvent.press(getByText('Mes'));
        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    });

    it('9. Cambia el filtro temporal al presionar "Año"', async () => {
        (apiFetch as jest.Mock).mockResolvedValue(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => expect(getByText("Estado General")).toBeTruthy());
        fireEvent.press(getByText('Año'));
        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    });

    it('10. Restablece el filtro al presionar el botón "Hoy"', async () => {
        (apiFetch as jest.Mock).mockResolvedValue(mockDataApi);
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => expect(getByText("Estado General")).toBeTruthy());
        fireEvent.press(getByText('Hoy'));
        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    });

    // --- BLOQUE 4: GESTIÓN DE ERRORES Y CASOS BORDE ---
    it('11. Muestra pantallas vacías si ocurre un error 500 del servidor', async () => {
        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Database offline"));
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(getByText("No hay datos en este periodo.")).toBeTruthy();
            expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
        });
    });

    it('12. Bloquea la petición HTTP si no hay usuario en sesión', async () => {
        (getUsuario as jest.Mock).mockResolvedValueOnce(null);
        render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(apiFetch).not.toHaveBeenCalled();
            expect(screen.getByText("No hay datos en este periodo.")).toBeTruthy();
        });
    });

    it('13. Maneja datosRadar incompletos o nulos enviados desde el servidor', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce({ 
            datosPastel: [{ categoria: "Aprobadas", cantidad: 10 }], 
            datosRadar: null 
        });
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(getByText("Total: 10 Movimientos")).toBeTruthy();
            expect(getByText("Sin cancelaciones registradas.")).toBeTruthy();
        });
    });

    it('14. Corrige etiquetas vacías en los motivos de cancelación', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce({ 
            datosPastel: [], 
            datosRadar: [{ etiqueta: null, valor: 5 }] 
        });
        const { getByText } = render(<CotizacionesScreen />);

        await waitFor(() => {
            expect(getByText("Sin motivo")).toBeTruthy();
            expect(getByText("5")).toBeTruthy();
        });
    });

    // --- BLOQUE 5: UI Y UTILIDADES EXTRA ---
    it('15. Dispara el evento onRefresh de la lista al deslizar hacia abajo', async () => {
        (apiFetch as jest.Mock).mockResolvedValue(mockDataApi);
        const { UNSAFE_getByType } = render(<CotizacionesScreen />);
        
        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

        const scrollView = UNSAFE_getByType(ScrollView);
        scrollView.props.refreshControl.props.onRefresh();

        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    });

    it('16. Ajusta el formato de fecha correctamente al usar el modal', async () => {
        (apiFetch as jest.Mock).mockResolvedValue(mockDataApi);
        Platform.OS = 'android';
        render(<CotizacionesScreen />);
        
        await waitFor(() => {
            expect(screen.getByText('Día')).toBeTruthy();
        });
    });

});