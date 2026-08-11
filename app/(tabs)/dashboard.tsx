import { apiFetch } from '@/services/apiClient';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { faArrowRight, faChartSimple, faClipboardList, faFileInvoiceDollar, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

const COLOR_INGRESOS = '#20C997';
const COLOR_EGRESOS = '#FF6B6B';

interface DashboardResumen {
    cotizacionesMes: number;
    ordenesActivas: number;
    pagosPendientes: number;
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

    const [resumen, setResumen] = useState<DashboardResumen>({
        cotizacionesMes: 0,
        ordenesActivas: 0,
        pagosPendientes: 0
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
        setLoading(true);
        setError(false);
        Promise.all([fetchDashboardData(), fetchFinanzas()]).finally(() => setLoading(false));
    }, [filtroTiempo]);

    useFocusEffect(
        useCallback(() => {
            cargarTodo();
        }, [cargarTodo])
    );

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
                labelWidth: 30,
                labelTextStyle: { color: '#6B7280', fontSize: 11, fontWeight: '500', marginTop: 4 },
                frontColor: COLOR_INGRESOS,
                tipo: 'Ingresos'
            });
            result.push({
                value: item.egresos,
                spacing: finanzas.datosGrafica.length <= 5 ? 35 : 20,
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

        return max === 0 ? 100 : max * 1.3;
    }, [finanzas.datosGrafica]);

    const BotonFiltro = ({ texto }: { texto: string }) => (
        <TouchableOpacity
            style={[styles.periodButton, filtroTiempo === texto && styles.periodButtonActive]}
            onPress={() => setFiltroTiempo(texto)}
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
                <Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 15 }}>
                    No se pudo cargar la información del dashboard.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={cargarTodo}>
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
                        fontSize: 15,
                        color: '#000000',
                    },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                    headerLeft: () => null,
                    headerRight: () => (
                        <TouchableOpacity style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faBell as IconProp} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                    <View style={styles.cardsGrid}>
                        <TouchableOpacity style={[styles.card, { backgroundColor: '#5C7CFA' }]} onPress={() => router.push('/(tabs)/cotizaciones')}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }]}>
                                    <FontAwesomeIcon icon={faFileInvoiceDollar as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <Text style={[styles.cardValue, { color: '#FFFFFF' }]}>{resumen.cotizacionesMes}</Text>
                            </View>
                            <Text style={[styles.cardLabel, { color: '#FFFFFF' }]}>Total cotizaciones</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.card, { backgroundColor: '#4dabf7' }]} onPress={() => router.push('/(tabs)/ordenes')}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }]}>
                                    <FontAwesomeIcon icon={faClipboardList as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <Text style={[styles.cardValue, { color: '#FFFFFF' }]}>{resumen.ordenesActivas}</Text>
                            </View>
                            <Text style={[styles.cardLabel, { color: '#FFFFFF' }]}>Total órdenes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.card, { backgroundColor: '#333333' }]}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }]}>
                                    <FontAwesomeIcon icon={faWallet as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <Text style={[styles.cardValue, { color: '#FFFFFF' }]}>{resumen.pagosPendientes}</Text>
                            </View>
                            <Text style={[styles.cardLabel, { color: '#FFFFFF' }]}>Pagos pendientes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.card, { backgroundColor: '#20C997' }]} onPress={() => router.push('/(tabs)/estadisticas')}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }]}>
                                    <FontAwesomeIcon icon={faChartSimple as IconProp} size={18} color="#FFFFFF" />
                                </View>
                                <FontAwesomeIcon icon={faArrowRight as IconProp} size={20} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.cardLabel, { color: '#FFFFFF', fontWeight: '700' }]}>Ver Reportes</Text>
                        </TouchableOpacity>
                    </View>

                    {/* === SECCIÓN FINANZAS === */}
                    <View style={styles.financeCard}>

                        <View style={styles.financeHeaderRow}>
                            <View style={{ flex: 1 }}>
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
                                    rulesLength={screenWidth - 80}
                                    barWidth={14}
                                    barBorderTopLeftRadius={4}
                                    barBorderTopRightRadius={4}
                                    initialSpacing={10}
                                    yAxisThickness={0}
                                    xAxisThickness={0}
                                    yAxisTextStyle={{ color: '#9CA3AF', fontSize: 11 }}
                                    hideRules={false}
                                    rulesType="dashed"
                                    rulesColor="#E5E7EB"
                                    height={230}
                                    isAnimated
                                    animationDuration={400}

                                    renderTooltip={(item: any) => {
                                        return (
                                            <View style={{
                                                backgroundColor: '#1F2937',
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: 5,
                                                marginLeft: -10,
                                            }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.frontColor, marginRight: 6 }} />
                                                    <Text style={{ color: '#D1D5DB', fontSize: 10, fontWeight: '600' }}>
                                                        {item.tipo}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>
                                                    {formatoMoneda(item.value)}
                                                </Text>
                                            </View>
                                        );
                                    }}
                                />
                            ) : (
                                <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: '#999' }}>Sin datos para este período</Text>
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
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryButton: {
        backgroundColor: '#5C7CFA',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    card: {
        width: '48%',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        justifyContent: 'flex-start',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'LexendTera-SemiBold',
    },
    cardLabel: {
        fontSize: 12,
        opacity: 0.9,
        fontWeight: '500',
    },
    financeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    financeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        fontFamily: 'LexendTera-SemiBold',
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 5,
        marginLeft: 1,
    },
    periodButton: {
        paddingVertical: 6,
        paddingHorizontal: 9,
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
    },
    periodText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
    },
    periodTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    chartWrapper: {
        alignItems: 'center',
    }
});