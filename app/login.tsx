import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
                <LinearGradient
                    colors={['#7EE2B5', '#457C63']}
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
                        <View style={styles.topSection}>
                            <Image
                                source={require('../assets/images/logo.png')}
                                resizeMode={"contain"}
                                style={styles.logo}
                            />
                        </View>

                        <View style={styles.bottomSection}>
                            <Text style={styles.title}>Login</Text>

                            <View style={styles.inputContainer}>
                                <FontAwesomeIcon
                                    icon={faEnvelope}
                                    style={styles.inputIcon}
                                    size={20}
                                />
                                <TextInput
                                    placeholder={"Correo Electrónico"}
                                    value={email}
                                    onChangeText={setEmail}
                                    style={styles.input}
                                    placeholderTextColor="#666"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <FontAwesomeIcon
                                    icon={faKey}
                                    style={styles.inputIcon}
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

                            <TouchableOpacity onPress={handleLogin} style={styles.loginButtonWrapper}>
                                <LinearGradient
                                    colors={["#7EE2B585", "#457C6385"]}
                                    style={styles.loginButtonGradient}
                                >
                                    <Text style={styles.loginButtonText}>
                                        {loading ? "Cargando..." : "Iniciar Sesión"}
                                    </Text>
                                </LinearGradient>
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
    },
    topSection: {
        flex: 1, 
        minHeight: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 180,
    },
    bottomSection: {
        backgroundColor: "#E2E2E2",
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 40, 
        width: '100%',
    },
    title: {
        color: "#000000",
        fontSize: 36,
        marginBottom: 30,
        marginLeft: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 21,
        marginBottom: 15,
        height: 50,
        paddingHorizontal: 15,
    },
    input: {
        color: "#000000",
        fontSize: 14,
        flex: 1,
        marginLeft: 10,
        height: '100%',
    },
    inputIcon: {
        opacity: 0.3,
    },
    loginButtonWrapper: {
        borderRadius: 21,
        marginTop: 25,
        overflow: 'hidden',
        marginBottom: 20,
    },
    loginButtonGradient: {
        alignItems: "center",
        paddingVertical: 15,
    },
    loginButtonText: {
        color: "#000000",
        fontSize: 16,
        fontWeight: '500',
    },
});