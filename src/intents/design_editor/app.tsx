import { Button, Rows, Switch, Text, Title } from "@canva/app-ui-kit";
import { initAppElement } from "@canva/design";
import type { AppElementOptions } from "@canva/design";
import { useEffect, useMemo, useState } from "react";
import * as styles from "styles/components.css";
import * as crosswordStyles from "styles/crossword.css";

import type { AppElementData } from "../../types";
import { useCrosswordState } from "../../hooks/useCrosswordState";
import { CrosswordGrid } from "../../components/CrosswordGrid";
import { renderToCanvasElements } from "../../utils/canvasRenderer";
import { serialize, deserialize, estimateSize } from "../../utils/serialization";
import { computeBounds } from "../../utils/gridHelpers";

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
    removeCell,
    setLetter,
    addCellInDirection,
    setSecretCol,
    setShowRowNumbers,
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

  // Compute available columns for secret word selector
  const availableCols = useMemo(() => {
    const bounds = computeBounds(data.cells);
    if (!bounds) return [];
    const cols: number[] = [];
    for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
      cols.push(c);
    }
    return cols;
  }, [data.cells]);

  const serialized = serialize(data);
  const dataSize = estimateSize(serialized);
  const isOverSize = dataSize > MAX_DATA_SIZE;

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Title size="small">Crossword Builder</Title>

        <Text size="small" tone="tertiary">
          Hover a cell and click "+" to expand. Hover an edge cell to remove it.
          Focus a cell and type to enter a letter.
        </Text>

        <CrosswordGrid
          data={data}
          secretCol={data.secretCol}
          showRowNumbers={data.showRowNumbers}
          onRemoveCell={removeCell}
          onSetLetter={setLetter}
          onAddCell={addCellInDirection}
        />

        <Switch
          label="Show row numbers"
          value={data.showRowNumbers}
          onChange={(value) => setShowRowNumbers(value)}
        />

        <Rows spacing="0.5u">
          <Text size="small" variant="bold">
            Secret word column
          </Text>
          <div className={crosswordStyles.secretColSelector}>
            {availableCols.map((col) => (
              <button
                key={col}
                className={`${crosswordStyles.secretColButton}${data.secretCol === col ? ` ${crosswordStyles.secretColButtonActive}` : ""}`}
                onClick={() => setSecretCol(data.secretCol === col ? null : col)}
              >
                {col + 1}
              </button>
            ))}
          </div>
        </Rows>

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

      </Rows>
    </div>
  );
};
