import { useState, useCallback } from 'react';
import { Ship, Squadron } from '../types/fleet';

export const useFleetState = () => {
  const [points, setPoints] = useState(0);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [totalShipPoints, setTotalShipPoints] = useState(0);
  const [totalSquadronPoints, setTotalSquadronPoints] = useState(0);
  const [previousShipPoints, setPreviousShipPoints] = useState(0);
  const [previousSquadronPoints, setPreviousSquadronPoints] = useState(0);
  const [hasCommander, setHasCommander] = useState(false);

  const updatePointsFromShipChange = useCallback((pointDelta: number) => {
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPoints(prev => prev + pointDelta);
    setTotalShipPoints(prev => prev + pointDelta);
  }, [points, totalShipPoints]);

  const updatePointsFromSquadronChange = useCallback((pointDelta: number) => {
    setPreviousPoints(points);
    setPreviousSquadronPoints(totalSquadronPoints);
    setPoints(prev => prev + pointDelta);
    setTotalSquadronPoints(prev => prev + pointDelta);
  }, [points, totalSquadronPoints]);

  const calculateShipTotalPoints = useCallback((ship: Ship) => {
    return ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0);
  }, []);

  const calculateSquadronTotalPoints = useCallback((squadron: Squadron) => {
    return squadron.points * (squadron.count || 1);
  }, []);

  const recalculateAllPoints = useCallback((ships: Ship[], squadrons: Squadron[]) => {
    const newShipPoints = ships.reduce((total, ship) => total + calculateShipTotalPoints(ship), 0);
    const newSquadronPoints = squadrons.reduce((total, squadron) => total + calculateSquadronTotalPoints(squadron), 0);
    const newTotalPoints = newShipPoints + newSquadronPoints;

    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPreviousSquadronPoints(totalSquadronPoints);
    
    setTotalShipPoints(newShipPoints);
    setTotalSquadronPoints(newSquadronPoints);
    setPoints(newTotalPoints);

    // Check for commander
    const commanderExists = ships.some(ship => 
      ship.assignedUpgrades.some(upgrade => upgrade.type === "commander")
    );
    setHasCommander(commanderExists);
  }, [points, totalShipPoints, totalSquadronPoints, calculateShipTotalPoints, calculateSquadronTotalPoints]);

  const resetFleetState = useCallback(() => {
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPreviousSquadronPoints(totalSquadronPoints);
    setPoints(0);
    setTotalShipPoints(0);
    setTotalSquadronPoints(0);
    setHasCommander(false);
  }, [points, totalShipPoints, totalSquadronPoints]);

  return {
    // State
    points,
    previousPoints,
    totalShipPoints,
    totalSquadronPoints,
    previousShipPoints,
    previousSquadronPoints,
    hasCommander,
    
    // Setters (for direct state updates when needed)
    setPoints,
    setPreviousPoints,
    setTotalShipPoints,
    setTotalSquadronPoints,
    setPreviousShipPoints,
    setPreviousSquadronPoints,
    setHasCommander,
    
    // Methods
    updatePointsFromShipChange,
    updatePointsFromSquadronChange,
    calculateShipTotalPoints,
    calculateSquadronTotalPoints,
    recalculateAllPoints,
    resetFleetState
  };
}; 