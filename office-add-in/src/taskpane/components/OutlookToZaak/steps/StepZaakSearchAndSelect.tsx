import React from "react";
import { Button, Checkbox, tokens, Subtitle1, Body1 } from "@fluentui/react-components";
import { ZaakSearch } from "../../ZaakSearch";
import { AttachmentFile } from "../../../types/attachement";

export function StepZaakSearchAndSelect({
  files,
  selectedIds,
  onToggle,
  onNext,
  hasZaak,
}: {
  files: AttachmentFile[];
  selectedIds: string[];
  onToggle: (_id: string) => void;
  onNext: () => void;
  hasZaak: boolean;
}) {
  return (
    <div>
      <ZaakSearch />

      {hasZaak && (
        <>
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: tokens.spacingHorizontalS,
              marginTop: tokens.spacingHorizontalXXXL,
            }}
          >
            <Subtitle1>Bestanden selecteren</Subtitle1>
            <Body1>Selecteer welke bestanden je wil koppelen aan bovenstaande zaak.</Body1>
          </section>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginTop: tokens.spacingVerticalM,
            }}
          >
            {files.map((f) => (
              <Checkbox
                key={f.id}
                label={`${f.name}${f.isInline ? " · inline" : ""}`}
                checked={selectedIds.includes(f.id)}
                onChange={() => onToggle(f.id)}
              />
            ))}
          </div>

          <div style={{ marginTop: tokens.spacingVerticalL }}>
            <Button
              appearance="primary"
              onClick={onNext}
              disabled={!hasZaak || selectedIds.length === 0}
            >
              Volgende stap: bestandsgegevens
            </Button>
            {selectedIds.length === 0 && (
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                Selecteer minimaal 1 bestand
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
