import { apiFetch } from '@/services/apiClient';
import { getUsuario } from '@/services/session';
import { faCalendarDays, faChartPie, faListUl } from '@fortawesome/free-solid-svg-icons';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import CotizacionesScreen from '../../app/(tabs)/cotizaciones';

jest.mock('expo-router', () => {
    const React = require('react');
    return {
        useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
        useLocalSearchParams: () => ({ idOrden: '1' }),
        useFocusEffect: (cb: () => void) => {
            React.useEffect(() => { cb(); }, [cb]);
        },
        Stack: {
            Screen: ({ options }: any) => (options?.headerRight ? options.headerRight() : null),
        },
    };
});

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));
jest.mock('@/services/session', () => ({ getUsuario: jest.fn(), saveSession: jest.fn() }));

jest.mock('@fortawesome/react-native-fontawesome', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        FontAwesomeIcon: (props: any) => <View testID={`fa-${props.icon?.iconName || 'icon'}`} />,
    };
});

jest.mock('react-native-chart-kit', () => ({
    PieChart: (props: any) => {
        const React = require('react');
        const { View, Text } = require('react-native');
        return (
            <View testID="mock-pie-chart">
                <Text>Gráfica Pastel Simulada</Text>
                {props.data.map((d: any) => (
                    <Text key={d.name}>{`${d.name}|${d.population}|${d.color}`}</Text>
                ))}
                <Text>{props.chartConfig.color()}</Text>
                <Text>{props.chartConfig.color(0.5)}</Text>
            </View>
        );
    },
}));

jest.mock('@react-native-community/datetimepicker', () => {
    const React = require('react');
    const { View } = require('react-native');
    return (props: any) => <View testID="mock-date-picker" {...props} />;
});

const mockApiFetch = apiFetch as jest.Mock;
const mockGetUsuario = getUsuario as jest.Mock;

const ID_USUARIO = 7;
const ERROR_RED = new Error('sin red');
const MIERCOLES = new Date(2025, 2, 12, 10, 0, 0);
const RESPUESTA_VACIA = { datosPastel: [], datosRadar: [] };

const RESPUESTA_COMPLETA = {
    datosPastel: [
        { categoria: 'Aprobadas', cantidad: 10 },
        { categoria: 'Completado', cantidad: 4 },
        { categoria: 'Canceladas', cantidad: 3 },
        { categoria: 'Pendientes', cantidad: 2 },
    ],
    datosRadar: [
        { etiqueta: 'Precio alto', valor: 5 },
        { valor: 3 },
        { etiqueta: 'Cero explícito', valor: 0 },
        { etiqueta: 'Sin valor' },
    ],
};

const idIcono = (icono: { iconName: string }) => `fa-${icono.iconName}`;

const PLATFORM_ORIGINAL = Platform.OS;
const setPlatform = (os: string) => {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true, writable: true, enumerable: true });
};

const spies: jest.SpyInstance[] = [];
const silenciarConsola = (metodo: 'log' | 'error') => {
    const spy = jest.spyOn(console, metodo).mockImplementation(() => { });
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

const esperarCarga = () =>
    waitFor(() => expect(screen.getByText('Estado General')).toBeTruthy());

const renderPantalla = async () => {
    await render(<CotizacionesScreen />);
    await esperarCarga();
};

const abrirCalendario = async () => {
    await fireEvent.press(screen.getByTestId(idIcono(faCalendarDays)));
};

const buscarModal = (nodo: any) => {
    let actual = nodo;
    while (actual && actual.type !== 'Modal' && typeof actual.props?.onRequestClose !== 'function') {
        actual = actual.parent;
    }
    return actual;
};

describe('CPU-102: CotizacionesScreen - Pruebas Unitarias', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue(RESPUESTA_VACIA);
        mockGetUsuario.mockReset().mockResolvedValue({ idUsuario: ID_USUARIO });
        setPlatform('ios');
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
        setPlatform(PLATFORM_ORIGINAL);
    });

    it('1. Muestra el indicador de carga hasta que responde la API', async () => {
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValue(respuesta.promise);

        await render(<CotizacionesScreen />);

        expect(screen.queryByText('Estado General')).toBeNull();
        expect(screen.getByText('Día')).toBeTruthy();
        expect(screen.getByText('Semana')).toBeTruthy();
        expect(screen.getByText('Mes')).toBeTruthy();
        expect(screen.getByText('Año')).toBeTruthy();
        expect(screen.getByText('Hoy')).toBeTruthy();

        await act(async () => {
            respuesta.resolve(RESPUESTA_COMPLETA);
        });
        await esperarCarga();

        expect(screen.getByText('Motivos de Cancelación')).toBeTruthy();
    });

    it.each([[null], [{}]])(
        '2. Sin idUsuario en sesión (%j) muestra estados vacíos y no llama a la API',
        async (usuario) => {
            const logSpy = silenciarConsola('log');
            mockGetUsuario.mockResolvedValue(usuario);

            await renderPantalla();

            expect(logSpy).toHaveBeenCalledWith('No hay usuario en sesión');
            expect(mockApiFetch).not.toHaveBeenCalled();
            expect(screen.getByText('No hay datos en este periodo.')).toBeTruthy();
            expect(screen.getByText('Sin cancelaciones registradas.')).toBeTruthy();
        },
    );

    it('3. Mapea pastel, colores, chartConfig, total y motivos de cancelación filtrando ceros', async () => {
        mockApiFetch.mockResolvedValue(RESPUESTA_COMPLETA);

        await renderPantalla();

        expect(screen.getByTestId(idIcono(faChartPie))).toBeTruthy();
        expect(screen.getByTestId(idIcono(faListUl))).toBeTruthy();
        expect(screen.getByTestId('mock-pie-chart')).toBeTruthy();
        expect(screen.getByText('Aprobadas|10|#7CCB64')).toBeTruthy();
        expect(screen.getByText('Completado|4|#7CCB64')).toBeTruthy();
        expect(screen.getByText('Canceladas|3|#FE5F5F')).toBeTruthy();
        expect(screen.getByText('Pendientes|2|#3A88F6')).toBeTruthy();
        expect(screen.getByText('rgba(0, 0, 0, 1)')).toBeTruthy();
        expect(screen.getByText('rgba(0, 0, 0, 0.5)')).toBeTruthy();
        expect(screen.getByText('Total: 19 Movimientos')).toBeTruthy();
        expect(screen.queryByText('No hay datos en este periodo.')).toBeNull();
        expect(screen.getByText('Precio alto')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
        expect(screen.getByText('Sin motivo')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.queryByText('Cero explícito')).toBeNull();
        expect(screen.queryByText('Sin valor')).toBeNull();
        expect(screen.queryByText('Sin cancelaciones registradas.')).toBeNull();
    });

    it('4. Con arreglos vacíos muestra ambos estados vacíos', async () => {
        await renderPantalla();

        expect(screen.queryByTestId('mock-pie-chart')).toBeNull();
        expect(screen.getByText('No hay datos en este periodo.')).toBeTruthy();
        expect(screen.getByText('Sin cancelaciones registradas.')).toBeTruthy();
    });

    it.each([
        ['sin datosPastel ni datosRadar', {}],
        ['datosRadar nulo', { datosPastel: [], datosRadar: null }],
        ['datosRadar que no es arreglo', { datosPastel: [], datosRadar: 'invalido' }],
    ])('5. Respuesta inutilizable (%s) muestra estados vacíos', async (_nombre, respuesta) => {
        mockApiFetch.mockResolvedValue(respuesta);

        await renderPantalla();

        expect(screen.getByText('No hay datos en este periodo.')).toBeTruthy();
        expect(screen.getByText('Sin cancelaciones registradas.')).toBeTruthy();
    });

    it('6. Si la API falla registra el error y muestra estados vacíos', async () => {
        const errorSpy = silenciarConsola('error');
        mockApiFetch.mockRejectedValue(ERROR_RED);

        await renderPantalla();

        expect(errorSpy).toHaveBeenCalledWith(ERROR_RED);
        expect(screen.getByText('No hay datos en este periodo.')).toBeTruthy();
        expect(screen.getByText('Sin cancelaciones registradas.')).toBeTruthy();
    });

    it('7. Tocar la pestaña ya activa no dispara una nueva petición', async () => {
        await renderPantalla();
        expect(mockApiFetch).toHaveBeenCalledTimes(1);

        await fireEvent.press(screen.getByText('Día'));

        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    it('8. En iOS el icono abre el Modal y "Listo" lo cierra', async () => {
        await renderPantalla();
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();

        await abrirCalendario();
        expect(screen.getByTestId('mock-date-picker')).toBeTruthy();
        expect(screen.getByText('Listo')).toBeTruthy();

        await fireEvent.press(screen.getByText('Listo'));
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
        expect(screen.queryByText('Listo')).toBeNull();
    });

    it('9. En iOS tocar el overlay y onRequestClose cierran el Modal', async () => {
        await renderPantalla();

        await abrirCalendario();
        await fireEvent.press(screen.getByTestId('mock-date-picker'));
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();

        await abrirCalendario();
        await fireEvent(buscarModal(screen.getByTestId('mock-date-picker')), 'requestClose');
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
    });

    it('10. En iOS ignora eventos que no son "set" o sin fecha', async () => {
        await renderPantalla();
        await abrirCalendario();
        const picker = screen.getByTestId('mock-date-picker');

        await fireEvent(picker, 'change', { type: 'dismissed' }, MIERCOLES);
        await fireEvent(picker, 'change', { type: 'set' }, undefined);

        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    it('11. En Android cancelar el picker lo oculta sin recargar datos', async () => {
        setPlatform('android');
        await renderPantalla();
        await abrirCalendario();
        expect(screen.getByTestId('mock-date-picker')).toBeTruthy();
        expect(screen.queryByText('Listo')).toBeNull();

        await fireEvent(screen.getByTestId('mock-date-picker'), 'change', { type: 'dismissed' });

        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });
});