import { render, screen } from '@testing-library/react-native';
import React from 'react';
import LoginScreen from '../app/login';

// 1. MOCK DE EXPO ROUTER
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
    }),
    Stack: {
        Screen: () => null,
    },
}));

// 2. MOCK DE ASYNC STORAGE
// Le damos a Jest la versión "de juguete" que viene incluida en la librería
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Pantalla Login', () => {

    it('debería mostrar los elementos principales de la pantalla', () => {
        render(<LoginScreen />);

        // VALIDAMOS LOS NUEVOS TEXTOS CENTRADOS DEL DISEÑO
        expect(screen.getByText('Bienvenido')).toBeTruthy();
        expect(screen.getByText('Inicia sesión para continuar')).toBeTruthy();
        
        // VALIDAMOS LOS INPUTS Y EL BOTÓN (Estos se mantuvieron igual)
        expect(screen.getByPlaceholderText('Correo Electrónico')).toBeTruthy();
        expect(screen.getByPlaceholderText('Contraseña')).toBeTruthy();
        expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    });

});