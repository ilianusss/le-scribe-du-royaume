export interface Rulings {
  phoenixPenaltyClearedByBeastmaster: boolean;
  blankingCycleMasksAll: boolean;
  dirigibleArmyWordClearWaivesArmyCondition: boolean;
  wildfireBlanksUnusedJoker: boolean;
  worldTreeBonus: { base: number; extension: number };
  tieBreakUsesPrintedStrengthOfAllCards: boolean;
}

export const DEFAULT_RULINGS: Rulings = {
  phoenixPenaltyClearedByBeastmaster: true,
  blankingCycleMasksAll: true,
  dirigibleArmyWordClearWaivesArmyCondition: true,
  wildfireBlanksUnusedJoker: true,
  worldTreeBonus: { base: 50, extension: 70 },
  tieBreakUsesPrintedStrengthOfAllCards: true,
};
