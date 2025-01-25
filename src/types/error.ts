import type { Primitive } from "./primitive.js";

/**
 * Common issue types
 */
type CommonIssueType =
  | "array"
  | "boolean"
  | "constant"
  | "number"
  | "object"
  | "string"
  | "union";

/**
 * Custom issue types
 */
type CustomIssueType = never;

/**
 * Issue types
 */
export type IssueType = ({} & string) | CommonIssueType | CustomIssueType;

type IssueMessageBase<
  T extends IssueType,
  Args extends Primitive[] | Record<string, Primitive> =
    | Primitive[]
    | Record<string, Primitive>
> = Readonly<{
  args?: Args;
  template: string;
  type: T;
}>;

type BooleanIssueMessage = IssueMessageBase<
  "boolean",
  { expected: string; received: string }
>;

type ConstantIssueMessage = IssueMessageBase<
  "constant",
  { expected: string; received: string }
>;

type NumberIssueMessage = IssueMessageBase<
  "number",
  { expected: string; received: string }
>;

type StringIssueMessage = IssueMessageBase<
  "string",
  { expected: string; received: string }
>;

export type IssueMessage<T extends IssueType = IssueType> = T extends "boolean"
  ? BooleanIssueMessage
  : T extends "constant"
  ? ConstantIssueMessage
  : T extends "number"
  ? NumberIssueMessage
  : T extends "string"
  ? StringIssueMessage
  : IssueMessageBase<T>;

interface IssuesObject {
  readonly [key: string]:
    | IssueMessage
    | IssuesObject
    | readonly IssuesObject[]
    | string;
}

export type Issues<T extends IssueType = IssueType> = T extends
  | "boolean"
  | "constant"
  | "number"
  | "string"
  ? IssueMessage<T>
  : T extends "null" | "undefined"
  ? IssueMessage
  : T extends "union"
  ? readonly IssuesObject[]
  : T extends "array" | "object"
  ? IssuesObject
  : IssuesObject[string];

export interface DecodeErrorInterface<T extends Issues> extends Error {
  issues: T;
}
