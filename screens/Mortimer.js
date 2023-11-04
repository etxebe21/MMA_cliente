import React , {useState, useEffect} from "react";
import styled from "styled-components/native";
import { Modal , StyleSheet, TouchableOpacity} from "react-native";
import axios from "axios";
import { ScrollView } from "react-native";

const Mortimer = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function getUsersFromDatabase() {
      try {
        const url = 'https://mmaproject-app.fly.dev/api/users';
        
        const response = await axios.get(url);
        const users = response.data.data;
        setUsers(users);
        console.log('Usuarios:', users);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    }

    getUsersFromDatabase();
  }, []);

  const acolitos = users.filter(user => user.role === "ACÓLITO");
 
  const handleUserPress = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  return (
    
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}>
        <Text>ACÓLITOS</Text>
        {acolitos.map((data) => (
          <TouchableOpacity key={data.picture} onPress={() => handleUserPress(data)}>
            <UserContainer>
              <AvatarContainer>
                <Avatar source={{ uri: data.picture }} />
                <StatusIndicator isInsideTower={data.insideTower} />
              </AvatarContainer>
              <NameText>{data.username}</NameText>
            </UserContainer>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {selectedUser && (
        <Modal visible={modalVisible}>
          <ModalContent>
            <Text>{selectedUser.username}</Text>
            <Text>Level: {selectedUser.level}</Text>
            <Text>Hitpoints: {selectedUser.hitPoints}</Text>
            {/* Agrega más propiedades según sea necesario */}
            <CloseButton onPress={() => setModalVisible(false)}>
              <ButtonText>Close</ButtonText>
            </CloseButton>
          </ModalContent>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C8A2C8',
  },
});
  
const View = styled.View`
  flex: 1;
  background: #C8A2C8;
`
const Text = styled.Text `
  bottom: -17px;
  color: #4c2882;
  font-size: 25px;
  font-weight: bold;
  letter-spacing: -0.3px;
  align-self: center;  
`
const NameText = styled.Text `
  margin-left: 15px;
  color: #4c2882;
  font-size: 19px;
  font-weight: bold;
  letter-spacing: -0.3px;
  align-self: center;  
`
const Avatar = styled.Image`
  width: 70px;
  height: 70px;
  margin-left: 10px;
  padding:1px;
  border-radius: 35px;
  border-color: #4c2882;
  border-width: 3px;
`
const AvatarContainer = styled.View`
  flex-direction: row;
  align-items: center;
`
const UserContainer = styled.View`
  flex-direction: row;
  align-items: center;
  height: 100px;
  border: #4c2882;
  bottom: -40px;
  background-color: #d9a9c9;
`
const StatusIndicator = styled.View`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  margin-left: -15px;
  bottom: -20px;
  background-color: ${(props) => (props.isInsideTower ? '#10D24B' : 'red')};
  border: #4c2882;
`
const ModalContent = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #d9a9c9;
`
const CloseButton = styled.TouchableOpacity`
    background-color: #4c2882;
    padding: 10px 20px;
    bottom: -50px;
    width: 50%;
    height: 55px;
    border-radius: 60px;
    align-self: center;
`
const ButtonText = styled.Text `
  color: #FFFFFF;
  font-size: 25px;
  font-weight: bold;
  letter-spacing: -0.3px;
  align-self: center;  
`

export default Mortimer;