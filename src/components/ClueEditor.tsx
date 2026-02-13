import { FormField, Rows, TextInput, Title } from "@canva/app-ui-kit";
import type { ClueEntry } from "../types";

interface ClueEditorProps {
  across: ClueEntry[];
  down: ClueEntry[];
  onUpdateClue: (
    direction: "across" | "down",
    number: number,
    text: string,
  ) => void;
}

export function ClueEditor({ across, down, onUpdateClue }: ClueEditorProps) {
  if (across.length === 0 && down.length === 0) {
    return null;
  }

  return (
    <Rows spacing="2u">
      {across.length > 0 && (
        <Rows spacing="1u">
          <Title size="small">Across</Title>
          {across.map((clue) => (
            <FormField
              key={`a-${clue.number}`}
              label={`${clue.number}.`}
              value={clue.text}
              control={(props) => (
                <TextInput
                  {...props}
                  placeholder="Enter clue..."
                  onChange={(value) =>
                    onUpdateClue("across", clue.number, value)
                  }
                />
              )}
            />
          ))}
        </Rows>
      )}
      {down.length > 0 && (
        <Rows spacing="1u">
          <Title size="small">Down</Title>
          {down.map((clue) => (
            <FormField
              key={`d-${clue.number}`}
              label={`${clue.number}.`}
              value={clue.text}
              control={(props) => (
                <TextInput
                  {...props}
                  placeholder="Enter clue..."
                  onChange={(value) =>
                    onUpdateClue("down", clue.number, value)
                  }
                />
              )}
            />
          ))}
        </Rows>
      )}
    </Rows>
  );
}
