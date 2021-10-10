DataTable

- name
- attributes
- tuples

需要用 hash 索引把约束固定起来

```javascript
interface DataTable {}

interface DataTableAttribute {}

interface DataTableAttributeValue {
  value: string|number
  data: DataTable
  attribute: DataTableAttribute
  sibling: DataTableAttributeValue[]
}
```

生成表的时候
