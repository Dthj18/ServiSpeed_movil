import { apiFetch } from '@/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import PerfilScreen from '../../app/(tabs)/perfil';

const mockReplace = jest.fn();

jest.mock('expo-router', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        useRouter: () => ({ replace: mockReplace }),
        useFocusEffect: (cb: () => void) => {
            React.useEffect(() => {
                cb();
            }, [cb]);
        },
        Stack: {
            Screen: ({ options }: any) => (
                <View testID="stack-header-bg">
                    {options?.headerBackground?.()}
                </View>
            ),
        },
    };
});

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

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
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

const spies: jest.SpyInstance[] = [];
const espiar = <T extends object, K extends keyof T>(obj: T, metodo: K, impl?: any) => {
    const spy = jest.spyOn(obj, metodo as any);
    if (impl) spy.mockImplementation(impl);
    spies.push(spy);
    return spy;
};

const mockUserLocal = {
    idUsuario: 12,
    nombre: 'Operador Local',
    email: 'operador@servispeed.com',
    rol: 'Disenador',
};

describe('CPI-205: PerfilScreen - Pruebas de Integración', () => {
    let alertSpy: jest.SpyInstance;
    let linkingSpy: jest.SpyInstance;

    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue({ nombre: 'Operador Sincronizado' });
        mockGetItem.mockReset().mockResolvedValue(JSON.stringify(mockUserLocal));
        mockRemoveItem.mockReset().mockResolvedValue(undefined);
        mockReplace.mockReset();
        alertSpy = espiar(Alert, 'alert', () => {});
        linkingSpy = espiar(Linking, 'openURL', () => Promise.resolve(true));
    });

    afterEach(() => {
        jest.useRealTimers();
        while (spies.length) spies.pop()!.mockRestore();
    });

    it('1. Lee AsyncStorage al enfocar, consulta /api/usuarios/:id y pinta la tarjeta completa', async () => {
        await render(<PerfilScreen />);

        await waitFor(() => {
            expect(mockGetItem).toHaveBeenCalledWith('userData');
            expect(mockApiFetch).toHaveBeenCalledWith('/api/usuarios/12');
            expect(screen.getByText('Operador Sincronizado')).toBeTruthy();
            expect(screen.getByText('Disenador')).toBeTruthy();
            expect(screen.getByText('operador@servispeed.com')).toBeTruthy();
        });
    });

    it('2. Ejecuta el flujo completo de cambio de contrasena, cierra el modal y limpia los campos', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Operador Sincronizado')).toBeTruthy());

        mockApiFetch.mockResolvedValueOnce({ ok: true });

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        await fireEvent.changeText(inputs[0], 'ClaveVieja1');
        await fireEvent.changeText(inputs[1], 'ClaveNueva2');
        await fireEvent.changeText(inputs[2], 'ClaveNueva2');
        await fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith('/api/usuarios/12/cambiar-password', {
                method: 'PUT',
                body: {
                    passwordActual: 'ClaveVieja1',
                    nuevaPassword: 'ClaveNueva2',
                },
            });
            expect(alertSpy).toHaveBeenCalledWith(
                'Éxito',
                'Tu contraseña ha sido actualizada correctamente'
            );
            expect(screen.queryByText('Actualizar Contraseña')).toBeNull();
        });

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputsLimpios = screen.getAllByPlaceholderText('********');
        expect(inputsLimpios[0].props.value).toBe('');
        expect(inputsLimpios[1].props.value).toBe('');
        expect(inputsLimpios[2].props.value).toBe('');
    });

    it('3. Mantiene el modal abierto tras error 400 del servidor y permite reintentar con exito', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Operador Sincronizado')).toBeTruthy());

        mockApiFetch
            .mockRejectedValueOnce({ status: 400, message: 'Password incorrecta' })
            .mockResolvedValueOnce({ ok: true });

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        await fireEvent.changeText(inputs[0], 'Erronea');
        await fireEvent.changeText(inputs[1], 'Nueva2026');
        await fireEvent.changeText(inputs[2], 'Nueva2026');
        await fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith(
                'Contraseña Incorrecta',
                'La contraseña actual que ingresaste no es la correcta. Inténtalo de nuevo.'
            )
        );
        expect(screen.getByText('Actualizar Contraseña')).toBeTruthy();

        await fireEvent.changeText(screen.getAllByPlaceholderText('********')[0], 'Correcta2026');
        await fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                'Éxito',
                'Tu contraseña ha sido actualizada correctamente'
            );
            expect(screen.queryByText('Actualizar Contraseña')).toBeNull();
        });
    });

    it('4. Completa el cierre de sesion limpiando tokens, mostrando indicador y navegando a /login', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Operador Sincronizado')).toBeTruthy());

        jest.useFakeTimers();

        await fireEvent.press(screen.getByText('Cerrar Sesión'));
        const botones = alertSpy.mock.calls[0][2];
        const botonSalir = botones.find((b: any) => b.text === 'Salir');

        await act(async () => {
            await botonSalir.onPress();
        });

        expect(mockRemoveItem).toHaveBeenCalledWith('userToken');
        expect(mockRemoveItem).toHaveBeenCalledWith('userData');
        expect(screen.queryByText('Cerrar Sesión')).toBeNull();
        expect(mockReplace).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockReplace).toHaveBeenCalledWith('/login');
        expect(screen.getByText('Cerrar Sesión')).toBeTruthy();
    });

    it('5. Construye el correo de soporte con el nombre sincronizado y rol del usuario actual', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Operador Sincronizado')).toBeTruthy());

        await fireEvent.press(screen.getByText('Ayuda y Soporte'));

        expect(linkingSpy).toHaveBeenCalledTimes(1);
        const urlEnviada = linkingSpy.mock.calls[0][0];
        expect(urlEnviada).toContain(encodeURIComponent('Nombre: Operador Sincronizado'));
        expect(urlEnviada).toContain(encodeURIComponent('Rol: Disenador'));
    });

    it('6. Recupera los datos de sesion en modo sin conexion cuando falla el backend de usuarios', async () => {
        const errorSpy = espiar(console, 'error', () => {});
        mockApiFetch.mockRejectedValueOnce(new Error('Network Error'));

        await render(<PerfilScreen />);

        await waitFor(() => {
            expect(screen.getByText('Operador Local')).toBeTruthy();
            expect(screen.getByText('operador@servispeed.com')).toBeTruthy();
            expect(screen.getByText('Disenador')).toBeTruthy();
        });
        expect(errorSpy).toHaveBeenCalled();
    });
});