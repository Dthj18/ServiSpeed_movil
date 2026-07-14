import { apiFetch } from '@/services/apiClient';
import { saveSession } from '@/services/session';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const GRADIENT_HEIGHT_EXPANDED = 440;
const GRADIENT_HEIGHT_COLLAPSED = 180;

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const gradientHeight = useRef(new Animated.Value(GRADIENT_HEIGHT_EXPANDED)).current;

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            Animated.timing(gradientHeight, {
                toValue: GRADIENT_HEIGHT_COLLAPSED,
                duration: Platform.OS === 'ios' ? e.duration ?? 250 : 250,
                useNativeDriver: false,
            }).start();
        });

        const hideSub = Keyboard.addListener(hideEvent, (e) => {
            Animated.timing(gradientHeight, {
                toValue: GRADIENT_HEIGHT_EXPANDED,
                duration: Platform.OS === 'ios' ? e.duration ?? 250 : 250,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleLogin = async () => {
        Keyboard.dismiss();

        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa correo y contraseña');
            return;
        }

        setLoading(true);

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                skipAuth: true,
                body: { email, password },
            });

            await saveSession(data.token, {
                idUsuario: data.idUsuario,
                email: email,
                rol: data.rol,
                permisos: data.permisos,
            });

            router.replace('/(tabs)/dashboard');
        } catch (error: any) {
            Alert.alert('Error de autenticación', error.body?.message || 'Correo o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.root}>
                <Stack.Screen options={{ headerShown: false }} />

                <Animated.View style={{ height: gradientHeight }}>
                    <LinearGradient
                        colors={['#1E3A8A', '#3A88F6', '#60A5FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <SafeAreaView style={styles.safeArea} edges={['top']}>
                            <View style={styles.logoWrap}>
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    resizeMode="contain"
                                    style={styles.logo}
                                />
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                </Animated.View>

                <View style={styles.card}>
                    <View
                        style={styles.cardContent}>

                        <View style={styles.dragIndicator} />

                        <Text style={styles.title}>Bienvenido</Text>
                        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail" size={20} color="#3A88F6" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Correo Electrónico"
                                value={email}
                                onChangeText={setEmail}
                                style={styles.input}
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="key" size={20} color="#3A88F6" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                style={styles.input}
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                        </View>

                        <Pressable
                            onPress={handleLogin}
                            disabled={loading}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.loginButton,
                                pressed && styles.loginButtonPressed,
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#1E3A8A',
    },
    gradient: {
        flex: 1
    },
    safeArea: {
        flex: 1,
    },
    logoWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 170,
        height: 170,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: -30,
        minHeight: 500,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    cardContent: {
        paddingHorizontal: 30,
        paddingTop: 25,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        flexGrow: 1,
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
        color: "#1F2937",
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 30,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#F9FAFB",
        borderRadius: 14,
        marginBottom: 16,
        height: 55,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    input: {
        color: "#1F2937",
        fontSize: 15,
        flex: 1,
        marginLeft: 10,
        height: '100%',
        fontWeight: '500',
    },
    inputIcon: {
        marginRight: 4,
    },
    loginButton: {
        backgroundColor: '#3A88F6',
        borderRadius: 14,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        shadowColor: "#3A88F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    loginButtonPressed: {
        opacity: 0.8,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: 'bold',
    },
});