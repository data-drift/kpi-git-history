import { DualTable } from "../../components/Table/DualTable";
import { sample_generated_diff } from "./generatedDiff";

// @ts-ignore
const diff = window.generated_diff || sample_generated_diff;

console.log(diff);

const headers = Object.keys(diff);

const tableProps1 = {
  diffType: "removed",
  data: Array.from({ length: 130 }).map((_, i) => ({
    isEmphasized: i % 5 === 4,
    data: Array.from({ length: 10 }).map((_, j) => ({
      isEmphasized: i % 5 === 4 && (j + 2 * i) % 6 === 2,
      value: `Old ${i}-${j}`,
    })),
  })),
  headers,
} as const;
const tableProps2 = {
  diffType: "added",
  data: Array.from({ length: 130 }).map((_, i) => ({
    isEmphasized: i % 5 === 4,
    data: Array.from({ length: 10 }).map((_, j) => ({
      isEmphasized: i % 5 === 4 && (j + 2 * i) % 6 === 2,
      value: `New ${i}-${j}`,
    })),
  })),
  headers,
} as const;

const App = () => {
  return <DualTable tableProps1={tableProps1} tableProps2={tableProps2} />;
};

export default App;
