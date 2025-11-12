import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const onLoginPress = () => {
        console.log("Iniciando sesión con:", email, password);
        router.replace('../cotizaciones')
    };



    return (
        <>
            <Stack.Screen options={{ headerShown: false }}/>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <LinearGradient
                    colors={['#7EE2B5', '#457C63']}
                    style={StyleSheet.absoluteFill}
                />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                ></KeyboardAvoidingView>
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

                        <TouchableOpacity onPress={onLoginPress}
                            style={styles.loginButtonWrapper}>
                            <LinearGradient colors={["#7EE2B585", "#457C6385"]}
                                style={styles.loginButtonGradient}>
                                <Text style={styles.loginButtonText}>{"Iniciar Sesión"}</Text>

                            </LinearGradient>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
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