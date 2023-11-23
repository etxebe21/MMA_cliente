import React from 'react';
import styled from 'styled-components/native';


const Container = styled.View`
    width: 100%;
    height: 85px;
    padding: 0 11px;
    align-items: center;
    flex-direction: row;
    justify-content: space-between; 
    background: #C8A2C8;
    `


const Text = styled.Text `
    margin-top: 40px;
    color: #4c2882;
    font-size: 30px;
    font-weight: bold;
    letter-spacing: -0.3px;
    font-family: 'Tealand';
`
const Row = styled.View`
    flex-direction: row;
`

const Button = styled.TouchableOpacity`
    width: 42px;
    height: 42px;
    border-radius: 21px;
    margin-left: 16px;
    background: #C8A2C8;
    align-items: center;
    justify-content: center;
`

const Header = () => {
    return(
        <Container>
            <Text> LA HERMANDAD </Text> 
        </Container>
    )
}
export default Header;

