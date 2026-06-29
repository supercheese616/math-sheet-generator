export type Operator = "+" | "-" | "×" | "÷";

export type Problem = {
  operand1: number;
  operand2: number;
  operator: Operator;
  answer: number;
};

export type MathGenerator = {
  id: string;
  name: string;
  description: string;
  generate: () => Problem;
};

export type SheetSettings = {
  fontSize: number;
  rowGap: number;
  includeAnswerKey: boolean;
  showUnderline: boolean;
};
