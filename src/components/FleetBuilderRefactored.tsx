/* eslint-disable @typescript-eslint/no-empty-interface */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Printer,
  FileText,
  Trash2,
  TriangleAlert,
  Import
} from "lucide-react";
import { ShipSelector } from "./ShipSelector";
import { SelectedShip } from "./SelectedShip";
import { ShipFilter } from "./ShipFilter";
import { SelectedSquadron } from "./SelectedSquadron";
import { SquadronFilter } from "./SquadronFilter";
import { SquadronSelector } from "./SquadronSelector";
import { PointsDisplay } from "./PointsDisplay";
import { ObjectiveSelector, ObjectiveModel } from "./ObjectiveSelector";
import UpgradeSelector from "./UpgradeSelector";
import { ExportTextPopup } from "./ExportTextPopup";
import { SwipeableObjective } from "./SwipeableObjective";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { TextImportWindow } from "./TextImportWindow";
import { NotificationWindow } from "./NotificationWindow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FleetRecoveryPopup } from "./FleetRecoveryPopup";
import { SaveFleetButton } from './SaveFleetButton';
import { PrintMenu } from "./PrintMenu";
import { ExpansionSelector } from "./ExpansionSelector";

// Import our hooks
import { useShipManagement } from '../hooks/useShipManagement';
import { useSquadronManagement } from '../hooks/useSquadronManagement';
import { useFleetState } from '../hooks/useFleetState';
import { useObjectiveManagement } from '../hooks/useObjectiveManagement';
import { useUpgradeManagement } from '../hooks/useUpgradeManagement';

// Import utilities
import { generateExportText } from '../utils/fleetExport';
import { importFleet } from '../utils/fleetImport';
import { generatePrintContent, generatePrintnPlayContent } from '../utils/printUtils';

// Import types
import { Ship, Squadron, Objective, FleetFormat, UIState, PrintSettings } from '../types/fleet';
import { checkFleetViolations, Gamemode, getRestrictionsForGamemode } from "../utils/gamemodeRestrictions";

const SectionHeader = ({
  title,
  points,
  previousPoints,
  onClearAll,
  onAdd,
  pointsLimit,
}: {
  title: string;
  points: number;
  previousPoints: number;
  show: boolean;
  onClearAll: () => void;
  onAdd: () => void;
  pointsLimit: number;
}) => (
  <Card className="mb-4 relative">
    <Button
      className="w-full justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 text-lg py-6"
      variant="outline"
      onClick={onAdd}
    >
      <span className="flex items-center text-l">ADD {title.toUpperCase()}</span>
      <span className="flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="mr-2 text-red-500 hover:text-opacity-70"
        >
          <Trash2 size={16} />
        </button>
        <PointsDisplay points={points} previousPoints={previousPoints} pointsLimit={pointsLimit} showWarning={points > pointsLimit} />
      </span>
    </Button>
  </Card>
);

interface FleetBuilderRefactoredProps {
  faction: string;
  fleetName: string;
  setFleetName: React.Dispatch<React.SetStateAction<string>>;
  gamemode: string;
}

export default function FleetBuilderRefactored({
  faction,
  fleetName,
  setFleetName,
  gamemode,
}: FleetBuilderRefactoredProps) {
  // UI state
  const [showShipSelector, setShowShipSelector] = useState(false);
  const [showSquadronSelector, setShowSquadronSelector] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showImportWindow, setShowImportWindow] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [currentUpgradeType, setCurrentUpgradeType] = useState("");
  const [currentShipId, setCurrentShipId] = useState("");
  const [currentUpgradeIndex, setCurrentUpgradeIndex] = useState<number>(0);
  const [showUpgradeSelector, setShowUpgradeSelector] = useState(false);
  const [squadronToSwap, setSquadronToSwap] = useState<string | null>(null);
  
  // Print settings
  const [paperSize, setPaperSize] = useState<'letter' | 'a4'>('letter');
  const [showPrintRestrictions, setShowPrintRestrictions] = useState(true);
  const [showPrintObjectives, setShowPrintObjectives] = useState(true);
  const [showCardBacks, setShowCardBacks] = useState(false);
  const [showDamageDeck, setShowDamageDeck] = useState(false);
  const [expandCardBacks, setExpandCardBacks] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Hook integrations
  const shipManagement = useShipManagement();
  const squadronManagement = useSquadronManagement();
  const fleetState = useFleetState();
  const objectiveManagement = useObjectiveManagement(faction);
  const upgradeManagement = useUpgradeManagement();

  // Get ships and squadrons from hooks
  const selectedShips = shipManagement.selectedShips;
  const selectedSquadrons = squadronManagement.selectedSquadrons;

  // Fleet violations calculation
  const commanderCount = selectedShips
    .flatMap((ship) => ship.assignedUpgrades)
    .filter((upgrade) => upgrade.type === "commander").length;

  // Calculate filter for ships and squadrons
  const shipFilter = {
    minPoints: 0,
    maxPoints: 1000,
  };

  const squadronFilter = {
    minPoints: 0,
    maxPoints: 1000,
  };

  // Recalculate points when ships or squadrons change
  useEffect(() => {
    fleetState.recalculateAllPoints(selectedShips, selectedSquadrons);
  }, [selectedShips, selectedSquadrons, fleetState]);

  // Ship management handlers
  const handleAddShip = () => {
    setShowShipSelector(true);
  };

  const handleSelectShip = (ship: any) => {
    shipManagement.handleSelectShip(ship);
    setShowShipSelector(false);
  };

  const handleRemoveShip = (id: string) => {
    const ship = selectedShips.find(s => s.id === id);
    if (ship) {
      upgradeManagement.clearUpgradeState(id);
      shipManagement.handleRemoveShip(id);
    }
  };

  const handleCopyShip = (shipToCopy: Ship) => {
    shipManagement.handleCopyShip(shipToCopy);
  };

  const handleMoveShip = (id: string, direction: 'up' | 'down') => {
    shipManagement.handleMoveShip(id, direction);
  };

  const clearAllShips = () => {
    selectedShips.forEach(ship => {
      upgradeManagement.clearUpgradeState(ship.id);
    });
    shipManagement.clearAllShips();
  };

  // Squadron management handlers
  const handleAddSquadron = () => {
    setShowSquadronSelector(true);
  };

  const handleSelectSquadron = (squadron: Squadron) => {
    if (squadronToSwap) {
      const oldSquadron = selectedSquadrons.find(s => s.id === squadronToSwap);
      if (oldSquadron) {
        squadronManagement.handleSwapSquadron(oldSquadron, squadron);
      }
      setSquadronToSwap(null);
    } else {
      squadronManagement.handleAddingSquadron(squadron);
    }
    setShowSquadronSelector(false);
  };

  const handleRemoveSquadron = (id: string) => {
    squadronManagement.handleRemoveSquadron(id);
  };

  const handleIncrementSquadron = (id: string) => {
    squadronManagement.handleIncrementSquadron(id);
  };

  const handleDecrementSquadron = (id: string) => {
    squadronManagement.handleDecrementSquadron(id);
  };

  const handleSwapSquadron = (id: string) => {
    setSquadronToSwap(id);
    setShowSquadronSelector(true);
  };

  const handleMoveSquadron = (id: string, direction: 'up' | 'down') => {
    squadronManagement.handleMoveSquadron(id, direction);
  };

  const clearAllSquadrons = () => {
    squadronManagement.clearAllSquadrons();
  };

  // Upgrade management handlers
  const handleUpgradeClick = (
    shipId: string,
    upgradeType: string,
    upgradeIndex: number
  ) => {
    setCurrentShipId(shipId);
    setCurrentUpgradeType(upgradeType);
    setCurrentUpgradeIndex(upgradeIndex);
    setShowUpgradeSelector(true);
  };

  const handleSelectUpgrade = (upgrade: Upgrade) => {
    upgradeManagement.handleSelectUpgrade(
      upgrade,
      currentShipId,
      currentUpgradeType,
      currentUpgradeIndex,
      selectedShips,
      shipManagement.updateShip
    );
    setShowUpgradeSelector(false);
  };

  const handleRemoveUpgrade = (shipId: string, upgradeType: string, index: number) => {
    upgradeManagement.handleRemoveUpgrade(shipId, upgradeType, index, selectedShips, shipManagement.updateShip);
  };

  // Export handlers
  const handleExport = () => {
    setShowExportPopup(true);
  };

  const handleImport = () => {
    setShowImportWindow(true);
  };

  const handleImportFleet = useCallback((importText: string, format: 'kingston' | 'afd' | 'warlords' | 'starforge') => {
    try {
      const result = importFleet(
        importText,
        format,
        faction,
        fleetState,
        selectedShips,
        selectedSquadrons,
        objectiveManagement,
        shipManagement,
        squadronManagement,
        upgradeManagement,
        setFleetName
      );
      
      if (result.success) {
        setShowImportWindow(false);
        if (result.skippedItems && result.skippedItems.length > 0) {
          setNotificationMessage(`Import completed. Skipped items: ${result.skippedItems.join(', ')}`);
          setShowNotification(true);
        }
      } else {
        setNotificationMessage(result.error || 'Import failed');
        setShowNotification(true);
      }
    } catch (error) {
      setNotificationMessage('Import failed: ' + (error as Error).message);
      setShowNotification(true);
    }
  }, [
    faction,
    fleetState,
    selectedShips,
    selectedSquadrons,
    objectiveManagement,
    shipManagement,
    squadronManagement,
    upgradeManagement,
    setFleetName
  ]);

  // Print handlers
  const handlePrint = () => {
    setShowPrintMenu(true);
  };

  const handlePrintList = () => {
    const printContent = generatePrintContent({
      fleetName,
      faction,
      points: fleetState.points,
      selectedShips,
      selectedSquadrons,
      selectedAssaultObjectives: objectiveManagement.selectedAssaultObjectives,
      selectedDefenseObjectives: objectiveManagement.selectedDefenseObjectives,
      selectedNavigationObjectives: objectiveManagement.selectedNavigationObjectives,
      showPrintRestrictions,
      showPrintObjectives,
      fleetViolations: [] // You'd need to implement violation checking
    });
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 2500);
    }
    setShowPrintMenu(false);
  };

  const handlePrintnPlay = () => {
    const printContent = generatePrintnPlayContent({
      fleetName,
      faction,
      selectedShips,
      selectedSquadrons,
      selectedAssaultObjectives: objectiveManagement.selectedAssaultObjectives,
      selectedDefenseObjectives: objectiveManagement.selectedDefenseObjectives,
      selectedNavigationObjectives: objectiveManagement.selectedNavigationObjectives,
      paperSize,
      showCardBacks,
      showDamageDeck,
      expandCardBacks
    });
    
    const printWindow = window.open('', 'print_window');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 2500);
    }
    setShowPrintMenu(false);
  };

  // Generate export text
  const exportText = generateExportText({
    fleetName,
    faction,
    selectedShips,
    selectedSquadrons,
    selectedAssaultObjectives: objectiveManagement.selectedAssaultObjectives,
    selectedDefenseObjectives: objectiveManagement.selectedDefenseObjectives,
    selectedNavigationObjectives: objectiveManagement.selectedNavigationObjectives,
    points: fleetState.points,
    totalSquadronPoints: fleetState.totalSquadronPoints
  });

  return (
    <div ref={contentRef} className="max-w-[2000px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0 flex items-center justify-start space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print Fleet</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md" onClick={handleExport}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Fleet</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md" onClick={handleImport}>
                  <Import className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import Fleet</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <SaveFleetButton
                  fleetData={exportText}
                  faction={faction}
                  fleetName={fleetName}
                  commander={selectedShips.find(ship => 
                    ship.assignedUpgrades.some(upgrade => upgrade.type === "commander"))?.assignedUpgrades
                      .find(upgrade => upgrade.type === "commander")?.name || ""}
                  points={fleetState.points}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Fleet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {fleetState.fleetViolations.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-yellow-500">
                  <TriangleAlert className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Restrictions Violations:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {fleetState.fleetViolations.map((violation, index) => (
                      <li key={index}>{violation}</li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex-grow logo-font" />
        {(faction !== "sandbox" || (selectedShips.length > 0 || selectedSquadrons.length > 0)) && (
          <PointsDisplay points={fleetState.points} previousPoints={fleetState.previousPoints} />
        )}
      </div>

      {faction === "sandbox" && (
        <ExpansionSelector 
          onSelectExpansion={(fleet) => handleImportFleet(fleet, 'kingston')}
          onClearFleet={clearAllShips}
          hasFleet={selectedShips.length > 0 || selectedSquadrons.length > 0}
          isExpansionMode={false}
          setExpansionMode={(mode) => {}}
        />
      )}

      {!faction === "sandbox" && (
        <>
          {/* Ships Section */}
          {selectedShips.length > 0 ? (
            <>
              <SectionHeader
                title="Ships"
                points={fleetState.totalShipPoints}
                previousPoints={fleetState.previousShipPoints}
                show={true}
                onClearAll={clearAllShips}
                onAdd={handleAddShip}
                pointsLimit={400}
              />
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5 gap-4">
                  {selectedShips.map((ship) => (
                    <SelectedShip
                      key={ship.id}
                      ship={ship}
                      onRemove={handleRemoveShip}
                      onUpgradeClick={handleUpgradeClick}
                      onCopy={handleCopyShip}
                      handleRemoveUpgrade={handleRemoveUpgrade}
                      disabledUpgrades={upgradeManagement.disabledUpgrades[ship.id] || []}
                      enabledUpgrades={upgradeManagement.enabledUpgrades[ship.id] || []}
                      filledSlots={upgradeManagement.filledSlots[ship.id] || {}}
                      hasCommander={fleetState.hasCommander}
                      traits={ship.traits || []}
                      onMoveUp={() => handleMoveShip(ship.id, 'up')}
                      onMoveDown={() => handleMoveShip(ship.id, 'down')}
                      isFirst={ship.id === selectedShips[0]?.id}
                      isLast={ship.id === selectedShips[selectedShips.length - 1]?.id}
                      greyUpgrades={upgradeManagement.greyUpgrades[ship.id] || []}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Card className="mb-4 relative">
              <Button
                className="w-full justify-between bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md text-lg py-6"
                variant="outline"
                onClick={handleAddShip}
              >
                <span className="text-lg">ADD SHIP</span>
              </Button>
            </Card>
          )}

          {/* Squadrons Section */}
          {selectedSquadrons.length > 0 ? (
            <>
              <SectionHeader
                title="Squadrons"
                points={fleetState.totalSquadronPoints}
                previousPoints={fleetState.previousSquadronPoints}
                show={true}
                onClearAll={clearAllSquadrons}
                onAdd={handleAddSquadron}
                pointsLimit={134}
              />
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {selectedSquadrons.map((squadron) => (
                    <SelectedSquadron
                      key={squadron.id}
                      squadron={squadron}
                      onRemove={handleRemoveSquadron}
                      onIncrement={handleIncrementSquadron}
                      onDecrement={handleDecrementSquadron}
                      onSwapSquadron={handleSwapSquadron}
                      onMoveUp={() => handleMoveSquadron(squadron.id, 'up')}
                      onMoveDown={() => handleMoveSquadron(squadron.id, 'down')}
                      isFirst={squadron.id === selectedSquadrons[0]?.id}
                      isLast={squadron.id === selectedSquadrons[selectedSquadrons.length - 1]?.id}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Card className="mb-4 relative">
              <Button
                className="w-full justify-between bg-white/30 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-md text-lg py-6"
                variant="outline"
                onClick={handleAddSquadron}
              >
                <span className="text-lg">ADD SQUADRON</span>
              </Button>
            </Card>
          )}

          {/* Objectives Section */}
          <div className="mb-4 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xl">
              <SwipeableObjective
                type="assault"
                selectedObjective={objectiveManagement.selectedAssaultObjectives[0]}
                selectedObjectives={faction === "sandbox" ? objectiveManagement.selectedAssaultObjectives : undefined}
                onRemove={objectiveManagement.handleRemoveAssaultObjective}
                onOpen={() => objectiveManagement.setShowAssaultObjectiveSelector(true)}
                color="#EB3F3A"
              />
              <SwipeableObjective
                type="defense"
                selectedObjective={objectiveManagement.selectedDefenseObjectives[0]}
                selectedObjectives={faction === "sandbox" ? objectiveManagement.selectedDefenseObjectives : undefined}
                onRemove={objectiveManagement.handleRemoveDefenseObjective}
                onOpen={() => objectiveManagement.setShowDefenseObjectiveSelector(true)}
                color="#FAEE13"
              />
              <SwipeableObjective
                type="navigation"
                selectedObjective={objectiveManagement.selectedNavigationObjectives[0]}
                selectedObjectives={faction === "sandbox" ? objectiveManagement.selectedNavigationObjectives : undefined}
                onRemove={objectiveManagement.handleRemoveNavigationObjective}
                onOpen={() => objectiveManagement.setShowNavigationObjectiveSelector(true)}
                color="#C2E1F4"
              />
            </div>
          </div>
        </>
      )}

      {/* Modals and Selectors */}
      {showShipSelector && (
        <ShipSelector
          faction={faction}
          filter={shipFilter}
          onSelectShip={handleSelectShip}
          onClose={() => setShowShipSelector(false)}
        />
      )}

      {showSquadronSelector && (
        <SquadronSelector
          faction={faction}
          filter={squadronFilter}
          onSelectSquadron={handleSelectSquadron}
          onClose={() => setShowSquadronSelector(false)}
          selectedSquadrons={selectedSquadrons}
          aceLimit={2}
          aceCount={selectedSquadrons.filter(s => s.ace).length}
        />
      )}

      {objectiveManagement.showAssaultObjectiveSelector && (
        <ObjectiveSelector
          type="assault"
          onSelectObjective={objectiveManagement.handleSelectAssaultObjective}
          onClose={() => objectiveManagement.setShowAssaultObjectiveSelector(false)}
        />
      )}

      {objectiveManagement.showDefenseObjectiveSelector && (
        <ObjectiveSelector
          type="defense"
          onSelectObjective={objectiveManagement.handleSelectDefenseObjective}
          onClose={() => objectiveManagement.setShowDefenseObjectiveSelector(false)}
        />
      )}

      {objectiveManagement.showNavigationObjectiveSelector && (
        <ObjectiveSelector
          type="navigation"
          onSelectObjective={objectiveManagement.handleSelectNavigationObjective}
          onClose={() => objectiveManagement.setShowNavigationObjectiveSelector(false)}
        />
      )}

      {showUpgradeSelector && (
        <UpgradeSelector
          id={currentShipId}
          upgradeType={currentUpgradeType}
          faction={faction}
          onSelectUpgrade={handleSelectUpgrade}
          onClose={() => setShowUpgradeSelector(false)}
          selectedUpgrades={selectedShips.flatMap(ship => ship.assignedUpgrades)}
          shipType={selectedShips.find(ship => ship.id === currentShipId)?.name}
          chassis={selectedShips.find(ship => ship.id === currentShipId)?.chassis}
          shipSize={selectedShips.find(ship => ship.id === currentShipId)?.size}
          shipTraits={selectedShips.find(ship => ship.id === currentShipId)?.traits}
          currentShipUpgrades={selectedShips.find(ship => ship.id === currentShipId)?.assignedUpgrades || []}
          disqualifiedUpgrades={upgradeManagement.disabledUpgrades[currentShipId] || []}
          disabledUpgrades={upgradeManagement.disabledUpgrades[currentShipId] || []}
          ship={selectedShips.find(ship => ship.id === currentShipId)!}
        />
      )}

      {showExportPopup && (
        <ExportTextPopup
          text={exportText}
          onClose={() => setShowExportPopup(false)}
          contentRef={contentRef}
        />
      )}

      {showImportWindow && (
        <TextImportWindow
          onImport={handleImportFleet}
          onClose={() => setShowImportWindow(false)}
        />
      )}

      {showNotification && (
        <NotificationWindow
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}

      {showPrintMenu && (
        <PrintMenu
          onPrintList={handlePrintList}
          onPrintnPlay={handlePrintnPlay}
          onClose={() => setShowPrintMenu(false)}
          paperSize={paperSize}
          setPaperSize={setPaperSize}
          showRestrictions={showPrintRestrictions}
          setShowRestrictions={setShowPrintRestrictions}
          showObjectives={showPrintObjectives}
          setShowObjectives={setShowPrintObjectives}
          showDamageDeck={showDamageDeck}
          setShowDamageDeck={setShowDamageDeck}
          showCardBacks={showCardBacks}
          setShowCardBacks={setShowCardBacks}
          expandCardBacks={expandCardBacks}
          setExpandCardBacks={setExpandCardBacks}
        />
      )}
    </div>
  );
} 