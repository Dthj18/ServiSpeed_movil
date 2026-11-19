import { apiFetch } from '@/services/apiClient';
import { saveSession } from '@/services/session';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Keyboard } from 'react-native';
import LoginScreen from '../../app/login';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockReplace }),
    Stack: {
        Screen: () => null,
    },
}));

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));
jest.mock('@/services/session', () => ({ saveSession: jest.fn() }));

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Ionicons: (props: any) => <View testID={`ion-${props.name}`} />,
    };
});

jest.mock('expo-linear-gradient', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    };
});

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    };
});

const mockApiFetch = apiFetch as jest.Mock;
const mockSaveSession = saveSession as jest.Mock;

const mockRespuestaLogin = {
    token: 'jwt-servispeed-2026',
    idUsuario: 15,
    rol: 'ADMINISTRADOR',
    permisos: ['ORDENES', 'COTIZACIONES', 'REPORTES'],
};

const spies: jest.SpyInstance[] = [];
const espiar = <T extends object, K extends keyof T>(obj: T, metodo: K, impl?: any) => {
    const spy = jest.spyOn(obj, metodo as any);
    if (impl) spy.mockImplementation(impl);
    spies.push(spy);
    return spy;
};

describe('CPI-206: LoginScreen - Pruebas de Integración', () => {
    let alertSpy: jest.SpyInstance;

    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue(mockRespuestaLogin);
        mockSaveSession.mockReset().mockResolvedValue(undefined);
        mockReplace.mockReset();
        alertSpy = espiar(Alert, 'alert', () => {});
        espiar(Keyboard, 'dismiss', () => {});
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Autentica contra /auth/login, persiste la sesion completa y navega al dashboard', async () => {
        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'gerente@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'Pass2026!');
        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith('/auth/login', {
                method: 'POST',
                skipAuth: true,
                body: { email: 'gerente@servispeed.com', password: 'Pass2026!' },
            });
            expect(mockSaveSession).toHaveBeenCalledWith('jwt-servispeed-2026', {
                idUsuario: 15,
                email: 'gerente@servispeed.com',
                rol: 'ADMINISTRADOR',
                permisos: ['ORDENES', 'COTIZACIONES', 'REPORTES'],
            });
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
        });
    });

    it('2. Ejecuta el flujo completo de autenticacion al confirmar desde el teclado (submitEditing)', async () => {
        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'ventas@servispeed.com');
        const passInput = screen.getByPlaceholderText('Contraseña');
        await fireEvent.changeText(passInput, 'Ventas123');
        await fireEvent(passInput, 'submitEditing');

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledTimes(1);
            expect(mockSaveSession).toHaveBeenCalledTimes(1);
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
        });
    });

    it('3. No guarda sesion ni redirige cuando la API rechaza las credenciales', async () => {
        mockApiFetch.mockRejectedValueOnce({ body: { message: 'Credenciales invalidas' } });

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'mal@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'incorrecta');
        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Error de autenticación', 'Credenciales invalidas');
        });
        expect(mockSaveSession).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
        expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    });

    it('4. Captura fallo al persistir la sesion en almacenamiento seguro y evita navegar', async () => {
        mockSaveSession.mockRejectedValueOnce(new Error('Error en SecureStore'));

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'gerente@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'Pass2026!');
        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Error de autenticación',
                'Correo o contraseña incorrectos'
            );
        });
        expect(mockApiFetch).toHaveBeenCalledTimes(1);
        expect(mockSaveSession).toHaveBeenCalledTimes(1);
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('5. Permite recuperarse de un error de red inicial y completar el login en el segundo intento', async () => {
        mockApiFetch
            .mockRejectedValueOnce(new Error('Gateway Timeout'))
            .mockResolvedValueOnce(mockRespuestaLogin);

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'gerente@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'Pass2026!');
        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith(
                'Error de autenticación',
                'Correo o contraseña incorrectos'
            )
        );
        expect(mockReplace).not.toHaveBeenCalled();

        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledTimes(2);
            expect(mockSaveSession).toHaveBeenCalledTimes(1);
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
        });
    });
});