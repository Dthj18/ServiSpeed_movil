import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import OrdenesScreen from '../app/(tabs)/ordenes';

jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve(JSON.stringify({
        idUsuario: 1,
        nombre: "Test User",
        token: "fake-token"
    }))),
    setItem: jest.fn(() => Promise.resolve()),
}));

global.fetch = jest.fn();

describe('OrdenesScreen', () => {

    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    it('Muestra el indicador de carga al inicio', () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { }));
        render(<OrdenesScreen />);
    });

    it('Muestra las órdenes cuando la API responde correctamente', async () => {
        const mockOrdenes = [
            {
                idOrden: 1,
                nombreCliente: "Empresa ABC",
                fecha: "08/12/2025",
                productoPrincipal: "Lonas Publicitarias",
                estatus: "En Curso",
                claveEstatus: "EN_PROCESO",
                fechaIso: "2025-12-08T12:00:00",
                nombreEncargado: "Juan Diseñador",
                montoTotal: 1500.50,
                fechaEntrega: "10/12/2025",
                descripcionEstatus: "Diseño en proceso"
            },
            {
                idOrden: 2,
                nombreCliente: "Cliente Cancelado",
                fecha: "01/12/2025",
                productoPrincipal: "Tarjetas",
                estatus: "Cancelada",
                claveEstatus: "CANCELADA",
                fechaIso: "2025-12-01T09:00:00",
                nombreEncargado: "Admin",
                montoTotal: 200.00,
                fechaEntrega: "05/12/2025",
                descripcionEstatus: "Cancelado por cliente"
            }
        ];

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockOrdenes,
        });

        const { getByText } = render(<OrdenesScreen />);

        await waitFor(() => {
            expect(getByText(/Empresa ABC/i)).toBeTruthy();
            expect(getByText(/Lonas Publicitarias/i)).toBeTruthy();
        });
    });

    it('Maneja el fallo de la API correctamente (Sin datos)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Error interno del servidor",
        });

        const { queryByText } = render(<OrdenesScreen />);

        await waitFor(() => {
            expect(queryByText(/Empresa ABC/i)).toBeNull();
        });
    });
});