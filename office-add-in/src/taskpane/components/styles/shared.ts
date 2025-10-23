import { makeStyles, tokens } from "@fluentui/react-components";

export const useCommonStyles = makeStyles({
  title: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingHorizontalXL,
  },
  messageBar: {
    paddingTop: tokens.spacingVerticalXL,
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  messageTitleNoWrap: {
    whiteSpace: "normal",
  },
  messageInline: {
    fontWeight: tokens.fontWeightRegular,
  },
});
