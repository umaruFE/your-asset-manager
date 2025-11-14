import { generateId } from '../utils/helpers';

// --- 模拟数据创建 (更新为 Form 结构, 增加更多表格) ---
export function createMockDataWithForms() {
    const now = Date.now();
    const mockCollections = {
        allAppUsers: [],
        forms: [], 
        files: [],
        assets: [], 
    };
    
    // Helper to add data to a collection and return the ID
    const addMockDoc = (collectionName, data) => {
        const id = generateId();
        const doc = { id, ...data };
        mockCollections[collectionName].push(doc);
        return id;
    };
    
    // 1. 创建模拟用户 (User creation remains the same)
    const superAdminId = addMockDoc('allAppUsers', { name: "超级管理员", role: "superadmin" });
    const adminId = addMockDoc('allAppUsers', { name: "管理员 (张三)", role: "admin" });
    const subAccountId1 = addMockDoc('allAppUsers', { name: "子账号一号 (李四)", role: "subaccount" });
    const subAccountId2 = addMockDoc('allAppUsers', { name: "子账号二号 (王五)", role: "subaccount" });
    const subAccountId3 = addMockDoc('allAppUsers', { name: "子账号三号", role: "subaccount" });
    const subAccountId4 = addMockDoc('allAppUsers', { name: "子账号四号", role: "subaccount" });
    const subAccountId5 = addMockDoc('allAppUsers', { name: "子账号五号", role: "subaccount" });
    
    console.log("模拟用户已添加");
    
    // --- 2. 创建表单模板和字段 (Based on CSV file names) ---
    const formsData = [];

    // Form 1: 附表1：存货入出库管理台账
    const f1Fields = [
        { id: generateId(), name: "日期", type: "date", active: true },
        { id: generateId(), name: "摘要", type: "text", active: true },
        { id: generateId(), name: "入库数量", type: "number", active: true },
        { id: generateId(), name: "出库数量", type: "number", active: true },
        { id: generateId(), name: "单价", type: "number", active: true },
        // Formula: 入库金额 = 入库数量 * 单价
        { id: generateId(), name: "入库金额", type: "formula", active: true, formula: "入库数量 * 单价" },
        { id: generateId(), name: "结存数量", type: "number", active: true },
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表1：存货入出库管理台账", isActive: true, fields: f1Fields });

    // Form 2: 附表2：存货盘底表 (已存在)
    const f2Fields = [
        { id: generateId(), name: "存货名称", type: "text", active: true },
        { id: generateId(), name: "规格型号", type: "text", active: true },
        { id: generateId(), name: "账存数量", type: "number", active: true },
        { id: generateId(), name: "盘存数量", type: "number", active: true },
        // Formula: 差异 = 盘存数量 - 账存数量
        { id: generateId(), name: "差异", type: "formula", active: true, formula: "盘存数量 - 账存数量" },
        { id: generateId(), name: "金额", type: "number", active: true },
        { id: generateId(), name: "差异原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表2：存货盘底表", isActive: true, fields: f2Fields });
    
    // --- NEW Form 3: 附表3 固定资产使用情况登记表 ---
    const f3Fields = [
        { id: generateId(), name: "资产名称", type: "text", active: true },
        { id: generateId(), name: "品牌型号", type: "text", active: true },
        { id: generateId(), name: "购置时间", type: "date", active: true },
        { id: generateId(), name: "计量单位", type: "text", active: true },
        { id: generateId(), name: "增加数量", type: "number", active: true },
        { id: generateId(), name: "增加金额", type: "number", active: true },
        { id: generateId(), name: "使用人", type: "text", active: true },
        { id: generateId(), name: "减少日期", type: "date", active: true },
        { id: generateId(), name: "减少数量", type: "number", active: true },
        { id: generateId(), name: "减少金额", type: "number", active: true },
        { id: generateId(), name: "减少原因", type: "textarea", active: true },
        // Formula: 基地现存数量 = 增加数量 - 减少数量
        { id: generateId(), name: "基地现存数量", type: "formula", active: true, formula: "增加数量 - 减少数量" },
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表3：固定资产使用情况登记表", isActive: true, fields: f3Fields });

    // --- NEW Form 4: 附表4 固定资产盘底表 ---
    const f4Fields = [
        { id: generateId(), name: "资产编号", type: "text", active: true },
        { id: generateId(), name: "资产名称", type: "text", active: true },
        { id: generateId(), name: "品牌型号", type: "text", active: true },
        { id: generateId(), name: "单位", type: "text", active: true },
        { id: generateId(), name: "账存数量", type: "number", active: true },
        { id: generateId(), name: "原值", type: "number", active: true },
        { id: generateId(), name: "使用人", type: "text", active: true },
        { id: generateId(), name: "盘存数量", type: "number", active: true },
        // Formula: 差异 = 盘存数量 - 账存数量
        { id: generateId(), name: "差异", type: "formula", active: true, formula: "盘存数量 - 账存数量" },
        { id: generateId(), name: "差异原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表4：固定资产盘底表", isActive: true, fields: f4Fields });

    // Form 5: 附表5：固定资产处置表 (已存在)
    const f5Fields = [
        { id: generateId(), name: "资产编号", type: "text", active: true },
        { id: generateId(), name: "资产名称", type: "text", active: true },
        { id: generateId(), name: "数量", type: "number", active: true },
        { id: generateId(), name: "原值", type: "number", active: true },
        { id: generateId(), name: "净值", type: "number", active: true },
        { id: generateId(), name: "处置情况说明", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表5：固定资产处置表", isActive: true, fields: f5Fields });

    // Form 6: 附表6：低值易耗品管理台账 (已存在)
    const f6Fields = [
        { id: generateId(), name: "购置金额", type: "number", active: true },
        { id: generateId(), name: "减少金额", type: "number", active: true },
        { id: generateId(), name: "现存数量", type: "number", active: true },
        // Formula: 现存价值 = 购置金额 - 减少金额
        { id: generateId(), name: "现存价值", type: "formula", active: true, formula: "购置金额 - 减少金额" }, 
        { id: generateId(), name: "原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表6：低值易耗品管理台账", isActive: true, fields: f6Fields });

    // --- NEW Form 7: 附表7 低值易耗品盘底表 ---
    const f7Fields = [
        { id: generateId(), name: "低值易耗品名称", type: "text", active: true },
        { id: generateId(), name: "规格型号", type: "text", active: true },
        { id: generateId(), name: "单位", type: "text", active: true },
        { id: generateId(), name: "金额", type: "number", active: true },
        { id: generateId(), name: "账存数量", type: "number", active: true },
        { id: generateId(), name: "盘存数量", type: "number", active: true },
        // Formula: 差异 = 盘存数量 - 账存数量
        { id: generateId(), name: "差异", type: "formula", active: true, formula: "盘存数量 - 账存数量" },
        { id: generateId(), name: "差异原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表7：低值易耗品盘底表", isActive: true, fields: f7Fields });

    // Form 8: 附表8：生物资产管理台账 (已存在)
    const f8Fields = [
        { id: generateId(), name: "投放日期", type: "date", active: true },
        { id: generateId(), name: "鱼类品种", type: "text", active: true },
        { id: generateId(), name: "转入重量 (kg)", type: "number", active: true },
        { id: generateId(), name: "转出重量 (kg)", type: "number", active: true },
        { id: generateId(), name: "期末盘点重量 (kg)", type: "number", active: true },
        // Formula: 结存净重 (kg) = 转入重量 (kg) - 转出重量 (kg) + 期末盘点重量 (kg)
        { id: generateId(), name: "结存净重 (kg)", type: "formula", active: true, formula: "转入重量 (kg) - 转出重量 (kg) + 期末盘点重量 (kg)" }, 
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表8：生物资产管理台账", isActive: true, fields: f8Fields });

    // Form 9: 附表9：生物资产盘点审核统计表 (已存在)
    const f9Fields = [
        { id: generateId(), name: "投放池塘编号", type: "text", active: true },
        { id: generateId(), name: "鱼类品种", type: "text", active: true },
        { id: generateId(), name: "规格", type: "text", active: true },
        { id: generateId(), name: "数量", type: "number", active: true },
        { id: generateId(), name: "单价 (元/公斤)", type: "number", active: true },
        // Formula: 总价值 = 数量 * 单价 (元/公斤) / 1000 
        { id: generateId(), name: "总价值", type: "formula", active: true, formula: "数量 * 单价 (元/公斤) / 1000" }, 
        { id: generateId(), name: "盘点日期", type: "date", active: true },
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表9：生物资产盘点审核统计表", isActive: true, fields: f9Fields });
    
    
    // Save Form Templates
    const formMap = {};
    formsData.forEach(formData => {
        const id = addMockDoc('forms', formData);
        formMap[formData.name] = { id, fields: formData.fields };
    });
    console.log("模拟表单已添加");

    // --- 3. 创建模拟文件 (Files remain the same) ---
    // 简化: 直接使用已声明的ID变量
    addMockDoc('files', {
        fileName: "鱼苗养殖标准手册.pdf",
        url: "https://example.com/manual.pdf",
        uploadedBy: adminId,
        uploadedAt: now,
        allowedSubAccounts: [subAccountId1, subAccountId2, subAccountId3]
    });
    
    addMockDoc('files', {
        fileName: "水质检测报告-2024-Q4.docx",
        url: "https://example.com/report.docx",
        uploadedBy: adminId,
        uploadedAt: now,
        allowedSubAccounts: [subAccountId1, subAccountId4]
    });
    console.log("模拟文件已添加");

    // --- 4. 创建模拟资产记录 (Assets now link to formId) ---
    
    // Record 1: Inventory Ledger data (Form 1) - SubAccount 1 (2 records)
    const invForm = formMap["附表1：存货入出库管理台账"];
    const invFieldMap = invForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: invForm.id, 
        formName: invForm.name,
        subAccountId: subAccountId1,
        batchData: [
            { [invFieldMap["日期"]]: "2024-01-15", [invFieldMap["摘要"]]: "采购饲料", [invFieldMap["入库数量"]]: 100, [invFieldMap["出库数量"]]: 0, [invFieldMap["单价"]]: 50, [invFieldMap["结存数量"]]: 100, [invFieldMap["备注"]]: "优质鱼饲料" },
            { [invFieldMap["日期"]]: "2024-01-20", [invFieldMap["摘要"]]: "使用饲料", [invFieldMap["入库数量"]]: 0, [invFieldMap["出库数量"]]: 30, [invFieldMap["单价"]]: 50, [invFieldMap["结存数量"]]: 70, [invFieldMap["备注"]]: "一号池塘" }
        ]
    });

    // Record 2: Inventory Count data (Form 2) - SubAccount 2 (1 record)
    const countForm = formMap["附表2：存货盘底表"];
    const countFieldMap = countForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: countForm.id,
        formName: countForm.name,
        subAccountId: subAccountId2,
        batchData: [
            { [countFieldMap["存货名称"]]: "鱼饲料", [countFieldMap["规格型号"]]: "优质颗粒", [countFieldMap["账存数量"]]: 200, [countFieldMap["盘存数量"]]: 195, [countFieldMap["金额"]]: 10000, [countFieldMap["差异原因"]]: "少量损耗" }
        ]
    });

    // Record 3: Fixed Asset Usage data (Form 3) - SubAccount 3 (1 record)
    const fixedUsageForm = formMap["附表3：固定资产使用情况登记表"];
    const fixedUsageFieldMap = fixedUsageForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: fixedUsageForm.id,
        formName: fixedUsageForm.name,
        subAccountId: subAccountId3,
        batchData: [
            { [fixedUsageFieldMap["资产名称"]]: "增氧机", [fixedUsageFieldMap["品牌型号"]]: "XY-2000", [fixedUsageFieldMap["购置时间"]]: "2023-06-01", [fixedUsageFieldMap["计量单位"]]: "台", [fixedUsageFieldMap["增加数量"]]: 2, [fixedUsageFieldMap["增加金额"]]: 8000, [fixedUsageFieldMap["使用人"]]: "技术员小李", [fixedUsageFieldMap["基地现存数量"]]: 2, [fixedUsageFieldMap["备注"]]: "运行良好" }
        ]
    });

    // Record 4: Fixed Asset Count data (Form 4) - SubAccount 4 (1 record)
    const fixedCountForm = formMap["附表4：固定资产盘底表"];
    const fixedCountFieldMap = fixedCountForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: fixedCountForm.id,
        formName: fixedCountForm.name,
        subAccountId: subAccountId4,
        batchData: [
            { [fixedCountFieldMap["资产编号"]]: "FA001", [fixedCountFieldMap["资产名称"]]: "水泵", [fixedCountFieldMap["品牌型号"]]: "WP-1500", [fixedCountFieldMap["单位"]]: "台", [fixedCountFieldMap["账存数量"]]: 3, [fixedCountFieldMap["原值"]]: 6000, [fixedCountFieldMap["使用人"]]: "维修工老王", [fixedCountFieldMap["盘存数量"]]: 3, [fixedCountFieldMap["差异原因"]]: "无差异" }
        ]
    });

    // Record 5: Fixed Asset Disposal data (Form 5) - SubAccount 5 (1 record)
    const disposalForm = formMap["附表5：固定资产处置表"];
    const disposalFieldMap = disposalForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: disposalForm.id,
        formName: disposalForm.name,
        subAccountId: subAccountId5,
        batchData: [
            { [disposalFieldMap["资产编号"]]: "FA002", [disposalFieldMap["资产名称"]]: "旧渔网", [disposalFieldMap["数量"]]: 10, [disposalFieldMap["原值"]]: 2000, [disposalFieldMap["净值"]]: 500, [disposalFieldMap["处置情况说明"]]: "使用年限已到，报废处理" }
        ]
    });

    // Record 6: Low Value Asset Management data (Form 6) - SubAccount 1 (1 record)
    const lowValueForm = formMap["附表6：低值易耗品管理台账"];
    const lowValueFieldMap = lowValueForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: lowValueForm.id,
        formName: lowValueForm.name,
        subAccountId: subAccountId1,
        batchData: [
            { [lowValueFieldMap["购置金额"]]: 1500, [lowValueFieldMap["减少金额"]]: 200, [lowValueFieldMap["现存数量"]]: 50, [lowValueFieldMap["原因"]]: "工具损耗" }
        ]
    });

    // Record 7: Low Value Asset Count data (Form 7) - SubAccount 2 (1 record)
    const lowValueCountForm = formMap["附表7：低值易耗品盘底表"];
    const lowValueCountFieldMap = lowValueCountForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: lowValueCountForm.id,
        formName: lowValueCountForm.name,
        subAccountId: subAccountId2,
        batchData: [
            { [lowValueCountFieldMap["低值易耗品名称"]]: "手套", [lowValueCountFieldMap["规格型号"]]: "橡胶防水", [lowValueCountFieldMap["单位"]]: "双", [lowValueCountFieldMap["金额"]]: 100, [lowValueCountFieldMap["账存数量"]]: 100, [lowValueCountFieldMap["盘存数量"]]: 95, [lowValueCountFieldMap["差异原因"]]: "正常损耗" }
        ]
    });

    // Record 8: Biological Asset Management data (Form 8) - SubAccount 3 (1 record)
    const bioForm = formMap["附表8：生物资产管理台账"];
    const bioFieldMap = bioForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: bioForm.id,
        formName: bioForm.name,
        subAccountId: subAccountId3,
        batchData: [
            { [bioFieldMap["投放日期"]]: "2024-03-01", [bioFieldMap["鱼类品种"]]: "草鱼", [bioFieldMap["转入重量 (kg)"]]: 500, [bioFieldMap["转出重量 (kg)"]]: 0, [bioFieldMap["期末盘点重量 (kg)"]]: 520, [bioFieldMap["备注"]]: "生长良好" }
        ]
    });

    // Record 9: Biological Asset Count data (Form 9) - SubAccount 4 (1 record)
    const bioCountForm = formMap["附表9：生物资产盘点审核统计表"];
    const bioCountFieldMap = bioCountForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: bioCountForm.id,
        formName: bioCountForm.name,
        subAccountId: subAccountId4,
        batchData: [
            { [bioCountFieldMap["投放池塘编号"]]: "P01", [bioCountFieldMap["鱼类品种"]]: "鲤鱼", [bioCountFieldMap["规格"]]: "0.5kg/条", [bioCountFieldMap["数量"]]: 1000, [bioCountFieldMap["单价 (元/公斤)"]]: 16, [bioCountFieldMap["盘点日期"]]: "2024-11-01", [bioCountFieldMap["备注"]]: "健康活跃" }
        ]
    });

    console.log("模拟资产记录已添加");
    
    return mockCollections;
}