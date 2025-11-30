import { pool } from '../config/database.js';
import { generateId } from '../utils/helpers.js';
import dotenv from 'dotenv';

dotenv.config();

const FORM_DEFINITIONS = [
    {
        name: '期初投入登记表',
        fields: [
            { name: '日期', type: 'date', order: 0 },
            { name: '池塘编号', type: 'text', order: 1 },
            { name: '鱼类品种', type: 'text', order: 2 },
            { name: '规格', type: 'text', order: 3 },
            { name: '平均单尾重量（kg）', type: 'number', order: 4 },
            { name: '重量（kg）', type: 'number', order: 5 },
            { name: '数量（尾）', type: 'formula', order: 6, formula: '重量（kg） / 平均单尾重量（kg）' },
            { name: '计划单价（元/公斤）', type: 'number', order: 7 },
            { name: '计划价值（元）', type: 'formula', order: 8, formula: '计划单价（元/公斤） * 重量（kg）' },
            { name: '经办人', type: 'text', order: 9 },
            { name: '备注', type: 'textarea', order: 10 }
        ]
    },
    {
        name: '转入转出登记表',
        fields: [
            { name: '日期', type: 'date', order: 0 },
            { name: '池塘编号', type: 'text', order: 1 },
            { name: '鱼类品种', type: 'text', order: 2 },
            { name: '平均单尾重量（kg）', type: 'number', order: 3 },
            { name: '转入重量（kg）', type: 'number', order: 4 },
            { name: '转入数量（尾）', type: 'formula', order: 5, formula: '转入重量（kg） / 平均单尾重量（kg）' },
            { name: '转出重量（kg）', type: 'number', order: 6 },
            { name: '转出数量（尾）', type: 'number', order: 7 },
            { name: '经办人', type: 'text', order: 8 },
            { name: '备注', type: 'textarea', order: 9 }
        ]
    },
    {
        name: '期末捕捞登记表',
        fields: [
            { name: '日期', type: 'date', order: 0 },
            { name: '池塘编号', type: 'text', order: 1 },
            { name: '鱼类品种', type: 'text', order: 2 },
            { name: '重量（kg）', type: 'number', order: 3 },
            { name: '数量（尾）', type: 'number', order: 4 },
            { name: '平均单尾重量（kg）', type: 'formula', order: 5, formula: '重量（kg） / 数量（尾）' },
            { name: '损耗率（%）', type: 'number', order: 6 },
            { name: '计划单价（元/公斤）', type: 'number', order: 7 },
            { name: '经办人', type: 'text', order: 8 },
            { name: '备注', type: 'textarea', order: 9 }
        ]
    },
    {
        name: '种鱼移动登记表',
        fields: [
            { name: '日期', type: 'date', order: 0 },
            { name: '源池塘编号', type: 'text', order: 1 },
            { name: '源水池编号', type: 'text', order: 2 },
            { name: '目标池塘编号', type: 'text', order: 3 },
            { name: '目标水池编号', type: 'text', order: 4 },
            { name: '鱼类品种', type: 'text', order: 5 },
            { name: '规格', type: 'text', order: 6 },
            { name: '平均单尾重量（kg）', type: 'number', order: 7 },
            { name: '重量（kg）', type: 'number', order: 8 },
            { name: '数量（尾）', type: 'number', order: 9 },
            { name: '经办人', type: 'text', order: 10 },
            { name: '备注', type: 'textarea', order: 11 }
        ]
    }
];

const FORM_SAMPLE_DATA = {
    '期初投入登记表': [
        {
            baseId: 'base_001',
            submittedAt: '2025-03-05T09:00:00+08:00',
            rows: [
                {
                    '日期': '2025-03-05',
                    '池塘编号': 'P1-01',
                    '鱼类品种': '草鱼',
                    '规格': '500-600克',
                    '平均单尾重量（kg）': 0.5,
                    '重量（kg）': 500,
                    '数量（尾）': 1000,
                    '计划单价（元/公斤）': 26.5,
                    '计划价值（元）': 13250,
                    '备注': '春季投放第一批草鱼'
                },
                {
                    '日期': '2025-03-05',
                    '池塘编号': 'P1-02',
                    '鱼类品种': '鲫鱼',
                    '规格': '200-300克',
                    '平均单尾重量（kg）': 0.25,
                    '重量（kg）': 300,
                    '数量（尾）': 1200,
                    '计划单价（元/公斤）': 23,
                    '计划价值（元）': 6900,
                    '备注': '鲫鱼补充苗种'
                }
            ]
        },
        {
            baseId: 'base_002',
            submittedAt: '2025-03-06T09:00:00+08:00',
            rows: [
                {
                    '日期': '2025-03-06',
                    '池塘编号': 'P2-01',
                    '鱼类品种': '鲈鱼',
                    '规格': '350-400克',
                    '平均单尾重量（kg）': 0.35,
                    '重量（kg）': 420,
                    '数量（尾）': 1200,
                    '计划单价（元/公斤）': 32.5,
                    '计划价值（元）': 13650,
                    '备注': '鲈鱼成活率良好'
                },
                {
                    '日期': '2025-03-06',
                    '池塘编号': 'P2-02',
                    '鱼类品种': '黄颡鱼',
                    '规格': '150-200克',
                    '平均单尾重量（kg）': 0.18,
                    '重量（kg）': 180,
                    '数量（尾）': 1000,
                    '计划单价（元/公斤）': 38,
                    '计划价值（元）': 6840,
                    '备注': '黄颡鱼苗补栏'
                }
            ]
        },
        {
            baseId: 'base_003',
            submittedAt: '2025-03-07T09:00:00+08:00',
            rows: [
                {
                    '日期': '2025-03-07',
                    '池塘编号': 'P3-01',
                    '鱼类品种': '青鱼',
                    '规格': '800-900克',
                    '平均单尾重量（kg）': 0.8,
                    '重量（kg）': 640,
                    '数量（尾）': 800,
                    '计划单价（元/公斤）': 45,
                    '计划价值（元）': 28800,
                    '备注': '青鱼主力养殖池'
                },
                {
                    '日期': '2025-03-07',
                    '池塘编号': 'P3-02',
                    '鱼类品种': '黑鱼',
                    '规格': '550-650克',
                    '平均单尾重量（kg）': 0.6,
                    '重量（kg）': 360,
                    '数量（尾）': 600,
                    '计划单价（元/公斤）': 50,
                    '计划价值（元）': 18000,
                    '备注': '黑鱼备份池塘'
                }
            ]
        }
    ],
    '转入转出登记表': [
        {
            baseId: 'base_001',
            submittedAt: '2025-04-10T09:00:00+08:00',
            rows: [
                {
                    '日期': '2025-04-01',
                    '池塘编号': 'P1-01',
                    '鱼类品种': '草鱼',
                    '平均单尾重量（kg）': 0.52,
                    '转入重量（kg）': 80,
                    '转入数量（尾）': 154,
                    '转出重量（kg）': 0,
                    '转出数量（尾）': 0,
                    '备注': '基地二调拨草鱼苗'
                },
                {
                    '日期': '2025-04-10',
                    '池塘编号': 'P1-02',
                    '鱼类品种': '鲫鱼',
                    '平均单尾重量（kg）': 0.27,
                    '转入重量（kg）': 0,
                    '转入数量（尾）': 0,
                    '转出重量（kg）': 50,
                    '转出数量（尾）': 185,
                    '备注': '调出部分鲫鱼至基地三'
                }
            ]
        },
        {
            baseId: 'base_002',
            submittedAt: '2025-04-12T09:00:00+08:00',
            rows: [
                {
                    '日期': '2025-04-05',
                    '池塘编号': 'P2-01',
                    '鱼类品种': '鲈鱼',
                    '平均单尾重量（kg）': 0.38,
                    '转入重量（kg）': 60,
                    '转入数量（尾）': 158,
                    '转出重量（kg）': 0,
                    '转出数量（尾）': 0,
                    '备注': '基地备份苗调入'
                },
                {
                    '日期': '2025-04-12',
                    '池塘编号': 'P2-02',
                    '鱼类品种': '黄颡鱼',
                    '平均单尾重量（kg）': 0.2,
                    '转入重量（kg）': 0,
                    '转入数量（尾）': 0,
                    '转出重量（kg）': 30,
                    '转出数量（尾）': 150,
                    '备注': '试捕转出黄颡鱼'
                }
            ]
        },
        {
            baseId: 'base_003',
            submittedAt: '2025-04-15T09:00:00+08:00',
            rows: [
                {
                    '日期': '2025-04-08',
                    '池塘编号': 'P3-01',
                    '鱼类品种': '青鱼',
                    '平均单尾重量（kg）': 0.85,
                    '转入重量（kg）': 90,
                    '转入数量（尾）': 106,
                    '转出重量（kg）': 0,
                    '转出数量（尾）': 0,
                    '备注': '补充种鱼'
                },
                {
                    '日期': '2025-04-15',
                    '池塘编号': 'P3-02',
                    '鱼类品种': '黑鱼',
                    '平均单尾重量（kg）': 0.62,
                    '转入重量（kg）': 0,
                    '转入数量（尾）': 0,
                    '转出重量（kg）': 40,
                    '转出数量（尾）': 65,
                    '备注': '黑鱼外销'
                }
            ]
        }
    ],
    '期末捕捞登记表': [
        {
            baseId: 'base_001',
            submittedAt: '2025-06-30T18:00:00+08:00',
            rows: [
                {
                    '日期': '2025-06-28',
                    '池塘编号': 'P1-01',
                    '鱼类品种': '草鱼',
                    '重量（kg）': 450,
                    '数量（尾）': 940,
                    '平均单尾重量（kg）': 0.479,
                    '损耗率（%）': 5,
                    '计划单价（元/公斤）': 28,
                    '备注': '草鱼整塘捕捞'
                },
                {
                    '日期': '2025-06-29',
                    '池塘编号': 'P1-02',
                    '鱼类品种': '鲫鱼',
                    '重量（kg）': 280,
                    '数量（尾）': 1120,
                    '平均单尾重量（kg）': 0.25,
                    '损耗率（%）': 4,
                    '计划单价（元/公斤）': 24.5,
                    '备注': '鲫鱼试捕'
                }
            ]
        },
        {
            baseId: 'base_002',
            submittedAt: '2025-07-02T18:00:00+08:00',
            rows: [
                {
                    '日期': '2025-07-01',
                    '池塘编号': 'P2-01',
                    '鱼类品种': '鲈鱼',
                    '重量（kg）': 410,
                    '数量（尾）': 1080,
                    '平均单尾重量（kg）': 0.38,
                    '损耗率（%）': 6,
                    '计划单价（元/公斤）': 34,
                    '备注': '鲈鱼成熟批次'
                },
                {
                    '日期': '2025-07-02',
                    '池塘编号': 'P2-02',
                    '鱼类品种': '黄颡鱼',
                    '重量（kg）': 165,
                    '数量（尾）': 900,
                    '平均单尾重量（kg）': 0.183,
                    '损耗率（%）': 3,
                    '计划单价（元/公斤）': 39,
                    '备注': '黄颡鱼入库'
                }
            ]
        },
        {
            baseId: 'base_003',
            submittedAt: '2025-07-05T18:00:00+08:00',
            rows: [
                {
                    '日期': '2025-07-04',
                    '池塘编号': 'P3-01',
                    '鱼类品种': '青鱼',
                    '重量（kg）': 620,
                    '数量（尾）': 760,
                    '平均单尾重量（kg）': 0.816,
                    '损耗率（%）': 5,
                    '计划单价（元/公斤）': 46,
                    '备注': '青鱼出塘'
                },
                {
                    '日期': '2025-07-05',
                    '池塘编号': 'P3-02',
                    '鱼类品种': '黑鱼',
                    '重量（kg）': 340,
                    '数量（尾）': 560,
                    '平均单尾重量（kg）': 0.607,
                    '损耗率（%）': 4,
                    '计划单价（元/公斤）': 52,
                    '备注': '黑鱼成鱼批次'
                }
            ]
        }
    ],
    '种鱼移动登记表': [
        {
            baseId: 'base_001',
            submittedAt: '2025-05-15T15:00:00+08:00',
            rows: [
                {
                    '日期': '2025-05-15',
                    '源池塘编号': 'P1-01',
                    '源水池编号': '养殖A1',
                    '目标池塘编号': 'P1-03',
                    '目标水池编号': '养殖C1',
                    '鱼类品种': '草鱼',
                    '规格': '600克种鱼',
                    '平均单尾重量（kg）': 0.6,
                    '重量（kg）': 120,
                    '数量（尾）': 200,
                    '备注': '草鱼种鱼轮换'
                }
            ]
        },
        {
            baseId: 'base_002',
            submittedAt: '2025-05-18T15:00:00+08:00',
            rows: [
                {
                    '日期': '2025-05-18',
                    '源池塘编号': 'P2-02',
                    '源水池编号': '孵化B2',
                    '目标池塘编号': 'P2-04',
                    '目标水池编号': '养殖D2',
                    '鱼类品种': '黄颡鱼',
                    '规格': '亲鱼',
                    '平均单尾重量（kg）': 0.22,
                    '重量（kg）': 44,
                    '数量（尾）': 200,
                    '备注': '亲鱼转入孵化池'
                }
            ]
        },
        {
            baseId: 'base_003',
            submittedAt: '2025-05-20T15:00:00+08:00',
            rows: [
                {
                    '日期': '2025-05-20',
                    '源池塘编号': 'P3-02',
                    '源水池编号': '养殖E1',
                    '目标池塘编号': 'P3-03',
                    '目标水池编号': '养殖E3',
                    '鱼类品种': '黑鱼',
                    '规格': '育种级',
                    '平均单尾重量（kg）': 0.7,
                    '重量（kg）': 70,
                    '数量（尾）': 100,
                    '备注': '黑鱼选留'
                }
            ]
        }
    ]
};

const SAMPLE_FILES = [
    {
        fileName: '2025Q1-基地一-养殖日报.pdf',
        url: 'https://example.com/files/2025q1-base1-daily.pdf',
        uploadedAt: '2025-04-15T10:00:00+08:00',
        allowedBaseIds: ['base_001', 'base_002']
    },
    {
        fileName: '2025年上半年水质检测报告.docx',
        url: 'https://example.com/files/2025-water-report.docx',
        uploadedAt: '2025-05-05T10:00:00+08:00',
        allowedBaseIds: ['base_001', 'base_002', 'base_003']
    },
    {
        fileName: '应急预案-最新版.pdf',
        url: 'https://example.com/files/emergency-plan-2025.pdf',
        uploadedAt: '2025-05-25T10:00:00+08:00',
        allowedBaseIds: ['base_002', 'base_003']
    }
];

async function main() {
    const client = await pool.connect();
    try {
        console.log('🚿 清理历史测试数据...');
        await client.query('BEGIN');
        await cleanupExistingData(client);
        console.log('🧱 重建表单结构...');
        const formsMap = await createForms(client);
        console.log('👥 读取用户信息...');
        const users = await fetchUsers(client);
        console.log('🔐 分配表单权限...');
        await assignPermissions(client, formsMap, users);
        console.log('🗂️ 写入示例表单记录...');
        await insertSampleAssets(client, formsMap, users.handlerByBaseId);
        console.log('📎 写入示例文件记录...');
        await insertSampleFiles(client, users);
        console.log('📊 初始化示例统计报表...');
        await insertSampleReports(client, formsMap, users);
        await client.query('COMMIT');
        console.log('\n✅ PostgreSQL 测试数据重置完成！');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ 重置测试数据失败：', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

async function cleanupExistingData(client) {
    await client.query('DELETE FROM assets');
    await client.query('DELETE FROM files');
    await client.query('DELETE FROM reports');
    await client.query('DELETE FROM form_archives');
    await client.query('DELETE FROM user_form_permissions');
    await client.query('DELETE FROM form_fields');
    await client.query('DELETE FROM forms');
}

async function createForms(client) {
    const map = new Map();
    for (const formDef of FORM_DEFINITIONS) {
        const formId = generateId();
        await client.query(
            'INSERT INTO forms (id, name, is_active, archive_status, archive_version) VALUES ($1, $2, $3, $4, $5)',
            [formId, formDef.name, true, 'active', 0]
        );

        const fields = [];
        for (const fieldDef of formDef.fields) {
            const fieldId = generateId();
            const fieldKey = generateId();
            const displayPrecision =
                typeof fieldDef.displayPrecision === 'number'
                    ? fieldDef.displayPrecision
                    : fieldDef.type === 'number'
                        ? 2
                        : 0;
            await client.query(
                'INSERT INTO form_fields (id, form_id, field_key, name, type, display_precision, active, "order", formula) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [
                    fieldId,
                    formId,
                    fieldKey,
                    fieldDef.name,
                    fieldDef.type,
                    displayPrecision,
                    true,
                    fieldDef.order,
                    fieldDef.formula || null
                ]
            );
            fields.push({ id: fieldId, fieldKey, displayPrecision, ...fieldDef });
        }

        map.set(formDef.name, { id: formId, name: formDef.name, fields });
    }
    return map;
}

async function fetchUsers(client) {
    const result = await client.query('SELECT id, role, base_id, name FROM users');
    const rows = result.rows;
    const baseHandlers = rows.filter((user) => user.role === 'base_handler');
    const baseManagers = rows.filter((user) => user.role === 'base_manager');
    const companyAssetUsers = rows.filter((user) => user.role === 'company_asset');
    const companyFinanceUsers = rows.filter((user) => user.role === 'company_finance');
    const superAdmin = rows.find((user) => user.role === 'superadmin') || null;

    const handlerByBaseId = new Map();
    baseHandlers.forEach((handler) => {
        if (handler.base_id) {
            handlerByBaseId.set(handler.base_id, handler);
        }
    });

    return {
        baseHandlers,
        baseManagers,
        companyAssetUsers,
        companyFinanceUsers,
        superAdmin,
        handlerByBaseId
    };
}

async function assignPermissions(client, formsMap, users) {
    const submissionFormNames = [
        '期初投入登记表',
        '转入转出登记表',
        '期末捕捞登记表',
        '种鱼移动登记表'
    ];
    const permissionColumn = await detectPermissionColumn(client);
    const formIds = submissionFormNames
        .map((name) => formsMap.get(name))
        .filter(Boolean)
        .map((form) => form.id);

    const upsertPermission = async (userId, formId, canView, canSubmit) => {
        const permId = generateId();
        await client.query(
            `INSERT INTO user_form_permissions (id, user_id, form_id, can_view, ${permissionColumn})
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, form_id)
             DO UPDATE SET can_view = EXCLUDED.can_view, ${permissionColumn} = EXCLUDED.${permissionColumn}`,
            [permId, userId, formId, canView, canSubmit]
        );
    };

    for (const handler of users.baseHandlers) {
        for (const formId of formIds) {
            await upsertPermission(handler.id, formId, true, true);
        }
    }

    const viewOnlyUsers = [
        ...users.baseManagers,
        ...users.companyAssetUsers,
        ...users.companyFinanceUsers
    ];

    for (const viewer of viewOnlyUsers) {
        for (const formId of formIds) {
            await upsertPermission(viewer.id, formId, true, false);
        }
    }
}

async function detectPermissionColumn(client) {
    const result = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'user_form_permissions' AND column_name IN ('can_submit', 'can_edit')
        ORDER BY column_name
    `);
    if (result.rows.some((row) => row.column_name === 'can_submit')) {
        return 'can_submit';
    }
    return 'can_edit';
}

async function insertSampleAssets(client, formsMap, handlerByBaseId) {
    for (const [formName, submissions] of Object.entries(FORM_SAMPLE_DATA)) {
        const form = formsMap.get(formName);
        if (!form) {
            console.warn(`⚠️ 未找到表单：${formName}，跳过样例数据`);
            continue;
        }

        const fieldsSnapshotResult = await client.query(
            'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC',
            [form.id]
        );
        const fieldSnapshot = fieldsSnapshotResult.rows;

        for (const submission of submissions) {
            const handler = handlerByBaseId.get(submission.baseId);
            if (!handler) {
                console.warn(`⚠️ 未找到基地经手人（baseId=${submission.baseId}），跳过记录`);
                continue;
            }

            const batchRows = submission.rows.map((row) => ({
                ...row,
                '经办人': row['经办人'] || handler.name
            }));

            const assetId = generateId();
            const submittedAt = new Date(submission.submittedAt).getTime();
            await client.query(
                `INSERT INTO assets (id, form_id, form_name, sub_account_id, sub_account_name, base_id, submitted_at, fields_snapshot, batch_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    assetId,
                    form.id,
                    form.name,
                    handler.id,
                    handler.name,
                    submission.baseId,
                    submittedAt,
                    JSON.stringify(fieldSnapshot),
                    JSON.stringify(batchRows)
                ]
            );
        }
    }
}

async function insertSampleFiles(client, users) {
    if (SAMPLE_FILES.length === 0) return;
    const uploader =
        users.superAdmin ||
        users.companyAssetUsers[0] ||
        users.baseManagers[0] ||
        users.baseHandlers[0];

    if (!uploader) {
        console.warn('⚠️ 没有可用上传账号，跳过文件数据写入');
        return;
    }

    for (const fileDef of SAMPLE_FILES) {
        const allowedHandlers = (fileDef.allowedBaseIds || [])
            .map((baseId) => users.handlerByBaseId.get(baseId))
            .filter(Boolean)
            .map((handler) => handler.id);

        if (allowedHandlers.length === 0) {
            allowedHandlers.push(uploader.id);
        }

        await client.query(
            `INSERT INTO files (id, file_name, url, uploaded_by, uploaded_at, allowed_sub_accounts)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                generateId(),
                fileDef.fileName,
                fileDef.url,
                uploader.id,
                new Date(fileDef.uploadedAt).getTime(),
                JSON.stringify(allowedHandlers)
            ]
        );
    }
}

async function insertSampleReports(client, formsMap, users) {
    const superAdminConfigs = buildSuperAdminReferenceReports(formsMap);
    if (users.superAdmin && superAdminConfigs.length) {
        await insertReportsForUser(client, users.superAdmin, superAdminConfigs);
        console.log(`  ✓ 已为超级管理员初始化 ${superAdminConfigs.length} 个参考报表配置`);
    } else if (!users.superAdmin) {
        console.warn('⚠️ 未找到超级管理员账号，跳过参考报表初始化');
    }

    const baseManagerConfigs = buildBaseManagerReportConfigs(formsMap);
    if (baseManagerConfigs.length && users.baseManagers.length) {
        for (const manager of users.baseManagers) {
            await insertReportsForUser(client, manager, baseManagerConfigs);
        }
        console.log(
            `  ✓ 已为 ${users.baseManagers.length} 位基地负责人初始化 ${baseManagerConfigs.length} 个统计报表`
        );
    }

    const companyConfigs = buildCompanyReportConfigs(formsMap);
    const corporateUsers = [...users.companyAssetUsers, ...users.companyFinanceUsers];
    if (companyConfigs.length && corporateUsers.length) {
        for (const corpUser of corporateUsers) {
            await insertReportsForUser(client, corpUser, companyConfigs);
        }
        console.log(
            `  ✓ 已为 ${corporateUsers.length} 位公司层级账号初始化 ${companyConfigs.length} 个统计报表`
        );
    }
}

async function insertReportsForUser(client, user, configs) {
    for (const report of configs) {
        await client.query(
            `INSERT INTO reports (id, name, description, created_by, config)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                generateId(),
                report.name,
                report.description,
                user.id,
                JSON.stringify(report.config)
            ]
        );
    }
}

function buildSuperAdminReferenceReports(formsMap) {
    const configs = [];
    const initialForm = formsMap.get('期初投入登记表');
    const transferForm = formsMap.get('转入转出登记表');
    const finalForm = formsMap.get('期末捕捞登记表');

    if (initialForm && transferForm) {
        const pondField = findField(initialForm, '池塘编号');
        const fishField = findField(initialForm, '鱼类品种');
        const initialQtyField = findField(initialForm, '数量（尾）');
        const transferInField = findField(transferForm, '转入数量（尾）');
        const transferOutField = findField(transferForm, '转出数量（尾）');

        configs.push({
            name: '基地生物资产实时统计表（示例）',
            description: '池塘+鱼类实时数量示例配置',
            config: {
                selectedForms: [initialForm.id, transferForm.id],
                selectedFields: [
                    { formId: initialForm.id, fieldId: pondField.id, fieldName: pondField.name },
                    { formId: initialForm.id, fieldId: fishField.id, fieldName: fishField.name }
                ],
                aggregations: [
                    { formId: initialForm.id, fieldId: initialQtyField.id, fieldName: initialQtyField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferInField.id, fieldName: transferInField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferOutField.id, fieldName: transferOutField.name, function: 'SUM' }
                ],
                calculations: [
                    {
                        name: '实时数量（尾）',
                        expression: `${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}`
                    }
                ]
            }
        });
    }

    if (initialForm && transferForm && finalForm) {
        const pondField = findField(initialForm, '池塘编号');
        const fishField = findField(initialForm, '鱼类品种');
        const initialQtyField = findField(initialForm, '数量（尾）');
        const transferInField = findField(transferForm, '转入数量（尾）');
        const transferOutField = findField(transferForm, '转出数量（尾）');
        const lossField = findField(finalForm, '损耗率（%）');
        const avgWeightField = findField(finalForm, '平均单尾重量（kg）');
        const planPriceField = findField(finalForm, '计划单价（元/公斤）');

        configs.push({
            name: '基地生物资产期末统计表（示例）',
            description: '期末数量/重量/价值示例配置',
            config: {
                selectedForms: [initialForm.id, transferForm.id, finalForm.id],
                selectedFields: [
                    { formId: initialForm.id, fieldId: pondField.id, fieldName: pondField.name },
                    { formId: initialForm.id, fieldId: fishField.id, fieldName: fishField.name }
                ],
                aggregations: [
                    { formId: initialForm.id, fieldId: initialQtyField.id, fieldName: initialQtyField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferInField.id, fieldName: transferInField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferOutField.id, fieldName: transferOutField.name, function: 'SUM' },
                    { formId: finalForm.id, fieldId: lossField.id, fieldName: lossField.name, function: 'AVG' },
                    { formId: finalForm.id, fieldId: avgWeightField.id, fieldName: avgWeightField.name, function: 'AVG' },
                    { formId: finalForm.id, fieldId: planPriceField.id, fieldName: planPriceField.name, function: 'AVG' }
                ],
                calculations: [
                    {
                        name: '期末数量（尾）',
                        expression: `${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}`
                    },
                    {
                        name: '期末重量（kg）',
                        expression: `(${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}) * (1 - (${lossField.id} / 100)) * ${avgWeightField.id}`
                    },
                    {
                        name: '盘点确认总价值（元）',
                        expression: `(${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}) * (1 - (${lossField.id} / 100)) * ${avgWeightField.id} * ${planPriceField.id}`
                    }
                ]
            }
        });
    }

    return configs;
}

function buildBaseManagerReportConfigs(formsMap) {
    const initialForm = formsMap.get('期初投入登记表');
    const transferForm = formsMap.get('转入转出登记表');
    const finalForm = formsMap.get('期末捕捞登记表');
    if (!initialForm || !transferForm || !finalForm) return [];

    const pondField = findField(initialForm, '池塘编号');
    const fishField = findField(initialForm, '鱼类品种');
    const initialQtyField = findField(initialForm, '数量（尾）');
    const transferInField = findField(transferForm, '转入数量（尾）');
    const transferOutField = findField(transferForm, '转出数量（尾）');
    const lossField = findField(finalForm, '损耗率（%）');
    const avgWeightField = findField(finalForm, '平均单尾重量（kg）');
    const planPriceField = findField(finalForm, '计划单价（元/公斤）');

    const metaGroupingPresets = [
        {
            key: 'pond_species_combo',
            label: '池塘编号+鱼类品种组合',
            defaultEnabled: true,
            dimensions: [
                { fieldId: pondField.id, label: pondField.name },
                { fieldId: fishField.id, label: fishField.name }
            ],
            sortOrder: [
                { priority: 1, fieldId: pondField.id, direction: 'ASC' },
                { priority: 2, fieldId: fishField.id, direction: 'ASC' }
            ]
        },
        {
            key: 'pond_only',
            label: '按池塘编号汇总',
            defaultEnabled: false,
            dimensions: [{ fieldId: pondField.id, label: pondField.name }],
            sortOrder: [{ priority: 1, fieldId: pondField.id, direction: 'ASC' }]
        },
        {
            key: 'species_only',
            label: '按鱼类品种汇总',
            defaultEnabled: false,
            dimensions: [{ fieldId: fishField.id, label: fishField.name }],
            sortOrder: [{ priority: 1, fieldId: fishField.id, direction: 'ASC' }]
        }
    ];

    return [
        {
            name: '基地生物资产实时统计表',
            description: '池塘/鱼种维度实时数量统计（基地级）',
            config: {
                selectedForms: [initialForm.id, transferForm.id],
                selectedFields: [
                    { formId: initialForm.id, fieldId: pondField.id, fieldName: pondField.name },
                    { formId: initialForm.id, fieldId: fishField.id, fieldName: fishField.name }
                ],
                aggregations: [
                    { formId: initialForm.id, fieldId: initialQtyField.id, fieldName: initialQtyField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferInField.id, fieldName: transferInField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferOutField.id, fieldName: transferOutField.name, function: 'SUM' }
                ],
                calculations: [
                    {
                        name: '数量（尾）',
                        expression: `${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}`
                    }
                ],
                filters: {},
                meta: {
                    ownerRole: 'base_manager',
                    reportType: 'realtime',
                    groupingPresets: metaGroupingPresets,
                    notes: [
                        '数量（尾）=期初数量+转入数量-转出数量',
                        '若未勾选任何分组选项，则不展示结果'
                    ]
                }
            }
        },
        {
            name: '基地生物资产期末统计表',
            description: '池塘/鱼种期末数量、重量与价值统计（基地级）',
            config: {
                selectedForms: [initialForm.id, transferForm.id, finalForm.id],
                selectedFields: [
                    { formId: initialForm.id, fieldId: pondField.id, fieldName: pondField.name },
                    { formId: initialForm.id, fieldId: fishField.id, fieldName: fishField.name }
                ],
                aggregations: [
                    { formId: initialForm.id, fieldId: initialQtyField.id, fieldName: initialQtyField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferInField.id, fieldName: transferInField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferOutField.id, fieldName: transferOutField.name, function: 'SUM' },
                    { formId: finalForm.id, fieldId: lossField.id, fieldName: lossField.name, function: 'AVG' },
                    { formId: finalForm.id, fieldId: avgWeightField.id, fieldName: avgWeightField.name, function: 'AVG' },
                    { formId: finalForm.id, fieldId: planPriceField.id, fieldName: planPriceField.name, function: 'AVG' }
                ],
                calculations: [
                    {
                        name: '数量（尾）',
                        expression: `${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}`
                    },
                    {
                        name: '重量（kg）',
                        expression: `(${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}) * (1 - (${lossField.id} / 100)) * ${avgWeightField.id}`
                    },
                    {
                        name: '盘点确认总价值（元）',
                        expression: `(${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}) * (1 - (${lossField.id} / 100)) * ${avgWeightField.id} * ${planPriceField.id}`
                    }
                ],
                filters: {},
                meta: {
                    ownerRole: 'base_manager',
                    reportType: 'final',
                    groupingPresets: metaGroupingPresets,
                    aggregationModes: {
                        quantity: 'sum',
                        weight: 'calculated',
                        value: 'calculated',
                        planPrice: 'reference'
                    },
                    referenceFields: [{ fieldId: planPriceField.id, label: planPriceField.name }],
                    notes: [
                        '计划单价字段仅引用期末捕捞登记表的单价，不参与汇总',
                        '重量、价值的计算基于期末数量与损耗率、平均单尾重量'
                    ]
                }
            }
        }
    ];
}

function buildCompanyReportConfigs(formsMap) {
    const initialForm = formsMap.get('期初投入登记表');
    const transferForm = formsMap.get('转入转出登记表');
    const finalForm = formsMap.get('期末捕捞登记表');
    if (!initialForm || !transferForm || !finalForm) return [];

    const pondField = findField(initialForm, '池塘编号');
    const fishField = findField(initialForm, '鱼类品种');
    const initialQtyField = findField(initialForm, '数量（尾）');
    const transferInField = findField(transferForm, '转入数量（尾）');
    const transferOutField = findField(transferForm, '转出数量（尾）');
    const lossField = findField(finalForm, '损耗率（%）');
    const avgWeightField = findField(finalForm, '平均单尾重量（kg）');
    const planPriceField = findField(finalForm, '计划单价（元/公斤）');

    const companyGroupingPresets = [
        {
            key: 'base_pond_fish',
            label: '基地+池塘+鱼种组合',
            defaultEnabled: true,
            dimensions: [
                { virtual: 'base_name', label: '基地名称' },
                { fieldId: pondField.id, label: pondField.name },
                { fieldId: fishField.id, label: fishField.name }
            ],
            sortOrder: [
                { priority: 1, virtual: 'base_name', direction: 'ASC' },
                { priority: 2, fieldId: pondField.id, direction: 'ASC' },
                { priority: 3, fieldId: fishField.id, direction: 'ASC' }
            ]
        },
        {
            key: 'base_only',
            label: '按基地名称汇总',
            defaultEnabled: false,
            dimensions: [{ virtual: 'base_name', label: '基地名称' }],
            sortOrder: [{ priority: 1, virtual: 'base_name', direction: 'ASC' }]
        },
        {
            key: 'fish_only',
            label: '按鱼类品种汇总',
            defaultEnabled: false,
            dimensions: [{ fieldId: fishField.id, label: fishField.name }],
            sortOrder: [{ priority: 1, fieldId: fishField.id, direction: 'ASC' }]
        },
        {
            key: 'base_pond_combo',
            label: '基地+池塘组合',
            defaultEnabled: false,
            dimensions: [
                { virtual: 'base_name', label: '基地名称' },
                { fieldId: pondField.id, label: pondField.name }
            ],
            sortOrder: [
                { priority: 1, virtual: 'base_name', direction: 'ASC' },
                { priority: 2, fieldId: pondField.id, direction: 'ASC' }
            ]
        },
        {
            key: 'base_fish_combo',
            label: '基地+鱼种组合',
            defaultEnabled: false,
            dimensions: [
                { virtual: 'base_name', label: '基地名称' },
                { fieldId: fishField.id, label: fishField.name }
            ],
            sortOrder: [
                { priority: 1, virtual: 'base_name', direction: 'ASC' },
                { priority: 2, fieldId: fishField.id, direction: 'ASC' }
            ]
        }
    ];

    const sharedMeta = {
        ownerRole: 'company_asset',
        virtualDimensions: [
            {
                key: 'base_name',
                label: '基地名称',
                source: 'bases.name',
                description: '通过 assets.base_id -> bases.name 自动映射'
            }
        ],
        groupingPresets: companyGroupingPresets,
        notes: [
            '数量（尾）=期初数量+转入数量-转出数量',
            '未勾选任何分组选项将不返回统计结果'
        ]
    };

    return [
        {
            name: '公司生物资产实时统计表',
            description: '按基地/池塘/鱼种多维度实时统计数量',
            config: {
                selectedForms: [initialForm.id, transferForm.id],
                selectedFields: [
                    { formId: initialForm.id, fieldId: pondField.id, fieldName: pondField.name },
                    { formId: initialForm.id, fieldId: fishField.id, fieldName: fishField.name }
                ],
                aggregations: [
                    { formId: initialForm.id, fieldId: initialQtyField.id, fieldName: initialQtyField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferInField.id, fieldName: transferInField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferOutField.id, fieldName: transferOutField.name, function: 'SUM' }
                ],
                calculations: [
                    {
                        name: '数量（尾）',
                        expression: `${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}`
                    }
                ],
                filters: {},
                meta: {
                    ...sharedMeta,
                    reportType: 'realtime',
                    groupingPresets: companyGroupingPresets
                }
            }
        },
        {
            name: '公司生物资产期末统计表',
            description: '按基地/池塘/鱼种统计期末数量、重量与价值',
            config: {
                selectedForms: [initialForm.id, transferForm.id, finalForm.id],
                selectedFields: [
                    { formId: initialForm.id, fieldId: pondField.id, fieldName: pondField.name },
                    { formId: initialForm.id, fieldId: fishField.id, fieldName: fishField.name }
                ],
                aggregations: [
                    { formId: initialForm.id, fieldId: initialQtyField.id, fieldName: initialQtyField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferInField.id, fieldName: transferInField.name, function: 'SUM' },
                    { formId: transferForm.id, fieldId: transferOutField.id, fieldName: transferOutField.name, function: 'SUM' },
                    { formId: finalForm.id, fieldId: lossField.id, fieldName: lossField.name, function: 'AVG' },
                    { formId: finalForm.id, fieldId: avgWeightField.id, fieldName: avgWeightField.name, function: 'AVG' },
                    { formId: finalForm.id, fieldId: planPriceField.id, fieldName: planPriceField.name, function: 'AVG' }
                ],
                calculations: [
                    {
                        name: '数量（尾）',
                        expression: `${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}`
                    },
                    {
                        name: '重量（kg）',
                        expression: `(${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}) * (1 - (${lossField.id} / 100)) * ${avgWeightField.id}`
                    },
                    {
                        name: '盘点确认总价值（元）',
                        expression: `(${initialQtyField.id} + ${transferInField.id} - ${transferOutField.id}) * (1 - (${lossField.id} / 100)) * ${avgWeightField.id} * ${planPriceField.id}`
                    }
                ],
                filters: {},
                meta: {
                    ...sharedMeta,
                    reportType: 'final',
                    aggregationModes: {
                        quantity: 'sum',
                        weight: 'calculated',
                        value: 'calculated',
                        planPrice: 'reference'
                    },
                    referenceFields: [{ fieldId: planPriceField.id, label: planPriceField.name }],
                    notes: [
                        ...sharedMeta.notes,
                        '计划单价字段为引用值，用于后续在前端直接展示'
                    ]
                }
            }
        }
    ];
}

function findField(form, fieldName) {
    const target = form.fields.find((field) => field.name === fieldName);
    if (!target) {
        throw new Error(`字段 "${fieldName}" 在表单 "${form.name}" 中不存在`);
    }
    return target;
}

main();

