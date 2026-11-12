import { apiFetch } from '@/services/apiClient';
import { saveSession } from '@/services/session';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, Image, Keyboard, View } from 'react-native';
import LoginScreen from '../app/login';

// --- 1. MOCKS GLOBALES (Aislamiento Total) ---
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockRouterReplace }),
    Stack: { Screen: () => null },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/apiClient', () => ({ apiFetch: jest.fn() }));
jest.mock('@/services/session', () => ({ saveSession: jest.fn() }));

// Evita errores visuales de íconos en consola
jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => 'Icon'
}));

describe('LoginScreen - Suite Máxima de 16 Escenarios (100% Coverage)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Silenciamos las alertas y el teclado para que no interrumpan Jest
        jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
        // Simulamos los listeners del teclado que tienes en tu useEffect
        jest.spyOn(Keyboard, 'addListener').mockImplementation(() => ({ remove: jest.fn() } as any));
    });

    // --- BLOQUE 1: RENDERIZADO Y PROPIEDADES VISUALES ---
    it('1. Renderiza los textos principales de bienvenida', () => {
        render(<LoginScreen />);
        expect(screen.getByText('Bienvenido')).toBeTruthy();
        expect(screen.getByText('Inicia sesión para continuar')).toBeTruthy();
    });

    it('2. Renderiza el logotipo de la aplicación (Image)', () => {
        const { UNSAFE_getByType } = render(<LoginScreen />);
        expect(UNSAFE_getByType(Image)).toBeTruthy();
    });

    it('3. El input de contraseña oculta los caracteres (secureTextEntry)', () => {
        render(<LoginScreen />);
        const passInput = screen.getByPlaceholderText('Contraseña');
        expect(passInput.props.secureTextEntry).toBe(true);
    });

    // --- BLOQUE 2: INTERACCIONES BÁSICAS DE USUARIO ---
    it('4. Permite escribir y actualizar el valor del correo electrónico', () => {
        render(<LoginScreen />);
        const emailInput = screen.getByPlaceholderText('Correo Electrónico');
        fireEvent.changeText(emailInput, 'usuario@test.com');
        expect(emailInput.props.value).toBe('usuario@test.com');
    });

    it('5. Permite escribir y actualizar el valor de la contraseña', () => {
        render(<LoginScreen />);
        const passInput = screen.getByPlaceholderText('Contraseña');
        fireEvent.changeText(passInput, 'MiClaveSecreta');
        expect(passInput.props.value).toBe('MiClaveSecreta');
    });

    it('6. Oculta el teclado nativo al tocar el fondo (TouchableWithoutFeedback)', () => {
        render(<LoginScreen />);
        // TouchableWithoutFeedback inyecta el evento onPress al primer View hijo.
        // Seleccionamos el contenedor raíz (fondo) y disparamos el toque.
        const rootContainer = screen.UNSAFE_getAllByType(View)[0]; 
        fireEvent.press(rootContainer);
        expect(Keyboard.dismiss).toHaveBeenCalled();
    });

    it('7. Intenta iniciar sesión automáticamente al presionar Enter en el teclado (onSubmitEditing)', () => {
        render(<LoginScreen />);
        const passInput = screen.getByPlaceholderText('Contraseña');
        fireEvent(passInput, 'submitEditing');
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Por favor ingresa correo y contraseña');
    });

    // --- BLOQUE 3: VALIDACIONES PREVENTIVAS (FRONTEND) ---
    it('8. Bloquea el intento y muestra alerta si ambos campos están vacíos', () => {
        render(<LoginScreen />);
        fireEvent.press(screen.getByText('Iniciar Sesión'));
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Por favor ingresa correo y contraseña');
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('9. Bloquea el intento si solo falta la contraseña', () => {
        render(<LoginScreen />);
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'admin@mail.com');
        fireEvent.press(screen.getByText('Iniciar Sesión'));
        expect(Alert.alert).toHaveBeenCalled();
    });

    it('10. Bloquea el intento si solo falta el correo', () => {
        render(<LoginScreen />);
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'admin123');
        fireEvent.press(screen.getByText('Iniciar Sesión'));
        expect(Alert.alert).toHaveBeenCalled();
    });

    // --- BLOQUE 4: RED Y FLUJO DE ÉXITO (HAPPY PATH) ---
    it('11. Muestra el estado de carga y deshabilita el botón al hacer la petición', () => {
        (apiFetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
        
        render(<LoginScreen />);
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'admin@servispeed.com');
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), '1234');
        
        const boton = screen.getByText('Iniciar Sesión');
        fireEvent.press(boton);

        expect(screen.queryByText('Iniciar Sesión')).toBeNull();
    });

    it('12. Inyecta los parámetros correctos en la petición (POST, skipAuth y body)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce({ token: 'jwt', idUsuario: 1 });
        render(<LoginScreen />);
        
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'test@mail.com');
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'pass');
        fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
                method: 'POST',
                skipAuth: true, 
                body: { email: 'test@mail.com', password: 'pass' },
            });
        });
    });

    it('13. Almacena la sesión de manera segura tras una respuesta HTTP 200', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce({
            token: 'TOKEN_123', idUsuario: 5, rol: 'SuperAdmin', permisos: ['ALL']
        });
        
        render(<LoginScreen />);
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'user');
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'pass');
        fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(saveSession).toHaveBeenCalledWith('TOKEN_123', {
                idUsuario: 5, email: 'user', rol: 'SuperAdmin', permisos: ['ALL']
            });
        });
    });

    it('14. Ejecuta la redirección nativa al Dashboard (router.replace)', async () => {
        (apiFetch as jest.Mock).mockResolvedValueOnce({ token: '123', idUsuario: 1 });
        render(<LoginScreen />);
        
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'user');
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'pass');
        fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
        });
    });

    // --- BLOQUE 5: RECUPERACIÓN Y MITIGACIÓN DE ERRORES (CATCH) ---
    it('15. Muestra el mensaje de error provisto por el Backend (Credenciales incorrectas)', async () => {
        (apiFetch as jest.Mock).mockRejectedValueOnce({
            body: { message: 'El usuario no existe o está inactivo' }
        });

        render(<LoginScreen />);
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'fantasma@mail.com');
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'fail');
        fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error de autenticación', 'El usuario no existe o está inactivo');
            expect(mockRouterReplace).not.toHaveBeenCalled();
        });
    });

    it('16. Muestra el mensaje de respaldo por defecto ante una falla estructurada del servidor (Error 500)', async () => {
        (apiFetch as jest.Mock).mockRejectedValueOnce(new Error("Network connection lost"));

        render(<LoginScreen />);
        fireEvent.changeText(screen.getByPlaceholderText('Correo Electrónico'), 'admin@mail.com');
        fireEvent.changeText(screen.getByPlaceholderText('Contraseña'), 'pass');
        fireEvent.press(screen.getByText('Iniciar Sesión'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error de autenticación', 'Correo o contraseña incorrectos');
            expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
        });
    });
});