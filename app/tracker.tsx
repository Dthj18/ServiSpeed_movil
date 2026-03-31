import {
    faBoxOpen,
    faCheckCircle,
    faCircleInfo,
    faClipboardList, faDollarSign, faPalette,
    faPaperPlane,
    faPencilAlt,
    faPrint,
    faThumbsDown, faThumbsUp,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// 1. DICCIONARIO DE ESTADOS (UI Centralizada)
// Aquí definimos el color y el ícono basado en la fase. 
// Cuando conecten la API, asegúrense de que la "claveEstatus" coincida con estas llaves.
const DICCIONARIO_ESTATUS: Record<string, { color: string, icono: any }> = {
    'COT_INICIADA':      { color: '#FFB300', icono: faClipboardList }, // Amarillo
    'COT_PAGADA':        { color: '#3A88F6', icono: faDollarSign },    // Azul
    'DIS_INICIO':        { color: '#8E24AA', icono: faPalette },       // Morado Oscuro
    'DIS_DESARROLLO':    { color: '#9C27B0', icono: faPencilAlt },     // Morado Medio
    'DIS_ENVIADO':       { color: '#5E35B1', icono: faPaperPlane },    // Indigo
    'DIS_RECHAZADO':     { color: '#FE5F5F', icono: faThumbsDown },    // Rojo
    'DIS_APROBADO':      { color: '#4CAF50', icono: faThumbsUp },      // Verde
    'PROD_TALLER':       { color: '#FF9800', icono: faPrint },         // Naranja
    'PROD_LISTA':        { color: '#009688', icono: faCheckCircle },   // Teal (Verde azulado)
    'ORD_ENTREGADA':     { color: '#607D8B', icono: faBoxOpen },       // Gris Azulado
    'DEFAULT':           { color: '#9CA3AF', icono: faCircleInfo }     // Gris por defecto
};

const obtenerEstiloEstatus = (clave: string) => {
    return DICCIONARIO_ESTATUS[clave] || DICCIONARIO_ESTATUS['DEFAULT'];
};

// 2. INTERFACES (Buenas prácticas de TypeScript)
interface MovimientoTracker {
    idMovimiento: string;
    claveEstatus: string; // Esta es la llave que conecta con el diccionario
    titulo: string;
    fechaStr: string;
    nombreEncargado: string;
}

// 3. DATOS MOCK (Basados en el diseño de escritorio para poder maquetar hoy)
const mockHistorial: MovimientoTracker[] = [
    { idMovimiento: '1', claveEstatus: 'COT_INICIADA', titulo: 'Cotización iniciada', fechaStr: '31 Dec 2025 - 12:10 PM', nombreEncargado: 'Jorge Luis Tuz Moreno' },
    { idMovimiento: '2', claveEstatus: 'COT_PAGADA', titulo: 'Cotización pagada (total o anticipo)', fechaStr: '31 Dec 2025 - 12:13 PM', nombreEncargado: 'Jorge Luis Tuz Moreno' },
    { idMovimiento: '3', claveEstatus: 'DIS_INICIO', titulo: 'Orden en etapa de diseño', fechaStr: '31 Dec 2025 - 12:14 PM', nombreEncargado: 'Edgar Garcia' },
    { idMovimiento: '4', claveEstatus: 'DIS_DESARROLLO', titulo: 'Diseño en desarrollo', fechaStr: '31 Dec 2025 - 12:14 PM', nombreEncargado: 'Angel suarez' },
    { idMovimiento: '5', claveEstatus: 'DIS_ENVIADO', titulo: 'Diseño enviado al cliente para revisión', fechaStr: '31 Dec 2025 - 12:15 PM', nombreEncargado: 'Angel suarez' },
    { idMovimiento: '6', claveEstatus: 'DIS_RECHAZADO', titulo: 'Diseño no aprobado, requiere corrección', fechaStr: '31 Dec 2025 - 12:20 PM', nombreEncargado: 'Angel suarez' },
    { idMovimiento: '7', claveEstatus: 'DIS_APROBADO', titulo: 'Diseño aprobado por el cliente', fechaStr: '31 Dec 2025 - 12:36 PM', nombreEncargado: 'Angel suarez' },
    { idMovimiento: '8', claveEstatus: 'PROD_TALLER', titulo: 'Orden en etapa de taller / impresión', fechaStr: '31 Dec 2025 - 12:51 PM', nombreEncargado: 'Edgar Garcia' },
    { idMovimiento: '9', claveEstatus: 'PROD_LISTA', titulo: 'Orden lista para entrega', fechaStr: '31 Dec 2025 - 12:51 PM', nombreEncargado: 'Edgar Garcia' },
    { idMovimiento: '10', claveEstatus: 'ORD_ENTREGADA', titulo: 'Orden entregada y finalizada', fechaStr: '21 Jan 2026 - 05:46 PM', nombreEncargado: 'Edgar Garcia' },
];
export default function TrackerScreen() {
    const router = useRouter();
    const numeroOrden = "#37"; 

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Seguimiento de Orden",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { fontFamily: "LexendTera-SemiBold", fontSize: 16 },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                }}
            />

            {/* HEADER CENTRADO */}
            <View style={styles.headerInfo}>
                <Text style={styles.subtitle}>
                    Historial de movimientos para la orden{' '}
                    <Text style={styles.orderNumber}>{numeroOrden}</Text>
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {mockHistorial.map((item, index) => {
                    const isLast = index === mockHistorial.length - 1;
                    const estilo = obtenerEstiloEstatus(item.claveEstatus);
                    
                    // Magia Senior: Le agregamos '08' al hex para hacerlo 3% transparente (súper sutil)
                    const colorPastel = estilo.color + '08'; 

                    return (
                        <View key={item.idMovimiento} style={styles.timelineRow}>
                            
                            <View style={styles.timelineGraphic}>
                                <View style={[styles.iconCircle, { backgroundColor: estilo.color }]}>
                                    <FontAwesomeIcon icon={estilo.icono} size={14} color="#FFF" />
                                </View>
                                {!isLast && <View style={styles.verticalLine} />}
                            </View>

                            <View style={[styles.cardContainer, { backgroundColor: colorPastel, borderColor: estilo.color + '15' }]}>
                                {/* El título vuelve a la fuente del sistema */}
                                <Text style={[styles.cardTitle, { color: estilo.color }]}>{item.titulo}</Text>
                                <Text style={styles.cardDate}>{item.fechaStr}</Text>
                                
                                <View style={styles.userContainer}>
                                    <FontAwesomeIcon icon={faUser} size={10} color="#3A88F6" style={{ marginRight: 6 }} />
                                    <Text style={styles.cardUser}>Atendió: {item.nombreEncargado}</Text>
                                </View>
                            </View>

                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ESTILOS ACTUALIZADOS
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#FFFFFF" 
    },
    headerInfo: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 20,
        alignItems: 'center', // Centramos el contenedor
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center', // Centramos el texto
    },
    orderNumber: {
        fontFamily: 'LexendTera-SemiBold', 
        fontSize: 15,
        color: '#3A88F6', 
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    timelineRow: {
        flexDirection: 'row',
    },
    timelineGraphic: {
        width: 45,
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    verticalLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB', 
        marginTop: -4,
        marginBottom: -4,
        zIndex: 1,
    },
    cardContainer: {
        flex: 1,
        borderRadius: 14,
        padding: 16,
        marginLeft: 12,
        marginBottom: 24, 
        borderWidth: 1, 
    },
    cardTitle: {
        // Quitamos fontFamily para que use la del sistema
        fontSize: 14,
        fontWeight: 'bold', // Negrita clásica
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: '#6B7280', 
        marginBottom: 12,
        fontWeight: '500',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF90', 
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    cardUser: {
        fontSize: 12,
        color: '#4B5563', 
        fontWeight: '600',
    }
});