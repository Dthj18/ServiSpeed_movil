import { apiFetch } from '@/services/apiClient';
import { faBook, faBox, faBullhorn, faMugHot, faShirt, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import EstadisticasScreen from '../../app/(tabs)/estadisticas';

jest.mock('expo-router', () => {
    const React = require('react');
    return {
        useFocusEffect: (cb: () => void) => {
            React.useEffect(() => {
                cb();
            }, [cb]);
        },
        Stack: {
            Screen: () => null,
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

const mockApiFetch = apiFetch as jest.Mock;

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

const mockProductosCompletos = [
    { descripcion: 'Playera sublimada', cantidad: 1200 },
    { descripcion: 'Camisa polo bordada', cantidad: 350 },
    { descripcion: 'Taza magica', cantidad: 85 },
    { descripcion: 'Termo metalico', cantidad: 60 },
    { descripcion: 'Libro pasta dura', cantidad: 45 },
    { descripcion: 'Cuaderno corporativo', cantidad: 40 },
    { descripcion: 'Lona impresa', cantidad: 25 },
    { descripcion: 'Material publicitario', cantidad: 20 },
    { descripcion: 'Vinil adhesivo', cantidad: 15 },
    { descripcion: 'Articulo generico', cantidad: 10 },
    { descripcion: '', cantidad: 5 },
];

const mockClientesCompletos = [
    { nombre: 'Imprenta Norte', totalCompras: '$15,000' },
    { nombre: 'Cafe Veracruz', totalCompras: '$9,200' },
    { nombre: 'Editorial Sur', totalCompras: '$4,800' },
    { nombre: 'Cliente Cuarto', totalCompras: '$1,000' },
];

const spies: jest.SpyInstance[] = [];
const silenciarError = () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    spies.push(spy);
    return spy;
};

describe('CPU-104: EstadisticasScreen - Pruebas Unitarias', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockImplementation((url: string) => {
            if (url.includes('top-productos')) return Promise.resolve(mockProductosCompletos);
            return Promise.resolve(mockClientesCompletos);
        });
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Muestra los titulos de ambas tarjetas en estado de carga inicial hasta resolver', async () => {
        const dProd = crearDeferred<any>();
        const dCli = crearDeferred<any>();
        mockApiFetch.mockImplementation((url: string) =>
            url.includes('top-productos') ? dProd.promise : dCli.promise
        );

        await render(<EstadisticasScreen />);

        expect(screen.getByText('Productos más solicitados')).toBeTruthy();
        expect(screen.getByText('Mejores clientes')).toBeTruthy();
        expect(screen.queryByText('Aún no hay ventas registradas')).toBeNull();
        expect(screen.queryByText('Aún no hay clientes con órdenes finalizadas')).toBeNull();

        await act(async () => {
            dProd.resolve([]);
            dCli.resolve([]);
        });

        await waitFor(() => {
            expect(screen.getByText('Aún no hay ventas registradas')).toBeTruthy();
            expect(screen.getByText('Aún no hay clientes con órdenes finalizadas')).toBeTruthy();
        });
    });

    it('2. Asigna el icono correspondiente a cada categoria, rota colores y formatea cantidades', async () => {
        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Playera sublimada')).toBeTruthy();
        });

        expect(screen.getByText(Number(1200).toLocaleString('es-MX'))).toBeTruthy();
        expect(screen.getByText('Camisa polo bordada')).toBeTruthy();
        expect(screen.getByText('Taza magica')).toBeTruthy();
        expect(screen.getByText('Termo metalico')).toBeTruthy();
        expect(screen.getByText('Libro pasta dura')).toBeTruthy();
        expect(screen.getByText('Cuaderno corporativo')).toBeTruthy();
        expect(screen.getByText('Lona impresa')).toBeTruthy();
        expect(screen.getByText('Material publicitario')).toBeTruthy();
        expect(screen.getByText('Vinil adhesivo')).toBeTruthy();
        expect(screen.getByText('Articulo generico')).toBeTruthy();

        const shirts = screen.getAllByTestId(idIcono(faShirt));
        expect(shirts).toHaveLength(2);
        expect(shirts[0].props.accessibilityLabel).toBe('#FF5252');
        expect(shirts[1].props.accessibilityLabel).toBe('#FF4081');

        const mugs = screen.getAllByTestId(idIcono(faMugHot));
        expect(mugs).toHaveLength(2);
        expect(mugs[0].props.accessibilityLabel).toBe('#448AFF');
        expect(mugs[1].props.accessibilityLabel).toBe('#D32F2F');

        const books = screen.getAllByTestId(idIcono(faBook));
        expect(books).toHaveLength(2);
        expect(books[0].props.accessibilityLabel).toBe('#FF5252');

        const bullhorns = screen.getAllByTestId(idIcono(faBullhorn));
        expect(bullhorns).toHaveLength(3);

        const boxes = screen.getAllByTestId(idIcono(faBox));
        expect(boxes).toHaveLength(2);
    });

    it('3. Limita mejores clientes a los primeros 3 con trofeos oro, plata y bronce', async () => {
        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Imprenta Norte')).toBeTruthy();
        });

        expect(screen.getByText('$15,000')).toBeTruthy();
        expect(screen.getByText('Cafe Veracruz')).toBeTruthy();
        expect(screen.getByText('$9,200')).toBeTruthy();
        expect(screen.getByText('Editorial Sur')).toBeTruthy();
        expect(screen.getByText('$4,800')).toBeTruthy();
        expect(screen.queryByText('Cliente Cuarto')).toBeNull();

        const trofeos = screen.getAllByTestId(idIcono(faTrophy));
        expect(trofeos).toHaveLength(3);
        expect(trofeos[0].props.accessibilityLabel).toBe('#FFD700');
        expect(trofeos[1].props.accessibilityLabel).toBe('#E0E0E0');
        expect(trofeos[2].props.accessibilityLabel).toBe('#CD7F32');
    });

    it('4. Renderiza correctamente tarjetas con un solo elemento sin divisor inferior', async () => {
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('top-productos')) {
                return Promise.resolve([{ descripcion: 'Lona unica', cantidad: 7 }]);
            }
            return Promise.resolve([{ nombre: 'Unico Cliente', totalCompras: '$500' }]);
        });

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Lona unica')).toBeTruthy();
            expect(screen.getByText('7')).toBeTruthy();
            expect(screen.getByText('Unico Cliente')).toBeTruthy();
            expect(screen.getByText('$500')).toBeTruthy();
        });
    });

    it.each([
        ['arreglos vacios', [], []],
        ['valores null', null, null],
        ['valores undefined', undefined, undefined],
    ])('5. Muestra estados vacios cuando la API responde %s', async (_caso, respProd, respCli) => {
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('top-productos')) return Promise.resolve(respProd);
            return Promise.resolve(respCli);
        });

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Aún no hay ventas registradas')).toBeTruthy();
            expect(screen.getByText('Aún no hay clientes con órdenes finalizadas')).toBeTruthy();
        });
    });

    it('6. Maneja errores en ambos endpoints sin colapsar la interfaz', async () => {
        const errorSpy = silenciarError();
        mockApiFetch.mockRejectedValue(new Error('Fallo total'));

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Aún no hay ventas registradas')).toBeTruthy();
            expect(screen.getByText('Aún no hay clientes con órdenes finalizadas')).toBeTruthy();
        });
        expect(errorSpy).toHaveBeenCalledTimes(2);
    });
});