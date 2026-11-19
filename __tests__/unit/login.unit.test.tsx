import { apiFetch } from '@/services/apiClient';
import { saveSession } from '@/services/session';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Animated, Keyboard, Platform } from 'react-native';
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

const PLATFORM_ORIGINAL = Platform.OS;
const setPlatform = (os: string) => {
    Object.defineProperty(Platform, 'OS', {
        value: os,
        configurable: true,
        writable: true,
        enumerable: true,
    });
};

const crearDeferred = <T,>() => {
    let resolve!: (valor: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const spies: jest.SpyInstance[] = [];
const espiar = <T extends object, K extends keyof T>(obj: T, metodo: K, impl?: any) => {
    const spy = jest.spyOn(obj, metodo as any);
    if (impl) spy.mockImplementation(impl);
    spies.push(spy);
    return spy;
};

describe('CPU-106: LoginScreen - Pruebas Unitarias', () => {
    let alertSpy: jest.SpyInstance;
    let dismissSpy: jest.SpyInstance;

    beforeEach(() => {
        mockApiFetch.mockReset();
        mockSaveSession.mockReset();
        mockReplace.mockReset();
        setPlatform('ios');
        alertSpy = espiar(Alert, 'alert', () => {});
        dismissSpy = espiar(Keyboard, 'dismiss', () => {});
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
        setPlatform(PLATFORM_ORIGINAL);
    });

    it('1. Renderiza el formulario completo con titulos, iconos, campos y boton', async () => {
        await render(<LoginScreen />);

        expect(screen.getByText('Bienvenido')).toBeTruthy();
        expect(screen.getByText('Inicia sesión para continuar')).toBeTruthy();
        expect(screen.getByPlaceholderText('Correo Electrónico')).toBeTruthy();
        expect(screen.getByPlaceholderText('Contraseña')).toBeTruthy();
        expect(screen.getByTestId('ion-mail')).toBeTruthy();
        expect(screen.getByTestId('ion-key')).toBeTruthy();
        expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    });

    it.each([
        ['ambos vacios', '', ''],
        ['solo correo', 'usuario@servispeed.com', ''],
        ['solo contrasena', '', 'secreto123'],
    ])('2. Valida campos obligatorios (%s) y evita llamar a la API', async (_caso, correo, clave) => {
        await render(<LoginScreen />);

        if (correo) {
            await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), correo);
        }
        if (clave) {
            await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), clave);
        }

        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        expect(dismissSpy).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Por favor ingresa correo y contraseña');
        expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('3. Oculta el texto del boton mientras carga y lo restaura al finalizar', async () => {
        const respuesta = crearDeferred<any>();
        mockApiFetch.mockReturnValue(respuesta.promise);
        mockSaveSession.mockResolvedValue(undefined);

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'admin@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), '123456');

        const pressPromise = fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => expect(screen.queryByText('Iniciar Sesión')).toBeNull());

        await act(async () => {
            respuesta.resolve({ token: 'tk', idUsuario: 1, rol: 'ADMIN', permisos: [] });
        });
        await pressPromise;

        await waitFor(() => expect(screen.getByText('Iniciar Sesión')).toBeTruthy());
    });

    it('4. Maneja estados de presion en el boton y cierra el teclado al tocar fuera', async () => {
        await render(<LoginScreen />);

        const boton = screen.getByText('Iniciar Sesión');
        await fireEvent(boton, 'pressIn');
        await fireEvent(boton, 'pressOut');

        await fireEvent.press(screen.getByText('Bienvenido'));
        expect(dismissSpy).toHaveBeenCalled();
    });

    it('5. En iOS registra keyboardWillShow/Hide, anima el gradiente y limpia suscripciones', async () => {
        const listeners: Record<string, (e: any) => void> = {};
        const removeSpy = jest.fn();
        const startSpy = jest.fn();

        espiar(Keyboard, 'addListener', (evento: string, cb: (e: any) => void) => {
            listeners[evento] = cb;
            return { remove: removeSpy };
        });
        const timingSpy = espiar(Animated, 'timing', () => ({ start: startSpy }));

        await render(<LoginScreen />);

        expect(listeners.keyboardWillShow).toBeDefined();
        expect(listeners.keyboardWillHide).toBeDefined();

        await act(async () => {
            listeners.keyboardWillShow({ duration: 300 });
            listeners.keyboardWillShow({});
            listeners.keyboardWillHide({ duration: 180 });
            listeners.keyboardWillHide({});
        });

        expect(timingSpy).toHaveBeenNthCalledWith(
            1,
            expect.any(Animated.Value),
            expect.objectContaining({ toValue: 180, duration: 300, useNativeDriver: false })
        );
        expect(timingSpy).toHaveBeenNthCalledWith(
            2,
            expect.any(Animated.Value),
            expect.objectContaining({ toValue: 180, duration: 250, useNativeDriver: false })
        );
        expect(timingSpy).toHaveBeenNthCalledWith(
            3,
            expect.any(Animated.Value),
            expect.objectContaining({ toValue: 440, duration: 180, useNativeDriver: false })
        );
        expect(timingSpy).toHaveBeenNthCalledWith(
            4,
            expect.any(Animated.Value),
            expect.objectContaining({ toValue: 440, duration: 250, useNativeDriver: false })
        );
        expect(startSpy).toHaveBeenCalledTimes(4);

        await screen.unmount();
        expect(removeSpy).toHaveBeenCalledTimes(2);
    });

    it('6. En Android registra keyboardDidShow/Hide y anima el gradiente con duracion fija de 250ms', async () => {
        setPlatform('android');
        const listeners: Record<string, (e: any) => void> = {};
        const removeSpy = jest.fn();
        const startSpy = jest.fn();

        espiar(Keyboard, 'addListener', (evento: string, cb: (e: any) => void) => {
            listeners[evento] = cb;
            return { remove: removeSpy };
        });
        const timingSpy = espiar(Animated, 'timing', () => ({ start: startSpy }));

        await render(<LoginScreen />);

        expect(listeners.keyboardDidShow).toBeDefined();
        expect(listeners.keyboardDidHide).toBeDefined();

        await act(async () => {
            listeners.keyboardDidShow({ duration: 100 });
            listeners.keyboardDidHide({ duration: 100 });
        });

        expect(timingSpy).toHaveBeenNthCalledWith(
            1,
            expect.any(Animated.Value),
            expect.objectContaining({ toValue: 180, duration: 250, useNativeDriver: false })
        );
        expect(timingSpy).toHaveBeenNthCalledWith(
            2,
            expect.any(Animated.Value),
            expect.objectContaining({ toValue: 440, duration: 250, useNativeDriver: false })
        );
        expect(startSpy).toHaveBeenCalledTimes(2);

        await screen.unmount();
        expect(removeSpy).toHaveBeenCalledTimes(2);
    });

    it('7. Muestra el mensaje especifico del servidor cuando existe error.body.message', async () => {
        mockApiFetch.mockRejectedValueOnce({ body: { message: 'Cuenta suspendida' } });

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'user@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'clave');
        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith('Error de autenticación', 'Cuenta suspendida')
        );
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('8. Muestra el mensaje generico cuando el rechazo no incluye body.message', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Sin conexion'));

        await render(<LoginScreen />);

        await fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'user@servispeed.com');
        await fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'clave');
        await fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith(
                'Error de autenticación',
                'Correo o contraseña incorrectos'
            )
        );
        expect(mockReplace).not.toHaveBeenCalled();
    });
});