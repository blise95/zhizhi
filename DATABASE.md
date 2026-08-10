# 智·质 - 数据存储结构与表设计

## 📋 项目概述

**智·质（Zhi-Zhi）** 是一个卷烟数智化质量管理与智能分析平台。

本系统采用 **localStorage** 作为前端数据持久化方案，所有业务数据存储在浏览器本地。

---

## 🗄️ 数据存储架构

### 存储方式

- **技术栈**: localStorage (浏览器本地存储)
- **数据格式**: JSON (JavaScript Object Notation)
- **访问方式**: 通过 React Hooks + 自定义工具函数读写

---

## 📊 数据表结构

### 1️⃣ 过程质量数据表 (`processQualityData`)

**用途**: 存储卷包过程质量检测记录

```typescript
interface ProcessQualityRecord {
  id: string;                    // 唯一标识符 (UUID)
  date: string;                  // 检测日期 (YYYY-MM-DD)
  time: string;                  // 检测时间 (HH:mm:ss)

  // 生产信息
  productionPoint: string;       // 合作生产点 (如: "阿联酋环球烟草")
  brand: string;                 // 牌号 (如: "摩登（细支金）")
  machine: string;               // 机台编号 ("2#" | "4#" | "9#" | "10#" | "ALW 9#" | "ALW 1#")
  shiftType: string;             // 班别 ("早班" | "夜班")
  shiftNumber: number;           // 班次 (1 | 2)

  // 质量检测结果
  sampleCount: number;           // 抽检样本数量
  defectCount: number;           // 缺陷数量
  defectRate: number;            // 缺陷率 (%)
  qualityRate: number;           // 优质率 (%)

  // 外观质量详情
  appearanceDefects: {
    box: DefectRecord[];         // 箱装外观缺陷
    carton: DefectRecord[];      // 条装外观缺陷
    pack: DefectRecord[];        // 盒装外观缺陷
    cigarette: DefectRecord[];   // 烟支外观缺陷
  };

  // 元数据
  createdAt: string;             // 创建时间 (ISO 8601)
  updatedAt: string;             // 更新时间 (ISO 8601)
  operator?: string;             // 操作员（可选）
  remarks?: string;              // 备注（可选）
}

interface DefectRecord {
  id: string;
  type: string;                   // 缺陷类型
  location?: string;             // 缺陷位置
  severity: 'minor' | 'major' | 'critical';  // 严重程度
  description: string;           // 缺陷描述
  count: number;                 // 缺陷数量
}
```

**示例数据**:
```json
{
  "id": "uuid-1234",
  "date": "2026-08-10",
  "time": "14:30:00",
  "productionPoint": "阿联酋环球烟草",
  "brand": "摩登（细支金）",
  "machine": "2#",
  "shiftType": "早班",
  "shiftNumber": 1,
  "sampleCount": 50,
  "defectCount": 3,
  "defectRate": 0.03,
  "qualityRate": 94.0,
  "appearanceDefects": {
    "box": [],
    "carton": [
      {
        "type": "条盒破损",
        "severity": "minor",
        "description": "左上角轻微压痕",
        "count": 1
      }
    ],
    "pack": [
      {
        "type": "包装褶皱",
        "severity": "minor",
        "description": "侧面有轻微折痕",
        "count": 2
      }
    ],
    "cigarette": []
  },
  "createdAt": "2026-08-10T14:30:00.000Z",
  "updatedAt": "2026-08-10T14:30:00.000Z"
}
```

---

### 2️⃣ 烟支物测指标数据表 (`physicalTestRecords`)

**用途**: 存烟支物理测试指标检测记录（六西格玛过程能力分析）

```typescript
interface PhysicalTestRecord {
  id: string;                    // 唯一标识符 (UUID)
  date: string;                  // 检测日期 (YYYY-MM-DD)
  time: string;                  // 检测时间 (HH:mm:ss)

  // 生产信息
  productionPoint: string;       // 合作生产点
  brand: string;                 // 牌号
  machine: string;               // 机台编号
  shiftType: string;             // 班别
  shiftNumber: number;           // 班次

  // 物测指标数据
  indicators: IndicatorData[];   // 物测指标数组

  // 元数据
  createdAt: string;
  updatedAt: string;
  operator?: string;
  batchNumber?: string;          // 批次号（可选）
}

interface IndicatorData {
  id: string;                    // 指标ID
  name: string;                  // 指标名称 (中文)
  nameEn: string;                // 指标名称 (英文)
  unit: string;                  // 单位
  value: number;                 // 实际测量值
  target: number;                // 目标值
  USL: number;                   // 规格上限 (Upper Spec Limit)
  LSL: number;                   // 规格下限 (Lower Spec Limit)
  deviation: number;             // 偏差值 (value - target)
  status: 'normal' | 'warning' | 'out_of_spec';  // 状态
}
```

**支持的物测指标类型**:

| 指标ID | 中文名 | 英文名 | 单位 | 目标值 | LSL | USL |
|--------|--------|--------|------|--------|-----|-----|
| weight | 烟支重量 | Weight | mg | 900 | 880 | 920 |
| circumference | 圆周 | Circumference | mm | 24.20 | 24.05 | 24.35 |
| drawResistance | 吸阻 | Draw Resistance | mmH₂O | 1000 | 850 | 1150 |
| ventilationLength | 通风度/长度 | Ventilation | %/mm | 25 | 20 | 30 |

**示例数据**:
```json
{
  "id": "uuid-5678",
  "date": "2026-08-10",
  "time": "15:20:00",
  "productionPoint": "阿联酋环球烟草",
  "brand": "摩登（细支金）",
  "machine": "2#",
  "shiftType": "早班",
  "shiftNumber": 1,
  "indicators": [
    {
      "id": "weight",
      "name": "烟支重量",
      "nameEn": "Weight",
      "unit": "mg",
      "value": 902.5,
      "target": 900,
      "USL": 920,
      "LSL": 880,
      "deviation": 2.5,
      "status": "normal"
    },
    {
      "id": "circumference",
      "name": "圆周",
      "nameEn": "Circumference",
      "unit": "mm",
      "value": 24.18,
      "target": 24.20,
      "USL": 24.35,
      "LSL": 24.05,
      "deviation": -0.02,
      "status": "normal"
    }
  ],
  "createdAt": "2026-08-10T15:20:00.000Z",
  "updatedAt": "2026-08-10T15:20:00.000Z"
}
```

---

### 3️⃣ 外观质量缺陷分类表（静态配置）

**用途**: 定义四类外观质量的缺陷类型和检查标准

```typescript
interface AppearanceDefectCategory {
  key: 'box' | 'carton' | 'pack' | 'cigarette';  // 类型键
  label: string;                                    // 中文名称
  icon: string;                                     // 图标名称
  color: string;                                    // 主题色
  gradient: string;                                 // 渐变色类名

  // 缺陷类型定义
  defectTypes: DefectType[];
}

interface DefectType {
  id: string;
  name: string;                  // 缺陷名称
  category: string;              // 分类
  severityLevels: SeverityLevel[];  // 严重等级定义
  inspectionPoints: number;      // 检查点数量
  standardDescription: string;   // 标准描述
}
```

**四类外观质量**:

| 类型 | 键名 | 图标 | 颜色 | 说明 |
|------|------|------|------|------|
| 箱装外观 | `box` | Box | 蓝色 (#3b82f6) | 大包装箱体质量 |
| 条装外观 | `carton` | Package | 紫色 (#8b5cf6) | 条盒包装质量 |
| 盒装外观 | `pack` | Layers | 青色 (#06b6d4) | 小盒包装质量 |
| 烟支外观 | `cigarette` | Zap | 琥珀色 (#f59e0b) | 单支烟质量 |

---

## 🔗 数据关系图

```
┌─────────────────────────────────────────────────────────────┐
│                     智·质 数据模型                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐                                        │
│  │ processQualityData│ ← 主表：过程质量数据                    │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ├── 1:N → appearanceDefects.box[]     (箱装缺陷)    │
│           ├── 1:N → appearanceDefects.carton[]  (条装缺陷)    │
│           ├── 1:N → appearanceDefects.pack[]    (盒装缺陷)    │
│           └── 1:N → appearanceDefects.cigarette[](烟支缺陷)  │
│                                                              │
│  ┌──────────────────────┐                                    │
│  │ physicalTestRecords  │ ← 主表：物测数据                     │
│  └──────────┬───────────┘                                    │
│             │                                                │
│             └── 1:N → indicators[]              (物测指标)     │
│                       ├─ weight (重量)                      │
│                       ├─ circumference (圆周)               │
│                       ├─ drawResistance (吸阻)              │
│                       └─ ventilationLength (通风度)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 关键计算公式

### 1. 优质率计算

```
优质率 = (无缺陷样本数 ÷ 总抽检样本数) × 100%
```

### 2. 缺陷率计算（严格公式）

```
缺陷率 = 当月总缺陷数量 ÷ (当月样本量 × 215) × 100%

其中：
- 当月总缺陷数量 = 箱装缺陷数 + 条装缺陷数 + 盒装缺陷数 + 烟支缺陷数
- 当月样本量 = 当月实际完成质量抽检的样本总数
- 215 = 每个样本对应的质量检查点总数
```

### 3. 六西格玛过程能力指数 (Cpk)

```
Cpk = min(USL - μ, μ - LSL) / (3σ)

其中：
- USL = 规格上限
- LSL = 规格下限
- μ = 过程均值 (样本平均值)
- σ = 过程标准差

Cpk 分级标准：
- Cpk ≥ 1.67 → 优秀 (Excellent)
- 1.33 ≤ Cpk < 1.67 → 良好 (Good)
- 1.00 ≤ Cpk < 1.33 → 关注 (Attention)
- Cpk < 1.00 → 不足 (Insufficient)
```

### 4. 质量健康指数（综合评分）

```
健康指数 = f(优质率, 缺陷率, 缺陷趋势, Cpk, 异常情况)

权重分配（建议）：
- 综合优质率: 40%
- 缺陷率: 25%
- 缺陷变化趋势: 15%
- 物测过程能力(Cpk): 15%
- 质量异常情况: -5%

输出范围: 0-100分
```

---

## 🔧 数据操作接口

### 读取数据

```typescript
// 读取过程质量数据
const processQualityData: ProcessQualityRecord[] = JSON.parse(
  localStorage.getItem('processQualityData') || '[]'
);

// 读取物测数据
const physicalTestRecords: PhysicalTestRecord[] = JSON.parse(
  localStorage.getItem('physicalTestRecords') || '[]'
);
```

### 写入数据

```typescript
// 写入过程质量数据
localStorage.setItem('processQualityData', JSON.stringify(newData));

// 写入物测数据
localStorage.setItem('physicalTestRecords', JSON.stringify(newData));
```

### 数据同步机制

```typescript
// 使用 storage 事件监听跨标签页数据变化
window.addEventListener('storage', (event) => {
  if (event.key === 'processQualityData' || event.key === 'physicalTestRecords') {
    // 刷新页面数据
    refreshData();
  }
});
```

---

## 📁 文件位置

| 数据文件 | localStorage Key | 源码位置 |
|----------|------------------|----------|
| 过程质量数据 | `processQualityData` | `src/utils/analysisUtils.ts` |
| 物测指标数据 | `physicalTestRecords` | `src/data/physicalTestTypes.ts` |
| 物测指标定义 | `PHYSICAL_TEST_INDICATORS` | `src/data/physicalTestTypes.ts` |

---

## ⚠️ 注意事项

1. **数据容量限制**: localStorage 通常限制为 5-10MB
2. **数据备份**: 建议定期导出数据备份
3. **安全性**: localStorage 数据可被用户直接访问，不适合存储敏感信息
4. **跨域限制**: 不同域名/端口下的 localStorage 相互隔离
5. **数据清理**: 建议实现过期数据自动清理机制

---

## 🚀 未来扩展建议

如果需要升级到生产环境，建议：

1. **数据库迁移**: 迁移到 MySQL/PostgreSQL/MongoDB
2. **后端API**: 使用 Node.js/Python/Java 构建RESTful API
3. **实时同步**: 引入 WebSocket 实现多端实时同步
4. **数据备份**: 定期自动备份到云存储
5. **权限控制**: 基于角色的访问控制(RBAC)

---

**文档版本**: v1.0  
**最后更新**: 2026-08-10  
**维护者**: 智·质开发团队
