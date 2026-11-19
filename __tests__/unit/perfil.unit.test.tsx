import { apiFetch } from '@/services/apiClient';
import { faBell, faChevronRight, faCircleQuestion, faEnvelope, faLock, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Platform } from 'react-native';
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

const idIcono = (icono: { iconName: string }) => `fa-${icono.iconName}`;

const PLATFORM_ORIGINAL = Platform.OS;
const setPlatform = (os: string) => {
    Object.defineProperty(Platform, 'OS', {
        value: os,
        configurable: true,
        writable: true,
        enumerable: true,
    });
};

const spies: jest.SpyInstance[] = [];
const espiar = <T extends object, K extends keyof T>(obj: T, metodo: K, impl?: any) => {
    const spy = jest.spyOn(obj, metodo as any);
    if (impl) spy.mockImplementation(impl);
    spies.push(spy);
    return spy;
};

const mockUserLocal = {
    idUsuario: 7,
    nombre: 'Carlos Local',
    email: 'carlos@servispeed.com',
    rol: 'Gerente',
};

const buscarModal = (nodo: any) => {
    let actual = nodo;
    while (actual && actual.type !== 'Modal' && typeof actual.props?.onRequestClose !== 'function') {
        actual = actual.parent;
    }
    return actual;
};

describe('CPU-105: PerfilScreen - Pruebas Unitarias', () => {
    let alertSpy: jest.SpyInstance;
    let linkingSpy: jest.SpyInstance;

    beforeEach(() => {
        mockApiFetch.mockReset().mockResolvedValue({ nombre: 'Carlos API' });
        mockGetItem.mockReset().mockResolvedValue(JSON.stringify(mockUserLocal));
        mockRemoveItem.mockReset().mockResolvedValue(undefined);
        mockReplace.mockReset();
        setPlatform('ios');
        alertSpy = espiar(Alert, 'alert', () => {});
        linkingSpy = espiar(Linking, 'openURL', () => Promise.resolve(true));
    });

    afterEach(() => {
        while (spies.length) spies.pop()!.mockRestore();
        setPlatform(PLATFORM_ORIGINAL);
    });

    it('1. Mantiene estado por defecto y no consulta API cuando no existe userData en AsyncStorage', async () => {
        mockGetItem.mockResolvedValueOnce(null);

        await render(<PerfilScreen />);

        await waitFor(() => expect(mockGetItem).toHaveBeenCalledWith('userData'));
        expect(mockApiFetch).not.toHaveBeenCalled();
        expect(screen.getByText('Cargando...')).toBeTruthy();
        expect(screen.getByTestId('stack-header-bg')).toBeTruthy();
        expect(screen.getByTestId(idIcono(faUser))).toBeTruthy();
        expect(screen.getByTestId(idIcono(faEnvelope))).toBeTruthy();
        expect(screen.getByTestId(idIcono(faLock))).toBeTruthy();
        expect(screen.getByTestId(idIcono(faBell))).toBeTruthy();
        expect(screen.getByTestId(idIcono(faCircleQuestion))).toBeTruthy();
        expect(screen.getByTestId(idIcono(faRightFromBracket))).toBeTruthy();
        expect(screen.getAllByTestId(idIcono(faChevronRight)).length).toBe(2);
        expect(screen.getByText('ServiSpeed App v1.0.2')).toBeTruthy();
    });

    it.each([
        ['persona.nombre', { nombre: 'Nombre API' }, mockUserLocal, 'Nombre API'],
        ['persona.nombres', { nombres: 'Nombres API' }, mockUserLocal, 'Nombres API'],
        ['datosLocales.nombre', {}, mockUserLocal, 'Carlos Local'],
        ['respaldo Usuario', {}, { idUsuario: 7, email: 'a@b.com', rol: 'Op' }, 'Usuario'],
    ])(
        '2. Resuelve la cadena de prioridad de nombre usando %s',
        async (_caso, respuestaApi, datosLocales, nombreEsperado) => {
            mockGetItem.mockResolvedValueOnce(JSON.stringify(datosLocales));
            mockApiFetch.mockResolvedValueOnce(respuestaApi);

            await render(<PerfilScreen />);

            await waitFor(() => expect(screen.getByText(nombreEsperado)).toBeTruthy());
        }
    );

    it.each([
        ['con nombre local', mockUserLocal, 'Carlos Local'],
        ['sin nombre local', { idUsuario: 7, email: 'a@b.com', rol: 'Op' }, 'Usuario (Sin conexión)'],
    ])(
        '3. Usa respaldo local cuando falla la API (%s)',
        async (_caso, datosLocales, nombreEsperado) => {
            const errorSpy = espiar(console, 'error', () => {});
            mockGetItem.mockResolvedValue(JSON.stringify(datosLocales));
            mockApiFetch.mockRejectedValueOnce(new Error('Sin red'));

            await render(<PerfilScreen />);

            await waitFor(() => expect(screen.getByText(nombreEsperado)).toBeTruthy());
            expect(errorSpy).toHaveBeenCalled();
        }
    );

    it('4. No sobreescribe userData si en el bloque catch tampoco existe userData en almacenamiento', async () => {
        const errorSpy = espiar(console, 'error', () => {});
        mockGetItem
            .mockResolvedValueOnce(JSON.stringify(mockUserLocal))
            .mockResolvedValueOnce(null);
        mockApiFetch.mockRejectedValueOnce(new Error('Fallo backend'));

        await render(<PerfilScreen />);

        await waitFor(() => expect(errorSpy).toHaveBeenCalled());
        expect(screen.getByText('Cargando...')).toBeTruthy();
    });

    it('5. Alterna el interruptor de notificaciones entre activado y desactivado', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        const interruptor = screen.getByRole('switch');
        expect(interruptor.props.value).toBe(true);

        await fireEvent(interruptor, 'valueChange', false);
        expect(screen.getByRole('switch').props.value).toBe(false);

        await fireEvent(screen.getByRole('switch'), 'valueChange', true);
        expect(screen.getByRole('switch').props.value).toBe(true);
    });

    it('6. Abre y cierra el modal de contrasena por Cancelar y requestClose en iOS y Android', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        expect(screen.getByText('Actualizar Contraseña')).toBeTruthy();

        await fireEvent.press(screen.getByText('Cancelar'));
        expect(screen.queryByText('Actualizar Contraseña')).toBeNull();

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        await fireEvent(buscarModal(screen.getByText('Actualizar Contraseña')), 'requestClose');
        expect(screen.queryByText('Actualizar Contraseña')).toBeNull();

        await screen.unmount();
        setPlatform('android');

        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        expect(screen.getByText('Actualizar Contraseña')).toBeTruthy();
        await fireEvent.press(screen.getByText('Cancelar'));
        expect(screen.queryByText('Actualizar Contraseña')).toBeNull();
    });

    it.each([
        ['todos vacios', '', '', ''],
        ['falta nueva', 'actual', '', ''],
        ['falta confirmar', 'actual', 'nueva', ''],
    ])(
        '7. Valida campos obligatorios al guardar contrasena (%s)',
        async (_caso, actual, nueva, confirmar) => {
            await render(<PerfilScreen />);
            await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

            await fireEvent.press(screen.getByText('Cambiar Contraseña'));
            const inputs = screen.getAllByPlaceholderText('********');
            await fireEvent.changeText(inputs[0], actual);
            await fireEvent.changeText(inputs[1], nueva);
            await fireEvent.changeText(inputs[2], confirmar);
            await fireEvent.press(screen.getByText('Actualizar Contraseña'));

            expect(alertSpy).toHaveBeenCalledWith('Error', 'Todos los campos son obligatorios');
            expect(mockApiFetch).toHaveBeenCalledTimes(1);
        }
    );

    it('8. Muestra alerta cuando las contrasenas nuevas no coinciden', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        await fireEvent.changeText(inputs[0], 'Actual123');
        await fireEvent.changeText(inputs[1], 'Nueva123');
        await fireEvent.changeText(inputs[2], 'Otra456');
        await fireEvent.press(screen.getByText('Actualizar Contraseña'));

        expect(alertSpy).toHaveBeenCalledWith('Error', 'Las contraseñas nuevas no coinciden');
        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    it('9. Muestra alerta si no hay sesion activa en AsyncStorage al guardar contrasena', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        mockGetItem.mockResolvedValueOnce(null);

        await fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        await fireEvent.changeText(inputs[0], 'Actual123');
        await fireEvent.changeText(inputs[1], 'Nueva123');
        await fireEvent.changeText(inputs[2], 'Nueva123');
        await fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith(
                'Error',
                'No se encontró sesión activa. Reingresa a la app.'
            )
        );
        expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    it.each([
        [
            'status 400',
            { status: 400 },
            'Contraseña Incorrecta',
            'La contraseña actual que ingresaste no es la correcta. Inténtalo de nuevo.',
        ],
        [
            'mensaje con palabra incorrecta',
            { mensaje: 'La clave actual es Incorrecta' },
            'Contraseña Incorrecta',
            'La contraseña actual que ingresaste no es la correcta. Inténtalo de nuevo.',
        ],
        [
            'error.data.message generico',
            { status: 500, data: { message: 'Servicio no disponible' } },
            'Error',
            'Servicio no disponible',
        ],
        [
            'error sin mensaje',
            {},
            'Error',
            'No se pudo actualizar la contraseña. Revisa tu conexión.',
        ],
    ])(
        '10. Maneja errores al cambiar contrasena (%s)',
        async (_caso, errorSimulado, tituloEsperado, mensajeEsperado) => {
            await render(<PerfilScreen />);
            await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

            mockApiFetch.mockRejectedValueOnce(errorSimulado);

            await fireEvent.press(screen.getByText('Cambiar Contraseña'));
            const inputs = screen.getAllByPlaceholderText('********');
            await fireEvent.changeText(inputs[0], 'Actual123');
            await fireEvent.changeText(inputs[1], 'Nueva123');
            await fireEvent.changeText(inputs[2], 'Nueva123');
            await fireEvent.press(screen.getByText('Actualizar Contraseña'));

            await waitFor(() =>
                expect(alertSpy).toHaveBeenCalledWith(tituloEsperado, mensajeEsperado)
            );
        }
    );

    it('11. Abre el cliente de correo en Ayuda y Soporte y muestra alerta si falla Linking', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        await fireEvent.press(screen.getByText('Ayuda y Soporte'));
        expect(linkingSpy).toHaveBeenCalledWith(
            expect.stringContaining('mailto:diegothj57@gmail.com?subject=Soporte%20App%20ServiSpeed')
        );

        linkingSpy.mockRejectedValueOnce(new Error('Sin cliente de correo'));
        await fireEvent.press(screen.getByText('Ayuda y Soporte'));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith(
                'Error',
                'No se pudo abrir ninguna aplicación de correo. Verifica que tengas una instalada.'
            )
        );
    });

    it('12. Muestra alerta de confirmacion al presionar Cerrar Sesion sin cerrar al elegir Cancelar', async () => {
        await render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos API')).toBeTruthy());

        await fireEvent.press(screen.getByText('Cerrar Sesión'));

        expect(alertSpy).toHaveBeenCalledWith(
            'Cerrar Sesión',
            '¿Estás seguro que deseas salir?',
            expect.arrayContaining([
                expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
                expect.objectContaining({ text: 'Salir', style: 'destructive' }),
            ])
        );
        expect(mockRemoveItem).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
    });
});