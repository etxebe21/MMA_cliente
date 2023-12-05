import React, { useEffect, useState, useRef, useContext } from 'react';
import { StyleSheet, PermissionsAndroid, Alert, ImageBackground, ToastAndroid, Image, View, ActivityIndicator, Animated } from 'react-native';
import styled from 'styled-components/native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Context } from '../context/Context';
import MapStyle from '../components/MapStyle.json'
import { socket } from '../socket/socketConnect';

const GeolocationUser = () => {
  //GLOBALES
  const { userGlobalState, handleUserGlobalState } = useContext(Context);
  const { artifactsGlobalState, setArtefactsGlobalState } = useContext(Context);
  const {pendingTextGlobalState, setPendingTextGlobalState} = useContext(Context);

  //LOCALES
  //const [artifactsGlobalStat, handleArtefactsGlobalState] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState([]);
  const [search, setSearches] = useState([]);
  const [showButton, setShowButton] = useState();
  const [collectedArtifacts, setCollectedArtifacts] = useState();
  const [showAnotherButton, setShowAnotherButton] = useState(true);
  const [showPendingText, setShowPendingText] = useState(false);
  const [userId, setuserId] = useState([]);
  const [mapVisible, setMapVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // const [socket, setSocket] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const img = require("../assets/wallpaper_geolocalitation.png")

  useEffect(() => {
    if (showPendingText) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,  // Ajusta la fricción para cambiar la velocidad de la animación
        tension: 40, // Ajusta la tensión para cambiar la velocidad de la animación
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [showPendingText, scaleAnim]);

  //EFFECT INICIAL
  useEffect(() => {
    requestLocationPermission();
    getSearchesFromDataBase();
    loadArtifacts();
    getID();
  }, []);

   //EFFECT conprobar estado busqueda
   useEffect(() => {
    checkState();
  }, [pendingTextGlobalState]);

  useEffect(() => {
    if (userLocation != undefined) {
      // console.log("Localizacion")
      // console.log(userLocation);
      checkIfUserNearMarker(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, artifactsGlobalState]); 
  
  const checkIfUserNearMarker = (latitude, longitude) => {
    if(artifactsGlobalState !== undefined)
    {
      artifactsGlobalState != null && artifactsGlobalState.forEach((artifact) => {
        if (!artifact.found) {
          const distance = calculateDistance(latitude, longitude, artifact.latitude, artifact.longitude);
          // console.log("Distancia: ");
          // console.log(distance);
          if (distance < 1000000) {
            console.log('Estás cerca del marcador:', artifact.name);
            setShowButton(true); // Establece el estado del botón a true si el usuario está cerca del artefacto
            setSelectedArtifact(artifact);
          } else {
            setShowButton(false); // Si no está cerca, oculta el botón
          }
        }
      });
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    const y = (lat2 - lat1);
    const d = Math.sqrt(x * x + y * y) * R;
    return d;
  };

  const getID = async () => {
    try {
      const userId = await AsyncStorage.getItem('userID')
      setuserId(userId);
      return jsonValue != null ? JSON.parse(jsonValue) : null;

    } catch (e) {
    }
  };

  const loadArtifacts = async () => {
    try {
      const artifactsData = await axios.get('https://mmaproject-app.fly.dev/api/artifacts');
      const artifacts = artifactsData.data.data;

      // Actualizar los artefactos con la imagen del usuario
      const updatedArtifacts = await Promise.all(
        artifacts.map(async (artifact) => {
          if (artifact.found) {
            const userImage = await getUserImageById(artifact.who);
            return { ...artifact, userImage };
          }
          return artifact;
        })
      );

      (updatedArtifacts);
    } catch (error) {
      console.error('Error al cargar los artefactos:', error);
    }
  };
  const updateFoundedArtifact = async (artifact) => {
    try {
      const selectedArtifact = { 
        found: !artifact.found, 
        who: userId,
        id: artifact._id,
        userImage: '', // Inicializa userImage con un valor vacío por ahora
      }; 
  
      // Obtener la imagen del usuario actual
      const userImage = await getUserImageById(userId);
  
      // Actualizar el estado de artefactos localmente con la imagen del usuario que lo recogió
      const updatedArtifacts = artifactsGlobalState.map(art => {
        if (art._id === artifact._id) {
          return { ...art, found: !artifact.found, userImage }; // Actualizar el artefacto recién recolectado con la nueva imagen
        } else if (art.found) {
          // Mantener la información de la imagen de usuario para los artefactos previamente recolectados
          return { ...art, userImage: art.userImage };
        }
        return art;
      });
  
      // Establecer el nuevo estado global de los artefactos
      setArtefactsGlobalState(updatedArtifacts);
  
      // Incluir la imagen del usuario en selectedArtifact
      selectedArtifact.userImage = userImage;
  
      // Emitir el evento 'clientEvent' al servidor con los datos actualizados del artefacto
      socket.emit('updateArtifact', { selectedArtifact });
      
      setCollectedArtifacts(prevCount => prevCount + 1);
      ToastAndroid.showWithGravity('Artefacto recogido', ToastAndroid.SHORT, ToastAndroid.CENTER);
    } catch (error) {
      console.error('Error al actualizar los datos del artefacto:', error);
    }
  };
  

  //CUANDO recoges un artefacto se llama a este effect
  useEffect(() => {
    if (collectedArtifacts === 4) {
      setShowAnotherButton(true);
      setShowButton(false);
    } else {
      setShowAnotherButton(false);
    }
  }, [collectedArtifacts]);

  // Función para contar los artefactos encontrados
 const countFoundArtifacts = () => {
  const foundArtifacts = artifactsGlobalState != null && artifactsGlobalState && artifactsGlobalState.filter((artifact) => artifact.found);
  console.log("lenght artefactos", foundArtifacts.length)
  return foundArtifacts.length;
};

//Actualizar el estado de visibilidad del botón
useEffect(() => {
  const foundCount = countFoundArtifacts();
  setShowAnotherButton(foundCount === 4);
  setShowButton(foundCount < 4);
}, [artifactsGlobalState]);


  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();
        console.log("Entra en OS")
        Geolocation.watchPosition(
          position => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          });
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED || Platform.OS === 'ios') {
          Geolocation.watchPosition(
            position => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              // console.log(latitude)
              // sendLocationToServer(latitude, longitude);
            },
            (error) => {
              console.error('Error al obtener la ubicación:', error);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000, distanceFilter: 1 }
          );
        } else {
          console.log('Permiso de ubicación denegado');
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getSearchesFromDataBase = async () => {
    try {
      const url = 'https://mmaproject-app.fly.dev/api/searches';
      const response = await axios.get(url);
      const searches = response.data.data;
      setSearches(searches);
      console.log(searches[0].state);

       if (searches[0].state === 'completed') {
        Alert.alert(
          'BUSQUEDA VALIDADA',
          '',
          [
            {
              text: 'OK',
              onPress: () => openModal(),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error al obtener búsquedas:', error);
    }
  };

  const updateSearch = async (search) => {
    try {
      console.log('busqueda:', search);
      const finishedSearch = { state: "pending" };
      console.log('modificar estado state', finishedSearch);
      console.log('ID de la busqueda :', search[0]._id);
      socket.emit('verifyArtifact', search[0]._id,finishedSearch);

     
      getSearchesFromDataBase();
    } catch (error) {
      console.error('Error al actualizar busqueda:', error);
    }
  };

  // función para obtener la imagen del usuario por su ID
  const getUserImageById = async (userId) => {
    try {
      const user = await axios.get(`https://mmaproject-app.fly.dev/api/users/${userId}`);
      const userPicture = user.data.data.picture;
      return userPicture; // Devolvemos la URL de la imagen del usuario

    } catch (error) {
      console.error('Error al obtener la imagen del usuario:', error);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setMapVisible(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setMapVisible(true);
  };

  const checkState = () => {
      if (pendingTextGlobalState === 'pending') {
        setShowPendingText(true); // Actualizar el estado para mostrar el Animated.View
        setShowAnotherButton(false); // Ocultar el botón 'Check'
        ToastAndroid.showWithGravity('BÚSQUEDA EN ESTADO PENDING', ToastAndroid.SHORT, ToastAndroid.CENTER);
      } 
  };

  return (
    <Container>
      {mapVisible && artifactsGlobalState && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={{
            latitude: 43.30972753944833,
            longitude: -2.002748937230638,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          customMapStyle={MapStyle}
        >

          {artifactsGlobalState != null && artifactsGlobalState &&
            artifactsGlobalState
              .filter(artifact => !artifact.found) // Filtrar solo artefactos no encontrados
              .map((artifact, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: artifact.latitude,
                    longitude: artifact.longitude,
                  }}
                  title={artifact.name}
                  description={artifact.description || ''}
                >
                  {/* Contenedor del marcador con imagen */}
                  <View style={styles.markerImageContainer}>
                    <Image
                      source={{ uri: artifact.image }}
                      style={styles.roundedMarkerImage}
                    />
                  </View>
                </Marker>
              
              ))}
        </MapView>
      )}

      <BackgroundImage source={img}>

        {showButton && (
          <Buttons onPress={() => updateFoundedArtifact(selectedArtifact)}>
            <ButtonsText>RECOGER</ButtonsText>
          </Buttons>
        )}

        {showAnotherButton && (
          <>
            <SendButton onPress={() => updateSearch(search)}>
              <ButtonsText>CHECK</ButtonsText>
            </SendButton>
          </>
        )}

        <View>
          {pendingTextGlobalState === "pending" && (
            <>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <PendingText style={styles.pendingText}>PENDING</PendingText>
                <ActivityIndicator size="large" color="#3498db" animating={true} />
              </Animated.View>
            </>
          )}
        </View>

        {!pendingTextGlobalState && (
          <>
            <Title>ARTIFACTS</Title>
            <View style={styles.artifactsContainer}>
              {artifactsGlobalState != null && artifactsGlobalState && artifactsGlobalState.slice(0, 4).map((artifact, index) => (
                <View key={index} style={styles.artifactUserContainer}>
                  <View style={styles.artifactContainer}>
                    <Image
                      source={{ uri: artifact.image }}
                      style={[
                        styles.roundedArtifactImage,
                        { opacity: artifact.found ? 1 : 0.4 },
                      ]}
                    />
                  </View>
                  {artifact.found && artifact.userImage && (
                    <View style={styles.userImageContainer}>
                      <Image
                        source={{ uri: artifact.userImage }}
                        style={styles.roundedUserImage}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

      </BackgroundImage>
    </Container>

  );
};

const styles = StyleSheet.create({
  markerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundedMarkerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  artifactsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 10,
    bottom: 20
  },
  artifactContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  roundedArtifactImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  userImageContainer: {
    position: 'absolute',
    top: 20,
    left: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundedUserImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 1,
    borderColor: '#4c2882',
    top: 27,
    marginLeft: 33
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Color de fondo del modal
  },
});

const BackgroundImage = styled(ImageBackground)`
  flex: 1;
  resizeMode: cover;
  justify-content: center;
  opacity:0.8
  `
  
const Buttons = styled.TouchableOpacity`
  background: #A3A2A2;
  opacity: 0.95;
  width: 180px;
  height: 65px;
  align-self: center;
  border-radius: 30px;
  border: #0B0B0B;
  bottom:25px;
  background-color:#ffffff
  `

const ButtonsText = styled.Text`
  fontSize: 28px;
  font-family: 'Tealand';
  color: #4c2882; 
  align-self: center;
  top:17px;
  `

const SendButton = styled.TouchableOpacity`
background: #A3A2A2;
opacity: 0.95;
width: 180px;
height: 65px;
align-self: center;
border-radius: 30px;
border: #0B0B0B;
bottom:25px;
background-color:#ffffff
`
const Container = styled.View`
  flex: 1;
  `
const Title = styled.Text`
font-size: 40px; 
align-self:center;
color:#49CFDF;
font-family: 'Tealand';
bottom:20px;
text-shadow: 2px 2px 7px black;
`
const PendingText = styled.Text`
  fontSize: 65px;
  font-family: 'Creepster';
  color: #49CFDF; 
  align-self: center;
  top: -30px;
  `
const UpdateButton = styled.TouchableOpacity`
background: #A3A2A2;
opacity: 0.95;
width: 180px;
height: 65px;
align-self: center;
border-radius: 30px;
border: #0B0B0B;
bottom:25px;
background-color:#ffffff
`

export default GeolocationUser;