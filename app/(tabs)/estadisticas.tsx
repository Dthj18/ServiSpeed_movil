import { faBook, faBullhorn, faCalendarDays, faChevronLeft, faMugHot, faShirt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack } from 'expo-router';
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts"; // Usamos la librería de tu compañero
import { SafeAreaView } from "react-native-safe-area-context";

export default function EstadisticasScreen() {
    
    // Datos para la gráfica de línea (simulados para que se vea como el mockup)
    const lineData = [
        { value: 0, label: 'Ene' },
        { value: 20, label: 'Feb' },
        { value: 10, label: 'Mar' },
        { value: 28, label: 'Abr' },
        { value: 22, label: 'May' },
        { value: 12, label: 'Jun' },
        { value: 22, label: 'Jul' },
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
                    <View style={styles.blueCard}>
                        <Text style={styles.cardTitle}>{"Ventas por periodo"}</Text>
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <LineChart
                                data={lineData}
                                color="#2962FF"
                                thickness={3}
                                dataPointsColor="#2962FF"
                                startFillColor="#2962FF"
                                endFillColor="#2962FF"
                                startOpacity={0}
                                endOpacity={0}
                                initialSpacing={10}
                                noOfSections={4}
                                yAxisColor="transparent"
                                xAxisColor="gray"
                                rulesColor="gray"
                                rulesType="solid"
                                yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: 'gray', fontSize: 10 }}
                                height={120}
                                width={260} // Ajustado para que quepa en la tarjeta
                                hideDataPoints={false}
                            />
                        </View>
                    </View>

                    {/* --- SECCIÓN 3: MÉTRICAS (Tarjetas Amarillas) --- */}
                    <Text style={[styles.cardTitle, { marginTop: 10, marginBottom: 10 }]}>
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
        width: '80%', // Para que el texto se acomode en dos líneas si es necesario
    }
});