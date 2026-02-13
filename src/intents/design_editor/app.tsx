import { Button, Rows, Text, Title } from "@canva/app-ui-kit";
import { initAppElement } from "@canva/design";
import type { AppElementOptions } from "@canva/design";
import { useEffect, useState } from "react";
import * as styles from "styles/components.css";

import type { AppElementData } from "../../types";
import { useCrosswordState } from "../../hooks/useCrosswordState";
import { CrosswordGrid } from "../../components/CrosswordGrid";
import { ClueEditor } from "../../components/ClueEditor";
import { renderToCanvasElements } from "../../utils/canvasRenderer";
import { serialize, deserialize, estimateSize } from "../../utils/serialization";

const MAX_DATA_SIZE = 5000;

const appElementClient = initAppElement<AppElementData>({
  render: (data) => {
    const crosswordData = deserialize(data);
    return renderToCanvasElements(crosswordData);
  },
});

type UpdateFn = (opts: AppElementOptions<AppElementData>) => Promise<void>;

export const App = () => {
  const {
    data,
    toggleBlack,
    setLetter,
    updateClueText,
    addCellInDirection,
    resetGrid,
    loadData,
  } = useCrosswordState();

  const [updateFn, setUpdateFn] = useState<UpdateFn | null>(null);

  useEffect(() => {
    appElementClient.registerOnElementChange((appElement) => {
      if (appElement) {
        const crosswordData = deserialize(appElement.data);
        loadData(crosswordData);
        setUpdateFn(() => appElement.update);
      } else {
        setUpdateFn(null);
      }
    });
  }, [loadData]);

  const handleAddOrUpdate = () => {
    const serialized = serialize(data);
    if (updateFn) {
      updateFn({ data: serialized });
    } else {
      appElementClient.addElement({ data: serialized });
    }
  };

  const serialized = serialize(data);
  const dataSize = estimateSize(serialized);
  const isOverSize = dataSize > MAX_DATA_SIZE;

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Title size="small">Crossword Builder</Title>

        <Text size="small" tone="tertiary">
          Hover a cell and click "+" to expand. Click a cell to toggle
          black/white. Focus a cell and type to enter a letter.
        </Text>

        <CrosswordGrid
          data={data}
          onToggleBlack={toggleBlack}
          onSetLetter={setLetter}
          onAddCell={addCellInDirection}
        />

        {isOverSize && (
          <Text size="small" tone="critical">
            Grid data is too large ({Math.round(dataSize / 1000)}KB / 5KB).
            Remove some cells to continue.
          </Text>
        )}

        <Rows spacing="1u">
          <Button
            variant="primary"
            onClick={handleAddOrUpdate}
            disabled={isOverSize}
            stretch
          >
            {updateFn ? "Update design" : "Add to design"}
          </Button>
          <Button variant="secondary" onClick={resetGrid} stretch>
            Reset grid
          </Button>
        </Rows>

        <ClueEditor
          across={data.clues.across}
          down={data.clues.down}
          onUpdateClue={updateClueText}
        />
      </Rows>
    </div>
  );
};
