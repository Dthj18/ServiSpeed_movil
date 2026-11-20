import { apiFetch } from '@/services/apiClient';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import TrackerScreen from '../../app/tracker';

const mockBack = jest.fn();

jest.mock('expo-router', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        useRouter: () => ({ back: mockBack }),
        useLocalSearchParams: jest.fn(),
        Stack: {
            Screen: ({ options }: any) => (
                <View testID="stack-header-left">
                    {options?.headerLeft?.()}
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

const mockApiFetch = apiFetch as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

const idIcono = (icono: { iconName: string }) => `fa-${icono.iconName}`;

const crearDeferred = <T,>() => {
    let resolve!: (valor: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const spies: jest.SpyInstance[] = [];
const silenciarError = () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    spies.push(spy);
    return spy;
};

const mockHistorialOrden88 = [
    {
        idMovimiento: 10,
        claveEstatus: 'COT_PAGADA',
        titulo: 'Anticipo recibido',
        fechaStr: '18 Nov 2026, 09:30 AM',
        nombreEncargado: 'Laura Ventas',
    },
    {
        idMovimiento: 11,
        claveEstatus: 'PROD_TALLER',
        titulo: 'En taller de impresion',
        fechaStr: '19 Nov 2026, 11:00 AM',
        nombreEncargado: 'Supervisor Taller',
    },
];

describe('CPI-207: TrackerScreen - Pruebas de Integración', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue(mockHistorialOrden88);
        mockUseLocalSearchParams.mockReset().mockReturnValue({ idOrden: '88' });
        mockBack.mockReset();
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Lee idOrden de los parametros de ruta, consulta el endpoint y renderiza la linea de tiempo completa', async () => {
        await render(<TrackerScreen />);

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith('/api/ordenes/88/historial');
            expect(screen.getByText('#88')).toBeTruthy();
            expect(screen.getByText('Anticipo recibido')).toBeTruthy();
            expect(screen.getByText('Atendió: Laura Ventas')).toBeTruthy();
            expect(screen.getByText('En taller de impresion')).toBeTruthy();
            expect(screen.getByText('Atendió: Supervisor Taller')).toBeTruthy();
        });
    });

    it('2. Recarga el historial cuando cambia el parametro idOrden en navegacion', async () => {
        const { rerender } = await render(<TrackerScreen />);
        await waitFor(() => expect(screen.getByText('Anticipo recibido')).toBeTruthy());

        mockUseLocalSearchParams.mockReturnValue({ idOrden: '99' });
        mockApiFetch.mockResolvedValueOnce([
            {
                idMovimiento: 20,
                claveEstatus: 'ORD_ENTREGADA',
                titulo: 'Entregada al cliente',
                fechaStr: '20 Nov 2026',
                nombreEncargado: 'Recepcion',
            },
        ]);

        await rerender(<TrackerScreen />);

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith('/api/ordenes/99/historial');
            expect(screen.getByText('#99')).toBeTruthy();
            expect(screen.getByText('Entregada al cliente')).toBeTruthy();
        });
    });

    it('3. Descarta la respuesta si la pantalla se desmonta antes de resolver la API', async () => {
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValueOnce(respuesta.promise);

        await render(<TrackerScreen />);
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));

        await screen.unmount();

        await act(async () => {
            respuesta.resolve(mockHistorialOrden88);
        });

        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    it('4. No registra error en consola si la pantalla se desmonta antes de que la API falle', async () => {
        const errorSpy = silenciarError();
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValueOnce(respuesta.promise);

        await render(<TrackerScreen />);
        await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));

        await screen.unmount();

        await act(async () => {
            respuesta.reject(new Error('Timeout tras salir'));
        });

        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('5. Permite navegar hacia atras despues de consultar y visualizar el historial', async () => {
        await render(<TrackerScreen />);
        await waitFor(() => expect(screen.getByText('En taller de impresion')).toBeTruthy());

        await fireEvent.press(screen.getByTestId(idIcono(faChevronLeft)));

        expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('6. Maneja un rechazo del servicio mostrando estado vacio sin romper la navegacion', async () => {
        const errorSpy = silenciarError();
        mockApiFetch.mockRejectedValueOnce(new Error('Gateway Timeout'));

        await render(<TrackerScreen />);

        await waitFor(() =>
            expect(screen.getByText('No se encontró historial para esta orden.')).toBeTruthy()
        );
        expect(errorSpy).toHaveBeenCalled();

        await fireEvent.press(screen.getByTestId(idIcono(faChevronLeft)));
        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});