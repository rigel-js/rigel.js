import DataTable from "./data_source";

export const getTableByName = (
  tables: DataTable[],
  name: string
): DataTable => {
  return tables.find((table) => table.name === name);
};

export const isTableAttribute = (
  table: DataTable,
  attrName: string
): Boolean => {
  return table.attributes.map((attr) => attr.name).includes(attrName);
};

export const calcDimension = (arr: any): number => {
  // let j = 1;
  // for (let i in arr) {
  //   if (arr[i] instanceof Array) {
  //     let d = calcDimension(arr[i]);
  //     if (1 + d > j) {
  //       j = 1 + d;
  //     }
  //   }
  // }
  // return j;
  if (!(arr instanceof Array) || arr.length == 0) return 0;
  if (arr instanceof Array) {
    if (arr[0] instanceof Array) {
      return arr[0].length;
    } else {
      return 1;
    }
  }

};

// 字符串化spec
export const calString = (spec) => {
  if (!spec) { 
    return ""; 
  } else if (typeof (spec.value) == "number") {
    return String(spec.value);
  } else if (typeof (spec.value) == "string") {
    return `'${String(spec.value)}'`;
  } else if (spec.data) {
    return `${spec.data}.${spec.attribute}`;
  } else {
    let res = [];
    if (spec.parameters && spec.parameters.length > 0) {
      spec.parameters.forEach(item => {
        res.push(calString(item));
      })
    }
    if (spec.operator == "cross" || spec.operator == "add") {
      let tmp = res[0];
      for (let i = 1; i < res.length; i++) {
        tmp += ` × ${res[i]}`;
      }
      return tmp;
    } else {
      let tmp = spec.operator + "(";
      for (let i = 0; i < res.length; i++) {
        if (i == 0) {
          tmp = tmp + res[i];
        } else {
          tmp = tmp + ", " + res[i];
        }
      }
      tmp = tmp + ")";
      return tmp;
    }
  }
}

// 定义一个深拷贝函数  接收目标target参数
export const deepClone = (target) => {
  // 定义一个变量
  let result;
  // 如果当前需要深拷贝的是一个对象的话
  if (typeof target === 'object') {
    // 如果是一个数组的话
    if (Array.isArray(target)) {
      result = []; // 将result赋值为一个数组，并且执行遍历
      for (let i = 0; i < target.length; i++) {
        // 递归克隆数组中的每一项
        result.push(deepClone(target[i]))
      }
      // 判断如果当前的值是null的话；直接赋值为null
    } else if (target === null) {
      result = null;
      // 判断如果当前的值是一个RegExp对象的话，直接赋值    
    } else if (target.constructor === RegExp) {
      result = target;
    } else {
      // 否则是普通对象，直接for in循环，递归赋值对象的所有值
      result = {};
      for (let i in target) {
        result[i] = deepClone(target[i]);
      }
    }
    // 如果不是对象的话，就是基本数据类型，那么直接赋值
  } else {
    result = target;
  }
  // 返回最终结果
  return result;
}