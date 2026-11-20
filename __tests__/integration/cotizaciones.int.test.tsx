import { apiFetch } from '@/services/apiClient';
import { getUsuario } from '@/services/session';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
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
const DOMINGO = new Date(2025, 2, 16, 10, 0, 0);
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
    ],
};

const endpoint = (inicio: string, fin: string) =>
    `/api/dashboard/movil/graficas?idUsuario=${ID_USUARIO}&fechaInicio=${inicio}&fechaFin=${fin}`;

const isoLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const fmtDia = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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

const elegirFecha = async (fecha: Date) => {
    await abrirCalendario();
    await fireEvent(screen.getByTestId('mock-date-picker'), 'change', { type: 'set' }, fecha);
};

const obtenerRefreshControl = () => {
    let nodo: any = screen.getByText('Estado General');
    while (nodo && !nodo.props?.refreshControl) nodo = nodo.parent;
    if (!nodo) throw new Error('No se encontró el ScrollView con refreshControl');
    return nodo.props.refreshControl;
};

describe('CPI-202: CotizacionesScreen - Pruebas de Integración', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue(RESPUESTA_VACIA);
        mockGetUsuario.mockReset().mockResolvedValue({ idUsuario: ID_USUARIO });
        setPlatform('ios');
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
        setPlatform(PLATFORM_ORIGINAL);
    });

    it('1. Consulta la API con el usuario en sesión y el rango del día actual', async () => {
        await renderPantalla();

        const hoy = isoLocal(new Date());
        expect(mockApiFetch).toHaveBeenCalledTimes(1);
        expect(mockApiFetch).toHaveBeenCalledWith(endpoint(hoy, hoy));
    });

    const casosPeriodo = [
        {
            nombre: 'Día',
            tab: 'Día',
            fecha: MIERCOLES,
            inicio: '2025-03-12',
            fin: '2025-03-12',
            texto: capitalizar(MIERCOLES.toLocaleDateString('es-ES', { dateStyle: 'full' })),
        },
        {
            nombre: 'Semana (fecha en miércoles)',
            tab: 'Semana',
            fecha: MIERCOLES,
            inicio: '2025-03-10',
            fin: '2025-03-16',
            texto: `Semana: ${fmtDia(new Date(2025, 2, 10))} - ${fmtDia(new Date(2025, 2, 16))}`,
        },
        {
            nombre: 'Semana (fecha en domingo)',
            tab: 'Semana',
            fecha: DOMINGO,
            inicio: '2025-03-10',
            fin: '2025-03-16',
            texto: `Semana: ${fmtDia(new Date(2025, 2, 10))} - ${fmtDia(new Date(2025, 2, 16))}`,
        },
        {
            nombre: 'Mes',
            tab: 'Mes',
            fecha: MIERCOLES,
            inicio: '2025-03-01',
            fin: '2025-03-31',
            texto: capitalizar(
                new Date(2025, 2, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            ),
        },
        {
            nombre: 'Año',
            tab: 'Año',
            fecha: MIERCOLES,
            inicio: '2025-01-01',
            fin: '2025-12-31',
            texto: 'Año 2025',
        },
    ];

    it.each(casosPeriodo)(
        '2. Pestaña $nombre solicita el rango exacto a la API y actualiza el encabezado',
        async (caso) => {
            setPlatform('android');
            await renderPantalla();

            await elegirFecha(caso.fecha);
            if (caso.tab !== 'Día') {
                await fireEvent.press(screen.getByText(caso.tab));
            }

            await waitFor(() =>
                expect(mockApiFetch).toHaveBeenLastCalledWith(endpoint(caso.inicio, caso.fin)),
            );
            expect(screen.getByText(caso.texto)).toBeTruthy();
            await esperarCarga();
        },
    );

    it('3. El botón "Hoy" restablece la fecha actual y vuelve a consultar la API', async () => {
        setPlatform('android');
        await renderPantalla();

        await elegirFecha(MIERCOLES);
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenLastCalledWith(endpoint('2025-03-12', '2025-03-12')),
        );

        await fireEvent.press(screen.getByText('Hoy'));

        const hoy = isoLocal(new Date());
        await waitFor(() => expect(mockApiFetch).toHaveBeenLastCalledWith(endpoint(hoy, hoy)));
        await esperarCarga();
    });

    it('4. En iOS seleccionar una fecha recarga la API y mantiene abierto el Modal', async () => {
        await renderPantalla();

        await elegirFecha(MIERCOLES);

        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenLastCalledWith(endpoint('2025-03-12', '2025-03-12')),
        );
        const picker = screen.getByTestId('mock-date-picker');
        expect(picker.props.value).toEqual(MIERCOLES);
        await esperarCarga();
    });

    it('5. En Android seleccionar una fecha cierra el picker y recarga la API', async () => {
        setPlatform('android');
        await renderPantalla();

        await abrirCalendario();
        await fireEvent(screen.getByTestId('mock-date-picker'), 'change', { type: 'set' }, MIERCOLES);

        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenLastCalledWith(endpoint('2025-03-12', '2025-03-12')),
        );
        await esperarCarga();
    });

    it('6. Pull to refresh vuelve a consultar la API y actualiza los datos en pantalla', async () => {
        mockApiFetch
            .mockResolvedValueOnce(RESPUESTA_COMPLETA)
            .mockResolvedValueOnce({
                datosPastel: [{ categoria: 'Aprobadas', cantidad: 1 }],
                datosRadar: [],
            });

        await renderPantalla();
        expect(screen.getByText('Total: 19 Movimientos')).toBeTruthy();

        await act(async () => {
            obtenerRefreshControl().props.onRefresh();
        });

        await waitFor(() => expect(screen.getByText('Total: 1 Movimientos')).toBeTruthy());
        expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });

    it('7. No continúa la consulta si se desmonta mientras se obtiene el usuario', async () => {
        const usuario = crearDeferred<any>();
        mockGetUsuario.mockReturnValue(usuario.promise);

        await render(<CotizacionesScreen />);
        await screen.unmount();
        await act(async () => {
            usuario.resolve({ idUsuario: ID_USUARIO });
        });

        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('8. Descarta la respuesta si se desmonta mientras espera la API', async () => {
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValue(respuesta.promise);

        await render(<CotizacionesScreen />);
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));
        await screen.unmount();
        await act(async () => {
            respuesta.resolve(RESPUESTA_COMPLETA);
        });

        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    it('9. No registra el error si se desmonta antes de que la API falle', async () => {
        const errorSpy = silenciarConsola('error');
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValue(respuesta.promise);

        await render(<CotizacionesScreen />);
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));
        await screen.unmount();
        await act(async () => {
            respuesta.reject(ERROR_RED);
        });

        expect(errorSpy).not.toHaveBeenCalledWith(ERROR_RED);
    });
});