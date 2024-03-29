import { useContext, useEffect, useState } from 'react';
import { Context } from '../context/Context';

function SocketListener(props) {
	const { currentSocketEvent } = props;
	const [currentEvent, setEvent] = useState(currentSocketEvent);
	const { handleGlobalState } = useContext(Context);
	const { artifactsGlobalState, setArtefactsGlobalState } = useContext(Context);
	const { materialsGlobalState, setMaterialsGlobalState } = useContext(Context);
	const { pendingTextGlobalState, setPendingTextGlobalState } = useContext(Context);
	const { userGlobalState, setUserGlobalState } = useContext(Context);
	const { usersGlobalState, setUsersGlobalState} = useContext(Context);

	useEffect(() => {
		setEvent(currentSocketEvent);
	}, [currentSocketEvent]);

	useEffect(() => {
		if (currentEvent !== null) {
			const handler = handlers[currentEvent.event];
			if (handler) {
				handler(currentEvent.value);
			}
		}
		else return;
	}, [currentEvent]);

	const handleAcoliteStamina = (data) => { handleGlobalState({ stamina: data }) };
	const handleAcoliteLife = (data) => { handleGlobalState({ life: data }) };
	const handleAcoliteGold = (data) => { handleGlobalState({ gold: data }) };
	const handleAcoliteXperience = (data) => { handleGlobalState({ xp: data }) };
	const handleNewAcolite = (data) => { handleGlobalState({ user: data }) };
	const handleArtifacts = (data) => {
		setArtefactsGlobalState(data);
		// console.log(artifactsGlobalState);
	};
	const handleMaterials = (data) => {
		//console.log('ENTRA EN LA FUNCION ', materialsGlobalState);
		setMaterialsGlobalState(data);
		
	};
	const handleVerify = (data) => {
		setPendingTextGlobalState(data.state);
	}

	const handleUserGlobalState = (data) => {
		setUserGlobalState(data)
	}

	// Socket de escucha que recibe los datos de cambio de vida del cron
	const handleStats = (users) => {
		// console.log("Datos recibidos del servidor del usuario: ")
		// console.log(users);
		if (users !== null || users !== undefined) {
			// console.log("Entra en seteo de usuario")
			setUsersGlobalState(users);
		}

	}
	const handleReset = (data) => { setArtefactsGlobalState(data) };
	
	const handleMaterialReset = (data) => { setMaterialsGlobalState(data);  console.log('MATERIALES RESETEADOS', data) };

	const handleTired = (data) => {
		const acolitosData = data.filter(dataRole => dataRole.role === "ACÓLITO");
		setUsersGlobalState(acolitosData);
	
	};

	const handleRestAcolite = (data) => { setUsersGlobalState(data)};

	const handleEthazium = (data) => {setUsersGlobalState(data)};


	const handlers = {
		stamina: handleAcoliteStamina,
		life: handleAcoliteLife,
		gold: handleAcoliteGold,
		xp: handleAcoliteXperience,
		new_user: handleNewAcolite,
		responseEvent: handleArtifacts,
		responseMaterial: handleMaterials,
		responseVerify: handleVerify,
		returnStat: handleStats,
		resetArtifact: handleReset,
		resetMaterialResponse : handleMaterialReset,
		ethaziumUser: handleEthazium,
		UpdatedTired: handleTired,
		receiveUserAtributes: handleUserGlobalState,
		restAcolite: handleRestAcolite,
	}

	return null;
}

export default SocketListener