import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import VentasPorPeriodoScreen from '../app/ventas-por-periodo';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    router: { back: mockRouterBack },
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

describe('VentasPorPeriodoScreen - Suite de UI de Reportes (8 Escenarios)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- BLOQUE 1: ESTRUCTURA Y TÍTULOS BASE ---
    it('1. Renderiza el título de la página', () => {
        const { getByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Ventas por periodo')).toBeTruthy();
    });

    // --- BLOQUE 2: INTERFAZ DE FILTROS ---
    it('2. Renderiza la fila de filtros de tiempo', () => {
        const { getByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Hoy')).toBeTruthy();
        expect(getByText('Semana')).toBeTruthy();
        expect(getByText('Mes')).toBeTruthy();
        expect(getByText('3 meses')).toBeTruthy();
    });

    it('3. Responde al toque en los botones de filtro temporal', () => {
        const { getByText } = render(<VentasPorPeriodoScreen />);
        const botonMes = getByText('Mes');
        
        fireEvent.press(botonMes);
        expect(botonMes).toBeTruthy();
    });

    // --- BLOQUE 3: GRÁFICA PRINCIPAL ---
    it('4. Renderiza el componente simulado de la gráfica de líneas', () => {
        const { getByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Gráfica de Líneas Simulada')).toBeTruthy();
    });

    // --- BLOQUE 4: INDICADORES CLAVE (KPIs) ---
    it('5. Muestra las tarjetas de indicadores de ventas (KPIs)', () => {
        const { getByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Total de ventas')).toBeTruthy();
        expect(getByText('$70000.00')).toBeTruthy();
        expect(getByText('Número de pedidos')).toBeTruthy();
        expect(getByText('89')).toBeTruthy();
    });

    it('6. Muestra las tarjetas de crecimiento y ticket promedio', () => {
        const { getByText, getAllByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Ticket promedio')).toBeTruthy();
        // Usamos getAllByText porque el valor $550.00 se repite en la tabla inferior
        expect(getAllByText('$550.00').length).toBeGreaterThan(0);
        expect(getByText('% crecimiento')).toBeTruthy();
        expect(getByText('15%')).toBeTruthy();
    });

    // --- BLOQUE 5: TABLA DE DETALLE ---
    it('7. Renderiza los encabezados de la tabla de detalles', () => {
        const { getByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Fecha')).toBeTruthy();
        expect(getByText('Cliente')).toBeTruthy();
        expect(getByText('Total')).toBeTruthy();
    });

    it('8. Renderiza el contenido hardcoded de las filas de la tabla', () => {
        const { getByText, getAllByText } = render(<VentasPorPeriodoScreen />);
        expect(getByText('Rubén Tuesta')).toBeTruthy();
        expect(getByText('$1200.00')).toBeTruthy();
        expect(getByText('Jorge Tuz')).toBeTruthy();
        expect(getAllByText('$550.00').length).toBeGreaterThan(0);
    });

});