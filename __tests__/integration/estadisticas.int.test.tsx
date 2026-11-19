import { apiFetch } from '@/services/apiClient';
import { render, screen, waitFor } from '@testing-library/react-native';
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
            <View testID={`fa-${props.icon?.iconName || 'icon'}`} />
        ),
    };
});

const mockApiFetch = apiFetch as jest.Mock;

const mockProductos = [
    { descripcion: 'Playera polo', cantidad: 50 },
    { descripcion: 'Lona 3x2', cantidad: 30 },
];

const mockClientes = [
    { nombre: 'Imprenta Central', totalCompras: '$12,500' },
    { nombre: 'Cafe Cordoba', totalCompras: '$8,100' },
];

const spies: jest.SpyInstance[] = [];
const silenciarError = () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    spies.push(spy);
    return spy;
};

describe('CPI-204: EstadisticasScreen - Pruebas de Integración', () => {
    beforeEach(() => {
        mockApiFetch.mockReset().mockImplementation((url: string) => {
            if (url.includes('top-productos')) return Promise.resolve(mockProductos);
            return Promise.resolve(mockClientes);
        });
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Consulta en paralelo top-productos y top-clientes al enfocar y muestra ambos rankings', async () => {
        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Playera polo')).toBeTruthy();
            expect(screen.getByText('Imprenta Central')).toBeTruthy();
        });

        expect(mockApiFetch).toHaveBeenCalledTimes(2);
        expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/top-productos');
        expect(mockApiFetch).toHaveBeenCalledWith('/api/dashboard/top-clientes');
    });

    it('2. Muestra mejores clientes aunque falle top-productos gracias a Promise.allSettled', async () => {
        const errorSpy = silenciarError();
        const err = new Error('Timeout productos');
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('top-productos')) return Promise.reject(err);
            return Promise.resolve(mockClientes);
        });

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Aún no hay ventas registradas')).toBeTruthy();
            expect(screen.getByText('Imprenta Central')).toBeTruthy();
            expect(screen.getByText('Cafe Cordoba')).toBeTruthy();
        });

        expect(errorSpy).toHaveBeenCalledWith('Error al cargar top productos', err);
    });

    it('3. Muestra top productos aunque falle top-clientes gracias a Promise.allSettled', async () => {
        const errorSpy = silenciarError();
        const err = new Error('Timeout clientes');
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('top-productos')) return Promise.resolve(mockProductos);
            return Promise.reject(err);
        });

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Playera polo')).toBeTruthy();
            expect(screen.getByText('Lona 3x2')).toBeTruthy();
            expect(screen.getByText('Aún no hay clientes con órdenes finalizadas')).toBeTruthy();
        });

        expect(errorSpy).toHaveBeenCalledWith('Error al cargar top clientes', err);
    });

    it('4. Registra ambos errores y muestra ambos estados vacios cuando fallan los dos endpoints', async () => {
        const errorSpy = silenciarError();
        const errProd = new Error('Error 500 productos');
        const errCli = new Error('Error 500 clientes');
        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('top-productos')) return Promise.reject(errProd);
            return Promise.reject(errCli);
        });

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Aún no hay ventas registradas')).toBeTruthy();
            expect(screen.getByText('Aún no hay clientes con órdenes finalizadas')).toBeTruthy();
        });

        expect(errorSpy).toHaveBeenCalledWith('Error al cargar top productos', errProd);
        expect(errorSpy).toHaveBeenCalledWith('Error al cargar top clientes', errCli);
    });

    it('5. Actualiza la informacion al volver a montar la pantalla con datos nuevos del servidor', async () => {
        await render(<EstadisticasScreen />);
        await waitFor(() => expect(screen.getByText('Playera polo')).toBeTruthy());

        await screen.unmount();

        mockApiFetch.mockImplementation((url: string) => {
            if (url.includes('top-productos')) {
                return Promise.resolve([{ descripcion: 'Taza nueva', cantidad: 99 }]);
            }
            return Promise.resolve([{ nombre: 'Cliente Nuevo', totalCompras: '$20,000' }]);
        });

        await render(<EstadisticasScreen />);

        await waitFor(() => {
            expect(screen.getByText('Taza nueva')).toBeTruthy();
            expect(screen.getByText('Cliente Nuevo')).toBeTruthy();
        });
    });
});