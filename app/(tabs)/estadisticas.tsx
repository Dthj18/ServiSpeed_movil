import { faBook, faBullhorn, faCalendarDays, faChevronLeft, faMugHot, faShirt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack } from 'expo-router';
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EstadisticasScreen() {
    
    // Datos para la gráfica pequeña (Resumen)
    const lineDataSmall = [
        { value: 0 }, 
        { value: 20 }, 
        { value: 10 }, 
        { value: 28 }, 
        { value: 22 }, 
        { value: 12 }, 
        { value: 22 }
    ];

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Estadísticas",
                    headerTitleAlign: 'center',
                    headerTitleStyle: {
                        fontFamily: "LexendTera-SemiBold",
                        fontSize: 15,
                    },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 20 }}>
                            <FontAwesomeIcon icon={faChevronLeft} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={() => {}} style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faCalendarDays} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    
                    <Text style={styles.pageTitle}>{"Reportes y Estadísticas"}</Text>

                    {/* --- SECCIÓN 1: PRODUCTOS (Tarjeta Rosa) --- */}
                    <View style={styles.pinkCard}>
                        <Text style={styles.cardTitle}>{"Productos más solicitados"}</Text>

                        {/* Fila 1 */}
                        <View style={styles.statRow}>
                            <View style={styles.iconContainer}>
                                <FontAwesomeIcon icon={faShirt} size={18} color="#FF5252" /> 
                            </View>
                            <Text style={styles.statLabel}>{"Playeras personalizadas"}</Text>
                            <View style={styles.spacer} />
                            <Text style={styles.statValue}>{"345"}</Text>
                        </View>

                        {/* Fila 2 */}
                        <View style={styles.statRow}>
                            <View style={styles.iconContainer}>
                                <FontAwesomeIcon icon={faMugHot} size={18} color="#FF4081" />
                            </View>
                            <Text style={styles.statLabel}>{"Tazas personalizadas"}</Text>
                            <View style={styles.spacer} />
                            <Text style={styles.statValue}>{"290"}</Text>
                        </View>

                        {/* Fila 3 */}
                        <View style={styles.statRow}>
                            <View style={styles.iconContainer}>
                                <FontAwesomeIcon icon={faBullhorn} size={18} color="#448AFF" />
                            </View>
                            <Text style={styles.statLabel}>{"Publicidad impresa"}</Text>
                            <View style={styles.spacer} />
                            <Text style={styles.statValue}>{"150"}</Text>
                        </View>

                         {/* Fila 4 */}
                         <View style={styles.statRow}>
                            <View style={styles.iconContainer}>
                                <FontAwesomeIcon icon={faBook} size={18} color="#D32F2F" />
                            </View>
                            <Text style={styles.statLabel}>{"Libros"}</Text>
                            <View style={styles.spacer} />
                            <Text style={styles.statValue}>{"100"}</Text>
                        </View>
                    </View>

                    {/* --- SECCIÓN 2: VENTAS (Tarjeta Azul con Gráfica) --- */}
                    {/* ¡AQUÍ ESTÁ LA MAGIA! Al presionar, vamos a /ventas-por-periodo */}
                    <TouchableOpacity 
                        style={styles.blueCard}
                        onPress={() => router.push('/ventas-por-periodo')} 
                        activeOpacity={0.9}
                    >
                        <Text style={styles.cardTitle}>{"Ventas por periodo"}</Text>
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <LineChart
                                data={lineDataSmall}
                                color="#2962FF"
                                thickness={3}
                                hideDataPoints={false}
                                noOfSections={3}
                                yAxisColor="transparent"
                                xAxisColor="gray"
                                rulesType="solid"
                                rulesColor="rgba(0,0,0,0.1)"
                                height={100}
                                width={260} // Ajustado para que quepa en la tarjeta
                                pointerConfig={{
                                    pointerStripHeight: 100,
                                    pointerStripColor: 'lightgray',
                                    pointerStripWidth: 2,
                                    pointerColor: 'lightgray',
                                    radius: 4,
                                    pointerLabelWidth: 100,
                                    pointerLabelHeight: 120,
                                    activatePointersOnLongPress: true,
                                    autoAdjustPointerLabelPosition: false,
                                }}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* --- SECCIÓN 3: MÉTRICAS (Tarjetas Amarillas) --- */}
                    <Text style={[styles.cardTitle, { marginTop: 10, marginBottom: 10, color: '#000', textAlign: 'left', marginLeft: 4 }]}>
                        {"Métricas de productividad"}
                    </Text>

                    <View style={styles.metricsRow}>
                        {/* Tarjeta Izquierda */}
                        <View style={styles.yellowCard}>
                            <Text style={styles.metricValue}>{"$3500.00"}</Text>
                            <Text style={styles.metricLabel}>{"Ventas del día"}</Text>
                        </View>

                        <View style={{ width: 15 }} />

                        {/* Tarjeta Derecha */}
                        <View style={styles.yellowCard}>
                            <Text style={styles.metricValue}>{"$250.00"}</Text>
                            <Text style={styles.metricLabel}>{"Promedio de compra"}</Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 120, 
    },
    pageTitle: {
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        marginBottom: 14,
        marginLeft: 4,
    },
    // --- TARJETA ROSA (Productos) ---
    pinkCard: {
        backgroundColor: "#FFC4C4", // Rosa sólido del mockup
        borderRadius: 21,
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // --- TARJETA AZUL (Gráfica) ---
    blueCard: {
        backgroundColor: "#C4D7FF", // Azul sólido del mockup
        borderRadius: 21,
        paddingVertical: 15,
        paddingHorizontal: 10, // Menos padding horizontal para que quepa la gráfica
        marginBottom: 20,
        minHeight: 200,
        // Sombra sutil para indicar que es botón
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        color: "#000000",
        marginBottom: 15,
        textAlign: 'center',
    },
    // --- FILAS DE PRODUCTOS ---
    statRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    iconContainer: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
    },
    statLabel: {
        fontSize: 11,
        color: "#000000",
        fontWeight: "500",
    },
    spacer: {
        flex: 1,
    },
    statValue: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#000000",
    },
    // --- MÉTRICAS INFERIORES (Amarillas) ---
    metricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    yellowCard: {
        flex: 1, // Ocupa el 50% del espacio disponible
        backgroundColor: "#FAFFC4", // Amarillo pálido del mockup
        borderRadius: 21,
        paddingVertical: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        color: "#000000",
        marginBottom: 5,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#000000",
        textAlign: 'center',
        width: '80%',
    }
});