import { render, screen } from '@testing-library/react-native';
import React from 'react';

import LoginScreen from '../app/login';

jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
    }),
    Stack: {
        Screen: () => null,
    },
}));


describe('Pantalla Login', () => {

    it('debería mostrar los elementos principales de la pantalla', () => {

        render(<LoginScreen />);

        expect(screen.getByText('Login')).toBeTruthy();
        expect(screen.getByPlaceholderText('Correo Electrónico')).toBeTruthy();
        expect(screen.getByPlaceholderText('Contraseña')).toBeTruthy();
        expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    });

});