const sum = (numbers: number[]): number => {
  return numbers.reduce((total: number, num: number) => total + num);
};

const avg = (numbers: number[]): number => {
  return sum(numbers) / numbers.length;
};

const count = () => {};

const add = () => {};

const cross = (set1: any[], set2: any[]): any[] => {
  // todo
  return [];
};

const union = (set1: any[], set2: any[]): any[] => {
  const unionSet = new Set(set1);
  set2.forEach((value) => unionSet.add(value));
  return Array.from(unionSet);
};

const intersect = () => {};

const bin = (values: number[], binNumber: number): number[][] => {
  // todo
  const result = new Array(binNumber).fill([]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const interval = (max - min) / binNumber;
  values.forEach((value) => {});
  return result;
};

const concat = () => {};

export default { sum, avg, count, add, cross, union, intersect, bin, concat };
