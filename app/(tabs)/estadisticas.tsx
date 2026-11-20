import { apiFetch } from '@/services/apiClient';
import { faBook, faBox, faBullhorn, faMugHot, faShirt, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Stack, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

type Variant = 'light' | 'dark';

type Row = {
    key: string;
    label: string;
    value: string;
    leading: ReactNode;
};

const ACCENT = "#0F766E";

const formatMoney = (n: any) =>
    Number(n || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    });

function RankCard({
    title,
    variant,
    loading,
    emptyText,
    rows,
}: {
    title: string;
    variant: Variant;
    loading: boolean;
    emptyText: string;
    rows: Row[];
}) {
    const dark = variant === 'dark';

    return (
        <View style={[styles.card, dark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.cardTitle, dark && { color: '#FFFFFF' }]}>{title}</Text>

            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={dark ? '#FFFFFF' : ACCENT}
                    style={{ marginVertical: 20 }}
                />
            ) : rows.length > 0 ? (
                rows.map((row, index) => (
                    <View
                        key={row.key}
                        style={[
                            styles.row,
                            index < rows.length - 1 && styles.rowDivider,
                            index < rows.length - 1 && {
                                borderBottomColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                            },
                        ]}
                    >
                        {row.leading}
                        <Text
                            style={[styles.label, dark && { color: '#FFFFFF' }]}
                            numberOfLines={2}
                        >
                            {row.label}
                        </Text>
                        <Text
                            style={[styles.value, dark && { color: '#FFFFFF' }]}
                            numberOfLines={1}
                        >
                            {row.value}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={[styles.emptyText, dark && { color: '#E1BEE7' }]}>{emptyText}</Text>
            )}
        </View>
    );
}

export default function EstadisticasScreen() {
    const [topProductos, setTopProductos] = useState<any[]>([]);
    const [topClientes, setTopClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const cargarDatosDashboard = async () => {
                // allSettled: si falla un endpoint, el otro igual se muestra
                const [productos, clientes] = await Promise.allSettled([
                    apiFetch('/api/dashboard/top-productos'),
                    apiFetch('/api/dashboard/top-clientes'),
                ]);

                if (productos.status === 'fulfilled') setTopProductos(productos.value ?? []);
                else console.error("Error al cargar top productos", productos.reason);

                if (clientes.status === 'fulfilled') setTopClientes(clientes.value ?? []);
                else console.error("Error al cargar top clientes", clientes.reason);

                setLoading(false);
            };
            cargarDatosDashboard();
        }, [])
    );

    const getIconoProducto = (descripcion: string) => {
        if (!descripcion) return faBox;
        const desc = descripcion.toLowerCase();
        if (desc.includes('playera') || desc.includes('camis')) return faShirt;
        if (desc.includes('taza') || desc.includes('termo')) return faMugHot;
        if (desc.includes('lib') || desc.includes('cuaderno')) return faBook;
        if (desc.includes('lona') || desc.includes('publi') || desc.includes('vinil')) return faBullhorn;
        return faBox;
    };

    const getColorProducto = (index: number) => {
        const colores = ["#FF5252", "#FF4081", "#448AFF", "#D32F2F"];
        return colores[index % colores.length];
    };

    const getColorTrofeo = (index: number) =>
        index === 0 ? "#FFD700" : index === 1 ? "#E0E0E0" : index === 2 ? "#CD7F32" : "#E1BEE7";

    const filasProductos: Row[] = topProductos.map((prod, index) => ({
        key: `prod-${index}`,
        label: prod.descripcion,
        value: Number(prod.cantidad).toLocaleString('es-MX'),
        leading: (
            <View style={[styles.iconBox, { backgroundColor: getColorProducto(index) + '1A' }]}>
                <FontAwesomeIcon
                    icon={getIconoProducto(prod.descripcion)}
                    size={16}
                    color={getColorProducto(index)}
                />
            </View>
        ),
    }));

    const filasClientes: Row[] = topClientes.slice(0, 3).map((cliente, index) => ({
        key: `cliente-${index}`,
        label: cliente.nombre,
        value: cliente.totalCompras,
        leading: (
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <FontAwesomeIcon icon={faTrophy} size={16} color={getColorTrofeo(index)} />
            </View>
        ),
    }));

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Estadísticas",
                    headerTitleAlign: 'center',
                    headerTitleStyle: { fontFamily: "LexendTera-SemiBold", fontSize: 15 },
                    headerStyle: { backgroundColor: '#FFFFFF' },
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <RankCard
                    title="Productos más solicitados"
                    variant="light"
                    loading={loading}
                    emptyText="Aún no hay ventas registradas"
                    rows={filasProductos}
                />

                <RankCard
                    title="Mejores clientes"
                    variant="dark"
                    loading={loading}
                    emptyText="Aún no hay clientes con órdenes finalizadas"
                    rows={filasClientes}
                />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
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
    card: {
        borderRadius: 21,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardLight: {
        backgroundColor: "#FFFFFF",
    },
    cardDark: {
        backgroundColor: ACCENT,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold",
        color: "#000000",
        marginBottom: 10,
        textAlign: 'center',
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    label: {
        flex: 1,
        minWidth: 0,
        fontSize: 12,
        lineHeight: 16,
        color: "#000000",
        fontWeight: "500",
        marginRight: 8,
    },
    value: {
        flexShrink: 0,
        minWidth: 56,
        textAlign: 'right',
        fontSize: 13,
        fontWeight: "bold",
        color: "#000000",
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#666',
        marginVertical: 10,
    },
});