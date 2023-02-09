import { calcDimension } from "./utils";
const sum = (numbers: number[]): number => {
  return numbers.reduce((total: number, num: number) => total + num);
};

const avg = (numbers: number[]): number => {
  return sum(numbers) / numbers.length;
};

const count = () => { };

const add = (set1: any[], set2: any[]): any[] => {
  if (set1.length == 0) return set2;
  if (set2.length == 0) return set1;
  if (calcDimension(set1) != calcDimension(set2)) {
    throw new Error(`Incompatible parameters for ADD operation`);
  }
  if ("_" in set1 || "_" in set2) {
    set2.forEach((value) => set1.push(value));
  } else {
    throw new Error(`Illegal parameters for Add operation`);
  }
  return set1;
};

const cross = (set1: any[], set2: any[]): any[] => {
  let res = [];
  set1.forEach((value1) => {
    set2.forEach((value2) => {
      let tmp = [];
      if (value1 instanceof Array) {
        for (let i = 0; i < value1.length; i++) {
          tmp.push(value1[i]);
        }
      } else {
        tmp.push(value1);
      }
      if (value2 instanceof Array) {
        for (let i = 0; i < value2.length; i++) {
          tmp.push(value2[i]);
        }
      } else {
        tmp.push(value2);
      }
      res.push(tmp);
    });
  });
  return res;
};

const mul = (set1: any[], set2: any[]): any[] => {
  let res = [];
  if(!(set1 instanceof Array) || !(set2 instanceof Array)) {
    throw new Error (`Parameters for MUL operation are not arrays`);
  }
  if(set1.length != set2.length) {
    throw new Error (`Parameters for MUL operations are arrays with unequal lengths`);
  }
  for(let i = 0; i < set1.length; i++) {
    let u = Number.parseFloat(set1[i]), v = Number.parseFloat(set2[i]);
    res.push(u * v);
  }
  return res;
};

const plus = (set1: any[], set2: any[]): any[] => {
  let res = [];
  if(!(set1 instanceof Array) || !(set2 instanceof Array)) {
    throw new Error (`Parameters for PLUS operation are not arrays`);
  }
  if(set1.length != set2.length) {
    throw new Error (`Parameters for PLUS operations are arrays with unequal lengths`);
  }
  for(let i = 0; i < set1.length; i++) {
    let u = Number.parseFloat(set1[i]), v = Number.parseFloat(set2[i]);
    res.push(u + v);
  }
  return res;
};

const union = (set1: any[], set2: any[]): any[] => {
  // console.log("set1",set1);
  // console.log("set2", set2);
  if (calcDimension(set1) != calcDimension(set2)) {
    throw new Error(`Incompatible parameters for UNION operation`);
  }
  let valList = [];
  set1.forEach((obj) => {
    valList.push(obj.value);
  });
  const unionSet = new Set(valList);
  let res = set1;
  set2.forEach((value) => {
    if (!unionSet.has(value.value)) {
      res.push(value);
    }
  });
  return res;
};

const intersect = (set1: any[], set2: any[]): any[] => {
  if (calcDimension(set1) != calcDimension(set2)) {
    throw new Error(`Incompatible parameters for INTERSECT operation`);
  }
  let valList = [];
  set1.forEach((obj) => {
    valList.push(obj.value);
  });
  const unionSet = new Set(valList);
  let res = [];
  set2.forEach((value) => {
    if (unionSet.has(value.value)) {
      res.push(value);
    }
  });
  return res;
};

const bin = (values: any[], binNumber: number, lowerBound: number, upperBound: number): number[][] => {
  if (binNumber <= 0) {
    throw new Error("The step of BIN is illegal");
  }
  let min, max, result = [];
  if (lowerBound && upperBound) {
    if (lowerBound > upperBound) {
      throw new Error("The lowerBound is bigger than upperBound");
    }
    min = lowerBound;
    max = upperBound;
  } else {
    if (values.length == 0) {
      throw new Error("The length of para 1 for BIN cannot be 0");
    }
    let valueList = [];
    values.forEach((value) => {
      valueList.push(value.value);
    });
    if (typeof valueList[0] != "number") {
      throw new Error("Parameter of BIN cannot be divided");
    }
    min = Math.min(...valueList);
    max = Math.max(...valueList);
  }
  const interval = (max - min) / binNumber;
  for (var i = 0; i < binNumber; i++) {
    result[i] = Object.assign({}, values[0]);
    result[i].value = {
      lower: min + i * interval,
      // upper: (i==binNumber-1)?Infinity:min+i*interval
      upper: min + (i + 1) * interval,
      isRightOpen: (i != binNumber - 1)
    };
    result[i].originalValue = [{
      lower: min + i * interval,
      // upper: (i==binNumber-1)?Infinity:min+i*interval
      upper: min + (i + 1) * interval,
      isRightOpen: (i != binNumber - 1)
    }];
  }
  return result;
};

const concat = (set1: any[], set2: any[]) => {
  if (calcDimension(set1) != calcDimension(set2)) {
    throw new Error(`Incompatible parameters for CONCAT operation`);
  }
  let res = [];
  for (let i = 0; i < set1.length && i < set2.length; i++) {
    if(typeof(set1[i]) == "string" || typeof(set1[i]) == "number") {
      res.push(String(set1[i]).concat(String(set2[i])));
    } else {
      let newObj = Object.assign({}, set1[i]);
      newObj.value = String(set1[i].value).concat(String(set2[i].value));
      res.push(newObj);
    }
  }
  return res;
};

const ascsort = (values: any[]): any[] => {
  let tmp = [];
  values.forEach(item => {
    tmp.push(item);
  });
  return tmp.sort(function (a, b) {
    if (typeof (a.value) != typeof (b.value)) {
      throw new Error("Sort error: incompatible data type");
    } else if (typeof (a.value) == "number") {
      return (a.value > b.value) ? 1 : -1;
    } else if (typeof (a.value) == "string") {
      return (a.value > b.value) ? 1 : -1;
    } else {
      throw new Error("Sort error: items cannot be sorted");
    }
  });
}

const descsort = (values: any[]): any[] => {
  return ascsort(values).reverse();
}

const filterByValue = (values: any[], paras: any[]): any[] => {
  let tmp = [];
  let valueList = [];
  paras.forEach(item => {
    valueList.push(item.value);
  })
  values.forEach(item => {
    if (valueList.indexOf(item.value) != -1) {
      tmp.push(item);
    }
  })
  return tmp;
}

const filterByBound = (values: any[], lowerBound: any, upperBound: any): any[] => {
  // console.log("lb", lowerBound, upperBound);
  let tmp = [];
  values.forEach(item => {
    if (item.value >= lowerBound && item.value <= upperBound) {
      tmp.push(item);
    }
  })
  return tmp;
}

const Rsplit = (values: any[], pattern: any, index: any): any[] => {
  let ans = [];
  let dict = {};
  for (let i = 0; i < values.length; i++) {
    // console.log(values[i])
    let originalString;
    if(typeof(values[i]) == "number" || typeof(values[i]) == "string") {
      originalString = String(values[i]);
      let tmp = originalString.split(pattern);
      if(typeof(dict[String(tmp[index])]) == "undefined") {
        ans.push(String(tmp[index]));
        dict[String(tmp[index])] = ans.length - 1;
      }
    } else {
      originalString = String(values[i].value);
      let tmp = originalString.split(pattern);
      if(typeof(dict[String(tmp[index])]) == "undefined"){
        let newObj = Object.assign({}, values[i]);
        newObj.value = tmp[index];
        ans.push(newObj);
        dict[String(tmp[index])] = ans.length - 1;
      } else { // 多个值映射到同一个值，合并originalValue 
        let obj = ans[dict[String(tmp[index])]];
        obj.originalValue = [...obj.originalValue, ...values[i].originalValue];
      }
    }
  }
  return ans;
}

export default { sum, avg, count, add, cross, mul, plus, union, intersect, bin, concat, ascsort, descsort, filterByValue, filterByBound, Rsplit };
