# 共借人表设计方案对比

## 📊 两种方案对比

### 方案一：混合表（原方案）

**表结构：**
```
t_order_borrower
├── role_type (borrower/coBorrower/guarantor)
├── 所有角色的字段混在一起
└── 通过 role_type 区分不同角色
```

**优点：**
- ✅ 表数量少，结构简单
- ✅ 适合角色字段完全相同的场景

**缺点：**
- ❌ 字段冗余：不同角色的字段混在一起
- ❌ 查询需要过滤：WHERE role_type = 'xxx'
- ❌ 扩展困难：添加角色特有字段会影响其他角色
- ❌ 约束不严格：无法限制主借款人只有一个
- ❌ 索引效率低：需要联合索引 (order_id, role_type)
- ❌ 代码复杂：需要判断 role_type

### 方案二：独立表（推荐方案）⭐

**表结构：**
```
t_order_main_borrower    # 主借款人（1对1）
t_order_co_borrower      # 共借人（1对多）
t_order_guarantor        # 担保人（1对多）
```

**优点：**
- ✅ 职责清晰：每个表只负责一种角色
- ✅ 字段精简：只包含该角色需要的字段
- ✅ 查询高效：不需要过滤 role_type
- ✅ 扩展方便：可以为每个角色添加特有字段
- ✅ 约束严格：主借款人 order_id UNIQUE
- ✅ 索引精准：单字段索引即可
- ✅ 代码简洁：不需要判断角色类型
- ✅ 性能更好：表更小，缓存命中率更高

**缺点：**
- ⚠️ 表数量增加：3个表 vs 1个表
- ⚠️ 需要数据迁移（如果有历史数据）

## 🎯 推荐使用方案二的理由

### 1. 业务逻辑更清晰

```java
// 方案一：需要判断角色
if (borrower.getRoleType().equals("coBorrower")) {
    // 处理共借人逻辑
}

// 方案二：直接操作对应的表
OrderCoBorrower coBorrower = coBorrowerMapper.selectById(id);
```

### 2. 查询性能更好

```sql
-- 方案一：需要过滤
SELECT * FROM t_order_borrower 
WHERE order_id = 1 AND role_type = 'coBorrower';

-- 方案二：直接查询
SELECT * FROM t_order_co_borrower 
WHERE order_id = 1;
```

### 3. 扩展性更强

```sql
-- 方案一：添加共借人特有字段会影响其他角色
ALTER TABLE t_order_borrower ADD COLUMN co_borrower_specific_field VARCHAR(255);
-- 问题：借款人和担保人也会有这个字段（虽然不使用）

-- 方案二：只影响共借人表
ALTER TABLE t_order_co_borrower ADD COLUMN specific_field VARCHAR(255);
-- 优势：不影响其他表
```

### 4. 约束更严格

```sql
-- 方案一：无法限制主借款人只有一个
-- 可能出现一个订单有多个主借款人的情况

-- 方案二：通过 UNIQUE 约束保证
CREATE TABLE t_order_main_borrower (
    order_id BIGINT NOT NULL UNIQUE,  -- 一个订单只有一个主借款人
    ...
);
```

### 5. 特有字段支持

**共借人特有字段：**
- `status` - 审核状态（待审核/通过/拒绝）
- `audit_remark` - 审核备注
- `notary_documents_json` - 公证材料

**担保人特有字段：**
- `guarantee_type` - 担保方式（连带责任保证/一般保证）
- `guarantee_amount` - 担保金额
- `guarantee_period` - 担保期限

这些字段在混合表中很难实现，但在独立表中非常自然。

## 📈 性能对比

### 数据量测试（假设）

**场景：** 10万个订单，每个订单平均有1个主借款人、2个共借人、1个担保人

| 指标 | 方案一（混合表） | 方案二（独立表） |
|------|-----------------|-----------------|
| 总记录数 | 40万条 | 主借款人10万 + 共借人20万 + 担保人10万 |
| 查询共借人 | 需要扫描40万条 + 过滤 | 直接查询20万条 |
| 索引大小 | 较大（联合索引） | 较小（单字段索引） |
| 缓存命中率 | 较低（混合数据） | 较高（独立数据） |
| 查询速度 | 慢 | 快 |

### 索引对比

```sql
-- 方案一：需要联合索引
CREATE INDEX idx_order_role ON t_order_borrower(order_id, role_type);
-- 索引大小：较大
-- 查询：需要同时匹配两个字段

-- 方案二：单字段索引
CREATE INDEX idx_order_id ON t_order_co_borrower(order_id);
-- 索引大小：较小
-- 查询：只需匹配一个字段
```

## 🔄 数据迁移方案

### 步骤1：创建新表

```bash
mysql -u root -p your_database < docs/db/co-borrower-independent-table.sql
```

### 步骤2：迁移数据

```sql
-- 迁移主借款人
INSERT INTO t_order_main_borrower (...)
SELECT ... FROM t_order_borrower WHERE role_type = 'borrower';

-- 迁移共借人
INSERT INTO t_order_co_borrower (...)
SELECT ... FROM t_order_borrower WHERE role_type = 'coBorrower';

-- 迁移担保人
INSERT INTO t_order_guarantor (...)
SELECT ... FROM t_order_borrower WHERE role_type = 'guarantor';
```

### 步骤3：验证数据

```sql
-- 验证数据完整性
SELECT 
    (SELECT COUNT(*) FROM t_order_borrower WHERE role_type = 'borrower') as old_borrower,
    (SELECT COUNT(*) FROM t_order_main_borrower) as new_borrower,
    (SELECT COUNT(*) FROM t_order_borrower WHERE role_type = 'coBorrower') as old_co_borrower,
    (SELECT COUNT(*) FROM t_order_co_borrower) as new_co_borrower,
    (SELECT COUNT(*) FROM t_order_borrower WHERE role_type = 'guarantor') as old_guarantor,
    (SELECT COUNT(*) FROM t_order_guarantor) as new_guarantor;
```

### 步骤4：更新代码

- 更新 Entity：使用新的 `OrderCoBorrower`
- 更新 Mapper：使用新的 `OrderCoBorrowerMapper`
- 更新 Controller：使用新的 `OrderCoBorrowerController`
- 更新 Service：调整保存逻辑

### 步骤5：测试验证

- 单元测试
- 集成测试
- 性能测试

### 步骤6：备份旧表（可选）

```sql
-- 重命名旧表作为备份
RENAME TABLE t_order_borrower TO t_order_borrower_backup;
```

## 📝 代码对比

### Controller 对比

**方案一（混合表）：**
```java
// 需要过滤 role_type
LambdaQueryWrapper<OrderBorrower> query = new LambdaQueryWrapper<>();
query.eq(OrderBorrower::getOrderId, orderId)
     .eq(OrderBorrower::getRoleType, "coBorrower");  // 需要过滤
```

**方案二（独立表）：**
```java
// 直接查询，不需要过滤
LambdaQueryWrapper<OrderCoBorrower> query = new LambdaQueryWrapper<>();
query.eq(OrderCoBorrower::getOrderId, orderId);  // 更简洁
```

### Service 对比

**方案一（混合表）：**
```java
// 保存时需要设置 role_type
OrderBorrower borrower = OrderBorrower.builder()
    .orderId(orderId)
    .roleType("coBorrower")  // 必须设置
    .build();
```

**方案二（独立表）：**
```java
// 不需要设置 role_type，表本身就代表角色
OrderCoBorrower coBorrower = OrderCoBorrower.builder()
    .orderId(orderId)
    .build();
```

## 🎯 最终建议

### 推荐使用方案二（独立表）的场景：

1. ✅ **新项目**：从头开始，直接使用独立表
2. ✅ **有扩展需求**：需要为不同角色添加特有字段
3. ✅ **性能要求高**：查询频繁，需要优化性能
4. ✅ **数据量大**：订单数量多，需要优化索引
5. ✅ **代码可维护性**：希望代码逻辑清晰

### 可以继续使用方案一（混合表）的场景：

1. ⚠️ **老项目**：已有大量历史数据，迁移成本高
2. ⚠️ **角色字段完全相同**：三种角色的字段完全一致
3. ⚠️ **数据量小**：订单数量少，性能不是问题
4. ⚠️ **快速开发**：时间紧迫，不想改动太多

## 📚 相关文件

### 方案一（混合表）
- `docs/db/update-co-borrower-schema.sql` - 更新混合表的DDL
- `entity/OrderBorrower.java` - 混合表Entity
- `controller/CoBorrowerController.java` - 基于混合表的Controller

### 方案二（独立表）⭐
- `docs/db/co-borrower-independent-table.sql` - 独立表DDL
- `entity/OrderCoBorrower.java` - 共借人独立表Entity
- `entity/OrderGuarantor.java` - 担保人独立表Entity（待创建）
- `entity/OrderMainBorrower.java` - 主借款人独立表Entity（待创建）
- `mapper/OrderCoBorrowerMapper.java` - 共借人Mapper
- `controller/OrderCoBorrowerController.java` - 基于独立表的Controller

## 🚀 实施建议

### 如果是新项目：
**直接使用方案二（独立表）**，一步到位，避免后续重构。

### 如果是老项目：
1. **评估迁移成本**：数据量、业务影响、开发时间
2. **制定迁移计划**：分阶段迁移，降低风险
3. **保留备份**：迁移前备份数据，确保可回滚
4. **灰度发布**：先在测试环境验证，再上生产

## 💡 总结

**方案二（独立表）是更好的设计**，理由如下：

1. ✅ **符合单一职责原则**：每个表只负责一种角色
2. ✅ **符合开闭原则**：扩展开放，修改关闭
3. ✅ **性能更优**：查询更快，索引更精准
4. ✅ **代码更清晰**：逻辑简单，易于维护
5. ✅ **约束更严格**：数据完整性更好

虽然表数量增加了，但带来的好处远大于成本。**强烈推荐使用方案二！**

