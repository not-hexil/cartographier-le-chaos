import type { ElementType } from "react";
import * as runtime from "react/jsx-runtime";

type Components = Record<string, ElementType>;

function getMDXComponent(code: string) {
  const fn = new Function(code);
  return fn({ ...runtime }).default as ElementType;
}

type MDXContentProps = {
  code: string;
  components?: Components;
};

export function MDXContent({ code, components }: MDXContentProps) {
  const Component = getMDXComponent(code);
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={components} />;
}
