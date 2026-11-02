import React from 'react';
import { GameComponentProps } from '../state/types';
import { MagicWandGame } from './MagicWandGame';
import { BusyBeeGame } from './BusyBeeGame';
import { FirefliesGame } from './FirefliesGame';
import { CosmicVoyageGame } from './CosmicVoyageGame';
import { FruitArcheryGame } from './FruitArcheryGame';
import { WhackMoleGame } from './WhackMoleGame';
import { MagicBakeryGame } from './MagicBakeryGame';
import { FireworksGame } from './FireworksGame';
import { MagicMelodyGame } from './MagicMelodyGame';
import { CrystalPetRescueGame } from './CrystalPetRescueGame';
import { OpenWindowsGame } from './OpenWindowsGame';
import { DigTreasureGame } from './DigTreasureGame';
import { MagicSpellGame } from './MagicSpellGame';
import { SecretGiftGame } from './SecretGiftGame';
import { TidyRoomGame } from './TidyRoomGame';
import { FeedAnimalsGame } from './FeedAnimalsGame';
import { JigsawPuzzleGame } from './JigsawPuzzleGame';
import { AreaSelectGame } from './AreaSelectGame';
import { SubmarineDeepSeaGame } from './SubmarineDeepSeaGame';
import { MouseChampionGame } from './MouseChampionGame';

export const GAME_COMPONENTS: Record<number, React.FC<GameComponentProps>> = {
  1: MagicWandGame,
  2: BusyBeeGame,
  3: FirefliesGame,
  4: CosmicVoyageGame,
  5: FruitArcheryGame,
  6: WhackMoleGame,
  7: MagicBakeryGame,
  8: FireworksGame,
  9: MagicMelodyGame,
  10: CrystalPetRescueGame,
  11: OpenWindowsGame,
  12: DigTreasureGame,
  13: MagicSpellGame,
  14: SecretGiftGame,
  15: TidyRoomGame,
  16: FeedAnimalsGame,
  17: JigsawPuzzleGame,
  18: AreaSelectGame,
  19: SubmarineDeepSeaGame,
  20: MouseChampionGame,
};
