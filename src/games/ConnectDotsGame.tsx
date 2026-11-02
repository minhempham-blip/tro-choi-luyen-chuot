import React from 'react';
import { GameComponentProps } from '../state/types';
import { CosmicVoyageGame } from './CosmicVoyageGame';

export const ConnectDotsGame: React.FC<GameComponentProps> = (props) => {
  return <CosmicVoyageGame {...props} />;
};

export default ConnectDotsGame;
