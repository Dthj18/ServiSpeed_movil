import { apiFetch } from '@/services/apiClient';
import { faBoxOpen, faCalendarDays, faClock, faFileInvoiceDollar, faSearch, faTimes, faTruck, faUser, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
    const router = useRouter();

    const [ordenes, setOrdenes] = useState<OrdenCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [page, setPage] = useState(0);
    const [isLastPage, setIsLastPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [filtroActivo, setFiltroActivo] = useState("Todas");
    const opcionesFiltro = ["Todas", "En curso", "Completadas", "Canceladas"];
    const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const [busqueda, setBusqueda] = useState('');
    const [debouncedBusqueda, setDebouncedBusqueda] = useState('');

    const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCard | null>(null);

    const formatearFechaEspanol = (fechaIso: string) => {
        if (!fechaIso) return "Sin fecha";

        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const partes = fechaIso.split('-');
        if (partes.length !== 3) return fechaIso;

        const mesIndex = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);

        return `${meses[mesIndex]} ${dia}`;
    };

    const formatearFechaEntregaEspanol = (fechaString?: string) => {
        if (!fechaString || fechaString === 'Por definir') return 'Por definir';

        const mesesDiccionario: { [key: string]: string } = {
            'Jan': 'Enero', 'Feb': 'Febrero', 'Mar': 'Marzo', 'Apr': 'Abril',
            'May': 'Mayo', 'Jun': 'Junio', 'Jul': 'Julio', 'Aug': 'Agosto',
            'Sep': 'Septiembre', 'Oct': 'Octubre', 'Nov': 'Noviembre', 'Dec': 'Diciembre'
        };

        const partes = fechaString.trim().split(/\s+/);

        if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mesIngles = partes[1];
            const anio = partes[2];

            const mesEspanol = mesesDiccionario[mesIngles] || mesIngles;

            return `${dia} de ${mesEspanol} de ${anio}`;
        }

        return fechaString;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBusqueda(busqueda);
        }, 500);
        return () => clearTimeout(timer);
    }, [busqueda]);

    const fetchOrdenes = async (pageNumber = 0) => {
        if (pageNumber > 0 && (loadingMore || loading || isLastPage)) return;

        if (pageNumber === 0) {
            setLoading(true);
            setIsLastPage(false);
            setPage(0);
        } else {
            setLoadingMore(true);
        }

        try {
            let queryParams = [`page=${pageNumber}`, `size=20`];

            if (debouncedBusqueda.trim() !== '') {
                queryParams.push(`busqueda=${encodeURIComponent(debouncedBusqueda.trim())}`);
            }
            if (filtroActivo !== "Todas") {
                queryParams.push(`estado=${encodeURIComponent(filtroActivo)}`);
            }
            if (fechaSeleccionada) {
                const year = fechaSeleccionada.getFullYear();
                const month = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0');
                const day = fechaSeleccionada.getDate().toString().padStart(2, '0');
                queryParams.push(`fecha=${year}-${month}-${day}`);
            } else if (debouncedBusqueda.trim() === '') {
                const hoy = new Date();
                const year = hoy.getFullYear();
                const month = (hoy.getMonth() + 1).toString().padStart(2, '0');

                queryParams.push(`fecha=${year}-${month}`);
            }

            const queryString = `?${queryParams.join('&')}`;
            const endpoint = `/api/ordenes/movil/tarjetas${queryString}`;
            const data = await apiFetch(endpoint);
            const esArreglo = Array.isArray(data);
            const nuevasOrdenes = esArreglo ? data : (data.content || []);
            const esUltima = esArreglo ? true : (data.last ?? (nuevasOrdenes.length < 20));

            if (pageNumber === 0) {
                setOrdenes(nuevasOrdenes);
            } else {
                setOrdenes(prev => {
                    const idsExistentes = new Set(prev.map(o => o.idOrden));
                    const filtradas = nuevasOrdenes.filter((o: OrdenCard) => !idsExistentes.has(o.idOrden));
                    return [...prev, ...filtradas];
                });
            }

            setIsLastPage(esUltima);
            setPage(pageNumber);

        } catch (error: any) {
            console.error("Error al obtener órdenes: ", error);
            if (pageNumber === 0) setOrdenes([]);
            setIsLastPage(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrdenes(0);
    }, [debouncedBusqueda, filtroActivo, fechaSeleccionada]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrdenes(0);
    }, [debouncedBusqueda, filtroActivo, fechaSeleccionada]);

    const cargarMasOrdenes = () => {
        if (!isLastPage && !loadingMore && !loading && !refreshing) {
            fetchOrdenes(page + 1);
        }
    };

    const getStatusColor = (clave: string) => {
        if (!clave) return "#3A88F6";
        if (clave.includes('ENTREGADA')) return "#7CCB64";
        if (clave.includes('ATRASADA') || clave.includes('CANCELADA') || clave.includes('RECHAZADO')) return "#FE5F5F";
        return "#3A88F6";
    }

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setMostrarCalendario(false);
            if (event.type === 'set' && selectedDate) {
                setFechaSeleccionada(selectedDate);
            }
            return;
        }
        if (selectedDate) {
            setFechaSeleccionada(selectedDate);
        }
    };

    const onWebDateChange = (event: any) => {
        const dateValue = event.target.value;
        if (dateValue) {
            const selectedDate = new Date(dateValue);
            selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
            setFechaSeleccionada(selectedDate);
        }
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

    const renderTarjetaOrden = ({ item }: { item: OrdenCard }) => {
        const colorTema = getStatusColor(item.claveEstatus);
        return (
            <TouchableOpacity onPress={() => abrirDetalle(item)} activeOpacity={0.8}>
                <View style={styles.cardContainer}>
                    <View style={[styles.cardColorBar, { backgroundColor: colorTema }]}></View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardNombre}>{item.nombreCliente}</Text>
                        <View style={styles.cardFila}>
                            <View style={styles.cardFechaContainer}>
                                <FontAwesomeIcon icon={faCalendarDays} size={14} color={colorTema} style={{ marginRight: 6 }} />
                                <Text style={[styles.cardFechaTexto, { color: colorTema }]}>
                                    {formatearFechaEspanol(item.fechaIso)}
                                </Text>
                            </View>
                            <View style={[styles.cardPill, { backgroundColor: colorTema }]}>
                                <Text style={styles.cardPillTexto}>{item.estatus}</Text>
                            </View>
                        </View>
                        <Text style={styles.cardDescripcion} numberOfLines={1} ellipsizeMode="tail">
                            {item.productoPrincipal}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

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
                        <View style={{ marginRight: 20 }}>
                            {Platform.OS === 'web' ? (
                                <div style={{ position: 'relative' }}>
                                    <FontAwesomeIcon icon={faCalendarDays} size={20} color={fechaSeleccionada ? "#3A88F6" : "#525252"} />
                                    <input type="date" onChange={onWebDateChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                </div>
                            ) : (
                                <TouchableOpacity onPress={() => setMostrarCalendario(true)}>
                                    <FontAwesomeIcon icon={faCalendarDays} size={20} color={fechaSeleccionada ? "#3A88F6" : "#525252"} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ),
                }}
            />

            <View style={styles.headerExtension}>
                <View style={styles.tabsBackground}>
                    {opcionesFiltro.map((opcion) => (
                        <TouchableOpacity
                            key={opcion}
                            onPress={() => setFiltroActivo(opcion)}
                            style={[
                                styles.tab,
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                filtroActivo === opcion && styles.tabTextActive
                            ]}>
                                {opcion}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.container}>

                <View style={styles.searchContainer}>
                    <FontAwesomeIcon icon={faSearch} size={16} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por cliente, órden o producto..."
                        placeholderTextColor="#9CA3AF"
                        value={busqueda}
                        onChangeText={setBusqueda}
                        returnKeyType="search"
                        clearButtonMode="never"
                    />

                    {busqueda.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setBusqueda('')}
                            style={{ padding: 5 }}
                        >
                            <FontAwesomeIcon icon={faTimes} size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {fechaSeleccionada && (
                    <View style={styles.filtroFechaContainer}>
                        <Text style={styles.filtroFechaTexto}>
                            Filtrando por: {fechaSeleccionada.toISOString().split('T')[0]}
                        </Text>
                        <TouchableOpacity onPress={limpiarFecha}>
                            <Text style={styles.filtroReestablecer}>Reestablecer</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading && page === 0 ? (
                    <ActivityIndicator size="large" color="#3A88F6" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={ordenes}
                        keyExtractor={(item) => item.idOrden.toString()}
                        renderItem={renderTarjetaOrden}
                        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 30 }]}

                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3A88F6"]} tintColor="#3A88F6" />
                        }

                        onEndReached={cargarMasOrdenes}
                        onEndReachedThreshold={0.2}

                        ListFooterComponent={
                            loadingMore ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator size="small" color="#3A88F6" />
                                </View>
                            ) : null
                        }

                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>No se encontraron órdenes</Text>
                            </View>
                        }
                    />
                )}

                {mostrarCalendario && Platform.OS !== 'web' && (
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

                <Modal animationType="slide" transparent={true} visible={modalDetalleVisible} onRequestClose={() => setModalDetalleVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View style={[styles.cardPill, { backgroundColor: getStatusColor(ordenSeleccionada?.claveEstatus || ""), width: 'auto', paddingHorizontal: 15 }]}>
                                    <Text style={styles.cardPillTexto}>{ordenSeleccionada?.estatus}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalDetalleVisible(false)}>
                                    <FontAwesomeIcon icon={faTimes} size={22} color="#999" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalTitle}>Orden #{ordenSeleccionada?.idOrden}</Text>
                            <View style={styles.divider} />

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}><FontAwesomeIcon icon={faUser} size={18} color="#3A88F6" /></View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Cliente</Text>
                                    <Text style={styles.detailValue}>{ordenSeleccionada?.nombreCliente}</Text>
                                </View>
                            </View>

                            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                                <View style={[styles.iconContainer, { marginTop: 2 }]}><FontAwesomeIcon icon={faBoxOpen} size={18} color="#3A88F6" /></View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Productos ({listaProductos.length})</Text>
                                    {listaProductos.length > 0 ? (
                                        <View style={styles.listaProductosContainer}>
                                            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingRight: 5 }}>
                                                {listaProductos.map((item: any, index: number) => (
                                                    <View key={index} style={styles.productoFila}>
                                                        <Text style={styles.productoCantidad}>{item.cantidad}</Text>
                                                        <Text style={styles.productoEquis}>x</Text>
                                                        <Text style={styles.productoDescripcion}>{item.descripcion}</Text>
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
                                <View style={styles.iconContainer}><FontAwesomeIcon icon={faUserTie} size={18} color="#3A88F6" /></View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Encargado</Text>
                                    <Text style={styles.detailValue}>{ordenSeleccionada?.nombreEncargado}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}><FontAwesomeIcon icon={faClock} size={18} color="#3A88F6" /></View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Estatus Actual</Text>
                                    <Text style={styles.detailValue}>{ordenSeleccionada?.descripcionEstatus}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesomeIcon icon={faTruck} size={18} color="#3A88F6" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Entrega Estimada</Text>
                                    <Text style={styles.detailValue}>{formatearFechaEntregaEspanol(ordenSeleccionada?.fechaEntrega)}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <View style={styles.totalFila}>
                                    <FontAwesomeIcon icon={faFileInvoiceDollar} size={24} color={ordenSeleccionada?.claveEstatus?.includes('CANCELADA') ? "#FE5F5F" : "#7CCB64"} />
                                    <Text style={styles.totalLabel}>Total de Venta</Text>
                                </View>
                                <Text style={[styles.totalValue, ordenSeleccionada?.claveEstatus?.includes('CANCELADA') && styles.textoTachado]}>
                                    ${ordenSeleccionada?.montoTotal?.toFixed(2)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.closeButtonFull, { backgroundColor: '#3A88F6', marginBottom: 10 }]}
                                onPress={() => {
                                    setModalDetalleVisible(false);
                                    router.push({
                                        pathname: "/tracker" as any,
                                        params: { idOrden: ordenSeleccionada?.idOrden }
                                    });
                                }}
                            >
                                <Text style={[styles.closeButtonText, { color: '#FFF' }]}>Ver Historial de la Orden</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeButtonFull} onPress={() => setModalDetalleVisible(false)}>
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
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5"
    },
    headerExtension: {
        backgroundColor: '#FFFFFF',
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        zIndex: 10,
    },
    tabsBackground: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        height: 35,
        marginHorizontal: 20,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingVertical: 5,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
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
        color: '#3A88F6',
        fontWeight: 'bold'
    },
    scrollContainer: {
        padding: 20,
        paddingTop: 10,
    },
    titulo: {
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#333",
        fontFamily: "LexendTera-SemiBold"
    },
    filtroFechaContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#F0F8FF'
    },
    filtroFechaTexto: {
        color: '#3A88F6',
        fontWeight: 'bold',
        marginRight: 10
    },
    filtroReestablecer: {
        color: '#FF5555',
        fontWeight: 'bold'
    },
    cardContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        height: 110,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardColorBar: {
        width: 8,
        height: '100%'
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between'
    },
    cardNombre: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000'
    },
    cardFila: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    cardFechaContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardFechaTexto: {
        fontSize: 12,
        fontWeight: '500'
    },
    cardPill: {
        width: 100,
        paddingVertical: 4,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardPillTexto: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    cardDescripcion: {
        fontSize: 12,
        color: '#666'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    iosDatePickerContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20
    },
    iosToolbar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#F8F8F8',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },
    iosButtonText: {
        color: '#3A88F6',
        fontSize: 16,
        fontWeight: 'bold'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center'
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 15
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500'
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    detailTextContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    listaProductosContainer: {
        marginTop: 5,
        maxHeight: 120
    },
    productoFila: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start'
    },
    productoCantidad: {
        width: 45,
        textAlign: 'right',
        fontWeight: '600',
        color: '#333',
        fontSize: 13,
        marginTop: 2
    },
    productoEquis: {
        width: 25,
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
        marginTop: 2
    },
    productoDescripcion: {
        flex: 1,
        flexWrap: 'wrap',
        color: '#555',
        fontSize: 14,
        lineHeight: 20
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20
    },
    totalFila: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginLeft: 10
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#7CCB64'
    },
    textoTachado: {
        textDecorationLine: 'line-through',
        color: '#FE5F5F',
        textDecorationStyle: 'solid'
    },
    closeButtonFull: {
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center'
    },
    closeButtonText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 16
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 45,
        marginHorizontal: 20,
        marginTop: 15,
        marginBottom: 5,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        height: '100%',
    },
});