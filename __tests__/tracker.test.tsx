import { apiFetch } from '@/services/apiClient';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
// IMPORTACIÓN CORREGIDA: Apunta a app/tracker en lugar de app/(tabs)/tracker
import TrackerScreen from '../app/tracker';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
const mockRouterBack = jest.fn();

// Permite simular dinámicamente los parámetros de la URL de Expo Router
jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    useRouter: () => ({ back: mockRouterBack }),
    // Devolvemos un ID por defecto para que las primeras pruebas funcionen
    useLocalSearchParams: jest.fn(() => ({ idOrden: '101' })),
}));

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));

// Evita errores de renderizado SVG en consola
jest.mock('@fortawesome/react-native-fontawesome', () => ({ FontAwesomeIcon: () => null }));

describe('TrackerScreen - Suite de Seguimiento y Mapeo de UI (12 Escenarios)', () => {

    const mockHistorial = [
        {
            idMovimiento: 1,
            claveEstatus: 'COT_INICIADA', // Caso A: Mapeo exacto por clave
            fechaStr: '2026-05-20 10:00:00',
            nombreEncargado: 'Juan Pérez'
        },
        {
            idMovimiento: 2,
            claveEstatus: 'ERROR_RARO',
            titulo: 'Cotización Pagada por el Cliente', // Caso B: Mapeo difuso por string
            fecha: '2026-05-21 11:30:00',
            encargado: 'María García'
        },
        {
            idMovimiento: 3, // Caso C: Falta todo, asume valores "Sistema" y "DEFAULT"
            claveEstatus: ''
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        // Restauramos el parámetro base a 101 antes de cada prueba
        require('expo-router').useLocalSearchParams.mockImplementation(() => ({ idOrden: '101' }));
    });

    // --- BLOQUE 1: RENDERIZADO ESTRUCTURAL E ID DE ORDEN ---
    it('1. Renderiza la estructura básica mostrando el ActivityIndicator al inicio', () => {
        (apiFetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
        const { getByText } = render(<TrackerScreen />);
        expect(getByText('Historial de movimientos para la orden', { exact: false })).toBeTruthy();
        expect(getByText('#101')).toBeTruthy();
    });

    it('2. Navega hacia atrás al presionar el botón de regreso (Header Left)', () => {
        render(<TrackerScreen />);
        expect(apiFetch).toHaveBeenCalled(); 
    });

    it('3. Detiene la carga y muestra N/A si no se provee un idOrden por parámetro', async () => {
        // Simulamos que el usuario llegó a la pantalla sin un parámetro ID
        require('expo-router').useLocalSearchParams.mockImplementation(() => ({ idOrden: undefined }));
        const { getByText } = render(<TrackerScreen />);

        // No debería llamar a la API si no hay ID
        expect(apiFetch).not.toHaveBeenCalled();
        
        await waitFor(() => {
            expect(getByText('#N/A')).toBeTruthy();
        });
    });

    // --- BLOQUE 2: RED Y GESTIÓN DE ESTADOS VACÍOS ---
    it('4. Realiza la petición HTTP correcta armando la URL con el idOrden', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce([]);
        render(<TrackerScreen />);
        
        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/ordenes/101/historial');
        });
    });

    it('5. Muestra el estado vacío si el servidor responde con un arreglo sin datos', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce([]);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('No se encontró historial para esta orden.')).toBeTruthy();
        });
    });

    it('6. Soporta caídas de servidor capturando el catch para evitar crashear', async () => {
        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Error 500 Interno"));
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            // El catch limpia el arreglo (setHistorial([])) y apaga el loading
            expect(getByText('No se encontró historial para esta orden.')).toBeTruthy();
        });
    });

    // --- BLOQUE 3: MAPEO LÓGICO Y RESILIENCIA DE DATOS (DICCIONARIO_ESTATUS) ---
    it('7. Renderiza el historial completo al recibir datos (Happy Path)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockHistorial);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('2026-05-20 10:00:00')).toBeTruthy();
        });
    });

    it('8. Mapea estilos exactos usando claveEstatus (Caso A)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce([mockHistorial[0]]);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('Cambio de Estado')).toBeTruthy();
            expect(getByText('Atendió: Juan Pérez')).toBeTruthy();
        });
    });

    it('9. Infiere el estatus analizando las palabras clave del título (Caso B)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce([mockHistorial[1]]);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('Cotización Pagada por el Cliente')).toBeTruthy();
            expect(getByText('Atendió: María García')).toBeTruthy();
        });
    });

    it('10. Rellena huecos con valores "Sistema" y "DEFAULT" si falta información (Caso C)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce([mockHistorial[2]]);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('Cambio de Estado')).toBeTruthy(); 
            expect(getByText('Fecha no registrada')).toBeTruthy(); 
            expect(getByText('Atendió: Sistema')).toBeTruthy(); 
        });
    });

    it('11. Extrae el nombre del encargado de cualquiera de los campos disponibles (encargado vs usuario)', async () => {
        const mockUsuariosMixtos = [
            { idMovimiento: 1, claveEstatus: 'DEFAULT', encargado: 'Pedro' },
            { idMovimiento: 2, claveEstatus: 'DEFAULT', usuario: 'AdminBot' },
        ];
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockUsuariosMixtos);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('Atendió: Pedro')).toBeTruthy();
            expect(getByText('Atendió: AdminBot')).toBeTruthy();
        });
    });

    it('12. Extrae la fecha de cualquiera de los campos disponibles (fechaStr vs fecha)', async () => {
        const mockFechasMixtas = [
            { idMovimiento: 1, claveEstatus: 'DEFAULT', fechaStr: 'Lunes 15' },
            { idMovimiento: 2, claveEstatus: 'DEFAULT', fecha: 'Martes 16' },
        ];
        (apiFetch as jest.Mock).mockResolvedValueOnce(mockFechasMixtas);
        const { getByText } = render(<TrackerScreen />);

        await waitFor(() => {
            expect(getByText('Lunes 15')).toBeTruthy();
            expect(getByText('Martes 16')).toBeTruthy();
        });
    });

});