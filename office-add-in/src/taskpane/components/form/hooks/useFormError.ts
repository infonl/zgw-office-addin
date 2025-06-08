import { useFormContext } from "react-hook-form";

export function useFormError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();

  return errors[name]?.message?.toString() ?? null;
}
