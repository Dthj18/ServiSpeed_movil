import { apiFetch } from '@/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import PerfilScreen from '../app/(tabs)/perfil';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    useRouter: () => ({ replace: mockRouterReplace }),
}));

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    return {
        useFocusEffect: jest.fn((cb) => {
            React.useEffect(cb, [cb]);
        }),
    };
});

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('@fortawesome/react-native-fontawesome', () => ({ FontAwesomeIcon: () => null }));

describe('PerfilScreen - Suite Máxima de 17 Escenarios (100% Coverage)', () => {

    const mockUserData = {
        idUsuario: 1,
        nombre: 'Carlos Admin',
        email: 'admin@mail.com',
        rol: 'Administrador'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUserData));
        (apiFetch as jest.Mock).mockResolvedValue(mockUserData);
    });

    // --- BLOQUE 1: RENDERIZADO Y CARGA DE DATOS ---
    it('1. Renderiza la estructura base (Textos por defecto mientras carga)', () => {
        (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));
        const { getByText } = render(<PerfilScreen />);

        expect(getByText('Cargando...')).toBeTruthy();
        expect(getByText('ServiSpeed App v1.0.2')).toBeTruthy();
    });

    it('2. Carga y muestra los datos del usuario desde AsyncStorage y API', async () => {
        const { getByText } = render(<PerfilScreen />);
        await waitFor(() => {
            expect(getByText('Carlos Admin')).toBeTruthy();
            expect(getByText('admin@mail.com')).toBeTruthy();
            expect(getByText('Administrador')).toBeTruthy();
        });
    });

    it('3. Resiste si AsyncStorage no tiene userData (Usuario Nuevo o corrupto)', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
        const { getByText } = render(<PerfilScreen />);
        await waitFor(() => expect(getByText('Cargando...')).toBeTruthy());
    });

    it('4. Entra en modo offline si la API falla, usando el respaldo de sin conexión', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
            idUsuario: 1,
            email: 'admin@mail.com',
            rol: 'Administrador'
        }));
        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Sin internet"));

        const { getByText } = render(<PerfilScreen />);
        await waitFor(() => {
            expect(getByText('Usuario (Sin conexión)')).toBeTruthy();
        });
    });

    // --- BLOQUE 2: INTERACCIÓN Y NAVEGACIÓN DE MENÚS ---
    it('5. Renderiza el menú de opciones (Contraseña, Notificaciones, Ayuda)', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        expect(screen.getByText('Cambiar Contraseña')).toBeTruthy();
        expect(screen.getByText('Notificaciones')).toBeTruthy();
        expect(screen.getByText('Ayuda y Soporte')).toBeTruthy();
    });

    it('6. Permite activar/desactivar el switch de notificaciones', async () => {
        const { getByRole } = render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        const toggle = getByRole('switch');
        expect(toggle.props.value).toBe(true);
        fireEvent(toggle, 'valueChange', false);
        expect(toggle.props.value).toBe(false);
    });

    // --- BLOQUE 3: CERRAR SESIÓN (LOGOUT) ---
    it('7. Muestra alerta de confirmación al presionar "Cerrar Sesión"', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        fireEvent.press(screen.getByText('Cerrar Sesión'));
        expect(Alert.alert).toHaveBeenCalledWith(
            "Cerrar Sesión",
            "¿Estás seguro que deseas salir?",
            expect.any(Array)
        );
    });

    it('8. Ejecuta la destrucción de sesión y redirige si el usuario confirma "Salir"', async () => {
        jest.useFakeTimers();
        let callbackSalir: any;
        (Alert.alert as jest.Mock).mockImplementation((title, msg, buttons) => {
            callbackSalir = buttons.find((b: any) => b.text === 'Salir').onPress;
        });

        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        fireEvent.press(screen.getByText('Cerrar Sesión'));
        await callbackSalir();

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userToken');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');

        jest.runAllTimers();
        expect(mockRouterReplace).toHaveBeenCalledWith('/login');
        jest.useRealTimers();
    });

    // --- BLOQUE 4: MODAL DE CONTRASEÑA Y VALIDACIONES ---
    it('9. Abre el modal de cambio de contraseña al presionar la opción', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        expect(screen.getByText('Ingresa tu contraseña actual y la nueva para confirmar el cambio.')).toBeTruthy();
    });

    it('10. Cierra el modal de contraseña al presionar "Cancelar"', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        expect(screen.getByText('Actualizar Contraseña')).toBeTruthy();

        fireEvent.press(screen.getByText('Cancelar'));
        await waitFor(() => expect(screen.queryByText('Actualizar Contraseña')).toBeNull());
    });

    it('11. Bloquea el guardado si hay campos de contraseña vacíos', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());
        (apiFetch as jest.Mock).mockClear();

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        fireEvent.press(screen.getByText('Actualizar Contraseña'));

        expect(Alert.alert).toHaveBeenCalledWith("Error", "Todos los campos son obligatorios");
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('12. Bloquea el guardado si la nueva contraseña no coincide con la confirmación', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        fireEvent.press(screen.getByText('Cambiar Contraseña'));

        const inputs = screen.getAllByPlaceholderText('********');
        fireEvent.changeText(inputs[0], 'vieja123');
        fireEvent.changeText(inputs[1], 'nueva123');
        fireEvent.changeText(inputs[2], 'error123');

        fireEvent.press(screen.getByText('Actualizar Contraseña'));
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Las contraseñas nuevas no coinciden");
    });

    it('13. Bloquea el guardado si el AsyncStorage está vacío al intentar cambiar', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        // Simulamos pérdida de sesión justo antes de guardar
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        fireEvent.changeText(inputs[0], 'vieja');
        fireEvent.changeText(inputs[1], 'nueva');
        fireEvent.changeText(inputs[2], 'nueva');

        fireEvent.press(screen.getByText('Actualizar Contraseña'));
        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Error", "No se encontró sesión activa. Reingresa a la app.");
        });
    });

    // --- BLOQUE 5: CONEXIÓN CON EL SERVIDOR Y RESULTADOS DE CONTRASEÑA ---
    it('14. Envía los datos correctamente al servidor y muestra mensaje de éxito', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        (apiFetch as jest.Mock).mockResolvedValueOnce({ ok: true });

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        fireEvent.changeText(inputs[0], 'viejaPass');
        fireEvent.changeText(inputs[1], 'nuevaPass');
        fireEvent.changeText(inputs[2], 'nuevaPass');

        fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/api/usuarios/1/cambiar-password', {
                method: 'PUT',
                body: { passwordActual: 'viejaPass', nuevaPassword: 'nuevaPass' }
            });
            expect(Alert.alert).toHaveBeenCalledWith("Éxito", "Tu contraseña ha sido actualizada correctamente");
        });
    });

    it('15. Muestra mensaje amigable si el servidor responde con 400 (Contraseña Actual Incorrecta)', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        (apiFetch as jest.Mock).mockRejectedValueOnce({ status: 400, message: 'La contraseña actual es incorrecta' });

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        fireEvent.changeText(inputs[0], 'viejaMala');
        fireEvent.changeText(inputs[1], 'nuevaPass');
        fireEvent.changeText(inputs[2], 'nuevaPass');

        fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Contraseña Incorrecta", expect.any(String));
        });
    });

    it('16. Muestra mensaje de error genérico si el servidor falla (Error 500)', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Timeout de Base de datos"));

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        fireEvent.changeText(inputs[0], 'vieja');
        fireEvent.changeText(inputs[1], 'nueva');
        fireEvent.changeText(inputs[2], 'nueva');

        fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Error", "Timeout de Base de datos");
        });
    });

    it('17. Muestra texto genérico si el error del servidor viene vacío o nulo', async () => {
        render(<PerfilScreen />);
        await waitFor(() => expect(screen.getByText('Carlos Admin')).toBeTruthy());

        (apiFetch as jest.Mock).mockRejectedValueOnce({});

        fireEvent.press(screen.getByText('Cambiar Contraseña'));
        const inputs = screen.getAllByPlaceholderText('********');
        fireEvent.changeText(inputs[0], 'v');
        fireEvent.changeText(inputs[1], 'n');
        fireEvent.changeText(inputs[2], 'n');

        fireEvent.press(screen.getByText('Actualizar Contraseña'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo actualizar la contraseña. Revisa tu conexión.");
        });
    });

});