import React from 'react';
import { GameComponentProps } from '../state/types';
import { CrystalPetRescueGame } from './CrystalPetRescueGame';

export const HatchEggsGame: React.FC<GameComponentProps> = (props) => {
  return <CrystalPetRescueGame {...props} />;
};

export default HatchEggsGame;
