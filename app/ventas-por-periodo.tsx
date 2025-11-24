import { faCalendarDays, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack } from 'expo-router';
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VentasPorPeriodoScreen() {

    // Datos para la gráfica (Simulando la línea azul del mockup)
    const lineData = [
        { value: 0, label: 'Ene' },
        { value: 20, label: 'Feb' },
        { value: 10, label: 'Mar' },
        { value: 40, label: 'Abr' },
        { value: 25, label: 'May' },
        { value: 12, label: 'Jun' },
        { value: 30, label: 'Jul' },
    ];

    return (
        <>
            {/* HEADER: Definido aquí mismo para mantener el control */}
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Ventas por periodo",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { fontFamily: "LexendTera-SemiBold", fontSize: 14 },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false, // Quita la sombra para que se vea limpio
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 20 }}>
                            <FontAwesomeIcon icon={faChevronLeft} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faCalendarDays} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>

                    {/* Título interno (opcional, ya está en el header pero el diseño lo tenía) */}
                    <Text style={styles.pageTitle}>{"Ventas por periodo"}</Text>

                    {/* 1. FILTROS DE TIEMPO (Interpretados del diseño) */}
                    <View style={styles.filtersRow}>
                        {/* Grupo de botones unidos */}
                        <View style={styles.filterGroup}>
                            <TouchableOpacity style={styles.filterItem}>
                                <Text style={styles.filterText}>Hoy</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.filterItem}>
                                <Text style={styles.filterText}>Semana</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.filterItem}>
                                <Text style={styles.filterText}>Mes</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.filterItem}>
                                <Text style={styles.filterText}>3 meses</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón de fecha específica */}
                        <TouchableOpacity style={styles.dateButton}>
                            <Text style={styles.filterText}>1 - 31 mar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2. GRÁFICA GRANDE (Tarjeta Azul) */}
                    <View style={styles.chartCard}>
                        <LineChart
                            data={lineData}
                            color="#FFFFFF"
                            thickness={3}
                            dataPointsColor="#FFFFFF"
                            startFillColor="#FFFFFF"
                            endFillColor="#FFFFFF"
                            startOpacity={0.2}
                            endOpacity={0}
                            initialSpacing={20}
                            yAxisColor="transparent"
                            xAxisColor="rgba(255,255,255,0.3)"
                            rulesColor="rgba(255,255,255,0.2)"
                            yAxisTextStyle={{ color: '#FFF', fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: '#FFF', fontSize: 10 }}
                            height={180}
                            width={300} // Ajuste manual para el ancho
                            curved
                            isAnimated
                        />
                    </View>

                    {/* 3. INDICADORES CLAVE (Lo que seguía en el diseño) */}
                    <View style={styles.kpiGrid}>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Total de ventas</Text>
                            <Text style={styles.kpiValue}>$70000.00</Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Número de pedidos</Text>
                            <Text style={styles.kpiValue}>89</Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Ticket promedio</Text>
                            <Text style={styles.kpiValue}>$550.00</Text>
                        </View>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>% crecimiento</Text>
                            <Text style={[styles.kpiValue, { color: '#4CAF50' }]}>15%</Text>
                        </View>
                    </View>

                    {/* 4. TABLA DE DETALLE */}
                    <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeadText, { flex: 1 }]}>Fecha</Text>
                            <Text style={[styles.tableHeadText, { flex: 2 }]}>Cliente</Text>
                            <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>Total</Text>
                        </View>
                        
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableText, { flex: 1 }]}>02 mar</Text>
                            <Text style={[styles.tableText, { flex: 2 }]}>Rubén Tuesta</Text>
                            <Text style={[styles.tableText, { flex: 1, textAlign: 'right' }]}>$1200.00</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableText, { flex: 1 }]}>03 mar</Text>
                            <Text style={[styles.tableText, { flex: 2 }]}>Jorge Tuz</Text>
                            <Text style={[styles.tableText, { flex: 1, textAlign: 'right' }]}>$550.00</Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFFFFF" },
    scrollContainer: { padding: 20, paddingBottom: 50 },
    
    pageTitle: {
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        marginBottom: 14,
        marginLeft: 4,
        color: '#000',
    },

    // --- ESTILOS DE FILTROS (Adaptados del diseño original) ---
    filtersRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    filterGroup: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
        justifyContent: 'space-between',
    },
    filterItem: {
        paddingHorizontal: 5,
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E0E0E0',
    },
    dateButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    filterText: {
        fontSize: 10,
        color: '#333',
        fontWeight: '500',
    },

    // --- GRÁFICA AZUL ---
    chartCard: {
        backgroundColor: "#7FA8EA", // Azul del diseño original
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },

    // --- KPIs ---
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    kpiCard: {
        width: '48%',
        backgroundColor: '#FFF9C4',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
    },
    kpiLabel: { fontSize: 10, color: '#666', marginBottom: 5 },
    kpiValue: { fontSize: 16, fontWeight: 'bold', fontFamily: 'LexendTera-SemiBold', color: '#000' },

    // --- TABLA ---
    tableContainer: { backgroundColor: '#FFF0F0', borderRadius: 15, padding: 15 },
    tableHeader: { flexDirection: 'row', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 5 },
    tableHeadText: { fontSize: 11, fontWeight: 'bold', color: '#555' },
    tableRow: { flexDirection: 'row', marginBottom: 8 },
    tableText: { fontSize: 11, color: '#333' },
});