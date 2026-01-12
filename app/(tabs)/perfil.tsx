import { faBell, faChevronRight, faCircleQuestion, faEnvelope, faLock, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

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
                    const token = await AsyncStorage.getItem('userToken');
                    const jsonUser = await AsyncStorage.getItem('userData');
                    if (!token || !jsonUser) return;
                    const datosLocales = JSON.parse(jsonUser);
                    const idUsuario = datosLocales.idUsuario;

                    const response = await fetch(`http://10.0.0.1:8081/api/usuarios/${idUsuario}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const persona = await response.json();
                        setUserData({
                            nombre: persona.nombre || persona.nombres || "Usuario",
                            email: datosLocales.email,
                            rol: datosLocales.rol
                        });
                    } else {
                        setUserData({
                            nombre: "Usuario (Error)",
                            email: datosLocales.email,
                            rol: datosLocales.rol
                        });
                    }

                } catch (error) {
                    console.error("Error conectando a Personas-Service:", error);
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
            const token = await AsyncStorage.getItem('userToken');
            const jsonUser = await AsyncStorage.getItem('userData');

            if (!token || !jsonUser) {
                Alert.alert("Error", "No se encontró sesión activa. Reingresa a la app.");
                return;
            }

            const { idUsuario } = JSON.parse(jsonUser);

            const response = await fetch(`http://10.0.0.1:8081/api/usuarios/${idUsuario}/cambiar-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    passwordActual: passActual,
                    nuevaPassword: passNueva
                })
            });

            if (response.ok) {
                Alert.alert("Éxito", "Tu contraseña ha sido actualizada correctamente");
                setModalPasswordVisible(false);
                setPassActual('');
                setPassNueva('');
                setPassConfirmar('');
            } else {
                const errorText = await response.text();

                try {
                    const errorJson = JSON.parse(errorText);
                    const mensajeServidor = errorJson.message || errorJson.mensaje || "";

                    if (response.status === 400 || mensajeServidor.includes("incorrecta")) {
                        Alert.alert("Contraseña Incorrecta", "La contraseña actual que ingresaste no es la correcta. Inténtalo de nuevo.");
                    } else {
                        Alert.alert("Error", mensajeServidor || "No se pudo actualizar la contraseña.");
                    }

                } catch {
                    Alert.alert("Error", "El servidor respondió con error: " + response.status);
                }
            }

        } catch (error) {
            console.error("ERROR DE CONEXIÓN:", error);
            Alert.alert("Error", "Error de conexión con el servidor");
        }
    };

    const MenuOption = ({ icon, title, subtitle, onPress, showChevron = true, isDestructive = false }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                <FontAwesomeIcon icon={icon} size={18} color={isDestructive ? "#FE5F5F" : "#3A88F6"} />
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
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                }}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                {/* 1. Tarjeta de Usuario DINÁMICA */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <FontAwesomeIcon icon={faUser} size={40} color="#FFF" />
                    </View>

                    {/* AQUI USAMOS LAS VARIABLES DEL ESTADO */}
                    <Text style={styles.userName}>{userData.nombre}</Text>
                    <Text style={styles.userRole}>{userData.rol}</Text>

                    <View style={styles.emailBadge}>
                        <FontAwesomeIcon icon={faEnvelope} size={10} color="#666" style={{ marginRight: 5 }} />
                        <Text style={styles.userEmail}>{userData.email}</Text>
                    </View>
                </View>

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
                            <FontAwesomeIcon icon={faBell} size={18} color="#3A88F6" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Notificaciones</Text>
                            <Text style={styles.menuSubtitle}>Alertas de órdenes y estatus</Text>
                        </View>
                        <Switch
                            value={notificaciones}
                            onValueChange={setNotificaciones}
                            trackColor={{ false: "#E0E0E0", true: "#3A88F6" }}
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
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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

            {/* ... TU MODAL DE PASSWORD IGUAL ... */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalPasswordVisible}
                onRequestClose={() => setModalPasswordVisible(false)}
            >
                <View style={styles.modalOverlay}>
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
                                value={passConfirmar}
                                onChangeText={setPassConfirmar}
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={guardarPassword}>
                            <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalPasswordVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        marginBottom: 25,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3A88F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#3A88F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    userRole: { fontSize: 14, color: '#999', marginBottom: 10 },
    emailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15
    },
    userEmail: { fontSize: 12, color: '#666' },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginBottom: 10, marginLeft: 5 },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 5,
        marginBottom: 25,
        elevation: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconBoxDestructive: { backgroundColor: '#FFF0F0' },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
    menuTitleDestructive: { color: '#FE5F5F' },
    menuSubtitle: { fontSize: 12, color: '#999' },
    divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 68 },

    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#FFF0F0',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: { color: '#FE5F5F', fontWeight: 'bold', fontSize: 16 },
    versionText: { textAlign: 'center', color: '#CCC', fontSize: 12, marginBottom: 30 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
    },
    modalHeaderBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 13, color: '#999', marginBottom: 25, textAlign: 'center', paddingHorizontal: 20 },

    inputContainer: { marginBottom: 15 },
    inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8 },
    input: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#3A88F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
        shadowColor: "#3A88F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    cancelButton: { padding: 15, alignItems: 'center' },
    cancelButtonText: { color: '#999', fontWeight: '600', fontSize: 15 },
});