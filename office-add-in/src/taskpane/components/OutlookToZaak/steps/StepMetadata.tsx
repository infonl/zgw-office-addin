import React from "react";
import { PerFileMetadataPanel } from "./PerFileMetadataPanel";
import {
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  tokens,
} from "@fluentui/react-components";

type AttachFile = {
  id: string;
  name: string;
  size?: number;
  contentType?: string;
  isInline?: boolean;
};

export function StepMetadata({
  files,
  onBack,
  onSubmit,
}: {
  files: AttachFile[];
  onBack: () => void;
  onSubmit: () => Promise<void> | void;
}) {
  const [validMap, setValidMap] = React.useState<Record<string, boolean>>({});

  const handleValidityChange = React.useCallback((id: string, isValid: boolean) => {
    setValidMap((m) => (m[id] === isValid ? m : { ...m, [id]: isValid }));
  }, []);

  const allValid = files.length > 0 && files.every((f) => !!validMap[f.id]);

  return (
    <div>
      <Accordion collapsible defaultOpenItems={files.length ? [files[0].id] : []}>
        {files.map((f) => (
          <AccordionItem key={f.id} value={f.id}>
            <AccordionHeader>
              <span>{f.name}</span>
              {validMap[f.id] && (
                <span
                  aria-label="volledig"
                  title="Formulier compleet"
                  style={{ marginLeft: 8, color: "green" }}
                >
                  ✔
                </span>
              )}
            </AccordionHeader>
            <AccordionPanel
              style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS }}
            >
              <PerFileMetadataPanel fileId={f.id} onValidityChange={handleValidityChange} />
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      <div style={{ display: "flex", gap: tokens.spacingHorizontalM }}>
        <Button appearance="secondary" onClick={onBack}>
          Vorige stap
        </Button>
        <Button appearance="primary" onClick={() => void onSubmit()} disabled={!allValid}>
          Bestanden koppelen
        </Button>
      </div>
    </div>
  );
}
