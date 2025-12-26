import { faBoxOpen, faCalendarDays, faClock, faFileInvoiceDollar, faTimes, faTruck, faUser, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface OrdenCard {
    idOrden: number;
    nombreCliente: string;
    fecha: string;
    productoPrincipal: string;
    detallesJson?: string;
    estatus: string;
    claveEstatus: string;
    fechaIso: string;
    nombreEncargado: string;
    montoTotal: number;
    fechaEntrega: string;
    descripcionEstatus: string;
}

export default function OrdenesScreen() {

    const [ordenes, setOrdenes] = useState<OrdenCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [filtroActivo, setFiltroActivo] = useState("Todas");
    const opcionesFiltro = ["Todas", "En curso", "Completadas", "Canceladas"];
    const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCard | null>(null);
    const [verHistorialCompleto, setVerHistorialCompleto] = useState(false);


    const fetchOrdenes = async () => {
        try {
            const response = await fetch('http://10.0.0.1:8082/api/ordenes/movil/tarjetas');
            if (!response.ok) throw new Error("Error en el servidor");
            const data = await response.json();
            if (Array.isArray(data)) setOrdenes(data);
            else setOrdenes([]);
        } catch (error) {
            console.error("Error: ", error);
            setOrdenes([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrdenes();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrdenes();
    }, []);

    const getStatusColor = (clave: string) => {
        if (clave.includes('ENTREGADA')) return "#7CCB64";
        if (clave.includes('ATRASADA') || clave.includes('CANCELADA') || clave.includes('RECHAZADO')) return "#FE5F5F";
        return "#3A88F6";
    }

    const getOrdenesFiltradas = () => {
        return ordenes.filter((orden) => {
            if (fechaSeleccionada) {
                const year = fechaSeleccionada.getFullYear();
                const month = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0');
                const day = fechaSeleccionada.getDate().toString().padStart(2, '0');
                const fechaFiltroStr = `${year}-${month}-${day}`;
                if (orden.fechaIso !== fechaFiltroStr) return false;
            } else {
                const hoy = new Date();
                const mesActual = (hoy.getMonth() + 1).toString().padStart(2, '0');
                const anioActual = hoy.getFullYear().toString();

                const [anioOrden, mesOrden] = orden.fechaIso.split('-');

                if (anioOrden !== anioActual || mesOrden !== mesActual) {
                    return false;
                }
            }
            if (filtroActivo === "Todas") return true;
            if (filtroActivo === "Completadas") return orden.claveEstatus === 'ORD_ENTREGADA';
            if (filtroActivo === "Canceladas") return orden.claveEstatus.includes('CANCELADA') || orden.claveEstatus.includes('RECHAZADO') || orden.claveEstatus.includes('ATRASADA');
            if (filtroActivo === "En curso") return orden.claveEstatus !== 'ORD_ENTREGADA' && !orden.claveEstatus.includes('CANCELADA') && !orden.claveEstatus.includes('RECHAZADO');
            return true;
        });
    };

    const listaParaMostrar = getOrdenesFiltradas();

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

    const abrirDetalle = (orden: OrdenCard) => {
        setOrdenSeleccionada(orden);
        setModalDetalleVisible(true);
    };

    const obtenerProductosDetalle = () => {
        if (!ordenSeleccionada || !ordenSeleccionada.detallesJson) return [];

        try {
            return JSON.parse(ordenSeleccionada.detallesJson);
        } catch (error) {
            console.log("Error al leer los productos", error);
            return [];
        }
    };

    const listaProductos = obtenerProductosDetalle();

    const { height: screenHeight } = Dimensions.get('window');


    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Órdenes",
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
                {fechaSeleccionada && (
                    <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', backgroundColor: '#F0F8FF' }}>
                        <Text style={{ color: '#3A88F6', fontWeight: 'bold', marginRight: 10 }}>
                            Filtrando por: {fechaSeleccionada.toISOString().split('T')[0]}
                        </Text>
                        <TouchableOpacity onPress={limpiarFecha}>
                            <Text style={{ color: '#FF5555', fontWeight: 'bold' }}>Reestablecer</Text>
                        </TouchableOpacity>
                    </View>


                )}

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#3A88F6"]}
                            tintColor="#3A88F6"
                        />
                    }
                >
                    <Text style={styles.titulo}>{"Filtro de Órdenes"}</Text>

                    <View style={styles.filtrosContainer}>
                        {opcionesFiltro.map((opcion) => (
                            <TouchableOpacity key={opcion} onPress={() => setFiltroActivo(opcion)}>
                                <Text style={[styles.filtroTexto, filtroActivo === opcion && styles.filtroTextoActivo]}>
                                    {opcion}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color="#3A88F6" style={{ marginTop: 20 }} />
                    ) : (
                        listaParaMostrar.map((item) => {
                            const colorTema = getStatusColor(item.claveEstatus);

                            return (
                                <TouchableOpacity
                                    key={item.idOrden}
                                    onPress={() => abrirDetalle(item)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardContainer}>
                                        <View style={[styles.cardColorBar, { backgroundColor: colorTema }]}></View>
                                        <View style={styles.cardContent}>
                                            <Text style={styles.cardNombre}>{item.nombreCliente}</Text>
                                            <View style={styles.cardFila}>
                                                <View style={styles.cardFechaContainer}>
                                                    <FontAwesomeIcon
                                                        icon={faCalendarDays}
                                                        size={14}
                                                        color={colorTema}
                                                        style={{ marginRight: 6 }}
                                                    />
                                                    <Text style={[styles.cardFechaTexto, { color: colorTema }]}>{item.fecha}</Text>
                                                </View>
                                                <View style={styles.filtroSpacer}></View>
                                                <View style={[styles.cardPill, { backgroundColor: colorTema }]}>
                                                    <Text style={styles.cardPillTexto}>{item.estatus}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.cardDescripcion} numberOfLines={1} ellipsizeMode="tail">{item.productoPrincipal}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>

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

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalDetalleVisible}
                    onRequestClose={() => setModalDetalleVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>

                            <View style={styles.modalHeader}>
                                <View style={[styles.cardPill, {
                                    backgroundColor: getStatusColor(ordenSeleccionada?.claveEstatus || ""),
                                    width: 'auto', paddingHorizontal: 15
                                }]}>
                                    <Text style={styles.cardPillTexto}>{ordenSeleccionada?.estatus}</Text>
                                </View>

                                <TouchableOpacity onPress={() => setModalDetalleVisible(false)}>
                                    <FontAwesomeIcon icon={faTimes} size={22} color="#999" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalTitle}>Orden #{ordenSeleccionada?.idOrden}</Text>

                            <View style={styles.divider} />

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesomeIcon icon={faUser} size={18} color="#3A88F6" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Cliente</Text>
                                    <Text style={styles.detailValue}>{ordenSeleccionada?.nombreCliente}</Text>
                                </View>
                            </View>

                            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                                <View style={[styles.iconContainer, { marginTop: 2 }]}>
                                    <FontAwesomeIcon icon={faBoxOpen} size={18} color="#3A88F6" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Productos ({listaProductos.length})</Text>

                                    {listaProductos.length > 0 ? (
                                        <View style={{ marginTop: 5, maxHeight: 120 }}>

                                            <ScrollView
                                                nestedScrollEnabled={true}
                                                showsVerticalScrollIndicator={true}
                                                contentContainerStyle={{ paddingRight: 5 }}
                                            >
                                                {listaProductos.map((item: any, index: number) => (
                                                    <View key={index} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>

                                                        {/* COLUMNA 1: Cantidad */}
                                                        <Text style={{
                                                            width: 45,
                                                            textAlign: 'right',
                                                            fontWeight: '600',
                                                            color: '#333',
                                                            fontSize: 13,
                                                            marginTop: 2
                                                        }}>
                                                            {item.cantidad}
                                                        </Text>

                                                        {/* COLUMNA 2: Separador */}
                                                        <Text style={{
                                                            width: 25,
                                                            textAlign: 'center',
                                                            color: '#999',
                                                            fontSize: 13,
                                                            marginTop: 2
                                                        }}>
                                                            x
                                                        </Text>

                                                        {/* COLUMNA 3: Descripción */}
                                                        <Text style={{
                                                            flex: 1,
                                                            flexWrap: 'wrap',
                                                            color: '#555',
                                                            fontSize: 14,
                                                            lineHeight: 20
                                                        }}>
                                                            {item.descripcion}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    ) : (
                                        <Text style={styles.detailValue}>{ordenSeleccionada?.productoPrincipal}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesomeIcon icon={faUserTie} size={18} color="#3A88F6" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Encargado</Text>
                                    <Text style={styles.detailValue}>{ordenSeleccionada?.nombreEncargado}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesomeIcon icon={faClock} size={18} color="#3A88F6" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Estatus Actual</Text>
                                    <Text style={styles.detailValue}>
                                        {ordenSeleccionada?.descripcionEstatus}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesomeIcon icon={faTruck} size={18} color="#3A88F6" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Entrega Estimada</Text>
                                    <Text style={styles.detailValue}>{ordenSeleccionada?.fechaEntrega}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <FontAwesomeIcon
                                        icon={faFileInvoiceDollar}
                                        size={24}
                                        color={ordenSeleccionada?.claveEstatus?.includes('CANCELADA') ? "#FE5F5F" : "#7CCB64"}
                                    />
                                    <Text style={styles.totalLabel}>Total de Venta</Text>
                                </View>
                                <Text style={[
                                    styles.totalValue,
                                    ordenSeleccionada?.claveEstatus?.includes('CANCELADA') && {
                                        textDecorationLine: 'line-through',
                                        color: '#FE5F5F',
                                        textDecorationStyle: 'solid'
                                    }
                                ]}>
                                    ${ordenSeleccionada?.montoTotal?.toFixed(2)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeButtonFull}
                                onPress={() => setModalDetalleVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </Modal>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5" },
    scrollContainer: { padding: 20 },
    titulo: { fontSize: 13, fontWeight: "bold", marginBottom: 15, color: "#333", fontFamily: "LexendTera-SemiBold" },

    filtrosContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 25, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 20, width: '100%',
    },
    filtroTexto: { fontSize: 13, color: '#9E9E9E' },
    filtroTextoActivo: { color: '#3A88F6', fontWeight: 'bold' },
    filtroSpacer: { width: 10 },

    cardContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, height: 110, overflow: 'hidden', elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardColorBar: { width: 8, height: '100%' },
    cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
    cardNombre: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    cardFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardFechaContainer: { flexDirection: 'row', alignItems: 'center' },
    cardIcono: { width: 14, height: 14, marginRight: 6 },
    cardFechaTexto: { fontSize: 12, fontWeight: '500' },
    cardPill: { width: 100, paddingVertical: 4, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    cardPillTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    cardDescripcion: { fontSize: 12, color: '#666' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    iosDatePickerContainer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
    iosToolbar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#F8F8F8', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    iosButtonText: { color: '#3A88F6', fontSize: 16, fontWeight: 'bold' },

    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
        minHeight: 400,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    detailFooter: {
        textAlign: 'center',
        color: '#AAA',
        fontSize: 12,
        marginBottom: 20,
    },
    actionButton: {
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    detailTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginLeft: 10,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#7CCB64',
    },
    closeButtonFull: {
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 16,
    },
});