import { apiFetch } from '@/services/apiClient';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
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
                <View testID="stack-screen-mock">
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
        FontAwesomeIcon: (props: any) => (
            <View testID={`fa-${props.icon?.iconName || 'icon'}`} />
        ),
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
    const { View, Text } = require('react-native');
    return {
        BarChart: (props: any) => (
            <View testID="mock-bar-chart" accessibilityLabel={`max:${props.maxValue}`}>
                <Text>{props.formatYLabel('500')}</Text>
                <Text>{props.formatYLabel('2500')}</Text>
                {props.data.map((item: any, idx: number) => (
                    <View key={idx}>
                        <Text>{`bar:${item.tipo}:${item.value}:${item.spacing}`}</Text>
                        {props.renderTooltip(item)}
                    </View>
                ))}
            </View>
        ),
    };
});

const mockApiFetch = apiFetch as jest.Mock;
const mockRouterPush = router.push as jest.Mock;

const mockResumen = {
    cotizacionesMes: 14,
    ordenesActivas: 7,
    pagosPendientes: 3,
    pagoTotal: 4250.5,
};

const mockFinanzas = {
    balanceTotal: 12800,
    datosGrafica: [
        { label: 'Lun', ingresos: 3000, egresos: 1200 },
        { label: 'Mar', ingresos: 1500, egresos: 4500 },
    ],
};

const mxn = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const spies: jest.SpyInstance[] = [];
const silenciarError = () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    spies.push(spy);
    return spy;
};

const crearDeferred = <T,>() => {
    let resolve!: (valor: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const esperarDashboard = () =>
    waitFor(() => expect(screen.getByText('Finanzas')).toBeTruthy());

describe('CPU-101: DashboardScreen - Pruebas Unitarias', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve(mockFinanzas);
        });
        mockRouterPush.mockReset();
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Muestra el indicador de carga inicial hasta que ambas peticiones resuelven', async () => {
        const dResumen = crearDeferred<any>();
        const dFinanzas = crearDeferred<any>();
        mockApiFetch.mockImplementation((url: string) =>
            url.includes('/resumen') ? dResumen.promise : dFinanzas.promise
        );

        await render(<DashboardScreen />);
        expect(screen.queryByText('Finanzas')).toBeNull();

        await act(async () => {
            dResumen.resolve(mockResumen);
            dFinanzas.resolve(mockFinanzas);
        });
        await esperarDashboard();
    });

    it('2. Renderiza tarjetas, encabezado, eje Y, tooltips y tope de grafica calculado', async () => {
        await render(<DashboardScreen />);
        await esperarDashboard();

        expect(screen.getByTestId(`fa-${faBell.iconName}`)).toBeTruthy();
        expect(screen.getByText('14')).toBeTruthy();
        expect(screen.getByText('7')).toBeTruthy();
        expect(screen.getByText(mxn(4250.5))).toBeTruthy();
        expect(screen.getByText(mxn(12800))).toBeTruthy();
        expect(screen.getByText('Cotizaciones del mes')).toBeTruthy();
        expect(screen.getByText('Órdenes en curso')).toBeTruthy();
        expect(screen.getByText('Total por cobrar')).toBeTruthy();
        expect(screen.getByText('Ver Reportes')).toBeTruthy();

        const chart = screen.getByTestId('mock-bar-chart');
        expect(chart.props.accessibilityLabel).toBe(`max:${4500 * 1.4}`);
        expect(screen.getByText('$500')).toBeTruthy();
        expect(screen.getByText('$3k')).toBeTruthy();
        expect(screen.getByText('bar:Ingresos:3000:2')).toBeTruthy();
        expect(screen.getByText('bar:Egresos:1200:30')).toBeTruthy();
        expect(screen.getAllByText('Ingresos').length).toBe(2);
        expect(screen.getAllByText('Egresos').length).toBe(2);
    });

    it('3. Ajusta el espaciado de egresos a 15 cuando existen mas de 5 puntos en la grafica', async () => {
        const seisPuntos = Array.from({ length: 6 }, (_, i) => ({
            label: `D${i + 1}`,
            ingresos: 1000 * (i + 1),
            egresos: 500,
        }));
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve({ balanceTotal: 21000, datosGrafica: seisPuntos });
        });

        await render(<DashboardScreen />);
        await esperarDashboard();

        expect(screen.getAllByText('bar:Egresos:500:15').length).toBe(6);
    });

    it('4. Aplica topeGrafica igual a 100 con valores en cero y muestra estado vacio sin datos', async () => {
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve({
                balanceTotal: 0,
                datosGrafica: [{ label: 'Lun', ingresos: 0, egresos: 0 }],
            });
        });

        await render(<DashboardScreen />);
        await esperarDashboard();
        expect(screen.getByTestId('mock-bar-chart').props.accessibilityLabel).toBe('max:100');

        await screen.unmount();

        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) return Promise.resolve(mockResumen);
            return Promise.resolve({ balanceTotal: 0, datosGrafica: [] });
        });

        await render(<DashboardScreen />);
        await esperarDashboard();
        expect(screen.getByText('Sin datos para este período')).toBeTruthy();
    });

    it('5. Formatea valores null, undefined y NaN como "$0.00"', async () => {
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) {
                return Promise.resolve({ ...mockResumen, pagoTotal: null });
            }
            return Promise.resolve({ balanceTotal: undefined, datosGrafica: [] });
        });

        await render(<DashboardScreen />);
        await esperarDashboard();
        expect(screen.getAllByText('$0.00').length).toBe(2);

        await screen.unmount();

        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('/resumen')) {
                return Promise.resolve({ ...mockResumen, pagoTotal: 'texto-invalido' });
            }
            return Promise.resolve({ balanceTotal: 'NaN', datosGrafica: [] });
        });

        await render(<DashboardScreen />);
        await esperarDashboard();
        expect(screen.getAllByText('$0.00').length).toBe(2);
    });

    it('6. Navega a la ruta correspondiente al presionar cada una de las 4 tarjetas', async () => {
        await render(<DashboardScreen />);
        await esperarDashboard();

        await fireEvent.press(screen.getByText('Cotizaciones del mes'));
        expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/cotizaciones');

        await fireEvent.press(screen.getByText('Órdenes en curso'));
        expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/ordenes');

        await fireEvent.press(screen.getByText('Total por cobrar'));
        expect(mockRouterPush).toHaveBeenCalledWith({
            pathname: '/(tabs)/ordenes',
            params: { filtro: 'Con Adeudo' },
        });

        await fireEvent.press(screen.getByText('Ver Reportes'));
        expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/estadisticas');
    });

    it('7. Muestra la vista de error ante fallo de servidor y permite reintentar', async () => {
        const errorSpy = silenciarError();
        mockApiFetch.mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce(mockFinanzas);

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