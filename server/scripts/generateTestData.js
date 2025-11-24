import { pool } from '../config/database.js';
import { generateId } from '../utils/helpers.js';
import dotenv from 'dotenv';

dotenv.config();

// 生成随机日期（过去N天内）
function randomDate(daysAgo) {
    const now = Date.now();
    const randomDays = Math.floor(Math.random() * daysAgo);
    return now - (randomDays * 24 * 60 * 60 * 1000);
}

// 生成随机数字
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机文本
function randomText(prefix, length = 5) {
    return prefix + Math.random().toString(36).substring(2, 2 + length);
}

async function generateTestData() {
    try {
        console.log('开始生成测试数据...');

        // 1. 获取所有基地和用户
        const basesResult = await pool.query('SELECT id, name FROM bases ORDER BY id');
        const bases = basesResult.rows;
        console.log(`找到 ${bases.length} 个基地`);

        const handlersResult = await pool.query(
            "SELECT id, username, name, base_id FROM users WHERE role = 'base_handler' ORDER BY id"
        );
        const handlers = handlersResult.rows;
        console.log(`找到 ${handlers.length} 个基地经手人`);

        // 2. 创建表单模板
        const formsData = [
            {
                name: '附表1：存货入出库管理台账',
                fields: [
                    { name: '日期', type: 'date', order: 0 },
                    { name: '摘要', type: 'text', order: 1 },
                    { name: '入库数量', type: 'number', order: 2 },
                    { name: '出库数量', type: 'number', order: 3 },
                    { name: '单价', type: 'number', order: 4 },
                    { name: '入库金额', type: 'formula', order: 5, formula: '入库数量 * 单价' },
                    { name: '结存数量', type: 'number', order: 6 },
                    { name: '备注', type: 'textarea', order: 7 }
                ]
            },
            {
                name: '附表2：存货盘底表',
                fields: [
                    { name: '存货名称', type: 'text', order: 0 },
                    { name: '规格型号', type: 'text', order: 1 },
                    { name: '账存数量', type: 'number', order: 2 },
                    { name: '盘存数量', type: 'number', order: 3 },
                    { name: '差异', type: 'formula', order: 4, formula: '盘存数量 - 账存数量' },
                    { name: '金额', type: 'number', order: 5 },
                    { name: '差异原因', type: 'textarea', order: 6 }
                ]
            },
            {
                name: '附表3：固定资产使用情况登记表',
                fields: [
                    { name: '资产名称', type: 'text', order: 0 },
                    { name: '品牌型号', type: 'text', order: 1 },
                    { name: '购置时间', type: 'date', order: 2 },
                    { name: '计量单位', type: 'text', order: 3 },
                    { name: '增加数量', type: 'number', order: 4 },
                    { name: '增加金额', type: 'number', order: 5 },
                    { name: '使用人', type: 'text', order: 6 },
                    { name: '减少日期', type: 'date', order: 7 },
                    { name: '减少数量', type: 'number', order: 8 },
                    { name: '减少金额', type: 'number', order: 9 },
                    { name: '减少原因', type: 'textarea', order: 10 },
                    { name: '基地现存数量', type: 'formula', order: 11, formula: '增加数量 - 减少数量' },
                    { name: '备注', type: 'textarea', order: 12 }
                ]
            },
            {
                name: '附表4：固定资产盘底表',
                fields: [
                    { name: '资产编号', type: 'text', order: 0 },
                    { name: '资产名称', type: 'text', order: 1 },
                    { name: '品牌型号', type: 'text', order: 2 },
                    { name: '单位', type: 'text', order: 3 },
                    { name: '账存数量', type: 'number', order: 4 },
                    { name: '原值', type: 'number', order: 5 },
                    { name: '使用人', type: 'text', order: 6 },
                    { name: '盘存数量', type: 'number', order: 7 },
                    { name: '差异', type: 'formula', order: 8, formula: '盘存数量 - 账存数量' },
                    { name: '差异原因', type: 'textarea', order: 9 }
                ]
            },
            {
                name: '附表5：固定资产处置表',
                fields: [
                    { name: '资产编号', type: 'text', order: 0 },
                    { name: '资产名称', type: 'text', order: 1 },
                    { name: '数量', type: 'number', order: 2 },
                    { name: '原值', type: 'number', order: 3 },
                    { name: '净值', type: 'number', order: 4 },
                    { name: '处置情况说明', type: 'textarea', order: 5 }
                ]
            },
            {
                name: '附表6：低值易耗品管理台账',
                fields: [
                    { name: '购置金额', type: 'number', order: 0 },
                    { name: '减少金额', type: 'number', order: 1 },
                    { name: '现存数量', type: 'number', order: 2 },
                    { name: '现存价值', type: 'formula', order: 3, formula: '购置金额 - 减少金额' },
                    { name: '原因', type: 'textarea', order: 4 }
                ]
            },
            {
                name: '附表7：低值易耗品盘底表',
                fields: [
                    { name: '低值易耗品名称', type: 'text', order: 0 },
                    { name: '规格型号', type: 'text', order: 1 },
                    { name: '单位', type: 'text', order: 2 },
                    { name: '金额', type: 'number', order: 3 },
                    { name: '账存数量', type: 'number', order: 4 },
                    { name: '盘存数量', type: 'number', order: 5 },
                    { name: '差异', type: 'formula', order: 6, formula: '盘存数量 - 账存数量' },
                    { name: '差异原因', type: 'textarea', order: 7 }
                ]
            },
            {
                name: '附表8：生物资产管理台账',
                fields: [
                    { name: '投放日期', type: 'date', order: 0 },
                    { name: '鱼类品种', type: 'text', order: 1 },
                    { name: '转入重量 (kg)', type: 'number', order: 2 },
                    { name: '转出重量 (kg)', type: 'number', order: 3 },
                    { name: '期末盘点重量 (kg)', type: 'number', order: 4 },
                    { name: '结存净重 (kg)', type: 'formula', order: 5, formula: '转入重量 (kg) - 转出重量 (kg) + 期末盘点重量 (kg)' },
                    { name: '备注', type: 'textarea', order: 6 }
                ]
            },
            {
                name: '附表9：生物资产盘点审核统计表',
                fields: [
                    { name: '投放池塘编号', type: 'text', order: 0 },
                    { name: '鱼类品种', type: 'text', order: 1 },
                    { name: '规格', type: 'text', order: 2 },
                    { name: '数量', type: 'number', order: 3 },
                    { name: '单价 (元/公斤)', type: 'number', order: 4 },
                    { name: '总价值', type: 'formula', order: 5, formula: '数量 * 单价 (元/公斤) / 1000' },
                    { name: '盘点日期', type: 'date', order: 6 },
                    { name: '备注', type: 'textarea', order: 7 }
                ]
            }
        ];

        const formMap = {};
        console.log('创建表单模板...');
        for (const formData of formsData) {
            const formId = generateId();
            await pool.query(
                'INSERT INTO forms (id, name, is_active) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                [formId, formData.name, true]
            );

            // 创建字段
            for (const fieldData of formData.fields) {
                const fieldId = generateId();
                await pool.query(
                    'INSERT INTO form_fields (id, form_id, name, type, active, "order", formula) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
                    [
                        fieldId,
                        formId,
                        fieldData.name,
                        fieldData.type,
                        true,
                        fieldData.order,
                        fieldData.formula || null
                    ]
                );
            }

            formMap[formData.name] = formId;
            console.log(`  ✓ 创建表单: ${formData.name} (${formData.fields.length} 个字段)`);
        }

        // 3. 为每个基地经手人生成资产记录
        console.log('\n生成资产记录...');
        const assetTypes = [
            { formName: '附表1：存货入出库管理台账', count: 15 },
            { formName: '附表2：存货盘底表', count: 10 },
            { formName: '附表3：固定资产使用情况登记表', count: 12 },
            { formName: '附表4：固定资产盘底表', count: 8 },
            { formName: '附表5：固定资产处置表', count: 5 },
            { formName: '附表6：低值易耗品管理台账', count: 10 },
            { formName: '附表7：低值易耗品盘底表', count: 8 },
            { formName: '附表8：生物资产管理台账', count: 20 },
            { formName: '附表9：生物资产盘点审核统计表', count: 15 }
        ];

        let totalAssets = 0;
        for (const handler of handlers) {
            console.log(`  为 ${handler.name} (${handler.username}) 生成数据...`);
            let handlerAssetCount = 0;
            
            for (const assetType of assetTypes) {
                const formId = formMap[assetType.formName];
                if (!formId) continue;

                // 获取表单字段
                const fieldsResult = await pool.query(
                    'SELECT * FROM form_fields WHERE form_id = $1 AND active = true ORDER BY "order" ASC',
                    [formId]
                );
                const fields = fieldsResult.rows;

                // 生成多条记录
                for (let i = 0; i < assetType.count; i++) {
                    const submittedAt = randomDate(90); // 过去90天内
                    const batchData = [];
                    
                    // 生成1-3条批量数据
                    const batchCount = randomNumber(1, 3);
                    for (let j = 0; j < batchCount; j++) {
                        const row = {};
                        for (const field of fields) {
                            if (field.type === 'formula') continue;
                            
                            switch (field.type) {
                                case 'text':
                                    row[field.name] = randomText('', 8);
                                    break;
                                case 'number':
                                    row[field.name] = randomNumber(1, 1000);
                                    break;
                                case 'date':
                                    row[field.name] = new Date(randomDate(90)).toISOString().split('T')[0];
                                    break;
                                case 'textarea':
                                    row[field.name] = randomText('备注', 10);
                                    break;
                            }
                        }
                        batchData.push(row);
                    }

                    const assetId = generateId();
                    await pool.query(
                        `INSERT INTO assets (id, form_id, form_name, sub_account_id, sub_account_name, base_id, submitted_at, fields_snapshot, batch_data)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            assetId,
                            formId,
                            assetType.formName,
                            handler.id,
                            handler.name,
                            handler.base_id,
                            submittedAt,
                            JSON.stringify(fields),
                            JSON.stringify(batchData)
                        ]
                    );
                    totalAssets++;
                    handlerAssetCount++;
                }
            }
            console.log(`    ✓ 已生成 ${handlerAssetCount} 条记录`);
        }

        // 4. 生成文件记录
        console.log('\n生成文件记录...');
        const fileNames = [
            '鱼苗养殖标准手册.pdf',
            '水质检测报告-2024-Q1.docx',
            '水质检测报告-2024-Q2.docx',
            '水质检测报告-2024-Q3.docx',
            '设备维护记录表.xlsx',
            '资产盘点清单-2024.xlsx',
            '财务报表-2024年度.pdf',
            '安全操作规程.pdf',
            '应急预案.docx',
            '培训材料-新员工入职.pptx'
        ];

        for (let i = 0; i < fileNames.length; i++) {
            const fileId = generateId();
            const uploadedBy = handlers[randomNumber(0, handlers.length - 1)].id;
            const uploadedAt = randomDate(60);
            
            // 随机选择2-4个经手人可以访问
            const allowedHandlers = [];
            const count = randomNumber(2, 4);
            for (let j = 0; j < count; j++) {
                const handler = handlers[randomNumber(0, handlers.length - 1)];
                if (!allowedHandlers.includes(handler.id)) {
                    allowedHandlers.push(handler.id);
                }
            }

            await pool.query(
                `INSERT INTO files (id, file_name, url, uploaded_by, uploaded_at, allowed_sub_accounts)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    fileId,
                    fileNames[i],
                    `https://example.com/files/${fileId}/${fileNames[i]}`,
                    uploadedBy,
                    uploadedAt,
                    JSON.stringify(allowedHandlers)
                ]
            );
        }
        console.log(`  ✓ 已生成 ${fileNames.length} 个文件记录`);

        // 5. 生成报表记录
        console.log('\n生成报表记录...');
        const managersResult = await pool.query(
            "SELECT id, name FROM users WHERE role IN ('base_manager', 'company_asset', 'company_finance', 'superadmin') ORDER BY id"
        );
        const reportCreators = managersResult.rows;

        const reportTemplates = [
            {
                name: '基地资产汇总报表',
                description: '各基地资产汇总统计',
                config: {
                    selectedForms: [formMap['附表3：固定资产使用情况登记表']],
                    selectedFields: ['资产名称', '增加金额'],
                    aggregations: [{ field: '增加金额', function: 'SUM' }]
                }
            },
            {
                name: '存货出入库统计',
                description: '存货出入库情况统计',
                config: {
                    selectedForms: [formMap['附表1：存货入出库管理台账']],
                    selectedFields: ['入库数量', '出库数量', '入库金额'],
                    aggregations: [
                        { field: '入库数量', function: 'SUM' },
                        { field: '出库数量', function: 'SUM' },
                        { field: '入库金额', function: 'SUM' }
                    ]
                }
            },
            {
                name: '生物资产盘点报表',
                description: '生物资产盘点情况',
                config: {
                    selectedForms: [formMap['附表8：生物资产管理台账']],
                    selectedFields: ['鱼类品种', '转入重量 (kg)', '转出重量 (kg)'],
                    aggregations: [
                        { field: '转入重量 (kg)', function: 'SUM' },
                        { field: '转出重量 (kg)', function: 'SUM' }
                    ]
                }
            }
        ];

        for (const creator of reportCreators) {
            for (const template of reportTemplates) {
                const reportId = generateId();
                await pool.query(
                    `INSERT INTO reports (id, name, description, created_by, config)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        reportId,
                        `${template.name} - ${creator.name}`,
                        template.description,
                        creator.id,
                        JSON.stringify(template.config)
                    ]
                );
            }
        }
        console.log(`  ✓ 已生成 ${reportCreators.length * reportTemplates.length} 个报表记录`);

        console.log('\n✅ 测试数据生成完成！');
        console.log(`   - 表单: ${formsData.length} 个`);
        console.log(`   - 资产记录: ${totalAssets} 条`);
        console.log(`   - 文件记录: ${fileNames.length} 个`);
        console.log(`   - 报表记录: ${reportCreators.length * reportTemplates.length} 个`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('生成测试数据失败:', error);
        await pool.end();
        process.exit(1);
    }
}

generateTestData();

