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
    const adminId = addMockDoc('allAppUsers', { name: "管理员", role: "admin" });
    const subAccountId1 = addMockDoc('allAppUsers', { name: "子账号一号", role: "subaccount" });
    const subAccountId2 = addMockDoc('allAppUsers', { name: "子账号二号", role: "subaccount" });
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
    // 生成大量已提交记录的测试数据
    
    // Helper function to create asset record with submittedAt and fieldsSnapshot
    const createAssetRecord = (formId, formName, formFields, subAccountId, batchData, daysAgo = 0) => {
        const submittedAt = now - (daysAgo * 24 * 60 * 60 * 1000);
        return {
            formId,
            formName,
            subAccountId,
            submittedAt,
            fieldsSnapshot: formFields,
            batchData
        };
    };
    
    // 获取所有子账号ID数组
    const subAccountIds = [subAccountId1, subAccountId2, subAccountId3, subAccountId4, subAccountId5];
    
    // ========== 附表1：存货入出库管理台账 ==========
    const invForm = formMap["附表1：存货入出库管理台账"];
    const invFieldMap = invForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    // 为每个子账号生成多条记录
    for (let i = 0; i < 5; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 7 + (i % 7);
        
        const batchData = [];
        for (let j = 0; j < 3 + Math.floor(Math.random() * 4); j++) {
            const date = new Date(now - (daysAgo * 24 * 60 * 60 * 1000) - (j * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            const inQty = Math.floor(Math.random() * 200) + 50;
            const outQty = Math.floor(Math.random() * 100);
            const price = Math.floor(Math.random() * 50) + 30;
            const stock = Math.floor(Math.random() * 500) + 100;
            
            batchData.push({
                [invFieldMap["日期"]]: dateStr,
                [invFieldMap["摘要"]]: ["采购饲料", "使用饲料", "补充库存", "调拨入库", "销售出库", "损耗处理"][j % 6],
                [invFieldMap["入库数量"]]: inQty,
                [invFieldMap["出库数量"]]: outQty,
                [invFieldMap["单价"]]: price,
                [invFieldMap["结存数量"]]: stock,
                [invFieldMap["备注"]]: ["优质鱼饲料", "一号池塘", "二号池塘", "三号池塘", "四号池塘", "五号池塘"][j % 6]
            });
        }
        
        addMockDoc('assets', createAssetRecord(
            invForm.id, invForm.name, invForm.fields, subAccountId, batchData, daysAgo
        ));
    }

    // ========== 附表2：存货盘底表 ==========
    const countForm = formMap["附表2：存货盘底表"];
    const countFieldMap = countForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    const inventoryItems = ["鱼饲料", "鱼药", "增氧剂", "水质调节剂", "网具", "工具"];
    for (let i = 0; i < 8; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 10 + (i % 10);
        
        const batchData = [];
        for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
            const item = inventoryItems[j % inventoryItems.length];
            const bookQty = Math.floor(Math.random() * 300) + 100;
            const actualQty = bookQty + Math.floor(Math.random() * 20) - 10;
            const amount = bookQty * (Math.floor(Math.random() * 50) + 30);
            
            batchData.push({
                [countFieldMap["存货名称"]]: item,
                [countFieldMap["规格型号"]]: ["优质颗粒", "标准型", "加强型", "经济型", "专业型"][j % 5],
                [countFieldMap["账存数量"]]: bookQty,
                [countFieldMap["盘存数量"]]: actualQty,
                [countFieldMap["金额"]]: amount,
                [countFieldMap["差异原因"]]: actualQty === bookQty ? "无差异" : (actualQty > bookQty ? "盘盈" : "少量损耗")
            });
        }
        
        addMockDoc('assets', createAssetRecord(
            countForm.id, countForm.name, countForm.fields, subAccountId, batchData, daysAgo
        ));
    }

    // ========== 附表3：固定资产使用情况登记表 ==========
    const fixedUsageForm = formMap["附表3：固定资产使用情况登记表"];
    const fixedUsageFieldMap = fixedUsageForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    const fixedAssets = ["增氧机", "水泵", "投料机", "网箱", "渔船", "检测设备"];
    for (let i = 0; i < 10; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 15 + (i % 15);
        
        const asset = fixedAssets[i % fixedAssets.length];
        const purchaseDate = new Date(now - (365 + daysAgo) * 24 * 60 * 60 * 1000);
        const addQty = Math.floor(Math.random() * 5) + 1;
        const addAmount = addQty * (Math.floor(Math.random() * 5000) + 2000);
        const reduceQty = Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0;
        const reduceAmount = reduceQty * (Math.floor(Math.random() * 2000) + 500);
        
        addMockDoc('assets', createAssetRecord(
            fixedUsageForm.id, fixedUsageForm.name, fixedUsageForm.fields, subAccountId,
            [{
                [fixedUsageFieldMap["资产名称"]]: asset,
                [fixedUsageFieldMap["品牌型号"]]: ["XY-2000", "WP-1500", "TL-3000", "WX-500", "YC-800", "JC-1000"][i % 6],
                [fixedUsageFieldMap["购置时间"]]: purchaseDate.toISOString().split('T')[0],
                [fixedUsageFieldMap["计量单位"]]: ["台", "艘", "套", "个"][i % 4],
                [fixedUsageFieldMap["增加数量"]]: addQty,
                [fixedUsageFieldMap["增加金额"]]: addAmount,
                [fixedUsageFieldMap["使用人"]]: ["技术员小李", "维修工老王", "操作员小张", "管理员小刘", "技术员小王"][i % 5],
                [fixedUsageFieldMap["减少日期"]]: reduceQty > 0 ? new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
                [fixedUsageFieldMap["减少数量"]]: reduceQty,
                [fixedUsageFieldMap["减少金额"]]: reduceAmount,
                [fixedUsageFieldMap["减少原因"]]: reduceQty > 0 ? "报废处理" : "",
                [fixedUsageFieldMap["备注"]]: ["运行良好", "正常使用", "需要维护", "性能稳定", "新购置"][i % 5]
            }],
            daysAgo
        ));
    }

    // ========== 附表4：固定资产盘底表 ==========
    const fixedCountForm = formMap["附表4：固定资产盘底表"];
    const fixedCountFieldMap = fixedCountForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    for (let i = 0; i < 8; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 12 + (i % 12);
        
        const batchData = [];
        for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
            const bookQty = Math.floor(Math.random() * 10) + 1;
            const actualQty = bookQty + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0);
            const originalValue = bookQty * (Math.floor(Math.random() * 5000) + 2000);
            
            batchData.push({
                [fixedCountFieldMap["资产编号"]]: `FA${String(i * 10 + j).padStart(3, '0')}`,
                [fixedCountFieldMap["资产名称"]]: ["水泵", "增氧机", "投料机", "网箱", "渔船"][j % 5],
                [fixedCountFieldMap["品牌型号"]]: ["WP-1500", "XY-2000", "TL-3000", "WX-500", "YC-800"][j % 5],
                [fixedCountFieldMap["单位"]]: ["台", "艘", "套"][j % 3],
                [fixedCountFieldMap["账存数量"]]: bookQty,
                [fixedCountFieldMap["原值"]]: originalValue,
                [fixedCountFieldMap["使用人"]]: ["技术员小李", "维修工老王", "操作员小张", "管理员小刘"][j % 4],
                [fixedCountFieldMap["盘存数量"]]: actualQty,
                [fixedCountFieldMap["差异原因"]]: actualQty === bookQty ? "无差异" : (actualQty > bookQty ? "盘盈" : "盘亏")
            });
        }
        
        addMockDoc('assets', createAssetRecord(
            fixedCountForm.id, fixedCountForm.name, fixedCountForm.fields, subAccountId, batchData, daysAgo
        ));
    }

    // ========== 附表5：固定资产处置表 ==========
    const disposalForm = formMap["附表5：固定资产处置表"];
    const disposalFieldMap = disposalForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    for (let i = 0; i < 6; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 20 + (i % 20);
        
        const qty = Math.floor(Math.random() * 10) + 1;
        const originalValue = qty * (Math.floor(Math.random() * 3000) + 1000);
        const netValue = Math.floor(originalValue * (0.1 + Math.random() * 0.3));
        
        addMockDoc('assets', createAssetRecord(
            disposalForm.id, disposalForm.name, disposalForm.fields, subAccountId,
            [{
                [disposalFieldMap["资产编号"]]: `FA-D${String(i).padStart(3, '0')}`,
                [disposalFieldMap["资产名称"]]: ["旧渔网", "报废设备", "损坏工具", "过期设备", "淘汰机械"][i % 5],
                [disposalFieldMap["数量"]]: qty,
                [disposalFieldMap["原值"]]: originalValue,
                [disposalFieldMap["净值"]]: netValue,
                [disposalFieldMap["处置情况说明"]]: ["使用年限已到，报废处理", "损坏无法修复", "技术淘汰", "更新换代", "正常报废"][i % 5]
            }],
            daysAgo
        ));
    }

    // ========== 附表6：低值易耗品管理台账 ==========
    const lowValueForm = formMap["附表6：低值易耗品管理台账"];
    const lowValueFieldMap = lowValueForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    for (let i = 0; i < 10; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 8 + (i % 8);
        
        const purchaseAmount = Math.floor(Math.random() * 3000) + 500;
        const reduceAmount = Math.floor(purchaseAmount * (0.1 + Math.random() * 0.3));
        const stockQty = Math.floor(Math.random() * 100) + 20;
        
        addMockDoc('assets', createAssetRecord(
            lowValueForm.id, lowValueForm.name, lowValueForm.fields, subAccountId,
            [{
                [lowValueFieldMap["购置金额"]]: purchaseAmount,
                [lowValueFieldMap["减少金额"]]: reduceAmount,
                [lowValueFieldMap["现存数量"]]: stockQty,
                [lowValueFieldMap["原因"]]: ["工具损耗", "正常使用", "损坏更换", "过期处理", "调拨"][i % 5]
            }],
            daysAgo
        ));
    }

    // ========== 附表7：低值易耗品盘底表 ==========
    const lowValueCountForm = formMap["附表7：低值易耗品盘底表"];
    const lowValueCountFieldMap = lowValueCountForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    const lowValueItems = ["手套", "工作服", "安全帽", "工具", "清洁用品", "办公用品"];
    for (let i = 0; i < 8; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 11 + (i % 11);
        
        const batchData = [];
        for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
            const item = lowValueItems[j % lowValueItems.length];
            const bookQty = Math.floor(Math.random() * 200) + 50;
            const actualQty = bookQty + Math.floor(Math.random() * 10) - 5;
            const amount = bookQty * (Math.floor(Math.random() * 20) + 5);
            
            batchData.push({
                [lowValueCountFieldMap["低值易耗品名称"]]: item,
                [lowValueCountFieldMap["规格型号"]]: ["标准型", "加强型", "经济型", "专业型"][j % 4],
                [lowValueCountFieldMap["单位"]]: ["双", "件", "个", "套"][j % 4],
                [lowValueCountFieldMap["金额"]]: amount,
                [lowValueCountFieldMap["账存数量"]]: bookQty,
                [lowValueCountFieldMap["盘存数量"]]: actualQty,
                [lowValueCountFieldMap["差异原因"]]: actualQty === bookQty ? "无差异" : (actualQty > bookQty ? "盘盈" : "正常损耗")
            });
        }
        
        addMockDoc('assets', createAssetRecord(
            lowValueCountForm.id, lowValueCountForm.name, lowValueCountForm.fields, subAccountId, batchData, daysAgo
        ));
    }

    // ========== 附表8：生物资产管理台账 ==========
    const bioForm = formMap["附表8：生物资产管理台账"];
    const bioFieldMap = bioForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    const fishTypes = ["草鱼", "鲤鱼", "鲫鱼", "鲢鱼", "鳙鱼", "青鱼"];
    for (let i = 0; i < 12; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 6 + (i % 6);
        
        const fishType = fishTypes[i % fishTypes.length];
        const releaseDate = new Date(now - (daysAgo + 30) * 24 * 60 * 60 * 1000);
        const inWeight = Math.floor(Math.random() * 1000) + 200;
        const outWeight = Math.random() > 0.6 ? Math.floor(Math.random() * 300) : 0;
        const endWeight = inWeight - outWeight + Math.floor(Math.random() * 200) - 50;
        
        addMockDoc('assets', createAssetRecord(
            bioForm.id, bioForm.name, bioForm.fields, subAccountId,
            [{
                [bioFieldMap["投放日期"]]: releaseDate.toISOString().split('T')[0],
                [bioFieldMap["鱼类品种"]]: fishType,
                [bioFieldMap["转入重量 (kg)"]]: inWeight,
                [bioFieldMap["转出重量 (kg)"]]: outWeight,
                [bioFieldMap["期末盘点重量 (kg)"]]: endWeight,
                [bioFieldMap["备注"]]: ["生长良好", "健康活跃", "正常生长", "需要关注", "状态良好"][i % 5]
            }],
            daysAgo
        ));
    }

    // ========== 附表9：生物资产盘点审核统计表 ==========
    const bioCountForm = formMap["附表9：生物资产盘点审核统计表"];
    const bioCountFieldMap = bioCountForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    
    for (let i = 0; i < 10; i++) {
        const subAccountId = subAccountIds[i % subAccountIds.length];
        const daysAgo = Math.floor(i / subAccountIds.length) * 9 + (i % 9);
        
        const batchData = [];
        for (let j = 0; j < 2 + Math.floor(Math.random() * 4); j++) {
            const pondNum = `P${String(i * 10 + j).padStart(2, '0')}`;
            const fishType = fishTypes[j % fishTypes.length];
            const qty = Math.floor(Math.random() * 2000) + 500;
            const price = Math.floor(Math.random() * 20) + 10;
            const countDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
            
            batchData.push({
                [bioCountFieldMap["投放池塘编号"]]: pondNum,
                [bioCountFieldMap["鱼类品种"]]: fishType,
                [bioCountFieldMap["规格"]]: ["0.5kg/条", "0.3kg/条", "0.8kg/条", "1.0kg/条", "0.2kg/条"][j % 5],
                [bioCountFieldMap["数量"]]: qty,
                [bioCountFieldMap["单价 (元/公斤)"]]: price,
                [bioCountFieldMap["盘点日期"]]: countDate.toISOString().split('T')[0],
                [bioCountFieldMap["备注"]]: ["健康活跃", "生长良好", "状态正常", "需要关注", "表现优秀"][j % 5]
            });
        }
        
        addMockDoc('assets', createAssetRecord(
            bioCountForm.id, bioCountForm.name, bioCountForm.fields, subAccountId, batchData, daysAgo
        ));
    }

    console.log(`模拟资产记录已添加，共 ${mockCollections.assets.length} 条记录`);
    
    return mockCollections;
}