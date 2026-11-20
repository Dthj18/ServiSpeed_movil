import { apiFetch } from '@/services/apiClient';
import { faCalendarDays, faTimes } from '@fortawesome/free-solid-svg-icons';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import OrdenesScreen from '../../app/(tabs)/ordenes';

const mockPush = jest.fn();

jest.mock('expo-router', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        useRouter: () => ({ push: mockPush }),
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
            <View
                testID={`fa-${props.icon?.iconName || 'icon'}`}
                accessibilityLabel={props.color}
            />
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

const mxn = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

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

const buscarModal = (nodo: any) =>
    buscarAncestro(nodo, (n) => n.type === 'Modal' || typeof n.props?.onRequestClose === 'function');

const abrirCalendario = async () => {
    const header = screen.getByTestId('header-right-container');
    const icono = buscarDescendiente(header, (n) => n.props?.testID === idIcono(faCalendarDays));
    await fireEvent.press(icono);
};

const mockOrdenesBase = [
    {
        idOrden: 101,
        nombreCliente: 'Imprenta Central',
        fecha: '2026-11-18',
        productoPrincipal: 'Lona 2x1m',
        detallesJson: JSON.stringify([
            { cantidad: 2, descripcion: 'Lona impresa' },
            { cantidad: 1, descripcion: 'Estructura metalica' },
        ]),
        estatus: 'En produccion',
        claveEstatus: 'EN_PROCESO',
        fechaIso: '2026-11-18',
        nombreEncargado: 'Carlos Ruiz',
        montoTotal: 1500,
        montoPagado: 500,
        fechaEntrega: '25 Nov 2026',
        descripcionEstatus: 'En taller',
    },
    {
        idOrden: 102,
        nombreCliente: 'Cafe Cordoba',
        fecha: '',
        productoPrincipal: 'Tarjetas de presentacion',
        detallesJson: '{json-invalido',
        estatus: 'Entregada',
        claveEstatus: 'ENTREGADA',
        fechaIso: '',
        nombreEncargado: 'Ana Lopez',
        montoTotal: 800,
        montoPagado: 800,
        fechaEntrega: 'Por definir',
        descripcionEstatus: 'Finalizada',
    },
    {
        idOrden: 103,
        nombreCliente: 'Cliente Cancelado',
        fecha: 'invalida',
        productoPrincipal: 'Volantes',
        estatus: 'Cancelada',
        claveEstatus: 'CANCELADA',
        fechaIso: 'formato-raro',
        nombreEncargado: 'Luis Perez',
        montoTotal: 400,
        montoPagado: 'invalido' as any,
        fechaEntrega: '10 Xxx 2026',
        descripcionEstatus: 'Cancelada por cliente',
    },
    {
        idOrden: 104,
        nombreCliente: 'Cliente Atrasado',
        fecha: '2026-11-10',
        productoPrincipal: 'Tripticos',
        estatus: 'Atrasada',
        claveEstatus: 'ATRASADA',
        fechaIso: '2026-11-10',
        nombreEncargado: 'Sofia',
        montoTotal: 300,
        montoPagado: 0,
        fechaEntrega: 'Proximamente',
        descripcionEstatus: 'Retraso',
    },
    {
        idOrden: 105,
        nombreCliente: 'Sin Clave',
        fecha: '2026-11-12',
        productoPrincipal: 'Etiquetas',
        estatus: 'Pendiente',
        claveEstatus: '',
        fechaIso: '2026-11-12',
        nombreEncargado: 'Mario',
        montoTotal: 200,
        montoPagado: 0,
        fechaEntrega: '',
        descripcionEstatus: '',
    },
    {
        idOrden: 106,
        nombreCliente: 'Cotizacion Ignorada',
        fecha: '2026-11-18',
        productoPrincipal: 'No debe mostrarse',
        estatus: 'Cotizacion',
        claveEstatus: 'COT_INICIADA',
        fechaIso: '2026-11-18',
        nombreEncargado: 'N/A',
        montoTotal: 100,
        montoPagado: 0,
        fechaEntrega: 'Por definir',
        descripcionEstatus: '',
    },
];

describe('CPU-103: OrdenesScreen - Pruebas Unitarias', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue({ content: mockOrdenesBase, last: true });
        mockPush.mockReset();
        setPlatform('ios');
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
        setPlatform(PLATFORM_ORIGINAL);
    });

    it('1. Muestra indicador de carga inicial hasta que responde la API', async () => {
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValue(respuesta.promise);

        await render(<OrdenesScreen />);

        expect(screen.queryByText('Imprenta Central')).toBeNull();
        expect(screen.getByText('Todas')).toBeTruthy();
        expect(screen.getByText('En curso')).toBeTruthy();
        expect(screen.getByText('Listas')).toBeTruthy();
        expect(screen.getByText('Canceladas')).toBeTruthy();

        await act(async () => {
            respuesta.resolve({ content: mockOrdenesBase, last: true });
        });

        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());
    });

    it('2. Renderiza tarjetas, filtra COT_INICIADA y formatea fechas en espanol', async () => {
        await render(<OrdenesScreen />);

        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        expect(screen.getByText('Noviembre 18')).toBeTruthy();
        expect(screen.getByText('Cafe Cordoba')).toBeTruthy();
        expect(screen.getByText('Sin fecha')).toBeTruthy();
        expect(screen.getByText('Cliente Cancelado')).toBeTruthy();
        expect(screen.getByText('formato-raro')).toBeTruthy();
        expect(screen.getByText('Cliente Atrasado')).toBeTruthy();
        expect(screen.getByText('Sin Clave')).toBeTruthy();
        expect(screen.queryByText('Cotizacion Ignorada')).toBeNull();
    });

    it.each([
        ['arreglo vacio', []],
        ['objeto sin content', {}],
    ])('3. Muestra estado vacio cuando la API devuelve %s', async (_caso, respuesta) => {
        mockApiFetch.mockResolvedValueOnce(respuesta);

        await render(<OrdenesScreen />);

        await waitFor(() => expect(screen.getByText('No se encontraron órdenes')).toBeTruthy());
    });

    it('4. Ignora el toque cuando se presiona el filtro que ya esta activo', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        mockApiFetch.mockClear();
        await fireEvent.press(screen.getByText('Todas'));

        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('5. Abre el modal de detalle con productos JSON, saldo pendiente y navega a /tracker', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        await fireEvent.press(screen.getByText('Imprenta Central'));

        expect(screen.getByText('Orden #101')).toBeTruthy();
        expect(screen.getByText('Productos (2)')).toBeTruthy();
        expect(screen.getByText('Lona impresa')).toBeTruthy();
        expect(screen.getByText('Estructura metalica')).toBeTruthy();
        expect(screen.getByText('Carlos Ruiz')).toBeTruthy();
        expect(screen.getByText(mxn(500))).toBeTruthy();
        expect(screen.getByText('Falta por cobrar')).toBeTruthy();
        expect(screen.getByText(mxn(1000))).toBeTruthy();
        expect(screen.getByText('25 de Noviembre de 2026')).toBeTruthy();
        expect(screen.getByText('$1500.00')).toBeTruthy();

        await fireEvent.press(screen.getByText('Ver Historial de la Orden'));

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/tracker',
            params: { idOrden: 101 },
        });
    });

    it('6. Maneja detallesJson corrupto y oculta "Falta por cobrar" en orden liquidada', async () => {
        const logSpy = silenciarConsola('log');

        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cafe Cordoba')).toBeTruthy());

        await fireEvent.press(screen.getByText('Cafe Cordoba'));

        expect(screen.getByText('Orden #102')).toBeTruthy();
        expect(screen.getByText('Productos (0)')).toBeTruthy();
        expect(screen.getAllByText('Tarjetas de presentacion').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Por definir')).toBeTruthy();
        expect(screen.queryByText('Falta por cobrar')).toBeNull();
        expect(logSpy).toHaveBeenCalled();

        await fireEvent.press(screen.getByText('Cerrar'));
        expect(screen.queryByText('Orden #102')).toBeNull();
    });

    it('7. Renderiza orden cancelada con mes desconocido, montoPagado NaN y fecha libre', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Cliente Cancelado')).toBeTruthy());

        await fireEvent.press(screen.getByText('Cliente Cancelado'));

        expect(screen.getByText('Orden #103')).toBeTruthy();
        expect(screen.getByText('10 de Xxx de 2026')).toBeTruthy();
        expect(screen.getByText('$0.00')).toBeTruthy();
        expect(screen.getByText('$400.00')).toBeTruthy();

        await fireEvent.press(screen.getByTestId(idIcono(faTimes)));
        expect(screen.queryByText('Orden #103')).toBeNull();

        await fireEvent.press(screen.getByText('Cliente Atrasado'));
        expect(screen.getByText('Orden #104')).toBeTruthy();
        expect(screen.getByText('Proximamente')).toBeTruthy();

        await fireEvent(buscarModal(screen.getByText('Orden #104')), 'requestClose');
        expect(screen.queryByText('Orden #104')).toBeNull();
    });

    it('8. Permite escribir en la barra de busqueda y limpiarla con el boton X', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        const input = screen.getByPlaceholderText('Buscar por cliente, órden o producto...');
        await fireEvent.changeText(input, 'Lona');
        expect(screen.getByTestId(idIcono(faTimes))).toBeTruthy();

        await fireEvent.press(screen.getByTestId(idIcono(faTimes)));
        expect(screen.queryByTestId(idIcono(faTimes))).toBeNull();
    });

    it('9. En iOS abre el calendario, valida responder, ignora fecha indefinida y cierra por Listo, overlay y requestClose', async () => {
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        await abrirCalendario();
        const picker = screen.getByTestId('mock-date-picker');
        expect(picker).toBeTruthy();

        const contenedor = buscarAncestro(
            picker,
            (n) => typeof n.props?.onStartShouldSetResponder === 'function'
        );
        expect(contenedor.props.onStartShouldSetResponder()).toBe(true);

        mockApiFetch.mockClear();
        await fireEvent(picker, 'change', { type: 'set' }, undefined);
        expect(mockApiFetch).not.toHaveBeenCalled();

        await fireEvent.press(screen.getByText('Listo'));
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();

        await abrirCalendario();
        await fireEvent.press(screen.getByTestId('mock-date-picker'));
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();

        await abrirCalendario();
        await fireEvent(buscarModal(screen.getByTestId('mock-date-picker')), 'requestClose');
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
    });

    it('10. En Android cierra el selector al cancelar sin disparar nueva peticion', async () => {
        setPlatform('android');
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        mockApiFetch.mockClear();
        await abrirCalendario();
        expect(screen.getByTestId('mock-date-picker')).toBeTruthy();

        await fireEvent(screen.getByTestId('mock-date-picker'), 'change', { type: 'dismissed' }, undefined);
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('11. En Web renderiza el input de fecha en el header e ignora valores vacios', async () => {
        setPlatform('web');
        await render(<OrdenesScreen />);
        await waitFor(() => expect(screen.getByText('Imprenta Central')).toBeTruthy());

        const header = screen.getByTestId('header-right-container');
        const inputWeb = buscarDescendiente(header, (n) => n.type === 'input');
        expect(inputWeb).toBeTruthy();

        mockApiFetch.mockClear();
        await act(async () => {
            inputWeb.props.onChange({ target: { value: '' } });
        });
        expect(mockApiFetch).not.toHaveBeenCalled();
        expect(screen.queryByTestId('mock-date-picker')).toBeNull();
    });
});