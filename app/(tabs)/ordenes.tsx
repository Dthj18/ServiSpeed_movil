import { faCalendarDays, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, Stack } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OrdenesScreen() {
    
    return (
        <>
            {/* ESTA ES LA NUEVA SECCIÓN (copiada de cotizaciones.tsx)
              Define el header (barra superior) de esta pantalla
            */}
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Órdenes", // Título de tu pantalla
                    headerTitleAlign: 'center',
                    headerTitleStyle: {
                        fontFamily: "LexendTera-SemiBold", // Fuente de tu compañero
                        fontSize: 15,
                    },
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                    },
                    headerShadowVisible: false,

                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 20 }}>
                            <FontAwesomeIcon icon={faChevronLeft} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),

                    headerRight: () => (
                        <TouchableOpacity onPress={() => { /* Lógica del calendario */ }} style={{ marginRight: 20 }}>
                            <FontAwesomeIcon icon={faCalendarDays} size={20} color="#525252" />
                        </TouchableOpacity>
                    ),
                }}
            />
            
            {/* ESTE ES EL NUEVO LAYOUT (copiado de cotizaciones.tsx)
            */}
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    
                    {/* ESTE ES TU CONTENIDO (el que ya habíamos arreglado)
                    */}
                    <Text style={styles.titulo}>
                        {"Filtros de Órdenes"}
                    </Text>

                    <View style={styles.filtrosContainer}>
                        <Text style={styles.filtroTexto}>
                            {"Todas"}
                        </Text>
                        <View style={styles.filtroSpacer} />
                        <Text style={styles.filtroTexto}>
                            {"En curso"}
                        </Text>
                        <View style={styles.filtroSpacer} />
                        <Text style={styles.filtroTexto}>
                            {"Completadas"}
                        </Text>
                        <View style={styles.filtroSpacer} />
                        <Text style={styles.filtroTexto}>
                            {"Atrasadas"}
                        </Text>
                        <View style={styles.filtroSpacer} />
                    </View>
                    
                    <View style={styles.cardContainer}>
                        <View style={[styles.cardColorBar, {backgroundColor: "#3A88F6"}]} />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardNombre}>
                                {"Rubén Tuesta"}
                            </Text>
                            <View style={styles.cardFila}>
                                <View style={styles.cardFechaContainer}>
                                    <Image
                                        source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/3j9CazomhD/vqua0tr7_expires_30_days.png"}} 
                                        resizeMode = {"stretch"}
                                        style={styles.cardIcono}
                                    />
                                    <Text style={[styles.cardFechaTexto, {color: "#3B89F6"}]}>
                                        {"Noviembre 25"}
                                    </Text>
                                </View>
                                <View style={styles.filtroSpacer} />
                                <View style={[styles.cardPill, {backgroundColor: "#3B89F6"}]}>
                                    <Text style={styles.cardPillTexto}>
                                        {"En curso"}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.cardDescripcion}>
                                {"Playera con estampado personalizado"}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.cardContainer}>
                        <View style={[styles.cardColorBar, {backgroundColor: "#7CCB64"}]} />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardNombre}>
                                {"Jorge Tuz"}
                            </Text>
                            <View style={styles.cardFila}>
                                <View style={styles.cardFechaContainer}>
                                    <Image
                                        source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/3j9CazomhD/tfn6pnwf_expires_30_days.png"}} 
                                        resizeMode = {"stretch"}
                                        style={styles.cardIcono}
                                    />
                                    <Text style={[styles.cardFechaTexto, {color: "#7CCB64"}]}>
                                        {"Septiembre 05"}
                                    </Text>
                                </View>
                                <View style={styles.filtroSpacer} />
                                <View style={[styles.cardPill, {backgroundColor: "#7CCB64"}]}>
                                    <Text style={styles.cardPillTexto}>
                                        {"Completado"}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.cardDescripcion}>
                                {"Taza color azul con frase"}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.cardContainer}>
                        <View style={[styles.cardColorBar, {backgroundColor: "#FE5F5F"}]} />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardNombre}>
                                {"Isaias Juarez"}
                            </Text>
                            <View style={styles.cardFila}>
                                <View style={styles.cardFechaContainer}>
                                    <Image
                                        source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/3j9CazomhD/cu8zo97m_expires_30_days.png"}} 
                                        resizeMode = {"stretch"}
                                        style={styles.cardIcono}
                                    />
                                    <Text style={[styles.cardFechaTexto, {color: "#FE5F5F"}]}>
                                        {"Agosto 27"}
                                    </Text>
                                </View>
                                <View style={styles.filtroSpacer} />
                                <View style={[styles.cardPill, {backgroundColor: "#FE5F5F"}]}>
                                    <Text style={styles.cardPillTexto}>
                                        {"Atrasada"}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.cardDescripcion}>
                                {"Publicidad comercial"}
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    // --- ESTILOS DEL LAYOUT (de cotizaciones.tsx) ---
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom:100,
    },
    // --- ESTILOS DE ORDENES (actualizados) ---
    titulo: {
        fontSize: 12, // Igual que cotizaciones
        fontWeight: "bold",
        fontFamily: "LexendTera-SemiBold", // Fuente de tu compañero
        marginBottom: 14,
        alignSelf: 'flex-start', // Igual que cotizaciones
    },
    filtrosContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderColor: "#00000070",
        borderRadius: 20,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 23, 
        marginBottom: 24,
    },
    filtroTexto: {
        color: "#000000",
        fontSize: 12,
    },
    filtroSpacer: {
        flex: 1, 
    },
    cardContainer: {
        flexDirection: "row",        
        backgroundColor: "#E4E4E485",
        borderRadius: 21,
        marginBottom: 15,            
        overflow: "hidden",          
    },
    cardColorBar: {
        width: 22,
    },
    cardContent: {
        flex: 1,                     
        paddingTop: 13,
        paddingBottom: 18,
        paddingLeft: 15,             
        paddingRight: 21,
    },
    cardNombre: {
        color: "#000000",
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 8,
        // ¡Fuente especial ELIMINADA! Ahora usa la fuente default.
    },
    cardFila: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    cardFechaContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardIcono: {
        width: 16,
        height: 16,
        marginRight: 3, 
    },
    cardFechaTexto: {
        fontSize: 9,
    },
    cardPill: {
        borderRadius: 30,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    cardPillTexto: {
        color: "#FFFFFF",
        fontSize: 12,
    },
    cardDescripcion: {
        color: "#000000",
        fontSize: 8,
        width: "80%",
    }
});