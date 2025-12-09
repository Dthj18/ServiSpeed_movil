import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function CotizacionesScreen() {

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [pieData, setPieData] = useState<any[]>([]);
    const [razonesData, setRazonesData] = useState<any[]>([]);
    const [totalMovimientos, setTotalMovimientos] = useState(0);

    const cargarDatos = async () => {
        try {
            const IP = "192.168.100.14";
            const ID_USUARIO = 2;

            const response = await fetch(`http://${IP}:8082/api/dashboard/movil/graficas?idUsuario=${ID_USUARIO}`);

            if (!response.ok) throw new Error(`Error API: ${response.status}`);

            const data = await response.json();

            console.log("DATA RADAR:", JSON.stringify(data.datosRadar, null, 2));

            let suma = 0;
            const pastel = (data.datosPastel || []).map((item: any) => {
                suma += item.cantidad;
                return {
                    name: item.categoria,
                    population: item.cantidad,
                    color: getColor(item.categoria),
                    legendFontColor: "#555",
                    legendFontSize: 12
                };
            });
            setPieData(pastel);
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
            console.error("❌ Error cargando datos:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        cargarDatos();
    };

    const getColor = (categoria: string) => {
        if (categoria === 'Aprobadas' || categoria === 'Completado') return '#7EDD83';
        if (categoria === 'Canceladas') return '#DD7E7E';
        return '#7E96DD';
    };

    const chartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7E96DD" />
            </View>
        );
    }

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
                        <TouchableOpacity style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faCalendarDays} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >

                    {/* --- GRÁFICA DE PASTEL --- */}
                    <View style={styles.cakecontainer}>
                        <Text style={styles.titulo1}>{"Estado de Cotizaciones"}</Text>

                        {pieData.length > 0 ? (
                            <PieChart
                                data={pieData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                center={[0, 0]}
                                absolute
                            />
                        ) : (
                            <Text style={styles.noDataText}>No hay datos disponibles</Text>
                        )}
                    </View>

                    {/* --- RAZONES DE RECHAZO (LISTA VISUAL) --- */}
                    <View style={styles.graphiccontainer}>
                        <Text style={styles.titulo2}>{"Razones de rechazo"}</Text>

                        {razonesData.length === 0 ? (
                            <Text style={styles.noDataText}>No hay cancelaciones registradas.</Text>
                        ) : (
                            razonesData.map((item, index) => {
                                const maxVal = Math.max(...razonesData.map(r => r.cantidad));
                                const porcentaje = maxVal > 0 ? (item.cantidad / maxVal) * 100 : 0;

                                return (
                                    <View key={index} style={styles.reasonRow}>
                                        <View style={styles.reasonHeader}>
                                            {/* AQUI SE MUESTRA EL TEXTO QUE NO SALÍA */}
                                            <Text style={styles.reasonLabel}>{item.texto}</Text>
                                            <Text style={styles.reasonCount}>{item.cantidad}</Text>
                                        </View>

                                        {/* Barra Roja */}
                                        <View style={styles.track}>
                                            <View style={[styles.bar, { width: `${porcentaje}%` }]} />
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>

                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#FFFFFF",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    titulo1: {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        marginBottom: 10,
        alignSelf: 'flex-start',
        color: '#333'
    },
    titulo2: {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        marginBottom: 20,
        alignSelf: 'flex-start',
        color: '#333'
    },
    cakecontainer: {
        flexDirection: "column",
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        marginBottom: 20,
        padding: 20,
        alignItems: 'center',
    },
    graphiccontainer: {
        flexDirection: "column",
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        marginBottom: 20,
        padding: 20,
    },
    noDataText: {
        color: '#999',
        fontStyle: 'italic',
        marginTop: 20,
        textAlign: 'center'
    },
    reasonRow: {
        marginBottom: 15,
        width: '100%'
    },
    reasonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    reasonLabel: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
        maxWidth: '85%'
    },
    reasonCount: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#DD7E7E'
    },
    track: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden'
    },
    bar: {
        height: '100%',
        backgroundColor: '#DD7E7E',
        borderRadius: 4
    }
});