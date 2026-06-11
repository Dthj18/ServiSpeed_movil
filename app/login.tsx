import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa correo y contraseña');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://10.0.0.1:8089/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('userToken', data.token);
                const usuarioData = {
                    idUsuario: data.idUsuario,
                    email: email,
                    rol: data.rol
                };
                await AsyncStorage.setItem('userData', JSON.stringify(usuarioData));
                router.replace('./(tabs)/dashboard');
            } else {
                Alert.alert('Error de autenticación', data.message || 'Correo o contraseña incorrectos');
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Ocurrió un error en el inicio de sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                {/* FONDO DINÁMICO: Un gradiente elegante y moderno que conecta con el color principal de la app */}
                <LinearGradient
                    colors={['#1E3A8A', '#3A88F6', '#60A5FA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                        overScrollMode="never"
                    >
                        {/* SECCIÓN DEL LOGO */}
                        <View style={styles.topSection}>
                            <Image
                                source={require('../assets/images/logo.png')}
                                resizeMode={"contain"}
                                style={styles.logo}
                            />
                        </View>

                        {/* SECCIÓN DEL FORMULARIO */}
                        <View style={styles.bottomSection}>
                            <View style={styles.dragIndicator} />
                            
                            <Text style={styles.title}>Bienvenido</Text>
                            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                            <View style={styles.inputContainer}>
                                <FontAwesomeIcon
                                    icon={faEnvelope}
                                    style={styles.inputIcon}
                                    size={18}
                                />
                                <TextInput
                                    placeholder={"Correo Electrónico"}
                                    value={email}
                                    onChangeText={setEmail}
                                    style={styles.input}
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <FontAwesomeIcon
                                    icon={faKey}
                                    style={styles.inputIcon}
                                    size={18}
                                />
                                <TextInput
                                    placeholder={"Contraseña"}
                                    value={password}
                                    onChangeText={setPassword}
                                    style={styles.input}
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={true}
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleLogin} 
                                style={styles.loginButton}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    topSection: {
        flex: 1,
        minHeight: 280,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
        // Opcional: Agregarle un poco de sombra al logo para que resalte sobre el gradiente
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    bottomSection: {
        backgroundColor: "#FFFFFF", // Blanco limpio como en las otras pantallas
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 50,
        width: '100%',
        // Sombra superior para dar profundidad
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    dragIndicator: {
        width: 50,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 25,
    },
    title: {
        fontFamily: "LexendTera-SemiBold", // Integración de tu fuente moderna
        color: "#1F2937", // Gris oscuro elegante
        fontSize: 28,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 30,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB", // Gris súper claro
        borderRadius: 14, // Radio de 14 igual a las tarjetas de órdenes
        marginBottom: 16,
        height: 55,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB", // Borde sutil
    },
    input: {
        color: "#1F2937",
        fontSize: 14,
        flex: 1,
        marginLeft: 12,
        height: '100%',
        fontWeight: '500',
    },
    inputIcon: {
        color: "#3A88F6", // Íconos en el azul principal de tu app
    },
    loginButton: {
        backgroundColor: '#3A88F6', // Color sólido primario igual al de "Ver Historial"
        borderRadius: 14,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#3A88F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontFamily: "LexendTera-SemiBold",
        fontSize: 15,
    },
});