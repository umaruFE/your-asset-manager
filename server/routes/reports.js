import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId, toCamelCaseObject } from '../utils/helpers.js';

const router = express.Router();

// 获取所有报表（用户可以看自己创建的，超级管理员可以看所有）
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        let query = 'SELECT * FROM reports WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // 非超级管理员只能看自己创建的
        if (req.user.role !== 'superadmin') {
            query += ` AND created_by = $${paramIndex++}`;
            params.push(req.user.id);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        // 转换字段名从下划线到驼峰
        const camelRows = result.rows.map(row => toCamelCaseObject(row));
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

        // 非超级管理员只能看自己创建的
        if (req.user.role !== 'superadmin' && report.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(report));
    } catch (error) {
        next(error);
    }
});

// 创建报表
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const { name, description, config } = req.body;

        if (!name || !config) {
            return res.status(400).json({ error: 'Name and config are required' });
        }

        // 验证config格式
        if (!config.selectedForms || !Array.isArray(config.selectedForms)) {
            return res.status(400).json({ error: 'Invalid config: selectedForms must be an array' });
        }

        const id = generateId();
        await pool.query(
            'INSERT INTO reports (id, name, description, created_by, config) VALUES ($1, $2, $3, $4, $5)',
            [id, name, description || null, req.user.id, JSON.stringify(config)]
        );

        const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
        // 转换字段名从下划线到驼峰
        res.status(201).json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 更新报表
router.put('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { name, description, config } = req.body;

        // 检查报表是否存在和权限
        const checkResult = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = checkResult.rows[0];
        if (req.user.role !== 'superadmin' && report.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
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

// 删除报表
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        // 检查权限
        const checkResult = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = checkResult.rows[0];
        if (req.user.role !== 'superadmin' && report.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
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

        // 检查权限
        if (req.user.role !== 'superadmin' && report.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const config = report.config;
        let { selectedForms, selectedFields, aggregations, calculations, filters } = config;

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

        // 构建查询 - 从资产数据中提取字段值
        // 由于数据存储在JSONB中，需要使用PostgreSQL的JSON函数
        // 注意：batch_data中的键可能是字段ID或字段名称，需要同时尝试
        let selectClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        // 检查是否有聚合函数（需要在构建字段之前检查）
        const hasAggregations = aggregations && aggregations.length > 0;
        
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

        // 添加聚合函数
        for (const agg of aggregations || []) {
            if (agg.formId && agg.fieldId && agg.function) {
                const func = agg.function.toUpperCase(); // SUM, AVG, COUNT, MAX, MIN
                const fieldId = agg.fieldId;
                const fieldName = agg.fieldName || fieldId;
                
                // 从batch_row中提取数值并聚合
                // 尝试字段ID，如果不存在则尝试字段名称
                if (func === 'COUNT') {
                    // COUNT可以用于任何类型
                    selectClauses.push(`${func}(COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}')) as "${agg.fieldName}_${func}"`);
                } else {
                    // 其他聚合函数需要数字类型
                    // 使用COALESCE尝试字段ID和字段名称，然后转换为数字
                    selectClauses.push(`${func}(CAST(COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') AS NUMERIC)) as "${agg.fieldName}_${func}"`);
                }
            }
        }

        // 创建聚合字段映射：fieldId -> 聚合列名（例如 "转入重量 (kg)_SUM"）
        const aggregationColumnMap = {};
        if (hasAggregations && aggregations) {
            for (const agg of aggregations) {
                if (agg.formId && agg.fieldId && agg.function) {
                    const func = agg.function.toUpperCase();
                    const fieldName = agg.fieldName || agg.fieldId;
                    aggregationColumnMap[agg.fieldId] = `${fieldName}_${func}`;
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
            for (const field of selectedFields || []) {
                if (field.formId && field.fieldId && groupByFieldIds.has(field.fieldId)) {
                    const fieldId = field.fieldId;
                    const fieldName = field.fieldName || fieldId;
                    innerSelectClauses.push(`COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') as "${fieldName}"`);
                }
            }
            
            // 添加所有聚合字段
            for (const agg of aggregations || []) {
                if (agg.formId && agg.fieldId && agg.function) {
                    const func = agg.function.toUpperCase();
                    const fieldId = agg.fieldId;
                    const fieldName = agg.fieldName || fieldId;
                    
                    if (func === 'COUNT') {
                        innerSelectClauses.push(`${func}(COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}')) as "${agg.fieldName}_${func}"`);
                    } else {
                        innerSelectClauses.push(`${func}(CAST(COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}') AS NUMERIC)) as "${agg.fieldName}_${func}"`);
                    }
                }
            }
            
            let innerQuery = `SELECT ${innerSelectClauses.join(', ')} FROM assets, jsonb_array_elements(batch_data) as batch_row WHERE 1=1`;
                
                // 添加表单过滤（在GROUP BY之前）
                if (selectedForms && selectedForms.length > 0) {
                    innerQuery += ` AND form_id = ANY($${paramIndex++}::text[])`;
                    queryParams.push(selectedForms);
                }

                // 添加基地过滤（在GROUP BY之前）
                if (req.user.role === 'base_manager' && req.user.baseId) {
                    innerQuery += ` AND base_id = $${paramIndex++}`;
                    queryParams.push(req.user.baseId);
                }
                
                // 如果有非聚合字段，需要添加GROUP BY（必须在WHERE之后）
                // 只对用于分组的字段进行GROUP BY（不包括被聚合的字段）
                if (groupByFieldIds.size > 0) {
                    const groupByFields = selectedFields
                        .filter(field => field && typeof field === 'object' && field.formId && field.fieldId && groupByFieldIds.has(field.fieldId))
                        .map(field => {
                            const fieldId = field.fieldId;
                            const fieldName = field.fieldName || fieldId;
                            return `COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}')`;
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
                        const aggColName = `${fieldName}_${func}`;
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
                            // 如果该字段有聚合函数，使用聚合列名
                            if (aggregationColumnMap[match]) {
                                const aggColName = aggregationColumnMap[match].replace(/"/g, ''); // 移除引号
                                const escapedColName = aggColName.replace(/"/g, '""'); // 转义双引号
                                return `subq."${escapedColName}"`;
                            }
                            // 否则使用普通字段名
                            const fieldName = fieldNameMap[match] || match;
                            const escapedFieldName = fieldName.replace(/"/g, '""'); // 转义双引号
                            return `subq."${escapedFieldName}"`;
                        });
                        const escapedCalcName = calc.name.replace(/"/g, '""'); // 转义双引号
                        outerSelectClauses.push(`(${expr}) as "${escapedCalcName}"`);
                    }
                }
                
                query = `SELECT ${outerSelectClauses.join(', ')} FROM (${innerQuery}) as subq`;
        } else if (hasAggregations) {
            // 有聚合函数但没有计算字段，直接使用聚合查询
            query = `SELECT ${selectClauses.join(', ')} FROM assets, jsonb_array_elements(batch_data) as batch_row WHERE 1=1`;
            
            // 添加表单过滤（在GROUP BY之前）
            if (selectedForms && selectedForms.length > 0) {
                query += ` AND form_id = ANY($${paramIndex++}::text[])`;
                queryParams.push(selectedForms);
            }

            // 添加基地过滤（在GROUP BY之前）
            if (req.user.role === 'base_manager' && req.user.baseId) {
                query += ` AND base_id = $${paramIndex++}`;
                queryParams.push(req.user.baseId);
            }
            
            // 如果有非聚合字段，需要添加GROUP BY（必须在WHERE之后）
            // 只对用于分组的字段进行GROUP BY（不包括被聚合的字段）
            if (groupByFieldIds.size > 0) {
                const groupByFields = selectedFields
                    .filter(field => field && typeof field === 'object' && field.formId && field.fieldId && groupByFieldIds.has(field.fieldId))
                    .map(field => {
                        const fieldId = field.fieldId;
                        const fieldName = field.fieldName || fieldId;
                        return `COALESCE(batch_row->>'${fieldId}', batch_row->>'${fieldName}')`;
                    });
                
                if (groupByFields.length > 0) {
                    query += ` GROUP BY ${groupByFields.join(', ')}`;
                }
            }
        } else {
            // 没有聚合函数，直接展开batch_data
            query = `SELECT ${selectClauses.join(', ')} FROM assets, jsonb_array_elements(batch_data) as batch_row WHERE 1=1`;
            
            // 添加表单过滤
            if (selectedForms && selectedForms.length > 0) {
                query += ` AND form_id = ANY($${paramIndex++}::text[])`;
                queryParams.push(selectedForms);
            }

            // 添加基地过滤
            if (req.user.role === 'base_manager' && req.user.baseId) {
                query += ` AND base_id = $${paramIndex++}`;
                queryParams.push(req.user.baseId);
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
                    ? 'SELECT COUNT(*) as count FROM assets, jsonb_array_elements(batch_data) as batch_row WHERE 1=1'
                    : 'SELECT COUNT(*) as count FROM assets WHERE 1=1';
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

        res.json({
            report: report,
            data: queryResult.rows,
            total: queryResult.rows.length
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

export { router as reportsRoutes };
