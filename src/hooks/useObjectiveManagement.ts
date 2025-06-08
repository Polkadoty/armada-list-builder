import { useState, useCallback } from 'react';
import { Objective } from '../types/fleet';
import { ObjectiveModel } from '../components/ObjectiveSelector';

export const useObjectiveManagement = (faction: string) => {
  const [selectedAssaultObjectives, setSelectedAssaultObjectives] = useState<Objective[]>([]);
  const [selectedDefenseObjectives, setSelectedDefenseObjectives] = useState<Objective[]>([]);
  const [selectedNavigationObjectives, setSelectedNavigationObjectives] = useState<Objective[]>([]);

  const handleSelectAssaultObjective = useCallback((objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedAssaultObjectives(prev => [...prev, objective as Objective]);
    } else {
      setSelectedAssaultObjectives([objective as Objective]);
    }
  }, [faction]);

  const handleSelectDefenseObjective = useCallback((objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedDefenseObjectives(prev => [...prev, objective as Objective]);
    } else {
      setSelectedDefenseObjectives([objective as Objective]);
    }
  }, [faction]);

  const handleSelectNavigationObjective = useCallback((objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedNavigationObjectives(prev => [...prev, objective as Objective]);
    } else {
      setSelectedNavigationObjectives([objective as Objective]);
    }
  }, [faction]);

  const handleRemoveAssaultObjective = useCallback(() => {
    setSelectedAssaultObjectives([]);
  }, []);

  const handleRemoveDefenseObjective = useCallback(() => {
    setSelectedDefenseObjectives([]);
  }, []);

  const handleRemoveNavigationObjective = useCallback(() => {
    setSelectedNavigationObjectives([]);
  }, []);

  const clearAllObjectives = useCallback(() => {
    setSelectedAssaultObjectives([]);
    setSelectedDefenseObjectives([]);
    setSelectedNavigationObjectives([]);
  }, []);

  return {
    selectedAssaultObjectives,
    selectedDefenseObjectives,
    selectedNavigationObjectives,
    setSelectedAssaultObjectives,
    setSelectedDefenseObjectives,
    setSelectedNavigationObjectives,
    handleSelectAssaultObjective,
    handleSelectDefenseObjective,
    handleSelectNavigationObjective,
    handleRemoveAssaultObjective,
    handleRemoveDefenseObjective,
    handleRemoveNavigationObjective,
    clearAllObjectives
  };
}; 