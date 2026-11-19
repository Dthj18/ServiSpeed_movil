import { apiFetch } from '@/services/apiClient';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faArrowRight, faBell, faChartSimple, faClipboardList, faFileInvoiceDollar, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get("window").width;

const COLOR_INGRESOS = '#20C997';
const COLOR_EGRESOS = '#FF6B6B';

interface DashboardResumen {
    cotizacionesMes: number;
    ordenesActivas: number;
    pagosPendientes: number;
    pagoTotal: number;
}

interface PuntoGrafica {
    label: string;
    ingresos: number;
    egresos: number;
}

interface FinanzasDTO {
    balanceTotal: number;
    datosGrafica: PuntoGrafica[];
}

export default function DashboardScreen() {

    const [filtroTiempo, setFiltroTiempo] = useState('Semana');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [resumen, setResumen] = useState<DashboardResumen>({
        cotizacionesMes: 0,
        ordenesActivas: 0,
        pagosPendientes: 0,
        pagoTotal: 0
    });

    const [finanzas, setFinanzas] = useState<FinanzasDTO>({
        balanceTotal: 0,
        datosGrafica: []
    });

    const fetchDashboardData = async () => {
        try {
            const data = await apiFetch('/api/dashboard/resumen');
            setResumen(data);
        } catch (error: any) {
            console.error("Error al obtener datos del dashboard:", error);
            if (error.status !== 401) {
                setError(true);
            }
        }
    };

    const fetchFinanzas = async () => {
        try {
            const data = await apiFetch(`/api/dashboard/finanzas/grafica-app?filtro=${filtroTiempo.toLowerCase()}`);
            setFinanzas(data);
        } catch (error: any) {
            console.error("Error finanzas:", error);
            if (error.status !== 401) {
                setError(true);
            }
        }
    };

    const cargarTodo = useCallback(() => {
        setError(false);
        Promise.all([fetchDashboardData(), fetchFinanzas()]).finally(() => setLoading(false));
    }, [filtroTiempo]);

    useFocusEffect(
        useCallback(() => {
            cargarTodo();
        }, [cargarTodo])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setError(false);

        // CORRECCIÓN APLICADA AQUÍ:
        await Promise.all([fetchDashboardData(), fetchFinanzas()]);

        setRefreshing(false);
    }, [filtroTiempo]);

    const formatoMoneda = (cantidad: any) => {
        if (cantidad === null || cantidad === undefined) return "$0.00";
        const numero = Number(cantidad);
        if (isNaN(numero)) return "$0.00";
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(numero);
    };

    const chartData = useMemo(() => {
        const result: any[] = [];
        finanzas.datosGrafica.forEach((item) => {
            result.push({
                value: item.ingresos,
                label: item.label,
                spacing: 2,
                labelWidth: 50, // ✨ Lo ampliamos para que "08:00" quepa holgadamente
                labelTextStyle: {
                    color: '#6B7280',
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 6,
                    textAlign: 'center',
                    marginLeft: -8 // ✨ Magia matemática: empuja la caja a la izquierda para centrarla perfecto bajo las barras
                },
                frontColor: COLOR_INGRESOS,
                tipo: 'Ingresos'
            });
            result.push({
                value: item.egresos,
                spacing: finanzas.datosGrafica.length <= 5 ? 30 : 15,
                frontColor: COLOR_EGRESOS,
                tipo: 'Egresos'
            });
        });
        return result;
    }, [finanzas.datosGrafica]);

    const topeGrafica = useMemo(() => {
        let max = 0;
        finanzas.datosGrafica.forEach(item => {
            if (item.ingresos > max) max = item.ingresos;
            if (item.egresos > max) max = item.egresos;
        });

        return max === 0 ? 100 : max * 1.40;
    }, [finanzas.datosGrafica]);

    const BotonFiltro = ({ texto }: { texto: string }) => (
        <TouchableOpacity
            style={[styles.periodButton, filtroTiempo === texto && styles.periodButtonActive]}
            onPress={() => setFiltroTiempo(texto)}
            activeOpacity={0.7}
        >
            <Text style={[styles.periodText, filtroTiempo === texto && styles.periodTextActive]}>
                {texto}
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#5C7CFA" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, styles.centered, { padding: 20 }]}>
                <Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 15, fontSize: 16 }}>
                    No se pudo cargar la información del dashboard.
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setLoading(true);
                        cargarTodo();
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Dashboard",
                    headerTitleAlign: 'center',
                    headerTitleStyle: {
                        fontFamily: "LexendTera-SemiBold",
                        fontSize: 16,
                        color: '#111827',
                    },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                    headerLeft: () => null,
                    headerRight: () => (
                        <TouchableOpacity style={{ marginRight: 20 }} activeOpacity={0.7}>
                            <FontAwesomeIcon icon={faBell as IconProp} size={22} color="#4B5563" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#5C7CFA']}
                        tintColor="#5C7CFA"
                    />
                }>

                    <View style={styles.cardsGrid}>
                        <TouchableOpacity style={[styles.card, { backgroundColor: '#5C7CFA' }]} onPress={() => router.push('/(tabs)/cotizaciones')} activeOpacity={0.9}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>
                                    <FontAwesomeIcon icon={faFileInvoiceDollar as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{resumen.cotizacionesMes}</Text>
                            </View>
                            <Text style={styles.cardLabel}>Cotizaciones del mes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.card, { backgroundColor: '#4DABF7' }]} onPress={() => router.push('/(tabs)/ordenes')} activeOpacity={0.9}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>
                                    <FontAwesomeIcon icon={faClipboardList as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{resumen.ordenesActivas}</Text>
                            </View>
                            <Text style={styles.cardLabel}>Órdenes en curso</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: '#374151' }]}
                            onPress={() => router.push({ pathname: '/(tabs)/ordenes', params: { filtro: 'Con Adeudo' } })}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>
                                    <FontAwesomeIcon icon={faWallet as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                                    {formatoMoneda(resumen.pagoTotal)}
                                </Text>
                            </View>
                            <Text style={styles.cardLabel}>Total por cobrar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.card, { backgroundColor: '#20C997' }]} onPress={() => router.push('/(tabs)/estadisticas')} activeOpacity={0.9}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>
                                    <FontAwesomeIcon icon={faChartSimple as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <FontAwesomeIcon icon={faArrowRight as IconProp} size={20} color="#FFFFFF" />
                                </View>
                            </View>
                            <Text style={[styles.cardLabel, { fontWeight: '700' }]}>Ver Reportes</Text>
                        </TouchableOpacity>
                    </View>

                    {/* === SECCIÓN FINANZAS === */}
                    <View style={styles.financeCard}>

                        <View style={styles.financeHeaderRow}>
                            <View style={styles.financeTitleContainer}>
                                <Text style={styles.sectionTitle}>Finanzas</Text>
                                <Text style={styles.totalAmount} numberOfLines={1} adjustsFontSizeToFit>
                                    {formatoMoneda(finanzas.balanceTotal)}
                                </Text>
                            </View>

                            <View style={styles.periodSelector}>
                                <BotonFiltro texto="Hoy" />
                                <BotonFiltro texto="Semana" />
                                <BotonFiltro texto="Mes" />
                            </View>
                        </View>

                        <View style={styles.chartWrapper}>
                            {chartData.length > 0 ? (
                                <BarChart
                                    key={JSON.stringify(chartData)}
                                    data={chartData}
                                    maxValue={topeGrafica}
                                    rulesLength={screenWidth - 70}
                                    barWidth={16}
                                    barBorderTopLeftRadius={4}
                                    barBorderTopRightRadius={4}
                                    initialSpacing={15}
                                    yAxisThickness={0}
                                    xAxisThickness={0}
                                    yAxisTextStyle={{ color: '#9CA3AF', fontSize: 11, textAlign: 'left' }}
                                    yAxisLabelWidth={55}
                                    formatYLabel={(label) => {
                                        const valor = Number(label);
                                        if (valor >= 1000) {
                                            return `$${(valor / 1000).toFixed(0)}k`;
                                        }
                                        return `$${valor}`;
                                    }}
                                    hideRules={false}
                                    rulesType="dashed"
                                    rulesColor="#E5E7EB"
                                    height={220}
                                    isAnimated
                                    animationDuration={400}

                                    renderTooltip={(item: any) => {
                                        return (
                                            <View style={styles.tooltipContainer}>
                                                <View style={styles.tooltipRow}>
                                                    <View style={[styles.tooltipDot, { backgroundColor: item.frontColor }]} />
                                                    <Text style={styles.tooltipType}>
                                                        {item.tipo}
                                                    </Text>
                                                </View>
                                                <Text style={styles.tooltipValue}>
                                                    {formatoMoneda(item.value)}
                                                </Text>
                                            </View>
                                        );
                                    }}
                                />
                            ) : (
                                <View style={styles.emptyChartContainer}>
                                    <Text style={styles.emptyChartText}>Sin datos para este período</Text>
                                </View>
                            )}
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F3F4F6" },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { padding: 16, paddingBottom: 100 },
    cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    card: {
        width: '48%',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        justifyContent: 'space-between',
        minHeight: 110,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardValue: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        fontFamily: "LexendTera-ExtraBold",
    },
    cardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
    financeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    financeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    financeTitleContainer: { flex: 1, marginRight: 15 },
    sectionTitle: { color: '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    totalAmount: { color: '#111827', fontSize: 16, fontWeight: '800', fontFamily: "LexendTera-ExtraBold" },
    periodSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
    periodButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    periodButtonActive: { backgroundColor: '#FFFFFF', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    periodText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
    periodTextActive: { color: '#111827' },
    chartWrapper: { alignItems: 'center', justifyContent: 'center' },
    emptyChartContainer: { height: 220, justifyContent: 'center', alignItems: 'center' },
    emptyChartText: { color: '#9CA3AF', fontSize: 14 },
    tooltipContainer: { backgroundColor: '#1F2937', padding: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
    tooltipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    tooltipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    tooltipType: { color: '#D1D5DB', fontSize: 10, fontWeight: '500' },
    tooltipValue: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
    retryButton: { backgroundColor: '#5C7CFA', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});