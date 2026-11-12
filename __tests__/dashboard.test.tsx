import { apiFetch } from '@/services/apiClient';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import DashboardScreen from '../app/(tabs)/dashboard';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
jest.mock('expo-router', () => {
    const React = require('react');
    return {
        Stack: { Screen: () => null },
        router: { push: jest.fn() },
        // Encapsulamos React adentro del mock para respetar las reglas de Jest y evitar bucles infinitos
        useFocusEffect: jest.fn((cb) => {
            React.useEffect(cb, [cb]);
        }),
    };
});

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));
jest.mock('@fortawesome/react-native-fontawesome', () => ({ FontAwesomeIcon: () => null }));

jest.mock("react-native-gifted-charts", () => ({
    BarChart: () => {
        const { View, Text } = require('react-native');
        return <View><Text>Gráfica Financiera Simulada</Text></View>;
    }
}));

describe('DashboardScreen - Suite Central de Métricas y Flujos (16 Escenarios)', () => {

    const mockResumen = {
        cotizacionesMes: 15,
        ordenesActivas: 8,
        pagosPendientes: 3,
        pagoTotal: 2500.50
    };

    const mockFinanzas = {
        balanceTotal: 5000.75,
        datosGrafica: [
            { label: 'Lun', ingresos: 1000, egresos: 500 },
            { label: 'Mar', ingresos: 2000, egresos: 1500 }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (apiFetch as jest.Mock).mockImplementation(async (url: string) => {
            if (url.includes('/resumen')) return mockResumen;
            if (url.includes('/finanzas')) return mockFinanzas;
            return {};
        });
    });

    // --- BLOQUE 1: RENDERIZADO Y ESTADOS BASE ---
    it('1. Renderiza el ActivityIndicator mientras las promesas se resuelven', () => {
        (apiFetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
        const { UNSAFE_getByType } = render(<DashboardScreen />);
        const { ActivityIndicator } = require('react-native');
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('2. Renderiza la cuadrícula de tarjetas con los datos del resumen', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => {
            expect(getByText('15')).toBeTruthy();
            expect(getByText('8')).toBeTruthy();
            expect(getByText('Cotizaciones del mes')).toBeTruthy();
            expect(getByText('Órdenes en curso')).toBeTruthy();
        });
    });

    // --- BLOQUE 2: LÓGICA DE NEGOCIO Y FORMATO FINANCIERO ---
    it('3. Formatea correctamente el pago total por cobrar a moneda mexicana', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('$2,500.50')).toBeTruthy());
    });

    it('4. Formatea correctamente el balance general de finanzas', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('$5,000.75')).toBeTruthy());
    });

    it('5. Resiste montos nulos y los convierte a $0.00 (formatoMoneda)', async () => {
        (apiFetch as jest.Mock).mockImplementation(async (url: string) => {
            if (url.includes('/resumen')) return { ...mockResumen, pagoTotal: null };
            if (url.includes('/finanzas')) return { ...mockFinanzas, balanceTotal: undefined };
        });

        const { getAllByText } = render(<DashboardScreen />);
        await waitFor(() => {
            expect(getAllByText('$0.00').length).toBeGreaterThanOrEqual(2);
        });
    });

    // --- BLOQUE 3: NAVEGACIÓN Y ENRUTAMIENTO DIRECTO ---
    it('6. Navega a la pantalla de Cotizaciones al presionar la primera tarjeta', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Cotizaciones del mes')).toBeTruthy());
        fireEvent.press(getByText('Cotizaciones del mes'));
        expect(router.push).toHaveBeenCalledWith('/(tabs)/cotizaciones');
    });

    it('7. Navega a la pantalla de Órdenes al presionar la segunda tarjeta', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Órdenes en curso')).toBeTruthy());
        fireEvent.press(getByText('Órdenes en curso'));
        expect(router.push).toHaveBeenCalledWith('/(tabs)/ordenes');
    });

    it('8. Navega a Órdenes aplicando el filtro "Con Adeudo" al presionar la tercera tarjeta', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Total por cobrar')).toBeTruthy());
        fireEvent.press(getByText('Total por cobrar'));
        expect(router.push).toHaveBeenCalledWith({
            pathname: '/(tabs)/ordenes',
            params: { filtro: 'Con Adeudo' }
        });
    });

    it('9. Navega a la pantalla de Estadísticas al presionar la cuarta tarjeta', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Ver Reportes')).toBeTruthy());
        fireEvent.press(getByText('Ver Reportes'));
        expect(router.push).toHaveBeenCalledWith('/(tabs)/estadisticas');
    });

    // --- BLOQUE 4: GESTIÓN DE LA GRÁFICA Y FILTROS TEMPORALES ---
    it('10. Pinta la gráfica si hay datos disponibles', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Gráfica Financiera Simulada')).toBeTruthy());
    });

    it('11. Muestra un estado vacío en la sección de finanzas si no hay datos', async () => {
        (apiFetch as jest.Mock).mockImplementation(async (url: string) => {
            if (url.includes('/finanzas')) return { balanceTotal: 0, datosGrafica: [] };
            return mockResumen;
        });

        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Sin datos para este período')).toBeTruthy());
    });

    it('12. Cambia el filtro de finanzas a "Hoy" y vuelve a consultar la API', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Finanzas')).toBeTruthy());

        (apiFetch as jest.Mock).mockClear();
        fireEvent.press(getByText('Hoy'));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledTimes(2);
            expect(apiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=hoy');
        });
    });

    it('13. Cambia el filtro de finanzas a "Mes" y recarga los datos', async () => {
        const { getByText } = render(<DashboardScreen />);
        await waitFor(() => expect(getByText('Finanzas')).toBeTruthy());

        (apiFetch as jest.Mock).mockClear();
        fireEvent.press(getByText('Mes'));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=mes');
        });
    });

    // --- BLOQUE 5: RECUPERACIÓN DE ERRORES Y REFRESH ---
    it('14. Muestra la pantalla de error si falla la carga inicial', async () => {
        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Error 500"));
        const { getByText } = render(<DashboardScreen />);

        await waitFor(() => {
            expect(getByText('No se pudo cargar la información del dashboard.')).toBeTruthy();
            expect(getByText('Reintentar')).toBeTruthy();
        });
    });

    it('15. Recupera la vista al presionar "Reintentar" luego de un error', async () => {
        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Error 500"));
        const { getByText } = render(<DashboardScreen />);

        await waitFor(() => expect(getByText('Reintentar')).toBeTruthy());

        (apiFetch as jest.Mock).mockImplementation(async (url: string) => {
            if (url.includes('/resumen')) return mockResumen;
            if (url.includes('/finanzas')) return mockFinanzas;
        });

        fireEvent.press(getByText('Reintentar'));
        await waitFor(() => expect(getByText('Cotizaciones del mes')).toBeTruthy());
    });

    it('16. Dispara la actualización de datos mediante Pull-to-Refresh', async () => {
        const { UNSAFE_getByType } = render(<DashboardScreen />);
        await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));

        const scrollView = UNSAFE_getByType(ScrollView);
        (apiFetch as jest.Mock).mockClear();

        scrollView.props.refreshControl.props.onRefresh();

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/dashboard/resumen');
        });
    });

});