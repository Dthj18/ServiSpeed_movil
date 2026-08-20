import { apiFetch } from '@/services/apiClient';
import { faBell, faChevronRight, faCircleQuestion, faEnvelope, faLock, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator, Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView, StyleSheet,
    Switch, Text, TextInput, TouchableOpacity, View
} from "react-native";

export default function PerfilScreen() {
    const router = useRouter();

    const [notificaciones, setNotificaciones] = useState(true);
    const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
    const [loadingLogout, setLoadingLogout] = useState(false);

    const [userData, setUserData] = useState({
        nombre: 'Cargando...',
        email: '...',
        rol: '...'
    });

    const [passActual, setPassActual] = useState('');
    const [passNueva, setPassNueva] = useState('');
    const [passConfirmar, setPassConfirmar] = useState('');

    useFocusEffect(
        useCallback(() => {
            const obtenerDatosDePersona = async () => {
                try {
                    const jsonUser = await AsyncStorage.getItem('userData');
                    if (!jsonUser) return;

                    const datosLocales = JSON.parse(jsonUser);
                    const idUsuario = datosLocales.idUsuario;

                    const persona = await apiFetch(`/api/usuarios/${idUsuario}`);

                    setUserData({
                        nombre: persona.nombre || persona.nombres || datosLocales.nombre || "Usuario",
                        email: datosLocales.email,
                        rol: datosLocales.rol
                    });

                } catch (error) {
                    console.error("Error conectando al backend de Usuarios:", error);

                    const jsonUser = await AsyncStorage.getItem('userData');
                    if (jsonUser) {
                        const datosLocales = JSON.parse(jsonUser);
                        setUserData({
                            nombre: datosLocales.nombre || "Usuario (Sin conexión)",
                            email: datosLocales.email,
                            rol: datosLocales.rol
                        });
                    }
                }
            };

            obtenerDatosDePersona();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro que deseas salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        setLoadingLogout(true);
                        await AsyncStorage.removeItem('userToken');
                        await AsyncStorage.removeItem('userData');

                        setTimeout(() => {
                            setLoadingLogout(false);
                            router.replace('/login');
                        }, 1000);
                    }
                }
            ]
        );
    };

    const guardarPassword = async () => {
        if (!passActual || !passNueva || !passConfirmar) {
            Alert.alert("Error", "Todos los campos son obligatorios");
            return;
        }
        if (passNueva !== passConfirmar) {
            Alert.alert("Error", "Las contraseñas nuevas no coinciden");
            return;
        }

        try {
            const jsonUser = await AsyncStorage.getItem('userData');
            if (!jsonUser) {
                Alert.alert("Error", "No se encontró sesión activa. Reingresa a la app.");
                return;
            }

            const { idUsuario } = JSON.parse(jsonUser);

            await apiFetch(`/api/usuarios/${idUsuario}/cambiar-password`, {
                method: 'PUT',
                body: {
                    passwordActual: passActual,
                    nuevaPassword: passNueva
                }
            });

            Alert.alert("Éxito", "Tu contraseña ha sido actualizada correctamente");
            setModalPasswordVisible(false);
            setPassActual('');
            setPassNueva('');
            setPassConfirmar('');

        } catch (error: any) {
            const mensajeServidor = error.message || error.mensaje || error.data?.message || "";

            if (error.status === 400 || mensajeServidor.toLowerCase().includes("incorrecta")) {
                Alert.alert("Contraseña Incorrecta", "La contraseña actual que ingresaste no es la correcta. Inténtalo de nuevo.");
            } else {
                Alert.alert("Error", mensajeServidor || "No se pudo actualizar la contraseña. Revisa tu conexión.");
            }
        }
    };

    const MenuOption = ({ icon, title, subtitle, onPress, showChevron = true, isDestructive = false }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                <FontAwesomeIcon icon={icon} size={20} color={isDestructive ? "#FE5F5F" : "#3A88F6"} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            {showChevron && <FontAwesomeIcon icon={faChevronRight} size={14} color="#CCC" />}
        </TouchableOpacity>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Mi Perfil",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { fontFamily: "LexendTera-SemiBold", fontSize: 15 },
                    headerShadowVisible: false,

                    headerBackground: () => (
                        <View style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            borderBottomWidth: 1,
                            borderBottomColor: '#E5E7EB'
                        }} />
                    ),
                }}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Tarjeta de Usuario */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <FontAwesomeIcon icon={faUser} size={35} color="#FFF" />
                    </View>

                    <Text style={styles.userName}>{userData.nombre}</Text>

                    {/* Le agregamos un identificador de sucursal/ubicación operativa */}
                    <Text style={styles.userRole}>{userData.rol}</Text>

                    <View style={styles.emailBadge}>
                        <FontAwesomeIcon icon={faEnvelope} size={12} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.userEmail}>{userData.email}</Text>
                    </View>
                </View>

                {/* 2. Sección Cuenta */}
                <Text style={styles.sectionTitle}>Cuenta</Text>
                <View style={styles.menuContainer}>
                    <MenuOption
                        icon={faLock}
                        title="Cambiar Contraseña"
                        subtitle="Actualiza tu clave de acceso"
                        onPress={() => setModalPasswordVisible(true)}
                    />
                </View>

                {/* 3. Sección Configuración */}
                <Text style={styles.sectionTitle}>Configuración</Text>
                <View style={styles.menuContainer}>
                    <View style={styles.menuItem}>
                        <View style={styles.iconBox}>
                            <FontAwesomeIcon icon={faBell} size={20} color="#3A88F6" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Notificaciones</Text>
                            <Text style={styles.menuSubtitle}>Alertas de órdenes y estatus</Text>
                        </View>
                        <Switch
                            value={notificaciones}
                            onValueChange={setNotificaciones}
                            trackColor={{ false: "#E5E7EB", true: "#3A88F6" }}
                            thumbColor={"#FFFFFF"}
                        />
                    </View>
                    <View style={styles.divider} />
                    <MenuOption
                        icon={faCircleQuestion}
                        title="Ayuda y Soporte"
                        subtitle="Contactar a sistemas"
                        onPress={() => { }}
                    />
                </View>

                {/* 4. Botón Cerrar Sesión */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                    {loadingLogout ? (
                        <ActivityIndicator color="#FE5F5F" />
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faRightFromBracket} size={18} color="#FE5F5F" style={{ marginRight: 10 }} />
                            <Text style={styles.logoutText}>Cerrar Sesión</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.versionText}>ServiSpeed App v1.0.2</Text>

            </ScrollView>

            {/* MODAL DE PASSWORD OPTIMIZADO */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalPasswordVisible}
                onRequestClose={() => setModalPasswordVisible(false)}
            >
                {/* KeyboardAvoidingView evita que el teclado de Android/iOS tape los inputs */}
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderBar} />

                        <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
                        <Text style={styles.modalSubtitle}>Ingresa tu contraseña actual y la nueva para confirmar el cambio.</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Contraseña Actual</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="********"
                                placeholderTextColor="#9CA3AF"
                                value={passActual}
                                onChangeText={setPassActual}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="********"
                                placeholderTextColor="#9CA3AF"
                                value={passNueva}
                                onChangeText={setPassNueva}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="********"
                                placeholderTextColor="#9CA3AF"
                                value={passConfirmar}
                                onChangeText={setPassConfirmar}
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={guardarPassword} activeOpacity={0.8}>
                            <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalPasswordVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5" },
    scrollContent: { padding: 20 },

    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        alignItems: 'center',
        padding: 25,
        marginBottom: 30,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    avatarContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#3A88F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 10, textAlign: 'center' },
    userRole: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
    emailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 5,
    },
    userEmail: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 12,
        marginLeft: 8,
        marginTop: -10
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 5,
        marginBottom: 25,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 15,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconBoxDestructive: { backgroundColor: '#FEF2F2' },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
    menuTitleDestructive: { color: '#FE5F5F' },
    menuSubtitle: { fontSize: 13, color: '#9CA3AF' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 70 },

    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    logoutText: { color: '#FE5F5F', fontWeight: 'bold', fontSize: 16 },
    versionText: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginBottom: 30, fontWeight: '500' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    },
    modalHeaderBar: {
        width: 45,
        height: 5,
        backgroundColor: '#D1D5DB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25, textAlign: 'center', paddingHorizontal: 10 },

    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    saveButton: {
        backgroundColor: '#3A88F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    cancelButton: { padding: 15, alignItems: 'center' },
    cancelButtonText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
}); 0  