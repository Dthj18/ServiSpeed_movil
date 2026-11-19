import { apiFetch } from '@/services/apiClient';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../../app/(tabs)/dashboard';

jest.mock('expo-router', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        router: { push: jest.fn() },
        useFocusEffect: (cb: () => void) => {
            React.useEffect(() => {
                cb();
            }, [cb]);
        },
        Stack: {
            Screen: ({ options }: any) => (
                <View>
                    {options?.headerLeft?.()}
                    {options?.headerRight?.()}
                </View>
            ),
        },
    };
});

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));

jest.mock('@fortawesome/react-native-fontawesome', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        FontAwesomeIcon: () => <View />,
    };
});

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    };
});

jest.mock('react-native-gifted-charts', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        BarChart: () => <View testID="mock-bar-chart" />,
    };
});

const mockApiFetch = apiFetch as jest.Mock;

const mockResumen = {
    cotizacionesMes: 10,
    ordenesActivas: 4,
    pagosPendientes: 2,
    pagoTotal: 1500,
};

const mockFinanzas = {
    balanceTotal: 5000,
    datosGrafica: [{ label: 'Lun', ingresos: 5000, egresos: 1000 }],
};

const spies: jest.SpyInstance[] = [];
const silenciarError = () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    spies.push(spy);
    return spy;
};

const esperarDashboard = () =>
    waitFor(() => expect(screen.getByText('Finanzas')).toBeTruthy());

const obtenerRefreshControl = () => {
    let nodo: any = screen.getByText('Finanzas');
    while (nodo && !nodo.props?.refreshControl) nodo = nodo.parent;
    if (!nodo) throw new Error('No se encontro ScrollView con refreshControl');
    return nodo.props.refreshControl;
};

describe('CPI-201: DashboardScreen - Pruebas de Integración', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve(mockFinanzas);
        });
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Consulta en paralelo resumen y finanzas con filtro semana al enfocar la pantalla', async () => {
        await render(<DashboardScreen />);
        await esperarDashboard();

        expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/resumen');
        expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=semana');
    });

    it('2. Alterna filtros Hoy, Mes y Semana enviando el query param correspondiente', async () => {
        await render(<DashboardScreen />);
        await esperarDashboard();

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Hoy'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=hoy')
        );

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Mes'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=mes')
        );

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Semana'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=semana')
        );
    });

    it('3. Pull to refresh recarga ambos endpoints en paralelo y actualiza los datos mostrados', async () => {
        await render(<DashboardScreen />);
        await esperarDashboard();
        expect(screen.getByText('10')).toBeTruthy();

        mockApiFetch.mockReset().mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve({ ...mockResumen, cotizacionesMes: 25 });
            return Promise.resolve({ ...mockFinanzas, balanceTotal: 9000 });
        });

        await act(async () => {
            await obtenerRefreshControl().props.onRefresh();
        });

        await waitFor(() => expect(screen.getByText('25')).toBeTruthy());
        expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/resumen');
        expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/finanzas/grafica-app?filtro=semana');
    });

    it('4. Ignora el estado de error visual cuando ambos endpoints responden status 401', async () => {
        const errorSpy = silenciarError();
        mockApiFetch.mockRejectedValue({ status: 401 });

        await render(<DashboardScreen />);
        await esperarDashboard();

        expect(errorSpy).toHaveBeenCalledTimes(2);
        expect(screen.queryByText('No se pudo cargar la información del dashboard.')).toBeNull();
    });

    it('5. Activa la vista de error si falla el endpoint de finanzas con 500 y se recupera al reintentar', async () => {
        const errorSpy = silenciarError();
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.reject({ status: 500 });
        });

        await render(<DashboardScreen />);

        await waitFor(() =>
            expect(screen.getByText('No se pudo cargar la información del dashboard.')).toBeTruthy()
        );
        expect(errorSpy).toHaveBeenCalled();

        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve(mockFinanzas);
        });

        await fireEvent.press(screen.getByText('Reintentar'));
        await esperarDashboard();
    });

    it('6. Activa la vista de error si falla el endpoint de resumen con 500 y se recupera al reintentar', async () => {
        const errorSpy = silenciarError();
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.reject({ status: 500 });
            return Promise.resolve(mockFinanzas);
        });

        await render(<DashboardScreen />);

        await waitFor(() =>
            expect(screen.getByText('No se pudo cargar la información del dashboard.')).toBeTruthy()
        );
        expect(errorSpy).toHaveBeenCalled();

        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve(mockFinanzas);
        });

        await fireEvent.press(screen.getByText('Reintentar'));
        await esperarDashboard();
    });
});