import { faCalendarDays, faChartPie, faListUl } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function CotizacionesScreen() {

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pieData, setPieData] = useState<any[]>([]);
    const [razonesData, setRazonesData] = useState<any[]>([]);
    const [totalMovimientos, setTotalMovimientos] = useState(0);

    const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const ID_USUARIO = 2;

    const getColor = (categoria: string) => {
        if (categoria === 'Aprobadas' || categoria === 'Completado') return '#7CCB64';
        if (categoria === 'Canceladas') return '#FE5F5F';
        return '#3A88F6';
    };

    const fetchCotizaciones = async () => {
        try {
            let url = `http://10.0.0.1:8082/api/dashboard/movil/graficas?idUsuario=${ID_USUARIO}`;

            if (fechaSeleccionada) {
                const year = fechaSeleccionada.getFullYear();
                const month = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0');
                const day = fechaSeleccionada.getDate().toString().padStart(2, '0');
                const fechaFiltroStr = `${year}-${month}-${day}`;

                url += `&fecha=${fechaFiltroStr}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error API: ${response.status}`);
            const data = await response.json();

            let suma = 0;

            const graficaPastel = (data.datosPastel || []).map((item: any) => {
                suma += item.cantidad;
                return {
                    name: item.categoria,
                    population: item.cantidad,
                    color: getColor(item.categoria),
                    legendFontColor: "#555",
                    legendFontSize: 12
                };
            });
            setPieData(graficaPastel);
            setTotalMovimientos(suma);

            if (data.datosRadar && Array.isArray(data.datosRadar)) {
                const razones = data.datosRadar.map((item: any) => ({
                    texto: item.etiqueta || "Sin motivo",
                    cantidad: item.valor || 0
                }));
                const razonesFiltradas = razones.filter((r: any) => r.cantidad > 0);
                setRazonesData(razonesFiltradas);
            } else {
                setRazonesData([]);
            }

        } catch (error) {
            console.error("Error cargando datos:", error);
            setPieData([]);
            setRazonesData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchCotizaciones();
    }, [fechaSeleccionada]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCotizaciones();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setMostrarCalendario(false);
            if (event.type === 'set' && selectedDate) setFechaSeleccionada(selectedDate);
            return;
        }
        if (selectedDate) setFechaSeleccionada(selectedDate);
    };

    const cerrarCalendario = () => setMostrarCalendario(false);
    const limpiarFecha = () => setFechaSeleccionada(null);

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#ffffff",
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Cotizaciones",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { fontFamily: "LexendTera-SemiBold", fontSize: 15 },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setMostrarCalendario(true)} style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faCalendarDays} size={20} color={fechaSeleccionada ? "#3A88F6" : "#525252"} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <View style={styles.container}>

                {/* BARRA DE FILTRO ACTIVO */}
                {fechaSeleccionada && (
                    <View style={styles.filtroBar}>
                        <Text style={styles.filtroTexto}>
                            Filtrando por: {fechaSeleccionada.toISOString().split('T')[0]}
                        </Text>
                        <TouchableOpacity onPress={limpiarFecha}>
                            <Text style={styles.filtroReset}>Reestablecer</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >

                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color="#3A88F6" style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            {/* GRÁFICA DE PASTEL */}
                            <View style={styles.cardContainer}>
                                <View style={styles.cardHeader}>
                                    <FontAwesomeIcon icon={faChartPie} size={16} color="#3A88F6" style={{ marginRight: 8 }} />
                                    <Text style={styles.cardTitle}>Estado General</Text>
                                </View>

                                {pieData.length > 0 ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <PieChart
                                            data={pieData}
                                            width={screenWidth - 60}
                                            height={220}
                                            chartConfig={chartConfig}
                                            accessor={"population"}
                                            backgroundColor={"transparent"}
                                            paddingLeft={"15"}
                                            center={[0, 0]}
                                            absolute
                                        />
                                    </View>
                                ) : (
                                    <Text style={styles.noDataText}>No hay datos en este periodo.</Text>
                                )}
                            </View>

                            {/* LISTA DE RAZONES */}
                            <View style={styles.cardContainer}>
                                <View style={styles.cardHeader}>
                                    <FontAwesomeIcon icon={faListUl} size={16} color="#3A88F6" style={{ marginRight: 8 }} />
                                    <Text style={styles.cardTitle}>Razones de Rechazo</Text>
                                </View>

                                {razonesData.length === 0 ? (
                                    <Text style={styles.noDataText}>No hay cancelaciones registradas.</Text>
                                ) : (
                                    razonesData.map((item, index) => {
                                        const maxVal = Math.max(...razonesData.map(r => r.cantidad));
                                        const porcentaje = maxVal > 0 ? (item.cantidad / maxVal) * 100 : 0;

                                        return (
                                            <View key={index} style={styles.reasonRow}>
                                                <View style={styles.reasonHeader}>
                                                    <Text style={styles.reasonLabel}>{item.texto}</Text>
                                                    <Text style={styles.reasonCount}>{item.cantidad}</Text>
                                                </View>
                                                <View style={styles.track}>
                                                    <View style={[styles.bar, { width: `${porcentaje}%` }]} />
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        </>
                    )}

                </ScrollView>

                {/* MODAL DE CALENDARIO */}
                {mostrarCalendario && (
                    Platform.OS === 'ios' ? (
                        <Modal transparent={true} animationType="fade" visible={mostrarCalendario} onRequestClose={cerrarCalendario}>
                            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={cerrarCalendario}>
                                <View style={styles.iosDatePickerContainer} onStartShouldSetResponder={() => true}>
                                    <View style={styles.iosToolbar}>
                                        <TouchableOpacity onPress={cerrarCalendario}>
                                            <Text style={styles.iosButtonText}>Listo</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker value={fechaSeleccionada || new Date()} mode="date" display="spinner" onChange={onDateChange} textColor="#000000" themeVariant="light" />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    ) : (
                        <DateTimePicker value={fechaSeleccionada || new Date()} mode="date" display="default" onChange={onDateChange} />
                    )
                )}

            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5" },
    scrollContainer: { padding: 20, paddingBottom: 50 },

    filtroBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#F0F8FF'
    },
    filtroTexto: { color: '#3A88F6', fontWeight: 'bold', marginRight: 10 },
    filtroReset: { color: '#FF5555', fontWeight: 'bold' },

    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 20,
        padding: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 10
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        fontFamily: "LexendTera-SemiBold",
    },

    noDataText: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 20
    },
    reasonRow: { marginBottom: 15, width: '100%' },
    reasonHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    reasonLabel: { fontSize: 13, color: '#555', fontWeight: '600', maxWidth: '85%' },
    reasonCount: { fontSize: 13, fontWeight: 'bold', color: '#FE5F5F' },
    track: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, width: '100%', overflow: 'hidden' },
    bar: { height: '100%', backgroundColor: '#FE5F5F', borderRadius: 4 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    iosDatePickerContainer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
    iosToolbar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#F8F8F8', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    iosButtonText: { color: '#3A88F6', fontSize: 16, fontWeight: 'bold' },
});