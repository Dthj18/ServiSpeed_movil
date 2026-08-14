import { apiFetch } from '@/services/apiClient';
import { getUsuario } from '@/services/session';
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

type Periodo = 'dia' | 'semana' | 'mes' | 'anio';

export default function CotizacionesScreen() {

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pieData, setPieData] = useState<any[]>([]);
    const [razonesData, setRazonesData] = useState<any[]>([]);
    const [totalMovimientos, setTotalMovimientos] = useState(0);

    const [fechaBase, setFechaBase] = useState<Date>(new Date());
    const [periodo, setPeriodo] = useState<Periodo>('dia');
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const formatDateISO = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getRangoFechas = (date: Date, tipo: any) => {
        const inicio = new Date(date);
        const fin = new Date(date);
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);

        if (tipo === 'semana') {
            const diaSemana = inicio.getDay() || 7;
            inicio.setDate(inicio.getDate() - diaSemana + 1);
            fin.setDate(fin.getDate() + (7 - diaSemana));
        } else if (tipo === 'mes') {
            inicio.setDate(1);
            fin.setMonth(fin.getMonth() + 1, 0);
        } else if (tipo === 'anio') {
            inicio.setMonth(0, 1);
            fin.setMonth(11, 31);
        }
        return { inicio, fin };
    };

    const getTextoRango = () => {
        const { inicio, fin } = getRangoFechas(fechaBase, periodo);
        const optsDia: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        const optsMes: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

        if (periodo === 'dia') return inicio.toLocaleDateString('es-ES', { dateStyle: 'full' });
        if (periodo === 'semana') return `Semana: ${inicio.toLocaleDateString('es-ES', optsDia)} - ${fin.toLocaleDateString('es-ES', optsDia)}`;
        if (periodo === 'mes') return inicio.toLocaleDateString('es-ES', optsMes);
        if (periodo === 'anio') return `Año ${inicio.getFullYear()}`;
        return '';
    };

    const getColor = (categoria: string) => {
        if (categoria === 'Aprobadas' || categoria === 'Completado') return '#7CCB64';
        if (categoria === 'Canceladas') return '#FE5F5F';
        return '#3A88F6';
    };

    const fetchCotizaciones = async () => {
        try {
            const usuario = await getUsuario();
            const idUsuario = usuario?.idUsuario;

            if (!idUsuario) {
                console.log("No hay usuario en sesión");
                setPieData([]);
                setRazonesData([]);
                return;
            }

            const { inicio, fin } = getRangoFechas(fechaBase || new Date(), periodo);
            let endpoint = `/api/dashboard/movil/graficas?idUsuario=${idUsuario}`;

            if (fechaBase) {
                endpoint += `&fechaInicio=${formatDateISO(inicio)}&fechaFin=${formatDateISO(fin)}`;
            }

            const data = await apiFetch(endpoint);

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
                })).filter((r: any) => r.cantidad > 0);
                setRazonesData(razones);
            } else {
                setRazonesData([]);
            }

        } catch (error) {
            console.error(error);
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
    }, [fechaBase, periodo]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCotizaciones();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setMostrarCalendario(false);
        if (event.type === 'set' && selectedDate) {
            setFechaBase(selectedDate);
        }
    };


    const FilterTab = ({ label, value }: { label: string, value: Periodo }) => {
        const isActive = periodo === value;
        return (
            <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setPeriodo(value)}
                activeOpacity={0.8}
            >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#ffffff",
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
    };

    return (
        <View style={styles.mainContainer}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Estadísticas",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { fontFamily: "LexendTera-SemiBold", fontWeight: '700', fontSize: 15 },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setMostrarCalendario(true)} style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faCalendarDays} size={20} color={"#525252"} />
                        </TouchableOpacity>
                    ),
                }}
            />


            <View style={styles.fixedHeader}>
                <View style={styles.tabsBackground}>
                    <FilterTab label="Día" value="dia" />
                    <FilterTab label="Semana" value="semana" />
                    <FilterTab label="Mes" value="mes" />
                    <FilterTab label="Año" value="anio" />
                </View>

                <View style={styles.dateInfoContainer}>
                    <Text style={styles.dateInfoText}>
                        {getTextoRango().charAt(0).toUpperCase() + getTextoRango().slice(1)}
                    </Text>
                    <TouchableOpacity onPress={() => setFechaBase(new Date())}>
                        <Text style={styles.resetButton}>Hoy</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#3A88F6" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* CARD PASTEL */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBg}>
                                    <FontAwesomeIcon icon={faChartPie} size={14} color="#3A88F6" />
                                </View>
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
                                    <Text style={styles.totalText}>Total: {totalMovimientos} Movimientos</Text>
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.noDataText}>No hay datos en este periodo.</Text>
                                </View>
                            )}
                        </View>

                        {/* CARD RAZONES */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBg, { backgroundColor: '#FFF0F0' }]}>
                                    <FontAwesomeIcon icon={faListUl} size={14} color="#FE5F5F" />
                                </View>
                                <Text style={styles.cardTitle}>Motivos de Cancelación</Text>
                            </View>

                            {razonesData.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.noDataText}>Sin cancelaciones registradas.</Text>
                                </View>
                            ) : (
                                razonesData.map((item, index) => {
                                    const maxVal = Math.max(...razonesData.map(r => r.cantidad));
                                    const porcentaje = maxVal > 0 ? (item.cantidad / maxVal) * 100 : 0;

                                    return (
                                        <View key={index} style={styles.reasonRow}>
                                            <View style={styles.reasonInfo}>
                                                <Text style={styles.reasonText}>{item.texto}</Text>
                                                <Text style={styles.reasonValue}>{item.cantidad}</Text>
                                            </View>
                                            <View style={styles.progressBarTrack}>
                                                <View style={[styles.progressBarFill, { width: `${porcentaje}%` }]} />
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* MODAL */}
            {mostrarCalendario && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="fade" visible={mostrarCalendario} onRequestClose={() => setMostrarCalendario(false)}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMostrarCalendario(false)}>
                            <View style={styles.iosDateContainer}>
                                <View style={styles.iosToolbar}>
                                    <TouchableOpacity onPress={() => setMostrarCalendario(false)}>
                                        <Text style={styles.iosDoneText}>Listo</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker value={fechaBase} mode="date" display="spinner" onChange={onDateChange} textColor="#000000" maximumDate={new Date()} />
                            </View>
                        </TouchableOpacity>
                    </Modal>
                ) : (
                    <DateTimePicker value={fechaBase} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: "#F9FAFB" },

    fixedHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        zIndex: 10,
    },
    tabsBackground: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        height: 35,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        fontWeight: '700',
        color: '#3A88F6',
    },
    dateInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 4
    },
    dateInfoText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600'
    },
    resetButton: {
        fontSize: 13,
        color: '#3A88F6',
        fontWeight: '600'
    },

    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    iconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827"
    },
    emptyState: { paddingVertical: 30, alignItems: 'center' },
    noDataText: { color: '#9CA3AF', fontStyle: 'italic' },
    totalText: { marginTop: 15, fontSize: 13, color: '#6B7280', fontWeight: '500' },

    reasonRow: { marginBottom: 16 },
    reasonInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    reasonText: { fontSize: 13, color: '#374151', fontWeight: '500' },
    reasonValue: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
    progressBarTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, width: '100%', overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#EF4444', borderRadius: 4 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
    iosDateContainer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
    iosToolbar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    iosDoneText: { color: '#3A88F6', fontSize: 16, fontWeight: '600' }
});