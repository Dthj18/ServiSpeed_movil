import {
    faBoxOpen,
    faCheckCircle,
    faChevronLeft,
    faCircleInfo,
    faClipboardList,
    faDollarSign,
    faPalette,
    faPaperPlane,
    faPencilAlt,
    faPrint,
    faThumbsDown,
    faThumbsUp,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const DICCIONARIO_ESTATUS: Record<string, { color: string, icono: any }> = {
    'COT_INICIADA':      { color: '#FFB300', icono: faClipboardList }, 
    'COT_PAGADA':        { color: '#3A88F6', icono: faDollarSign },    
    'DIS_INICIO':        { color: '#8E24AA', icono: faPalette },       
    'DIS_DESARROLLO':    { color: '#9C27B0', icono: faPencilAlt },     
    'DIS_ENVIADO':       { color: '#5E35B1', icono: faPaperPlane },    
    'DIS_RECHAZADO':     { color: '#FE5F5F', icono: faThumbsDown },    
    'DIS_APROBADO':      { color: '#4CAF50', icono: faThumbsUp },      
    'PROD_TALLER':       { color: '#FF9800', icono: faPrint },         
    'PROD_LISTA':        { color: '#009688', icono: faCheckCircle },   
    'ORD_ENTREGADA':     { color: '#607D8B', icono: faBoxOpen },       
    'DEFAULT':           { color: '#9CA3AF', icono: faCircleInfo }
};

const obtenerEstiloEstatus = (clave: string) => {
    return DICCIONARIO_ESTATUS[clave] || DICCIONARIO_ESTATUS['DEFAULT'];
};

interface MovimientoTracker {
    idMovimiento: string | number;
    claveEstatus: string;
    titulo?: string;
    descripcion?: string; // Respaldo por si viene como descripción
    estatus?: string;     // Respaldo por si viene como estatus
    fechaStr?: string;
    fecha?: string;       // Respaldo por si viene como fecha corta o ISO
    nombreEncargado?: string;
    encargado?: string;   // Respaldo alternativo
    usuario?: string;     // Respaldo alternativo
}

export default function TrackerScreen() {
    const router = useRouter();
    const { idOrden } = useLocalSearchParams();

    const [historial, setHistorial] = useState<MovimientoTracker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (idOrden) {
            getHistorial(Number(idOrden));
        } else {
            setLoading(false);
        }
    }, [idOrden]);

    const getHistorial = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetch(`http://10.0.0.1:8082/api/ordenes/${id}/historial`);
            if (!res.ok) throw new Error('Error al obtener historial');
            const data = await res.json();
            setHistorial(data);
        } catch (error) {
            console.error("Error cargando historial: ", error);
            setHistorial([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Seguimiento de Orden",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { 
                        fontFamily: "LexendTera-SemiBold", 
                        fontSize: 16 
                    },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={styles.backButton}
                        >
                            <FontAwesomeIcon 
                                icon={faChevronLeft} 
                                size={20} 
                                color="#333333" 
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <View style={styles.headerInfo}>
                <Text style={styles.subtitle}>
                    Historial de movimientos para la orden{' '}
                    <Text style={styles.orderNumber}>#{idOrden || 'N/A'}</Text>
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator 
                    size="large" 
                    color="#3A88F6" 
                    style={styles.loader} 
                />
            ) : historial.length === 0 ? (
                <Text style={styles.emptyText}>
                    No se encontró historial para esta orden.
                </Text>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                >
                    {historial.map((item, index) => {
                        const isLast = index === historial.length - 1;
                        const estilo = obtenerEstiloEstatus(item.claveEstatus);
                        const colorPastel = estilo.color + '08';

                        // Mapeos inteligentes para prevenir que los textos salgan vacíos
                        const textoTitulo = item.titulo || item.descripcion || item.estatus || "Cambio de Estado";
                        const textoFecha = item.fechaStr || item.fecha || "Fecha no registrada";
                        const textoEncargado = item.nombreEncargado || item.encargado || item.usuario || "Sistema";

                        return (
                            <View 
                                key={item.idMovimiento || index.toString()} 
                                style={styles.timelineRow}
                            >
                                {/* LÍNEA GRÁFICA DE TIEMPO */}
                                <View style={styles.timelineGraphic}>
                                    <View style={[styles.iconCircle, { backgroundColor: estilo.color }]}>
                                        <FontAwesomeIcon 
                                            icon={estilo.icono} 
                                            size={14} 
                                            color="#FFF" 
                                        />
                                    </View>
                                    {!isLast && <View style={styles.verticalLine} />}
                                </View>

                                {/* TARJETA DE INFORMACIÓN */}
                                <View style={[
                                    styles.cardContainer, 
                                    { 
                                        backgroundColor: colorPastel, 
                                        borderColor: estilo.color + '15' 
                                    }
                                ]}>
                                    <Text style={[styles.cardTitle, { color: estilo.color }]}>
                                        {textoTitulo}
                                    </Text>
                                    
                                    <Text style={styles.cardDate}>
                                        {textoFecha}
                                    </Text>

                                    <View style={styles.userContainer}>
                                        <FontAwesomeIcon 
                                            icon={faUser} 
                                            size={10} 
                                            color="#3A88F6" 
                                            style={styles.userIcon} 
                                        />
                                        <Text style={styles.cardUser}>
                                            Atendió: {textoEncargado}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    },
    backButton: {
        paddingRight: 20, 
        paddingVertical: 10
    },
    headerInfo: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 20,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    orderNumber: {
        fontFamily: 'LexendTera-SemiBold',
        fontSize: 15,
        color: '#3A88F6',
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 40
    },
    emptyText: {
        textAlign: 'center', 
        color: '#999', 
        marginTop: 40, 
        paddingHorizontal: 20
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
        fontSize: 14,
        fontWeight: 'bold',
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
    userIcon: {
        marginRight: 6
    },
    cardUser: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '600',
    }
});