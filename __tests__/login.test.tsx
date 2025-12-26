import { render, screen } from '@testing-library/react-native';
import React from 'react';
import LoginScreen from '../app/login';

// 1. MOCK DE EXPO ROUTER (Ya lo tenías, ¡bien!)
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
    }),
    Stack: {
        Screen: () => null,
    },
}));

// 2. MOCK DE ASYNC STORAGE (¡ESTO ES LO QUE FALTABA!)
// Le damos a Jest la versión "de juguete" que viene incluida en la librería
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);


describe('Pantalla Login', () => {

    it('debería mostrar los elementos principales de la pantalla', () => {
        render(<LoginScreen />);

        expect(screen.getByText('Login')).toBeTruthy();
        expect(screen.getByPlaceholderText('Correo Electrónico')).toBeTruthy();
        expect(screen.getByPlaceholderText('Contraseña')).toBeTruthy();
        expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    });

});