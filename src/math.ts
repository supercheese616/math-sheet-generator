import type { MathGenerator, Problem } from "./types";

const randomInt = (maxExclusive: number) => Math.floor(Math.random() * maxExclusive);

const makeProblem = (
  operand1: number,
  operand2: number,
  operator: Problem["operator"],
  answer: number,
): Problem => ({
  operand1,
  operand2,
  operator,
  answer,
});

export const itemsPerPage = 45;
export const maxProblems = 990;
export const minProblems = 15;

export const generators: MathGenerator[] = [
  {
    id: "addition-under-20",
    name: "20以内加法",
    description: "和不超过 20，适合基础口算热身。",
    generate: () => {
      const operand1 = randomInt(21);
      const operand2 = randomInt(21 - operand1);
      return makeProblem(operand1, operand2, "+", operand1 + operand2);
    },
  },
  {
    id: "mixed-under-20",
    name: "20以内加减混合",
    description: "加法不进位到 20 以上，减法不出现负数。",
    generate: () => {
      if (Math.random() < 0.5) {
        const operand1 = randomInt(21);
        const operand2 = randomInt(21 - operand1);
        return makeProblem(operand1, operand2, "+", operand1 + operand2);
      }

      const operand1 = randomInt(21);
      const operand2 = randomInt(operand1 + 1);
      return makeProblem(operand1, operand2, "-", operand1 - operand2);
    },
  },
  {
    id: "no-borrow-subtraction-under-100",
    name: "100以内不退位减法",
    description: "十位和个位都不需要退位，适合竖式前训练。",
    generate: () => {
      const aTens = randomInt(10);
      const aOnes = randomInt(10);
      const bTens = randomInt(aTens + 1);
      const bOnes = randomInt(aOnes + 1);
      const operand1 = aTens * 10 + aOnes;
      const operand2 = bTens * 10 + bOnes;
      return makeProblem(operand1, operand2, "-", operand1 - operand2);
    },
  },
  {
    id: "mixed-under-100",
    name: "100以内加减混合",
    description: "结果控制在 100 以内，覆盖两位数口算。",
    generate: () => {
      if (Math.random() < 0.5) {
        const operand1 = randomInt(100);
        const operand2 = randomInt(100 - operand1);
        return makeProblem(operand1, operand2, "+", operand1 + operand2);
      }

      const operand1 = randomInt(100);
      const operand2 = randomInt(operand1 + 1);
      return makeProblem(operand1, operand2, "-", operand1 - operand2);
    },
  },
  {
    id: "multiplication-table",
    name: "乘法练习 (9x9)",
    description: "乘数和被乘数都在 1 到 9 之间。",
    generate: () => {
      const operand1 = randomInt(9) + 1;
      const operand2 = randomInt(9) + 1;
      return makeProblem(operand1, operand2, "×", operand1 * operand2);
    },
  },
  {
    id: "division-table",
    name: "表内除法 (整除)",
    description: "除数和商都在 1 到 9 之间，保证整除。",
    generate: () => {
      const operand2 = randomInt(9) + 1;
      const answer = randomInt(9) + 1;
      return makeProblem(operand2 * answer, operand2, "÷", answer);
    },
  },
];

export const expressionOf = (problem: Problem) =>
  `${problem.operand1} ${problem.operator} ${problem.operand2}`;

export const fullEquationOf = (problem: Problem) => `${expressionOf(problem)} = ${problem.answer}`;

export const clampProblemCount = (count: number) =>
  Math.min(maxProblems, Math.max(minProblems, Math.round(count / 15) * 15));

export const pageCountForProblems = (count: number) =>
  Math.max(1, Math.ceil(clampProblemCount(count) / itemsPerPage));

export const countForPages = (pages: number) =>
  Math.min(maxProblems, Math.max(itemsPerPage, Math.floor(pages) * itemsPerPage));

export const createProblems = (generator: MathGenerator, count: number) =>
  Array.from({ length: clampProblemCount(count) }, () => generator.generate());

export const splitIntoPages = <T,>(items: T[], pageSize = itemsPerPage) => {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }
  return pages;
};
