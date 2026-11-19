import { apiFetch } from '@/services/apiClient';
import { onForceLogout } from '@/services/authEvents';
import { clearSession, getToken, getUsuario, saveSession } from '@/services/session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// --- MOCKS DE LIBRERÍAS NATIVAS ---
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock global de la función fetch de la plataforma
const globalFetchMock = jest.fn();
global.fetch = globalFetchMock;

describe('CPI-207: Servicios Core - Integración de API Client y Session (10 Escenarios)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- BLOQUE 1: GESTIÓN DE SESIÓN Y ALMACENAMIENTO SEGURO ---
    it('1. saveSession almacena el token en SecureStore y los datos de usuario en AsyncStorage', async () => {
        const mockUsuario = { idUsuario: 1, email: 'test@mail.com', rol: 'Admin', permisos: ['ALL'] };
        
        await saveSession('TOKEN_XYZ', mockUsuario);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'TOKEN_XYZ');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUsuario));
    });

    it('2. getToken recupera el token desde SecureStore', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('TOKEN_XYZ');
        
        const token = await getToken();

        expect(token).toBe('TOKEN_XYZ');
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
    });

    it('3. getUsuario deserializa correctamente los datos del usuario desde AsyncStorage', async () => {
        const mockUsuario = { idUsuario: 2, email: 'user@mail.com', rol: 'Client', permisos: ['READ'] };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockUsuario));

        const usuario = await getUsuario();

        expect(usuario).toEqual(mockUsuario);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('userData');
    });

    it('4. clearSession elimina tanto el token de SecureStore como los datos de AsyncStorage', async () => {
        await clearSession();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');
    });

    // --- BLOQUE 2: PETICIONES HTTP CON apiFetch ---
    it('5. apiFetch realiza una petición exitosa inyectando el Token Bearer por defecto', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('VALID_TOKEN');
        globalFetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: 'ok' })
        });

        const resultado = await apiFetch('/api/recurso');

        expect(globalFetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/recurso'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer VALID_TOKEN'
                })
            })
        );
        expect(resultado).toEqual({ success: true, data: 'ok' });
    });

    it('6. apiFetch omite la cabecera de autorización si se especifica skipAuth: true', async () => {
        globalFetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ publico: true })
        });

        await apiFetch('/api/publico', { skipAuth: true });

        expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
        const headersEnviados = globalFetchMock.mock.calls[0][1].headers;
        expect(headersEnviados).not.toHaveProperty('Authorization');
    });

    it('7. apiFetch serializa correctamente el cuerpo (body) a cadena JSON', async () => {
        globalFetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ actualizado: true })
        });

        await apiFetch('/api/actualizar', {
            method: 'PUT',
            body: { nombre: 'Nuevo Nombre' }
        });

        expect(globalFetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ nombre: 'Nuevo Nombre' })
            })
        );
    });

    // --- BLOQUE 3: MANEJO DE ERRORES Y EVENTOS DE AUTENTICACIÓN ---
    it('8. apiFetch lanza ApiError con status y cuerpo si la respuesta no es ok', async () => {
        globalFetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ message: 'Datos incompletos en el formulario' })
        });

        let errorCapturado: any;
        try {
            await apiFetch('/api/error');
        } catch (e) {
            errorCapturado = e;
        }

        expect(errorCapturado).toBeDefined();
        expect(errorCapturado.status).toBe(400);
        expect(errorCapturado.message).toBe('Datos incompletos en el formulario');
        expect(errorCapturado.body).toEqual({ message: 'Datos incompletos en el formulario' });
    });

    it('9. apiFetch limpia la sesión y emite un evento de fuerza de cierre si recibe un error 401', async () => {
        globalFetchMock.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Token expirado' })
        });

        const listenerMock = jest.fn();
        const unsubscribe = onForceLogout(listenerMock);

        try {
            await apiFetch('/api/protegido');
        } catch (e) {
            // Ignoramos el error lanzado por el 401
        }

        // Verifica que se limpió la sesión usando las llaves correctas
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');
        
        // Verifica que se disparó el evento de cierre forzado
        expect(listenerMock).toHaveBeenCalledTimes(1);

        unsubscribe();
    });

    it('10. Maneja correctamente respuestas del servidor que no retornan un cuerpo JSON válido', async () => {
        globalFetchMock.mockResolvedValueOnce({
            ok: true,
            status: 204,
            json: async () => { throw new Error("No JSON body"); }
        });

        const resultado = await apiFetch('/api/sin-contenido');

        expect(resultado).toBeNull();
    });

});