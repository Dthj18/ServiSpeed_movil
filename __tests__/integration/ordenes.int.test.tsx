import { apiFetch } from '@/services/apiClient';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import OrdenesScreen from '../../app/(tabs)/ordenes';

jest.mock('expo-router', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        useRouter: () => ({ push: jest.fn() }),
        Stack: {
            Screen: ({ options }: any) =>
                options?.headerRight ? (
                    <View testID="header-right-container">{options.headerRight()}</View>
                ) : null,
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

jest.mock('@react-native-community/datetimepicker', () => {
    const React = require('react');
    const { View } = require('react-native');
    return (props: any) => <View testID="mock-date-picker" {...props} />;
});

const mockApiFetch = apiFetch as jest.Mock;

const idIcono = (icono: { iconName: string }) => `fa-${icono.iconName}`;

const PLATFORM_ORIGINAL = Platform.OS;
const setPlatform = (os: string) => {
    Object.defineProperty(Platform, 'OS', {
        value: os,
        configurable: true,
        writable: true,
        enumerable: true,
    });
};

const spies: jest.SpyInstance[] = [];
const silenciarConsola = (metodo: 'log' | 'error') => {
    const spy = jest.spyOn(console, metodo).mockImplementation(() => {});
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

const buscarDescendiente = (nodo: any, predicado: (n: any) => boolean): any => {
    if (!nodo || typeof nodo !== 'object') return null;
    if (predicado(nodo)) return nodo;
    const hijos = Array.isArray(nodo.children) ? nodo.children : [];
    for (const hijo of hijos) {
        const encontrado = buscarDescendiente(hijo, predicado);
        if (encontrado) return encontrado;
    }
    return null;
};

const buscarAncestro = (nodo: any, predicado: (n: any) => boolean): any => {
    let actual = nodo;
    while (actual && !predicado(actual)) {
        actual = actual.parent;
    }
    return actual;
};

const abrirCalendario = async () => {
    const header = screen.getByTestId('header-right-container');
    const icono = buscarDescendiente(header, (n) => n.props?.testID === idIcono(faCalendarDays));
    await fireEvent.press(icono);
};

const obtenerScrollView = (textoReferencia: string) => {
    const nodo = buscarAncestro(
        screen.getByText(textoReferencia),
        (n) => Boolean(n.props?.refreshControl)
    );
    if (!nodo) throw new Error('No se encontro el ScrollView del FlatList');
    return nodo;
};

const crearOrden = (id: number, cliente: string) => ({
    idOrden: id,
    nombreCliente: cliente,
    fecha: '2026-11-18',
    productoPrincipal: 'Impresion digital',
    estatus: 'En produccion',
    claveEstatus: 'EN_PROCESO',
    fechaIso: '2026-11-18',
    nombreEncargado: 'Jorge',
    montoTotal: 500,
    montoPagado: 250,
    fechaEntrega: '20 Nov 2026',
    descripcionEstatus: 'Activa',
});

describe('CPI-203: OrdenesScreen - Pruebas de Integración', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue({
            content: [crearOrden(1, 'Cliente Uno')],
            last: false,
        });
        setPlatform('ios');
    });

    afterEach(() => {
        jest.useRealTimers();
        while (spies.length) spies.pop()!.mockRestore();
        setPlatform(PLATFORM_ORIGINAL);
    });

    it('1. Consulta pagina 0 con filtro Todas al montar el componente', async () => {
        await render(<OrdenesScreen />);

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Todas'
            );
            expect(screen.getByText('Cliente Uno')).toBeTruthy();
        });
    });

    it('2. Envia el parametro estado codificado al alternar entre En curso, Listas y Canceladas', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('En curso'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=En%20curso'
            )
        );

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Listas'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Listas'
            )
        );

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Canceladas'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Canceladas'
            )
        );
    });

    it('3. Aplica debounce de 500ms para busqueda e ignora texto con solo espacios', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        jest.useFakeTimers();
        mockApiFetch.mockClear();

        const input = screen.getByPlaceholderText('Buscar por cliente, órden o producto...');
        await fireEvent.changeText(input, '   ');

        await act(async () => {
            jest.advanceTimersByTime(500);
        });
        expect(mockApiFetch).not.toHaveBeenCalled();

        await fireEvent.changeText(input, '  Tarjetas  ');
        expect(mockApiFetch).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        jest.useRealTimers();
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Todas&busqueda=Tarjetas'
            )
        );
    });

    it('4. Carga pagina 1 al final de la lista, bloquea llamadas concurrentes y deduplica por idOrden', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        const paginaUno = crearDeferred<any>();
        mockApiFetch.mockReturnValueOnce(paginaUno.promise);

        const cargaPromesa = fireEvent(obtenerScrollView('Cliente Uno'), 'endReached');
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(2));

        await fireEvent(obtenerScrollView('Cliente Uno'), 'endReached');
        expect(mockApiFetch).toHaveBeenCalledTimes(2);

        await act(async () => {
            paginaUno.resolve({
                content: [crearOrden(1, 'Cliente Uno'), crearOrden(2, 'Cliente Dos')],
            });
        });
        await cargaPromesa;

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenLastCalledWith(
                '/api/ordenes/movil/tarjetas?page=1&size=20&estado=Todas'
            );
            expect(screen.getByText('Cliente Dos')).toBeTruthy();
        });

        mockApiFetch.mockClear();
        await fireEvent(obtenerScrollView('Cliente Uno'), 'endReached');
        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('5. Maneja error al cargar mas ordenes en paginacion y detiene futuras solicitudes', async () => {
        const errorSpy = silenciarConsola('error');
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        mockApiFetch.mockRejectedValueOnce(new Error('Fallo pagina 1'));

        await fireEvent(obtenerScrollView('Cliente Uno'), 'endReached');

        expect(errorSpy).toHaveBeenCalled();

        mockApiFetch.mockClear();
        await fireEvent(obtenerScrollView('Cliente Uno'), 'endReached');
        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('6. Recarga las ordenes mediante Pull-to-Refresh', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        mockApiFetch.mockResolvedValueOnce({
            content: [crearOrden(9, 'Cliente Actualizado')],
            last: true,
        });

        await act(async () => {
            obtenerScrollView('Cliente Uno').props.refreshControl.props.onRefresh();
        });

        await waitFor(() => expect(screen.getByText('Cliente Actualizado')).toBeTruthy());
        expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });

    it('7. Filtra por fecha YYYY-MM-DD en Android, iOS y Web y restablece el filtro', async () => {
        setPlatform('android');
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        mockApiFetch.mockClear();
        await abrirCalendario();
        await fireEvent(
            screen.getByTestId('mock-date-picker'),
            'change',
            { type: 'set' },
            new Date(2026, 10, 5, 12, 0, 0)
        );

        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Todas&fecha=2026-11-05'
            )
        );
        expect(screen.getByText('Filtrando por: 2026-11-05')).toBeTruthy();

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Reestablecer'));
        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Todas'
            )
        );
        expect(screen.queryByText(/Filtrando por:/)).toBeNull();

        await screen.unmount();

        setPlatform('ios');
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        mockApiFetch.mockClear();
        await abrirCalendario();
        await fireEvent(
            screen.getByTestId('mock-date-picker'),
            'change',
            { type: 'set' },
            new Date(2026, 10, 12, 12, 0, 0)
        );

        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Todas&fecha=2026-11-12'
            )
        );

        await screen.unmount();

        setPlatform('web');
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Uno')).toBeTruthy());

        const header = screen.getByTestId('header-right-container');
        const inputWeb = buscarDescendiente(header, (n) => n.type === 'input');
        mockApiFetch.mockClear();

        await act(async () => {
            inputWeb.props.onChange({ target: { value: '2026-11-20' } });
        });

        await waitFor(() =>
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ordenes/movil/tarjetas?page=0&size=20&estado=Todas&fecha=2026-11-20'
            )
        );
    });

    it('8. Captura error de red en carga inicial y muestra estado vacio', async () => {
        const errorSpy = silenciarConsola('error');
        mockApiFetch.mockRejectedValueOnce(new Error('Fallo de red'));

        await render(<OrdenesScreen />);

        await waitFor(() => expect(screen.getByText('No se encontraron órdenes')).toBeTruthy());
        expect(errorSpy).toHaveBeenCalled();
    });

    it('9. Descarta respuesta y error si se desmonta durante una peticion en curso', async () => {
        const errorSpy = silenciarConsola('error');
        const dExito = crearDeferred<any>();
        mockApiFetch.mockReturnValueOnce(dExito.promise);

        await render(<OrdenesScreen />);
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));
        await screen.unmount();

        await act(async () => {
            dExito.resolve({ content: [crearOrden(1, 'Cliente Uno')], last: true });
        });

        const dError = crearDeferred<any>();
        mockApiFetch.mockReturnValueOnce(dError.promise);

        await render(<OrdenesScreen />);
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(2));
        await screen.unmount();

        await act(async () => {
            dError.reject(new Error('Error tras desmontar'));
        });

        expect(errorSpy).not.toHaveBeenCalled();
    });
});