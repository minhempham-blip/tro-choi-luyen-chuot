import React from 'react';
import { GameComponentProps } from '../state/types';
import { FruitArcheryGame } from './FruitArcheryGame';

export const PopBubblesGame: React.FC<GameComponentProps> = (props) => {
  return <FruitArcheryGame {...props} />;
};

export default PopBubblesGame;
