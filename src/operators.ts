
import { calcDimension } from "./utils";
const sum = (numbers: number[]): number => {
  return numbers.reduce((total: number, num: number) => total + num);
};

const avg = (numbers: number[]): number => {
  return sum(numbers) / numbers.length;
};

const count = () => {};

const add = (set1: any[], set2: any[]): any[] => {
  if(set1.length == 0) return set2;
  if(set2.length == 0) return set1;
  if(calcDimension(set1) != calcDimension(set2)){
    throw new Error(`Incompatible parameters for ADD operation`);
  }
  if(("_" in set1) || ("_" in set2)) {
    set2.forEach((value) => set1.push(value))
  } else {
    throw new Error(`Illegal parameters for Add operation`);
  }
  return set1;
};

const cross = (set1: any[], set2: any[]): any[] => {
  let res = []
  set1.forEach((value1) => {
    set2.forEach((value2) => {
      res.push([value1, value2])
    })
  })
  return res;
};

const union = (set1: any[], set2: any[]): any[] => {
  // console.log("set1",set1);
  // console.log("set2", set2);
  if(calcDimension(set1) != calcDimension(set2)){
    throw new Error(`Incompatible parameters for UNION operation`);
  }
  let valList = [];
  set1.forEach((obj) => {
    valList.push(obj.value);
  })
  const unionSet = new Set(valList);
  let res = set1;
  set2.forEach((value) => {
    if(!unionSet.has(value.value)){
      res.push(value);
    }
  });
  return res;
};

const intersect = (set1: any[], set2: any[]): any[] => {
  if(calcDimension(set1) != calcDimension(set2)){
    throw new Error(`Incompatible parameters for INTERSECT operation`);
  }
  const unionSet = new Set();
  set1.forEach((value) => {if(value in set2) unionSet.add(value)});
  return Array.from(unionSet);
};

const bin = (values: any[], binNumber: number): number[][] => {
  // todo
  if(values.length == 0) {
    throw new Error("The length of para 1 for BIN cannot be 0");
  }
  const result = [];
  let valueList = [];
  values.forEach((value) => {
    valueList.push(value.value);
  })
  if(typeof(valueList[0])!="number"){
    throw new Error("Parameter of BIN cannot be divided");
  }
  const min = Math.min(...valueList);
  const max = Math.max(...valueList);
  const interval = (max - min) / binNumber;
  for(var i = 0 ;i<binNumber;i++){
    result[i] = Object.assign({}, values[0])
    result[i].value = {
      lower: min+i*interval,
      // upper: (i==binNumber-1)?Infinity:min+i*interval
      upper: min+(i+1)*interval,
      isRightOpen: (i!=binNumber-1)
    }
  }
  return result;
};

const concat = () => {};

export default { sum, avg, count, add, cross, union, intersect, bin, concat };
