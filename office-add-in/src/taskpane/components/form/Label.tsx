import { Label as FluentUiLabel, LabelProps } from "@fluentui/react-components";
import React from "react";

export function Label(props: Props) {
  return (
    <FluentUiLabel {...props} htmlFor={props.name}>
      {props.label ?? props.name}
    </FluentUiLabel>
  );
}

type Props = LabelProps & {
  name: string;
  label?: string;
  required?: boolean;
};
