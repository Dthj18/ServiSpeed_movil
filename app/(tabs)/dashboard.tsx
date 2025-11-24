import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { faChartSimple, faClipboardList, faFileInvoiceDollar, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack } from 'expo-router';
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {

    const barData: any = [
        { value: 11000, label: 'Lun', frontColor: '#92B2FD', spacing: 20 },
        { value: 6000, label: 'Mar', frontColor: '#92B2FD' },
        { value: 8000, label: 'Mie', frontColor: '#92B2FD' },
        { value: 16000, label: 'Jue', frontColor: '#FF8E9B' },
        { value: 2000, label: 'Vie', frontColor: '#92B2FD' },
        { value: 7500, label: 'Sab', frontColor: '#FF8E9B' },
    ];

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
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                    },
                    headerShadowVisible: false,
                    headerLeft: () => null,
                    headerRight: () => (
                        <TouchableOpacity style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faBell as IconProp} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                    <View style={styles.cardsGrid}>
                        
                        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/cotizaciones')}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { borderColor: '#5C7CFA' }]}>
                                    <FontAwesomeIcon icon={faFileInvoiceDollar as IconProp} size={20} color="#5C7CFA" />
                                </View>
                                <Text style={styles.cardValue}>13</Text>
                            </View>
                            <Text style={styles.cardLabel}>Total cotizaciones</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/ordenes')}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { borderColor: '#4dabf7' }]}>
                                    <FontAwesomeIcon icon={faClipboardList as IconProp} size={20} color="#4dabf7" />
                                </View>
                                <Text style={styles.cardValue}>06</Text>
                            </View>
                            <Text style={styles.cardLabel}>Total órdenes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/estadisticas')}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { borderColor: '#4CAF50' }]}>
                                    <FontAwesomeIcon icon={faChartSimple as IconProp} size={20} color="#4CAF50" />
                                </View>
                                <FontAwesomeIcon icon={faChartSimple as IconProp} size={24} color="#4CAF50" style={{marginLeft: 10, opacity: 0.5}}/>
                            </View>
                            <Text style={styles.cardLabel}>Estadísticas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { borderColor: '#333' }]}>
                                    <FontAwesomeIcon icon={faWallet as IconProp} size={20} color="#333" />
                                </View>
                                <Text style={styles.cardValue}>03</Text>
                            </View>
                            <Text style={styles.cardLabel}>Pagos pendientes</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.financesHeader}>
                        <Text style={styles.sectionTitle}>Finanzas</Text>
                        
                        <View style={styles.periodSelector}>
                            <TouchableOpacity style={styles.periodButton}>
                                <Text style={styles.periodText}>Hoy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.periodButton, styles.periodButtonActive]}>
                                <Text style={styles.periodTextActive}>Semana</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.periodButton}>
                                <Text style={styles.periodText}>Mes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.chartContainer}>
                        <BarChart
                            data={barData}
                            barWidth={18}
                            noOfSections={4}
                            barBorderRadius={4}
                            frontColor="lightgray"
                            yAxisThickness={0}
                            xAxisThickness={0}
                            yAxisTextStyle={{color: '#999', fontSize: 10}}
                            xAxisLabelTextStyle={{color: '#999', fontSize: 10}}
                            height={220}
                            width={300} 
                            isAnimated
                            hideRules
                        />
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 100, 
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    card: {
        width: '48%', 
        backgroundColor: '#F5F5F5', 
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDD', 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'LexendTera-SemiBold',
        color: '#000',
    },
    cardLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    financesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15, 
        fontWeight: 'bold',
        fontFamily: 'LexendTera-SemiBold',
        color: '#333',
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 20,
        padding: 2,
    },
    periodButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 18,
    },
    periodButtonActive: {
        backgroundColor: '#FFFFFF', 
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1,
    },
    periodText: {
        fontSize: 11,
        color: '#999',
    },
    periodTextActive: {
        fontSize: 11,
        color: '#000',
        fontWeight: 'bold',
    },
    chartContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
});