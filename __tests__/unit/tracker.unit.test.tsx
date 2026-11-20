import { apiFetch } from '@/services/apiClient';
import {
    faBoxOpen,
    faCheckCircle,
    faChevronLeft,
    faCircleInfo,
    faClipboardList,
    faDollarSign,
    faPalette,
    faPaperPlane,
    faPencilAlt,
    faPrint,
    faThumbsDown,
    faThumbsUp,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
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

describe('CPU-107: TrackerScreen - Pruebas Unitarias', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue([]);
        mockUseLocalSearchParams.mockReset().mockReturnValue({ idOrden: '45' });
        mockBack.mockReset();
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Muestra el indicador de carga inicial hasta que se resuelve el historial', async () => {
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValue(respuesta.promise);

        await render(<TrackerScreen />);

        expect(screen.getByText('#45')).toBeTruthy();
        expect(screen.queryByText('No se encontró historial para esta orden.')).toBeNull();

        await act(async () => {
            respuesta.resolve([]);
        });

        await waitFor(() =>
            expect(screen.getByText('No se encontró historial para esta orden.')).toBeTruthy()
        );
    });

    it('2. Muestra #N/A y estado vacio sin consultar la API cuando no llega idOrden', async () => {
        mockUseLocalSearchParams.mockReturnValue({});

        await render(<TrackerScreen />);

        expect(mockApiFetch).not.toHaveBeenCalled();
        expect(screen.getByText('#N/A')).toBeTruthy();
        expect(screen.getByText('No se encontró historial para esta orden.')).toBeTruthy();
    });

    it('3. Resuelve los fallbacks de titulo, fecha, encargado y key en cada movimiento', async () => {
        mockApiFetch.mockResolvedValueOnce([
            {
                idMovimiento: 1,
                claveEstatus: 'COT_INICIADA',
                titulo: 'Titulo Principal',
                fechaStr: '18 Nov 2026',
                nombreEncargado: 'Ana Lopez',
            },
            {
                idMovimiento: 2,
                claveEstatus: 'COT_PAGADA',
                descripcion: 'Solo Descripcion',
                fecha: '19 Nov 2026',
                encargado: 'Carlos Ruiz',
            },
            {
                idMovimiento: 30,
                claveEstatus: 'DIS_APROBADO',
                estatus: 'Solo Estatus',
                usuario: 'Operador Uno',
            },
            {
                idMovimiento: '',
                claveEstatus: 'DESCONOCIDA',
            },
        ]);

        await render(<TrackerScreen />);

        await waitFor(() => expect(screen.getByText('Titulo Principal')).toBeTruthy());

        expect(screen.getByText('18 Nov 2026')).toBeTruthy();
        expect(screen.getByText('Atendió: Ana Lopez')).toBeTruthy();

        expect(screen.getByText('Solo Descripcion')).toBeTruthy();
        expect(screen.getByText('19 Nov 2026')).toBeTruthy();
        expect(screen.getByText('Atendió: Carlos Ruiz')).toBeTruthy();

        expect(screen.getByText('Solo Estatus')).toBeTruthy();
        expect(screen.getAllByText('Fecha no registrada').length).toBe(2);
        expect(screen.getByText('Atendió: Operador Uno')).toBeTruthy();

        expect(screen.getByText('Cambio de Estado')).toBeTruthy();
        expect(screen.getByText('Atendió: Sistema')).toBeTruthy();
        expect(screen.getAllByTestId(idIcono(faUser)).length).toBe(4);
    });

    it('4. Asigna color e icono exacto por clave del diccionario de estatus', async () => {
        const claves = [
            { clave: 'COT_INICIADA', titulo: 'Mov 1', color: '#FFB300', icono: faClipboardList },
            { clave: 'COT_PAGADA', titulo: 'Mov 2', color: '#3A88F6', icono: faDollarSign },
            { clave: 'DIS_INICIO', titulo: 'Mov 3', color: '#8E24AA', icono: faPalette },
            { clave: 'DIS_DESARROLLO', titulo: 'Mov 4', color: '#9C27B0', icono: faPencilAlt },
            { clave: 'DIS_ENVIADO', titulo: 'Mov 5', color: '#5E35B1', icono: faPaperPlane },
            { clave: 'DIS_RECHAZADO', titulo: 'Mov 6', color: '#FE5F5F', icono: faThumbsDown },
            { clave: 'DIS_APROBADO', titulo: 'Mov 7', color: '#4CAF50', icono: faThumbsUp },
            { clave: 'PROD_TALLER', titulo: 'Mov 8', color: '#FF9800', icono: faPrint },
            { clave: 'PROD_LISTA', titulo: 'Mov 9', color: '#009688', icono: faCheckCircle },
            { clave: 'ORD_ENTREGADA', titulo: 'Mov 10', color: '#607D8B', icono: faBoxOpen },
        ];

        mockApiFetch.mockResolvedValueOnce(
            claves.map((c, idx) => ({
                idMovimiento: idx + 1,
                claveEstatus: c.clave,
                titulo: c.titulo,
                fechaStr: '20 Nov 2026',
                nombreEncargado: 'Admin',
            }))
        );

        await render(<TrackerScreen />);
        await waitFor(() => expect(screen.getByText('Mov 1')).toBeTruthy());

        for (const c of claves) {
            expect(screen.getByTestId(idIcono(c.icono))).toBeTruthy();
            expect(screen.getByText(c.titulo).props.style).toEqual(
                expect.arrayContaining([expect.objectContaining({ color: c.color })])
            );
        }
    });

    it.each([
        ['Cotizacion iniciada hoy', '#FFB300', faClipboardList],
        ['Orden pagada completa', '#3A88F6', faDollarSign],
        ['Se registro anticipo', '#3A88F6', faDollarSign],
        ['Ingreso a etapa de diseño', '#8E24AA', faPalette],
        ['Propuesta en desarrollo', '#9C27B0', faPencilAlt],
        ['Boceto enviado al cliente', '#5E35B1', faPaperPlane],
        ['En revisión con cliente', '#5E35B1', faPaperPlane],
        ['Boceto rechazado', '#FE5F5F', faThumbsDown],
        ['Boceto aprobado', '#4CAF50', faThumbsUp],
        ['Paso a taller', '#FF9800', faPrint],
        ['En producción activa', '#FF9800', faPrint],
        ['Orden lista para recoger', '#009688', faCheckCircle],
        ['Impresion terminada', '#009688', faCheckCircle],
        ['Orden entregada', '#607D8B', faBoxOpen],
        ['Evento personalizado', '#9CA3AF', faCircleInfo],
    ])(
        '5. Resuelve estilo por texto cuando la clave no existe en diccionario (%s)',
        async (titulo, colorEsperado, iconoEsperado) => {
            mockApiFetch.mockResolvedValueOnce([
                {
                    idMovimiento: 1,
                    claveEstatus: 'CLAVE_INEXISTENTE',
                    titulo,
                    fechaStr: '20 Nov 2026',
                    nombreEncargado: 'Sistema',
                },
            ]);

            await render(<TrackerScreen />);
            await waitFor(() => expect(screen.getByText(titulo)).toBeTruthy());

            expect(screen.getByTestId(idIcono(iconoEsperado))).toBeTruthy();
            expect(screen.getByText(titulo).props.style).toEqual(
                expect.arrayContaining([expect.objectContaining({ color: colorEsperado })])
            );
        }
    );

    it('6. Ejecuta router.back() al presionar el boton de retroceso del header', async () => {
        await render(<TrackerScreen />);
        await waitFor(() =>
            expect(screen.getByText('No se encontró historial para esta orden.')).toBeTruthy()
        );

        await fireEvent.press(screen.getByTestId(idIcono(faChevronLeft)));

        expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('7. Captura error de red, registra en consola y muestra estado vacio', async () => {
        const errorSpy = silenciarError();
        const err = new Error('Error 500');
        mockApiFetch.mockRejectedValueOnce(err);

        await render(<TrackerScreen />);

        await waitFor(() =>
            expect(screen.getByText('No se encontró historial para esta orden.')).toBeTruthy()
        );
        expect(errorSpy).toHaveBeenCalledWith('Error cargando historial: ', err);
    });
});