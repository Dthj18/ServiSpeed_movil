import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            // --- MODO DEMO / OFFLINE ---
            console.log("Saltando conexión al servidor...");

            // 1. Guardamos un token falso para que la app crea que hay sesión
            await AsyncStorage.setItem('userToken', 'demo-token-12345');

            // 2. Redirigimos directamente al dashboard
            router.replace('./(tabs)/dashboard');

            /* ---------------------------------------------------------
               CÓDIGO ORIGINAL (COMENTADO TEMPORALMENTE)
               Descomenta esto cuando quieras volver a conectar la API
            --------------------------------------------------------- */
            /*
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
                router.replace('./(tabs)/dashboard');
            } else {
                Alert.alert('Error de autenticación', data.message || 'Correo o contraseña incorrectos');
            }
            */
            /* --------------------------------------------------------- */

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
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <LinearGradient
                    colors={['#7EE2B5', '#457C63']}
                    style={StyleSheet.absoluteFill}
                />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer} scrollEnabled={false}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            resizeMode={"stretch"}
                            style={styles.logo}
                        />
                        <View style={styles.formContainer}>
                            <Text style={styles.title}>{"Login"}</Text>

                            <View style={styles.inputContainer}>
                                <FontAwesomeIcon
                                    icon={faEnvelope}
                                    style={styles.emailIcon}
                                    size={20}
                                />
                                <TextInput placeholder={"Correo Electrónico"}
                                    value={email}
                                    onChangeText={setEmail}
                                    style={styles.input}
                                    placeholderTextColor="#666"
                                    keyboardType="email-address"
                                    autoCapitalize="none">
                                </TextInput>
                            </View>

                            <View style={styles.inputContainer}>
                                <FontAwesomeIcon
                                    icon={faKey}
                                    style={styles.emailIcon}
                                    size={20}
                                />
                                <TextInput
                                    placeholder={"Contraseña"}
                                    value={password}
                                    onChangeText={setPassword}
                                    style={styles.input}
                                    placeholderTextColor="#666"
                                    secureTextEntry={true}
                                />
                            </View>

                            <TouchableOpacity onPress={handleLogin}
                                style={styles.loginButtonWrapper}>
                                <LinearGradient colors={["#7EE2B585", "#457C6385"]}
                                    style={styles.loginButtonGradient}>
                                    <Text style={styles.loginButtonText}>
                                        {loading ? "Cargando..." : "Iniciar Sesión"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    formContainer: {
        backgroundColor: "#E2E2E2",
        height: '55%',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        paddingHorizontal: 30,
        paddingTop: 50,
    },
    title: {
        color: "#000000",
        fontSize: 36,
        fontWeight: 'normal',
        marginBottom: 32,
        marginLeft: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 21,
        marginBottom: 13,
        marginHorizontal: 2,
        height: 50,
        paddingHorizontal: 15,

    },
    input: {
        color: "#000000",
        fontSize: 13,
        flex: 1,
        marginLeft: 1,
        opacity: 0.7,
        paddingVertical: 0,
    },
    emailIcon: {
        marginLeft: 17,
        marginRight: 7,
        opacity: 0.25,
    },
    loginButtonWrapper: {
        borderRadius: 21,
        marginBottom: 172,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    loginButtonGradient: {
        alignItems: "center",
        paddingTop: 13,
        paddingBottom: 14,
    },
    loginButtonText: {
        color: "#000000",
        fontSize: 15,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 40,
        alignSelf: 'center'
    }
});