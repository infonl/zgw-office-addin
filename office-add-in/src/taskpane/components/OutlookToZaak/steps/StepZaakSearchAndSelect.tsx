import React from "react";
import {
  Button,
  Checkbox,
  tokens,
  Title1,
  Body1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import { ZaakSearch } from "../../ZaakSearch";

type AttachFile = {
  id: string;
  name: string;
  size?: number;
  contentType?: string;
  isInline?: boolean;
};

export function StepZaakSearchAndSelect({
  files,
  selectedIds,
  onToggle,
  onNext,
  hasZaak,
}: {
  files: AttachFile[];
  selectedIds: string[];
  onToggle: (_id: string) => void;
  onNext: () => void;
  hasZaak: boolean;
}) {
  return (
    <div>
      <ZaakSearch />
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: tokens.spacingHorizontalS,
          marginTop: tokens.spacingHorizontalXXXL,
        }}
      >
        <Title1>Bestanden selecteren</Title1>
        <Body1>Selecteer welke bestanden je wil koppelen aan bovenstaande zaak.</Body1>
      </section>
      {!hasZaak && (
        <section
          style={{ marginTop: tokens.spacingHorizontalM, marginBottom: tokens.spacingHorizontalM }}
        >
          <MessageBar intent="info">
            <MessageBarBody>
              <MessageBarTitle>Geen zaak gevonden</MessageBarTitle>
              <div>Zoek eerst een zaak voordat je verder kan.</div>
            </MessageBarBody>
          </MessageBar>
        </section>
      )}
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
        {hasZaak && selectedIds.length === 0 && (
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
            Selecteer minimaal 1 bestand
          </div>
        )}
      </div>
    </div>
  );
}
