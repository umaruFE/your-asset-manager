import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId, toCamelCaseObject } from '../utils/helpers.js';

const router = express.Router();

// 获取所有报表（超级管理员可以查看全部，其余按照共享范围过滤）
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
        const filtered = result.rows.filter(report => canAccessReport(report, req.user));
        const camelRows = filtered.map(row => toCamelCaseObject(row));
        res.json(camelRows);
    } catch (error) {
        next(error);
    }
});

// 获取单个报表
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = result.rows[0];

        if (!canAccessReport(report, req.user)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(report));
    } catch (error) {
        next(error);
    }
});

// 创建报表（仅超级管理员）
router.post('/', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, description, config, accessRules } = req.body;

        if (!name || !config) {
            return res.status(400).json({ error: 'Name and config are required' });
        }

        // 验证config格式
        if (!config.selectedForms || !Array.isArray(config.selectedForms)) {
            return res.status(400).json({ error: 'Invalid config: selectedForms must be an array' });
        }

        const rules = normalizeAccessRules(accessRules);
        const id = generateId();
        await pool.query(
            'INSERT INTO reports (id, name, description, created_by, config, access_rules) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, name, description || null, req.user.id, JSON.stringify(config), JSON.stringify(rules)]
        );

        const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
        // 转换字段名从下划线到驼峰
        res.status(201).json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 更新报表（仅超级管理员）
router.put('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, description, config, accessRules } = req.body;

        // 检查报表是否存在和权限
        const checkResult = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex++}`);
            updateValues.push(description);
        }
        if (config !== undefined) {
            updateFields.push(`config = $${paramIndex++}`);
            updateValues.push(JSON.stringify(config));
        }
        if (accessRules !== undefined) {
            const rules = normalizeAccessRules(accessRules);
            updateFields.push(`access_rules = $${paramIndex++}`);
            updateValues.push(JSON.stringify(rules));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.params.id);

        await pool.query(
            `UPDATE reports SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
            updateValues
        );

        const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 删除报表（仅超级管理员）
router.delete('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const checkResult = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// 执行报表查询（生成统计数据）
router.post('/:id/execute', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = result.rows[0];

        // 调试日志：检查权限
        console.log('[Report Execute] Checking access for user:', {
            userId: req.user.id,
            role: req.user.role,
            reportId: report.id,
            createdBy: report.created_by,
            accessRules: report.access_rules
        });

        if (!canAccessReport(report, req.user)) {
            console.warn('[Report Execute] Access denied for user:', req.user.id, 'role:', req.user.role);
            return res.status(403).json({ error: 'Access denied' });
        }

        const config = report.config;
        let { selectedForms, selectedFields, aggregations, calculations, filters } = config;
        
        // 调试日志：记录用户信息和过滤条件
        console.log('[Report Execute] User info:', {
            id: req.user.id,
            role: req.user.role,
            baseId: req.user.baseId
        });
        console.log('[Report Execute] Selected forms:', selectedForms);

        // 兼容处理：如果selectedFields是字符串数组（字段名称），需要转换为对象数组
        // 需要从表单中查找字段ID
        if (selectedFields && selectedFields.length > 0 && typeof selectedFields[0] === 'string') {
            console.log('Converting string array selectedFields to object array:', selectedFields);
            // 是字符串数组，需要转换为对象数组
            const normalizedFields = [];
            for (const fieldName of selectedFields) {
                let found = false;
                // 在所有选中的表单中查找该字段
                for (const formId of selectedForms || []) {
                    const fieldsResult = await pool.query(
                        'SELECT * FROM form_fields WHERE form_id = $1 AND name = $2 AND active = true',
                        [formId, fieldName]
                    );
                    if (fieldsResult.rows.length > 0) {
                        const field = fieldsResult.rows[0];
                        normalizedFields.push({
                            formId: formId,
                            fieldId: field.id,
                            fieldName: field.name
                        });
                        found = true;
                        console.log(`Found field "${fieldName}" in form ${formId}: fieldId=${field.id}`);
                        break; // 找到后跳出内层循环
                    }
                }
                if (!found) {
                    console.warn(`Field "${fieldName}" not found in any selected form`);
                }
            }
            selectedFields = normalizedFields;
            console.log('Normalized selectedFields:', JSON.stringify(selectedFields, null, 2));
        }

        // 获取字段名称映射（用于支持字段名称作为键的情况）
        const fieldNameMap = {};
        if (selectedFields && selectedFields.length > 0) {
            for (const field of selectedFields) {
                if (field && field.fieldId && field.fieldName) {
                    fieldNameMap[field.fieldId] = field.fieldName;
                }
            }
        }
        
        // 检查是否有聚合函数（需要在构建字段之前检查）
        const hasAggregations = aggregations && aggregations.length > 0;
        
        // 关键修复：为跨表单聚合构建字段ID映射
        // 对于每个分组字段，从所有选中表单中查找同名字段的所有字段ID
        const groupingFieldIdsMap = {}; // fieldName -> [fieldId1, fieldId2, ...]
        if (selectedForms && selectedForms.length > 1 && selectedFields && selectedFields.length > 0) {
            // 先确定哪些字段用于分组
            const groupByFieldIds = new Set();
            if (hasAggregations && selectedFields && selectedFields.length > 0) {
                const aggregatedFieldIds = new Set();
                if (aggregations && aggregations.length > 0) {
                    aggregations.forEach(agg => {
                        if (agg.fieldId) {
                            aggregatedFieldIds.add(agg.fieldId);
                        }
                    });
                }
                selectedFields.forEach(field => {
                    if (field && field.fieldId && !aggregatedFieldIds.has(field.fieldId)) {
                        groupByFieldIds.add(field.fieldId);
                    }
                });
            }
            
            // 为每个分组字段查找所有表单中的字段ID
            for (const field of selectedFields) {
                if (field && field.fieldName && groupByFieldIds.has(field.fieldId)) {
                    const fieldName = field.fieldName;
                    if (!groupingFieldIdsMap[fieldName]) {
                        groupingFieldIdsMap[fieldName] = [];
                    }
                    // 从所有选中表单中查找同名字段的所有字段ID
                    for (const formId of selectedForms) {
                        const fieldsResult = await pool.query(
                            'SELECT id FROM form_fields WHERE form_id = $1 AND name = $2 AND active = true',
                            [formId, fieldName]
                        );
                        if (fieldsResult.rows.length > 0) {
                            const foundFieldId = fieldsResult.rows[0].id;
                            if (!groupingFieldIdsMap[fieldName].includes(foundFieldId)) {
                                groupingFieldIdsMap[fieldName].push(foundFieldId);
                            }
                        }
                    }
                    // 也添加字段名称本身（因为batch_data中可能使用字段名称作为键）
                    if (!groupingFieldIdsMap[fieldName].includes(fieldName)) {
                        groupingFieldIdsMap[fieldName].unshift(fieldName); // 优先使用字段名称
                    }
                }
            }
            console.log('[Report Execute] Grouping field IDs map:', JSON.stringify(groupingFieldIdsMap, null, 2));
        }

        // 构建查询 - 从资产数据中提取字段值
        // 由于数据存储在JSONB中，需要使用PostgreSQL的JSON函数
        // 注意：batch_data中的键可能是字段ID或字段名称，需要同时尝试
        let selectClauses = [];
        const queryParams = [];
        let paramIndex = 1;
        
        // 确定哪些字段用于分组（非聚合字段，且不是数字类型或不是聚合目标）
        // 用于分组的字段通常是文本类型字段，如"鱼类品种"
        const groupByFieldIds = new Set();
        if (hasAggregations && selectedFields && selectedFields.length > 0) {
            // 获取所有被聚合的字段ID
            const aggregatedFieldIds = new Set();
            if (aggregations && aggregations.length > 0) {
                aggregations.forEach(agg => {
                    if (agg.fieldId) {
                        aggregatedFieldIds.add(agg.fieldId);
                    }
                });
            }
            
            // 只有未被聚合的字段才用于分组
            selectedFields.forEach(field => {
                if (field.formId && field.fieldId && !aggregatedFieldIds.has(field.fieldId)) {
                    groupByFieldIds.add(field.fieldId);
                }
            });
        }
        
        // 添加选择的字段（从batch_data JSONB中提取）
        // 支持字段ID和字段名称两种格式
        for (const field of selectedFields || []) {
            if (field.formId && field.fieldId) {
                const fieldId = field.fieldId;
                const fieldName = field.fieldName || fieldId;
                
                if (hasAggregations) {
                    // 如果有聚合函数，从batch_row中提取（用于GROUP BY）
                    // 尝试字段ID，如果不存在则尝试字段名称
                    selectClauses.push(`COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') as "${fieldName}"`);
                } else {
                    // 没有聚合函数，从batch_data中提取
                    // 尝试字段ID，如果不存在则尝试字段名称
                    selectClauses.push(`COALESCE(batch_data->0->>'${fieldId}', batch_data->0->>'${fieldName}') as "${fieldName}"`);
                }
            }
        }

        // 聚合函数名到中文的映射
        const getAggregationSuffix = (func) => {
            const funcUpper = func.toUpperCase();
            const suffixMap = {
                'SUM': '求和',
                'AVG': '平均值',
                'COUNT': '计数',
                'MAX': '最大值',
                'MIN': '最小值'
            };
            return suffixMap[funcUpper] || funcUpper;
        };

        // 添加聚合函数
        // 关键修复：对于跨表单聚合，需要确保每个聚合字段只从它所属的表单中聚合数据
        for (const agg of aggregations || []) {
            if (agg.formId && agg.fieldId && agg.function) {
                const func = agg.function.toUpperCase(); // SUM, AVG, COUNT, MAX, MIN
                const fieldId = agg.fieldId;
                const fieldName = agg.fieldName || fieldId;
                const suffix = getAggregationSuffix(func);
                
                // 使用 CASE WHEN 确保只聚合该表单的数据
                if (func === 'COUNT') {
                    // COUNT可以用于任何类型
                    const aggExpression = `${func}(CASE WHEN assets.form_id = '${agg.formId}' THEN COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') ELSE NULL END)`;
                    selectClauses.push(`${aggExpression} as "${agg.fieldName}_${suffix}"`);
                } else {
                    // 其他聚合函数需要数字类型
                    const aggExpression = `${func}(CASE WHEN assets.form_id = '${agg.formId}' THEN CAST(COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') AS NUMERIC) ELSE NULL END)`;
                    // 对于"数量（尾）"这样的字段，SUM结果应该是整数，需要四舍五入
                    // 检查字段名称是否包含"数量"或"尾"，如果是SUM函数，则四舍五入为整数
                    const shouldRoundToInteger = func === 'SUM' && (fieldName.includes('数量') || fieldName.includes('尾'));
                    const finalExpression = shouldRoundToInteger 
                        ? `ROUND(COALESCE(${aggExpression}, 0))`
                        : `COALESCE(${aggExpression}, 0)`;
                    selectClauses.push(`${finalExpression} as "${agg.fieldName}_${suffix}"`);
                }
            }
        }

        // 创建聚合字段映射：fieldId -> 聚合列名（例如 "转入重量 (kg)_求和"）
        const aggregationColumnMap = {};
        if (hasAggregations && aggregations) {
            for (const agg of aggregations) {
                if (agg.formId && agg.fieldId && agg.function) {
                    const func = agg.function.toUpperCase();
                    const fieldName = agg.fieldName || agg.fieldId;
                    const suffix = getAggregationSuffix(func);
                    aggregationColumnMap[agg.fieldId] = `${fieldName}_${suffix}`;
                }
            }
        }
        
        // 如果有聚合函数且有计算字段，计算字段需要在子查询的外层处理
        // 否则，计算字段可以直接添加到selectClauses中
        const hasCalculations = calculations && calculations.length > 0;
        const needsSubquery = hasAggregations && hasCalculations;
        
        if (!needsSubquery) {
            // 没有聚合函数，或者有聚合函数但没有计算字段，可以直接添加计算字段
            for (const calc of calculations || []) {
                if (calc.expression) {
                    // 计算表达式，需要替换字段ID为JSONB路径
                    let expr = calc.expression;
                    const fieldIdPattern = /(\w+)/g;
                    expr = expr.replace(fieldIdPattern, (match) => {
                        // 检查是否是运算符或数字
                        if (['+', '-', '*', '/', '(', ')'].includes(match) || !isNaN(match)) {
                            return match;
                        }
                        // 否则是普通字段，转换为JSONB路径
                        const fieldName = fieldNameMap[match] || match;
                        if (hasAggregations) {
                            return `CAST(COALESCE(batch_row->>'${match}', batch_row->>'${fieldName}') AS NUMERIC)`;
                        } else {
                            return `CAST(COALESCE(batch_data->0->>'${match}', batch_data->0->>'${fieldName}') AS NUMERIC)`;
                        }
                    });
                    selectClauses.push(`(${expr}) as "${calc.name}"`);
                }
            }
        }

        if (selectClauses.length === 0) {
            return res.status(400).json({ 
                error: '未选择任何字段',
                suggestion: '请至少选择一个字段、聚合函数或计算字段'
            });
        }

        const hasNonAggregatedFields = selectedFields && selectedFields.length > 0;
        
        // 构建基础查询
        // 如果使用聚合函数且有计算字段，需要使用子查询（因为PostgreSQL不允许在同一SELECT中引用列别名）
        let query;
        if (needsSubquery) {
            // 构建内层查询（聚合查询，不包含计算字段）
            // 只选择用于分组的字段和聚合字段，不选择其他非聚合字段
            const innerSelectClauses = [];
            
            // 只添加用于分组的字段（非聚合字段）
            // 关键修复：对于跨表单聚合，分组字段需要从所有表单中都能提取到
            // 使用字段名称作为主要匹配依据，因为不同表单中同名字段的ID可能不同
            for (const field of selectedFields || []) {
                if (field.formId && field.fieldId && groupByFieldIds.has(field.fieldId)) {
                    const fieldName = field.fieldName || field.fieldId;
                    
                    // 如果有多表单且已构建了字段ID映射，使用所有可能的字段ID
                    if (Object.keys(groupingFieldIdsMap).length > 0 && groupingFieldIdsMap[fieldName]) {
                        const allFieldIds = groupingFieldIdsMap[fieldName];
                        // 构建COALESCE链，尝试所有可能的字段ID和字段名称
                        const coalesceChain = allFieldIds.map(id => `batch_row->>'${id}'`).join(', ');
                        innerSelectClauses.push(`COALESCE(${coalesceChain}) as "${fieldName}"`);
                    } else {
                        // 单表单或未构建映射，使用原来的逻辑
                        const fieldId = field.fieldId;
                        innerSelectClauses.push(`COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') as "${fieldName}"`);
                    }
                }
            }
            
            // 添加所有聚合字段
            for (const agg of aggregations || []) {
                if (agg.formId && agg.fieldId && agg.function) {
                    const func = agg.function.toUpperCase();
                    const fieldId = agg.fieldId;
                    const fieldName = agg.fieldName || fieldId;
                    const suffix = getAggregationSuffix(func);
                    
                    // 关键修复：对于跨表单聚合，需要确保每个聚合字段只从它所属的表单中聚合数据
                    // 使用 CASE WHEN 确保只聚合该表单的数据，这样即使其他表单没有该字段，也不会影响聚合结果
                    if (func === 'COUNT') {
                        const aggExpression = `${func}(CASE WHEN assets.form_id = '${agg.formId}' THEN COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') ELSE NULL END)`;
                        innerSelectClauses.push(`${aggExpression} as "${agg.fieldName}_${suffix}"`);
                    } else {
                        const aggExpression = `${func}(CASE WHEN assets.form_id = '${agg.formId}' THEN CAST(COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') AS NUMERIC) ELSE NULL END)`;
                        // 对于"数量（尾）"这样的字段，SUM结果应该是整数，需要四舍五入
                        // 检查字段名称是否包含"数量"或"尾"，如果是SUM函数，则四舍五入为整数
                        const shouldRoundToInteger = func === 'SUM' && (fieldName.includes('数量') || fieldName.includes('尾'));
                        const finalExpression = shouldRoundToInteger 
                            ? `ROUND(COALESCE(${aggExpression}, 0))`
                            : `COALESCE(${aggExpression}, 0)`;
                        innerSelectClauses.push(`${finalExpression} as "${agg.fieldName}_${suffix}"`);
                    }
                }
            }
            
            let innerQuery = `SELECT ${innerSelectClauses.join(', ')} FROM assets CROSS JOIN LATERAL jsonb_array_elements(assets.batch_data) as batch_row INNER JOIN forms ON assets.form_id = forms.id WHERE 1=1 AND forms.archive_status = 'active'`;
                
                // 添加表单过滤（在GROUP BY之前）
                if (selectedForms && selectedForms.length > 0) {
                    innerQuery += ` AND form_id = ANY($${paramIndex++}::text[])`;
                    queryParams.push(selectedForms);
                }

                // 添加基地过滤（在GROUP BY之前）
                if (req.user.role === 'base_manager' && req.user.baseId) {
                    innerQuery += ` AND base_id = $${paramIndex++}`;
                    queryParams.push(req.user.baseId);
                    console.log('[Report Execute] Added base filter for base_manager, baseId:', req.user.baseId);
                } else if (req.user.role === 'base_manager') {
                    console.warn('[Report Execute] base_manager user has no baseId!');
                }
                
                // 如果有非聚合字段，需要添加GROUP BY（必须在WHERE之后）
                // 只对用于分组的字段进行GROUP BY（不包括被聚合的字段）
                // 关键修复：对于跨表单聚合，GROUP BY 也需要使用所有可能的字段ID
                if (groupByFieldIds.size > 0) {
                    const groupByFields = selectedFields
                        .filter(field => field && typeof field === 'object' && field.formId && field.fieldId && groupByFieldIds.has(field.fieldId))
                        .map(field => {
                            const fieldName = field.fieldName || field.fieldId;
                            
                            // 如果有多表单且已构建了字段ID映射，使用所有可能的字段ID
                            if (Object.keys(groupingFieldIdsMap).length > 0 && groupingFieldIdsMap[fieldName]) {
                                const allFieldIds = groupingFieldIdsMap[fieldName];
                                // 构建COALESCE链，尝试所有可能的字段ID和字段名称
                                const coalesceChain = allFieldIds.map(id => `batch_row->>'${id}'`).join(', ');
                                return `COALESCE(${coalesceChain})`;
                            } else {
                                // 单表单或未构建映射，使用原来的逻辑
                                const fieldId = field.fieldId;
                                return `COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}')`;
                            }
                        });
                    
                    if (groupByFields.length > 0) {
                        innerQuery += ` GROUP BY ${groupByFields.join(', ')}`;
                    }
                }
                
                // 构建外层查询（计算字段查询）
                // 使用 subq 作为子查询别名（避免使用 inner 关键字）
                const outerSelectClauses = [];
                
                // 只添加内层查询中实际存在的列：
                // 1. 用于分组的字段（非聚合字段）
                for (const field of selectedFields || []) {
                    if (field.formId && field.fieldId && groupByFieldIds.has(field.fieldId)) {
                        const fieldName = field.fieldName || field.fieldId;
                        // 使用双引号包裹列名，确保特殊字符正确处理
                        const escapedFieldName = fieldName.replace(/"/g, '""'); // 转义双引号
                        outerSelectClauses.push(`subq."${escapedFieldName}"`);
                    }
                }
                
                // 2. 所有聚合列
                for (const agg of aggregations || []) {
                    if (agg.formId && agg.fieldId && agg.function) {
                        const func = agg.function.toUpperCase();
                        const fieldName = agg.fieldName || agg.fieldId;
                        const suffix = getAggregationSuffix(func);
                        const aggColName = `${fieldName}_${suffix}`;
                        const escapedColName = aggColName.replace(/"/g, '""'); // 转义双引号
                        outerSelectClauses.push(`subq."${escapedColName}"`);
                    }
                }
                
                // 添加计算字段（使用内层查询的列名）
                for (const calc of calculations || []) {
                    if (calc.expression) {
                        let expr = calc.expression;
                        // 替换字段ID为内层查询的列名引用
                        const fieldIdPattern = /(\w+)/g;
                        expr = expr.replace(fieldIdPattern, (match) => {
                            // 检查是否是运算符或数字
                            if (['+', '-', '*', '/', '(', ')'].includes(match) || !isNaN(match)) {
                                return match;
                            }
                            // 如果该字段有聚合函数，使用聚合列名，并用 COALESCE 处理 NULL
                            if (aggregationColumnMap[match]) {
                                const aggColName = aggregationColumnMap[match].replace(/"/g, ''); // 移除引号
                                const escapedColName = aggColName.replace(/"/g, '""'); // 转义双引号
                                return `COALESCE(subq."${escapedColName}", 0)`;
                            }
                            // 否则使用普通字段名，并用 COALESCE 处理 NULL
                            const fieldName = fieldNameMap[match] || match;
                            const escapedFieldName = fieldName.replace(/"/g, '""'); // 转义双引号
                            return `COALESCE(subq."${escapedFieldName}", 0)`;
                        });
                        const escapedCalcName = calc.name.replace(/"/g, '""'); // 转义双引号
                        outerSelectClauses.push(`(${expr}) as "${escapedCalcName}"`);
                    }
                }
                
                query = `SELECT ${outerSelectClauses.join(', ')} FROM (${innerQuery}) as subq`;
        } else if (hasAggregations) {
            // 有聚合函数但没有计算字段，直接使用聚合查询
            query = `SELECT ${selectClauses.join(', ')} FROM assets CROSS JOIN LATERAL jsonb_array_elements(assets.batch_data) as batch_row INNER JOIN forms ON assets.form_id = forms.id WHERE 1=1 AND forms.archive_status = 'active'`;
            
            // 添加表单过滤（在GROUP BY之前）
            if (selectedForms && selectedForms.length > 0) {
                query += ` AND form_id = ANY($${paramIndex++}::text[])`;
                queryParams.push(selectedForms);
            }

            // 添加基地过滤（在GROUP BY之前）
            if (req.user.role === 'base_manager' && req.user.baseId) {
                query += ` AND base_id = $${paramIndex++}`;
                queryParams.push(req.user.baseId);
                console.log('[Report Execute] Added base filter for base_manager, baseId:', req.user.baseId);
            } else if (req.user.role === 'base_manager') {
                console.warn('[Report Execute] base_manager user has no baseId!');
            }
            
            // 如果有非聚合字段，需要添加GROUP BY（必须在WHERE之后）
            // 只对用于分组的字段进行GROUP BY（不包括被聚合的字段）
            // 关键修复：对于跨表单聚合，GROUP BY 也需要使用所有可能的字段ID
            if (groupByFieldIds.size > 0) {
                const groupByFields = selectedFields
                    .filter(field => field && typeof field === 'object' && field.formId && field.fieldId && groupByFieldIds.has(field.fieldId))
                    .map(field => {
                        const fieldName = field.fieldName || field.fieldId;
                        
                        // 如果有多表单且已构建了字段ID映射，使用所有可能的字段ID
                        if (Object.keys(groupingFieldIdsMap).length > 0 && groupingFieldIdsMap[fieldName]) {
                            const allFieldIds = groupingFieldIdsMap[fieldName];
                            // 构建COALESCE链，尝试所有可能的字段ID和字段名称
                            const coalesceChain = allFieldIds.map(id => `batch_row->>'${id}'`).join(', ');
                            return `COALESCE(${coalesceChain})`;
                        } else {
                            // 单表单或未构建映射，使用原来的逻辑
                            const fieldId = field.fieldId;
                            return `COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}')`;
                        }
                    });
                
                if (groupByFields.length > 0) {
                    query += ` GROUP BY ${groupByFields.join(', ')}`;
                }
            }
        } else {
            // 没有聚合函数，直接展开batch_data
            query = `SELECT ${selectClauses.join(', ')} FROM assets CROSS JOIN LATERAL jsonb_array_elements(assets.batch_data) as batch_row INNER JOIN forms ON assets.form_id = forms.id WHERE 1=1 AND forms.archive_status = 'active'`;
            
            // 添加表单过滤
            if (selectedForms && selectedForms.length > 0) {
                query += ` AND form_id = ANY($${paramIndex++}::text[])`;
                queryParams.push(selectedForms);
            }

            // 添加基地过滤
            if (req.user.role === 'base_manager' && req.user.baseId) {
                query += ` AND base_id = $${paramIndex++}`;
                queryParams.push(req.user.baseId);
                console.log('[Report Execute] Added base filter for base_manager, baseId:', req.user.baseId);
            } else if (req.user.role === 'base_manager') {
                console.warn('[Report Execute] base_manager user has no baseId!');
            }
        }


        // 执行查询
        let queryResult;
        try {
            // 添加调试日志
            console.log('Executing report query:', query);
            console.log('Query params:', queryParams);
            console.log('Report config:', JSON.stringify(config, null, 2));
            
            queryResult = await pool.query(query, queryParams);
            
            // 添加调试日志
            console.log('Query result rows:', queryResult.rows.length);
            if (queryResult.rows.length > 0) {
                console.log('First row sample:', JSON.stringify(queryResult.rows[0], null, 2));
            } else {
                console.log('No rows returned. Checking if there are any assets...');
                // 检查是否有匹配的资产
                let checkQuery = hasAggregations 
                    ? 'SELECT COUNT(*) as count FROM assets CROSS JOIN LATERAL jsonb_array_elements(assets.batch_data) as batch_row INNER JOIN forms ON assets.form_id = forms.id WHERE 1=1 AND forms.archive_status = \'active\''
                    : 'SELECT COUNT(*) as count FROM assets INNER JOIN forms ON assets.form_id = forms.id WHERE 1=1 AND forms.archive_status = \'active\'';
                const checkParams = [];
                let checkParamIndex = 1;
                if (selectedForms && selectedForms.length > 0) {
                    checkQuery += ` AND form_id = ANY($${checkParamIndex++}::text[])`;
                    checkParams.push(selectedForms);
                }
                if (req.user.role === 'base_manager' && req.user.baseId) {
                    checkQuery += ` AND base_id = $${checkParamIndex++}`;
                    checkParams.push(req.user.baseId);
                }
                const checkResult = await pool.query(checkQuery, checkParams);
                console.log('Total matching assets:', checkResult.rows[0]?.count || 0);
                
                // 检查batch_data的结构
                if (selectedForms && selectedForms.length > 0) {
                    const sampleQuery = 'SELECT id, form_id, batch_data FROM assets WHERE form_id = ANY($1::text[]) LIMIT 1';
                    const sampleResult = await pool.query(sampleQuery, [selectedForms]);
                    if (sampleResult.rows.length > 0) {
                        console.log('Sample asset batch_data structure:', JSON.stringify(sampleResult.rows[0].batch_data, null, 2));
                    }
                }
            }
        } catch (dbError) {
            // 将数据库错误转换为友好的中文提示
            console.error('Database error:', dbError);
            const friendlyError = translateDatabaseError(dbError);
            return res.status(400).json(friendlyError);
        }

        // 过滤掉总计行（分组字段为 0、空字符串或 null 的行）
        let filteredRows = queryResult.rows;
        if (selectedFields && selectedFields.length > 0) {
            filteredRows = queryResult.rows.filter(row => {
                // 检查所有分组字段，如果都是 0、空字符串或 null，则认为是总计行
                let isSummaryRow = true;
                for (const field of selectedFields) {
                    if (field.formId && field.fieldId) {
                        const fieldName = field.fieldName || field.fieldId;
                        const value = row[fieldName];
                        // 如果字段值不是 0、空字符串或 null，则不是总计行
                        if (value !== 0 && value !== '0' && value !== '' && value != null && value !== undefined) {
                            isSummaryRow = false;
                            break;
                        }
                    }
                }
                return !isSummaryRow;
            });
        }

        res.json({
            report: report,
            data: applySortOrders(filteredRows, config.sortOrders),
            total: filteredRows.length
        });
    } catch (error) {
        console.error('Report execution error:', error);
        // 如果是数据库错误，转换为友好提示
        if (error.code && error.code.startsWith('42')) {
            const friendlyError = translateDatabaseError(error);
            return res.status(400).json(friendlyError);
        }
        next(error);
    }
});

// 将数据库错误转换为友好的中文提示
function translateDatabaseError(error) {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';

    // GROUP BY 错误
    if (errorCode === '42803' || errorMessage.includes('GROUP BY') || errorMessage.includes('aggregate function')) {
        return {
            error: 'SQL查询错误：字段分组问题',
            message: '当使用聚合函数（如SUM、AVG、COUNT等）时，所有非聚合字段必须包含在分组中。',
            suggestion: '建议：\n1. 如果只需要聚合结果，请移除普通字段选择\n2. 如果需要按字段分组，请确保所有选择的字段都包含在分组中\n3. 或者将普通字段改为聚合函数（如使用COUNT统计数量）',
            originalError: errorMessage
        };
    }

    // 类型转换错误
    if (errorCode === '22P02' || errorMessage.includes('invalid input syntax') || errorMessage.includes('cannot cast')) {
        return {
            error: '数据类型转换错误',
            message: '尝试将非数字类型的数据转换为数字类型时失败。',
            suggestion: '建议：\n1. 检查聚合函数或计算字段中使用的字段是否为数字类型\n2. 确保字段值可以转换为数字（不能包含文字、符号等）\n3. 对于文本类型字段，请使用COUNT而不是SUM、AVG等函数',
            originalError: errorMessage
        };
    }

    // 字段不存在错误
    if (errorCode === '42703' || errorMessage.includes('does not exist') || errorMessage.includes('column')) {
        return {
            error: '字段不存在错误',
            message: '查询中引用的字段不存在。',
            suggestion: '建议：\n1. 检查报表配置中的字段ID是否正确\n2. 确认字段是否已被删除或修改\n3. 重新编辑报表，检查字段选择',
            originalError: errorMessage
        };
    }

    // JSONB路径错误
    if (errorMessage.includes('jsonb') || errorMessage.includes('JSON')) {
        return {
            error: '数据格式错误',
            message: '无法从数据中提取字段值。',
            suggestion: '建议：\n1. 检查数据格式是否正确\n2. 确认字段ID是否匹配\n3. 尝试重新保存资产记录',
            originalError: errorMessage
        };
    }

    // 语法错误
    if (errorCode === '42601' || errorMessage.includes('syntax error')) {
        return {
            error: 'SQL语法错误',
            message: '查询语句存在语法问题。',
            suggestion: '建议：\n1. 检查计算字段的表达式是否正确\n2. 确认运算符使用是否正确（+、-、*、/）\n3. 检查括号是否匹配',
            originalError: errorMessage
        };
    }

    // 默认错误
    return {
        error: '报表执行失败',
        message: '执行报表时发生错误，请检查报表配置。',
        suggestion: '建议：\n1. 检查报表配置是否正确\n2. 确认选择的表单和字段是否存在\n3. 联系管理员查看详细错误信息',
        originalError: errorMessage
    };
}

function normalizeAccessRules(rules) {
    const defaultRules = {
        roles: ['base_manager', 'company_asset', 'company_finance'],
        users: []
    };

    // 如果 rules 是 null、undefined，返回默认规则
    if (rules === null || rules === undefined) {
        console.log('[normalizeAccessRules] Rules is null/undefined, using default rules');
        return defaultRules;
    }

    // 如果 rules 是字符串，尝试解析为 JSON
    let parsedRules = rules;
    if (typeof rules === 'string') {
        try {
            parsedRules = JSON.parse(rules);
        } catch (e) {
            console.warn('[normalizeAccessRules] Failed to parse rules as JSON:', e);
            return defaultRules;
        }
    }

    // 如果解析后不是对象，返回默认规则
    if (typeof parsedRules !== 'object' || Array.isArray(parsedRules)) {
        console.log('[normalizeAccessRules] Rules is not an object, using default rules');
        return defaultRules;
    }

    // 如果是空对象，返回默认规则
    if (Object.keys(parsedRules).length === 0) {
        console.log('[normalizeAccessRules] Rules is empty object, using default rules');
        return defaultRules;
    }

    const normalized = {
        roles: Array.isArray(parsedRules.roles)
            ? Array.from(new Set(parsedRules.roles.filter(role =>
                typeof role === 'string'
                && role.trim().length > 0
                && role !== 'base_handler' // 基地经手人无权查看统计报表
            )))
            : defaultRules.roles,
        users: Array.isArray(parsedRules.users)
            ? Array.from(new Set(parsedRules.users.filter(userId => typeof userId === 'string' && userId.trim().length > 0)))
            : []
    };

    if (normalized.roles.length === 0) {
        normalized.roles = defaultRules.roles;
    }

    console.log('[normalizeAccessRules] Normalized rules:', normalized);
    return normalized;
}

function canAccessReport(report, user) {
    if (!report) return false;

    // 基地经手人无权查看任何统计报表
    if (user?.role === 'base_handler') {
        return false;
    }
    
    // 兼容处理：created_by 可能是下划线命名（数据库原始）或驼峰命名（经过转换）
    const createdBy = report.created_by || report.createdBy;
    if (user.role === 'superadmin' || createdBy === user.id) {
        return true;
    }

    // 兼容处理：access_rules 可能是下划线命名（数据库原始）或驼峰命名（经过转换）
    const accessRules = report.access_rules || report.accessRules;
    const rules = normalizeAccessRules(accessRules);
    
    // 调试日志
    console.log('[canAccessReport] Checking access:', {
        userRole: user.role,
        userId: user.id,
        reportId: report.id,
        createdBy: createdBy,
        accessRules: accessRules,
        allowedRoles: rules.roles,
        allowedUsers: rules.users,
        hasRoleAccess: rules.roles.includes(user.role),
        hasUserAccess: rules.users.includes(user.id)
    });
    
    return rules.roles.includes(user.role) || rules.users.includes(user.id);
}

export { router as reportsRoutes };

function applySortOrders(rows = [], sortOrders = []) {
    if (!Array.isArray(sortOrders) || sortOrders.length === 0) {
        return rows;
    }
    const validOrders = sortOrders.filter(order => order && order.field);
    if (validOrders.length === 0) {
        return rows;
    }
    const sortedRows = [...rows];
    sortedRows.sort((a, b) => {
        for (const order of validOrders) {
            const field = order.field;
            const direction = (order.direction || 'asc').toLowerCase();
            const valA = a[field];
            const valB = b[field];

            if (valA == null && valB == null) continue;
            if (valA == null) return direction === 'asc' ? 1 : -1;
            if (valB == null) return direction === 'asc' ? -1 : 1;

            if (typeof valA === 'number' && typeof valB === 'number') {
                if (valA === valB) continue;
                return direction === 'asc' ? valA - valB : valB - valA;
            }

            const comparison = String(valA).localeCompare(String(valB), 'zh');
            if (comparison !== 0) {
                return direction === 'asc' ? comparison : -comparison;
            }
        }
        return 0;
    });
    return sortedRows;
}
