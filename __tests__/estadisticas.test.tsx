import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import EstadisticasScreen from '../app/(tabs)/estadisticas';

// --- 1. MOCKS GLOBALES (Aislamiento) ---
jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    router: { push: jest.fn() },
}));

// Evita errores de renderizado SVG de FontAwesome
jest.mock('@fortawesome/react-native-fontawesome', () => ({
    FontAwesomeIcon: () => null
}));

// Mock simple para la librería de gráficas complejas
jest.mock("react-native-gifted-charts", () => ({
    LineChart: () => {
        const { View, Text } = require('react-native');
        return <View><Text>Gráfica de Líneas Simulada</Text></View>;
    }
}));

describe('EstadisticasScreen - Suite de UI Estática (6 Escenarios)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- BLOQUE 1: RENDERIZADO DE ESTRUCTURA Y TÍTULOS ---
    it('1. Renderiza el título principal de la pantalla de Estadísticas', () => {
        const { getByText } = render(<EstadisticasScreen />);
        expect(getByText('Reportes y Estadísticas')).toBeTruthy();
    });

    // --- BLOQUE 2: TARJETA ROSA (LISTA DE PRODUCTOS Y VALORES) ---
    it('2. Renderiza la lista de productos más solicitados', () => {
        const { getByText } = render(<EstadisticasScreen />);
        
        expect(getByText('Productos más solicitados')).toBeTruthy();
        expect(getByText('Playeras personalizadas')).toBeTruthy();
        expect(getByText('Tazas personalizadas')).toBeTruthy();
        expect(getByText('Publicidad impresa')).toBeTruthy();
        expect(getByText('Libros')).toBeTruthy();
    });

    it('3. Muestra los valores numéricos correctos (Hardcoded) de los productos', () => {
        const { getByText } = render(<EstadisticasScreen />);
        
        // Valores extraídos del maquetado actual
        expect(getByText('345')).toBeTruthy(); // Playeras
        expect(getByText('290')).toBeTruthy(); // Tazas
        expect(getByText('150')).toBeTruthy(); // Publicidad
        expect(getByText('100')).toBeTruthy(); // Libros
    });

    // --- BLOQUE 3: TARJETA AZUL (GRÁFICA Y NAVEGACIÓN) ---
    it('4. Renderiza la sección de "Ventas por periodo" y la gráfica simulada', () => {
        const { getByText } = render(<EstadisticasScreen />);
        
        expect(getByText('Ventas por periodo')).toBeTruthy();
        expect(getByText('Gráfica de Líneas Simulada')).toBeTruthy();
    });

    it('5. Navega a la vista detallada al presionar la tarjeta de la gráfica', () => {
        const { getByText } = render(<EstadisticasScreen />);
        
        // Busca el título que está dentro del TouchableOpacity de la tarjeta azul
        const tarjetaGrafica = getByText('Ventas por periodo');
        fireEvent.press(tarjetaGrafica);

        // Verifica que Expo Router intente abrir la pantalla correspondiente
        expect(router.push).toHaveBeenCalledWith('/ventas-por-periodo');
    });

    // --- BLOQUE 4: TARJETAS AMARILLAS (MÉTRICAS INFERIORES) ---
    it('6. Muestra las métricas de productividad inferiores (Ventas del día y Promedio)', () => {
        const { getByText } = render(<EstadisticasScreen />);
        
        expect(getByText('Métricas de productividad')).toBeTruthy();
        
        // Validamos métrica 1
        expect(getByText('$3500.00')).toBeTruthy();
        expect(getByText('Ventas del día')).toBeTruthy();

        // Validamos métrica 2
        expect(getByText('$250.00')).toBeTruthy();
        expect(getByText('Promedio de compra')).toBeTruthy();
    });

});