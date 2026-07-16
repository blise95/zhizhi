/**
 * 卷包过程质量数智管控一体化平台 - 前端主逻辑
 * jQuery + Plotly.js 交互与图表渲染
 * 支持侧边导航多视图切换
 */

var LAYOUT_FONT = {
    family: '-apple-system, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
    size: 13,
    color: '#1d1d1f'
};

// ==================== 缺陷目录缓存 ====================
var DEFECT_CATALOG = {};
var ROW_COUNTER = {case:0, carton:0, boxSmall:0, cigarette:0};

// ==================== 视图渲染状态跟踪 ====================
var VIEW_RENDERED = {};

// ==================== 页面初始化 ====================
$(function () {
    var today = new Date().toISOString().split('T')[0];
    $('#inp_date').val(today);
    initUserInfo();
    initNavigation();
    loadDefectCatalog(function() {
        switchView('view-entry'); // 默认显示数据录入
    });
    $('#btn_submit').on('click', submitData);
    // 日期筛选按钮事件
    $('#btn_filter').on('click', function() {
        var startDate = $('#filter_start').val();
        var endDate = $('#filter_end').val();
        var brand = $('#filter_brand').val();
        var partnerSite = $('#filter_partner').val();
        var shift = $('#filter_shift').val();
        var team = $('#filter_team').val();
        if (startDate && endDate) {
            loadTable(startDate, endDate, brand, partnerSite, shift, team);
        } else {
            alert('请选择起始日期和结束日期');
        }
    });
    $('#btn_filter_clear').on('click', function() {
        $('#filter_start').val('');
        $('#filter_end').val('');
        $('#filter_brand').val('');
        $('#filter_partner').val('');
        $('#filter_shift').val('');
        $('#filter_team').val('');
        loadTable();
    });
    // 综合质量汇总分析时间预设按钮
    $('.time-preset').on('click', function() {
        var preset = $(this).data('preset');
        applyTimePreset(preset);
        doSummaryQuery();
    });
    // 综合质量汇总分析筛选按钮事件
    $('#btn_defect_filter').on('click', function() {
        doSummaryQuery();
    });
    $('#btn_defect_filter_clear').on('click', function() {
        $('#defect_filter_partner').val('');
        $('#defect_filter_brand').val('');
        $('#defect_filter_shift').val('');
        $('#defect_filter_team').val('');
        $('#defect_filter_machine').val('');
        applyTimePreset('month');
        doSummaryQuery();
    });
    // 烟支物测指标分析筛选按钮事件
    $('#btn_spc_filter').on('click', function() {
        var startDate = $('#spc_filter_start').val();
        var endDate = $('#spc_filter_end').val();
        var brand = $('#spc_filter_brand').val();
        var partnerSite = $('#spc_filter_partner').val();
        var shift = $('#spc_filter_shift').val();
        var team = $('#spc_filter_team').val();
        loadSPC(startDate, endDate, brand, partnerSite, shift, team);
    });
    $('#btn_spc_filter_clear').on('click', function() {
        $('#spc_filter_start').val('');
        $('#spc_filter_end').val('');
        $('#spc_filter_brand').val('');
        $('#spc_filter_partner').val('');
        $('#spc_filter_shift').val('');
        $('#spc_filter_team').val('');
        loadSPC();
    });
    // 箱装外观缺陷分析日期筛选按钮事件
    $('#btn_case_filter').on('click', function() {
        var startDate = $('#case_filter_start').val();
        var endDate = $('#case_filter_end').val();
        var brand = $('#case_filter_brand').val();
        var partnerSite = $('#case_filter_partner').val();
        var shift = $('#case_filter_shift').val();
        var team = $('#case_filter_team').val();
        if (!startDate || !endDate) {
            alert('请选择起始日期和结束日期');
            return;
        }
        // 校验最多7天
        var diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        if (diff < 0) {
            alert('结束日期不能早于起始日期');
            return;
        }
        if (diff > 6) {
            alert('最多只能查询7天数据，请调整日期范围');
            return;
        }
        loadCaseDefect(startDate, endDate, brand, partnerSite, shift, team);
    });
    $('#btn_case_filter_clear').on('click', function() {
        $('#case_filter_start').val('');
        $('#case_filter_end').val('');
        $('#case_filter_brand').val('');
        $('#case_filter_partner').val('');
        $('#case_filter_shift').val('');
        $('#case_filter_team').val('');
        $('#caseDefectContainer').html('<p class="empty-hint">请选择日期范围后点击查询</p>');
    });
    // 条装外观缺陷分析日期筛选按钮事件
    $('#btn_carton_filter').on('click', function() {
        var startDate = $('#carton_filter_start').val();
        var endDate = $('#carton_filter_end').val();
        var brand = $('#carton_filter_brand').val();
        var partnerSite = $('#carton_filter_partner').val();
        var shift = $('#carton_filter_shift').val();
        var team = $('#carton_filter_team').val();
        if (!startDate || !endDate) {
            alert('请选择起始日期和结束日期');
            return;
        }
        var diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        if (diff < 0) {
            alert('结束日期不能早于起始日期');
            return;
        }
        if (diff > 6) {
            alert('最多只能查询7天数据，请调整日期范围');
            return;
        }
        loadCartonDefect(startDate, endDate, brand, partnerSite, shift, team);
    });
    $('#btn_carton_filter_clear').on('click', function() {
        $('#carton_filter_start').val('');
        $('#carton_filter_end').val('');
        $('#carton_filter_brand').val('');
        $('#carton_filter_partner').val('');
        $('#carton_filter_shift').val('');
        $('#carton_filter_team').val('');
        $('#cartonDefectContainer').html('<p class="empty-hint">请选择日期范围后点击查询</p>');
    });
    // 盒装外观缺陷分析日期筛选按钮事件
    $('#btn_box_filter').on('click', function() {
        var startDate = $('#box_filter_start').val();
        var endDate = $('#box_filter_end').val();
        var brand = $('#box_filter_brand').val();
        var partnerSite = $('#box_filter_partner').val();
        var shift = $('#box_filter_shift').val();
        var team = $('#box_filter_team').val();
        if (!startDate || !endDate) {
            alert('请选择起始日期和结束日期');
            return;
        }
        var diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        if (diff < 0) {
            alert('结束日期不能早于起始日期');
            return;
        }
        if (diff > 6) {
            alert('最多只能查询7天数据，请调整日期范围');
            return;
        }
        loadBoxDefect(startDate, endDate, brand, partnerSite, shift, team);
    });
    $('#btn_box_filter_clear').on('click', function() {
        $('#box_filter_start').val('');
        $('#box_filter_end').val('');
        $('#box_filter_brand').val('');
        $('#box_filter_partner').val('');
        $('#box_filter_shift').val('');
        $('#box_filter_team').val('');
        $('#boxDefectContainer').html('<p class="empty-hint">请选择日期范围后点击查询</p>');
    });
    // 烟支外观缺陷分析日期筛选按钮事件
    $('#btn_cig_filter').on('click', function() {
        var startDate = $('#cig_filter_start').val();
        var endDate = $('#cig_filter_end').val();
        var brand = $('#cig_filter_brand').val();
        var partnerSite = $('#cig_filter_partner').val();
        var shift = $('#cig_filter_shift').val();
        var team = $('#cig_filter_team').val();
        if (!startDate || !endDate) {
            alert('请选择起始日期和结束日期');
            return;
        }
        var diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        if (diff < 0) {
            alert('结束日期不能早于起始日期');
            return;
        }
        if (diff > 6) {
            alert('最多只能查询7天数据，请调整日期范围');
            return;
        }
        loadCigDefect(startDate, endDate, brand, partnerSite, shift, team);
    });
    $('#btn_cig_filter_clear').on('click', function() {
        $('#cig_filter_start').val('');
        $('#cig_filter_end').val('');
        $('#cig_filter_brand').val('');
        $('#cig_filter_partner').val('');
        $('#cig_filter_shift').val('');
        $('#cig_filter_team').val('');
        $('#cigDefectContainer').html('<p class="empty-hint">请选择日期范围后点击查询</p>');
    });
});

// ==================== 用户信息 ====================
function initUserInfo() {
    var raw = sessionStorage.getItem('qa_user');
    if (!raw) return;
    var user = JSON.parse(raw);
    $('#sidebarUserName').text(user.name);
    $('#sidebarUserRole').text(user.role);
}

// ==================== 退出登录 ====================
function logout() {
    sessionStorage.removeItem('qa_user');
    location.replace('/zhiliang/login.html');
}

// ==================== 导航切换 ====================
function initNavigation() {
    $('.sidebar-nav-item').on('click', function() {
        var viewId = $(this).data('view');
        switchView(viewId);
    });
}

function switchView(viewId) {
    // 更新侧边栏激活态
    $('.sidebar-nav-item').removeClass('active');
    $('.sidebar-nav-item[data-view="' + viewId + '"]').addClass('active');

    // 切换视图面板
    $('.view-panel').removeClass('active');
    $('#' + viewId).addClass('active');

    // 按需渲染视图
    if (!VIEW_RENDERED[viewId]) {
        renderView(viewId);
        VIEW_RENDERED[viewId] = true;
    } else {
        // 已渲染过的视图需要resize图表
        resizeChartsInView(viewId);
    }
}

function renderView(viewId) {
    switch (viewId) {
        case 'view-entry':
            // 数据录入视图无需额外渲染
            loadBanner();
            break;
        case 'view-table':
            loadBanner();
            loadTable();
            break;
        case 'view-spc':
            loadBanner();
            loadSPC();
            break;
        case 'view-defect':
            loadBanner();
            applyTimePreset('month');
            doSummaryQuery();
            break;
        case 'view-predict':
            loadBanner();
            loadPredict();
            break;
        case 'view-case-defect':
            loadBanner();
            // 首次自动加载当天数据
            var today = new Date().toISOString().split('T')[0];
            loadCaseDefect(today, today);
            break;
        case 'view-carton-defect':
            loadBanner();
            var today2 = new Date().toISOString().split('T')[0];
            loadCartonDefect(today2, today2);
            break;
        case 'view-box-defect':
            loadBanner();
            var today3 = new Date().toISOString().split('T')[0];
            loadBoxDefect(today3, today3);
            break;
        case 'view-cig-defect':
            loadBanner();
            var today4 = new Date().toISOString().split('T')[0];
            loadCigDefect(today4, today4);
            break;
    }
}

function resizeChartsInView(viewId) {
    // 延迟resize确保DOM已显示
    setTimeout(function() {
        switch (viewId) {
            case 'view-spc':
                Plotly.Plots.resize('spcChart');
                break;
            case 'view-defect':
                Plotly.Plots.resize('defectPieChart');
                Plotly.Plots.resize('summaryPartnerChart');
                Plotly.Plots.resize('summaryBrandChart');
                Plotly.Plots.resize('summaryMachineChart');
                Plotly.Plots.resize('summaryTrendChart');
                break;
            case 'view-predict':
                Plotly.Plots.resize('predictChart');
                break;
            case 'view-case-defect':
                // 遍历所有箱装外观折线图并resize
                $('.case-defect-chart').each(function() {
                    Plotly.Plots.resize(this);
                });
                break;
            case 'view-carton-defect':
                $('.case-defect-chart').each(function() {
                    Plotly.Plots.resize(this);
                });
                break;
            case 'view-box-defect':
                $('.case-defect-chart').each(function() {
                    Plotly.Plots.resize(this);
                });
                break;
            case 'view-cig-defect':
                $('.case-defect-chart').each(function() {
                    Plotly.Plots.resize(this);
                });
                break;
        }
    }, 150);
}

// ==================== 加载缺陷目录 ====================
function loadDefectCatalog(callback) {
    $.get('api/chart/defectCatalog', function(data) {
        DEFECT_CATALOG = data;
        if (callback) callback();
    });
}

// ==================== 动态缺陷行管理 ====================
function addDefectRow(module) {
    if (!DEFECT_CATALOG[module]) return;
    var cat = DEFECT_CATALOG[module];
    ROW_COUNTER[module]++;
    var rowId = 'row-' + module + '-' + ROW_COUNTER[module];
    var h = '<div class="defect-row-item" id="' + rowId + '">';
    h += '<select class="sel-bodypart" data-module="' + module + '" data-row="' + rowId + '" onchange="onBodyPartChange(this)"><option value="">-- 部位 --</option>';
    cat.bodyParts.forEach(function(bp) { h += '<option value="' + bp + '">' + bp + '</option>'; });
    h += '</select>';
    h += '<select class="sel-defect" data-row="' + rowId + '" onchange="onDefectChange(this)"><option value="">-- 先选部位 --</option></select>';
    h += '<span class="grade-tag" id="grade-' + rowId + '">-</span>';
    h += '<input type="number" class="inp-count" min="1" value="1" style="width:65px"> <span class="unit-label">个</span>';
    h += '<button type="button" class="btn-del-row" onclick="removeDefectRow(\'' + rowId + '\',\'' + module + '\')">&times;</button>';
    h += '</div>';
    $('#rows-' + module).append(h);
    updateBadge(module);
}

function onBodyPartChange(sel) {
    var $sel = $(sel), module = $sel.data('module'), rowId = $sel.data('row');
    var bp = $sel.val(), $ds = $('#' + rowId + ' .sel-defect');
    $ds.empty();
    if (!bp) { $ds.append('<option value="">-- 先选部位 --</option>'); $('#grade-' + rowId).text('-').attr('class','grade-tag'); return; }
    $ds.append('<option value="">-- 选择缺陷 --</option>');
    var defects = DEFECT_CATALOG[module].defectsByPart[bp];
    if (defects) defects.forEach(function(d) { $ds.append('<option value="' + d.code + '" data-grade="' + d.grade + '" data-name="' + d.name + '">' + d.code + ' ' + d.name + '</option>'); });
    $('#grade-' + rowId).text('-').attr('class','grade-tag');
}

function onDefectChange(sel) {
    var rowId = $(sel).data('row'), grade = $(sel).find(':selected').data('grade') || '';
    var $t = $('#grade-' + rowId);
    $t.text(grade ? grade + '类' : '-').attr('class', grade ? 'grade-tag grade-tag-' + grade : 'grade-tag');
}

function removeDefectRow(rowId, module) { $('#' + rowId).remove(); updateBadge(module); }

function updateBadge(module) { $('#badge-' + module).text($('#rows-' + module + ' .defect-row-item').length + '项'); }

function collectDefectDetails() {
    var details = [];
    ['case','carton','boxSmall','cigarette'].forEach(function(m) {
        $('#rows-' + m + ' .defect-row-item').each(function() {
            var $r = $(this);
            var code = $r.find('.sel-defect :selected').val();
            var name = $r.find('.sel-defect :selected').data('name') || '';
            var grade = $r.find('.sel-defect :selected').data('grade') || '';
            var bodyPart = $r.find('.sel-bodypart').val();
            var count = parseInt($r.find('.inp-count').val()) || 0;
            if (code && count > 0) details.push({module:m, bodyPart:bodyPart, code:code, name:name, grade:grade, count:count});
        });
    });
    return details;
}

// ==================== 物测指标采集 ====================
function collectPhysicalMeasurements() {
    var pms = [];
    $('#tbody-measure tr').each(function() {
        var $row = $(this);
        var seqNo = parseInt($row.attr('data-row')) || 0;
        var measureTime = $row.find('.meas-time').val() || '';

        var pm = {
            seqNo: seqNo,
            measureTime: measureTime,
            weightX: parseFloat($row.find('[data-field=weight_x]').val()) || 0,
            weightSd: parseFloat($row.find('[data-field=weight_sd]').val()) || 0,
            weightMax: parseFloat($row.find('[data-field=weight_max]').val()) || 0,
            weightMin: parseFloat($row.find('[data-field=weight_min]').val()) || 0,
            circumferenceX: parseFloat($row.find('[data-field=circumference_x]').val()) || 0,
            circumferenceSd: parseFloat($row.find('[data-field=circumference_sd]').val()) || 0,
            circumferenceMax: parseFloat($row.find('[data-field=circumference_max]').val()) || 0,
            circumferenceMin: parseFloat($row.find('[data-field=circumference_min]').val()) || 0,
            suctionX: parseFloat($row.find('[data-field=suction_x]').val()) || 0,
            suctionSd: parseFloat($row.find('[data-field=suction_sd]').val()) || 0,
            suctionMax: parseFloat($row.find('[data-field=suction_max]').val()) || 0,
            suctionMin: parseFloat($row.find('[data-field=suction_min]').val()) || 0,
            ventilationX: parseFloat($row.find('[data-field=ventilation_x]').val()) || 0,
            ventilationSd: parseFloat($row.find('[data-field=ventilation_sd]').val()) || 0,
            ventilationMax: parseFloat($row.find('[data-field=ventilation_max]').val()) || 0,
            ventilationMin: parseFloat($row.find('[data-field=ventilation_min]').val()) || 0
        };
        pms.push(pm);
    });
    return pms;
}

function aggregateModule(details, module) {
    var s = {A:0,B:0,C:0,D:0};
    details.forEach(function(d) { if (d.module === module && s[d.grade] !== undefined) s[d.grade] += d.count; });
    return s;
}

// ==================== 提交质检数据 ====================
function submitData() {
    var details = collectDefectDetails();
    var cigSum = aggregateModule(details, 'cigarette');
    var boxSum = aggregateModule(details, 'boxSmall');
    var cartSum = aggregateModule(details, 'carton');
    var caseSum = aggregateModule(details, 'case');

    var data = {
        date: $('#inp_date').val(),
        shift: $('#inp_shift').val(),
        machineId: $('#inp_machine').val(),
        team: $('#inp_team').val(),
        partnerSite: $('#inp_partner').val(),
        brand: $('#inp_brand').val(),
        sampleTime: $('#inp_sample_time').val(),
        sampleTicketNo: $('#inp_sample_ticket').val(),
        physicalMeasurements: collectPhysicalMeasurements(),
        suction: null, weight: null, circumference: null,
        cigaretteA: cigSum.A, cigaretteB: cigSum.B, cigaretteC: cigSum.C, cigaretteD: cigSum.D,
        boxSmallA: boxSum.A, boxSmallB: boxSum.B, boxSmallC: boxSum.C, boxSmallD: boxSum.D,
        cartonA: cartSum.A, cartonB: cartSum.B, cartonC: cartSum.C, cartonD: cartSum.D,
        caseAa: caseSum.A, caseAb: caseSum.B, caseAc: caseSum.C, caseAd: caseSum.D,
        uploader: (function () {
            var u = sessionStorage.getItem('qa_user');
            return u ? JSON.parse(u).name : '未知用户';
        })(),
        uploadTime: (function () {
            var now = new Date();
            var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
            return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
                + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        })(),
        defectDetails: details
    };

    $.ajax({
        url: 'api/inspection/submit',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (res) {
            if (res.success) {
                alert('提交成功！风险等级：' + res.riskLevel);
                // 清空缺陷动态行
                ['case','carton','boxSmall','cigarette'].forEach(function(m) {
                    $('#rows-' + m).empty(); updateBadge(m); ROW_COUNTER[m] = 0;
                });
                // 捕获当前录入的筛选条件，联动同步到所有模块
                var submittedShift = $('#inp_shift').val();
                var submittedTeam = $('#inp_team').val();
                var submittedPartner = $('#inp_partner').val();
                var submittedBrand = $('#inp_brand').val();
                // 重置渲染状态，让所有视图刷新当天数据 + 筛选条件同步
                VIEW_RENDERED = {};
                VIEW_RENDERED['view-entry'] = true;
                refreshAll(submittedShift, submittedTeam, submittedPartner, submittedBrand);
                // 标记所有其他视图为已渲染，避免切过去重复拉数据
                ['view-table','view-spc','view-defect','view-predict',
                 'view-case-defect','view-carton-defect','view-box-defect','view-cig-defect'
                ].forEach(function(v) { VIEW_RENDERED[v] = true; });
            }
        },
        error: function () {
            alert('提交失败，请检查数据格式');
        }
    });
}

// ==================== 筛选条件同步函数 ====================
function syncAllFilters(today, shift, team, partnerSite, brand) {
    var prefixes = ['', 'spc_', 'defect_', 'case_', 'carton_', 'box_', 'cig_'];
    prefixes.forEach(function(prefix) {
        $('#' + prefix + 'filter_start').val(today);
        $('#' + prefix + 'filter_end').val(today);
        if (brand)  $('#' + prefix + 'filter_brand').val(brand);
        if (partnerSite) $('#' + prefix + 'filter_partner').val(partnerSite);
        if (shift)  $('#' + prefix + 'filter_shift').val(shift);
        if (team)   $('#' + prefix + 'filter_team').val(team);
        // 机台号仅对缺陷分析模块同步（defect_ 前缀）
    });
}

// ==================== 刷新全部面板（当天数据联动 + 筛选条件同步） ====================
function refreshAll(shift, team, partnerSite, brand) {
    var today = new Date().toISOString().split('T')[0];
    // 同步所有模块的筛选下拉框
    syncAllFilters(today, shift, team, partnerSite, brand);
    loadBanner();
    loadTable(today, today, brand, partnerSite, shift, team);
    loadSPC(today, today, brand, partnerSite, shift, team);
    loadSummary(today, today, brand, partnerSite, shift, team);
    loadPredict();
    loadCaseDefect(today, today, brand, partnerSite, shift, team);
    loadCartonDefect(today, today, brand, partnerSite, shift, team);
    loadBoxDefect(today, today, brand, partnerSite, shift, team);
    loadCigDefect(today, today, brand, partnerSite, shift, team);
}

// ==================== 横幅 ====================
function loadBanner() {
    $.get('api/warning/banner', function (res) {
        var $banner = $('#banner');
        $banner.css({
            'color': res.bannerColor,
            'background': hexToRgba(res.bannerColor, 0.08),
            'border-bottom-color': res.bannerColor
        });
        $('#bannerText').text(res.bannerText);
        // 风险不为"平稳"时启用呼吸灯
        if (res.riskLevel && res.riskLevel !== '平稳') {
            $banner.addClass('warning-active');
        } else {
            $banner.removeClass('warning-active');
        }
    });
}

// ==================== 板块1：历史数据表格 ====================
function loadTable(startDate, endDate, brand, partnerSite, shift, team) {
    var url = 'api/inspection/list';
    var params = [];
    if (startDate && endDate) {
        params.push('startDate=' + encodeURIComponent(startDate));
        params.push('endDate=' + encodeURIComponent(endDate));
    }
    if (brand) { params.push('brand=' + encodeURIComponent(brand)); }
    if (partnerSite) { params.push('partnerSite=' + encodeURIComponent(partnerSite)); }
    if (shift) { params.push('shift=' + encodeURIComponent(shift)); }
    if (team) { params.push('team=' + encodeURIComponent(team)); }
    if (params.length > 0) { url += '?' + params.join('&'); }

    $.get(url, function (records) {
        var $tbody = $('#tbody-query');
        if (!records || records.length === 0) {
            $tbody.html('<tr><td colspan="34" class="empty-hint">暂无数据</td></tr>');
            return;
        }

        // 为每条记录计算物测指标均值
        records.forEach(function(r) {
            var pms = r.physicalMeasurements || [];
            r._weightAvg = avgPhysField(pms, 'weightX');
            r._weightSd = avgPhysField(pms, 'weightSd');
            r._circumAvg = avgPhysField(pms, 'circumferenceX');
            r._circumSd = avgPhysField(pms, 'circumferenceSd');
            r._suctionAvg = avgPhysField(pms, 'suctionX');
            r._suctionSd = avgPhysField(pms, 'suctionSd');
            r._totalDefects = (r.cigaretteA||0)+(r.cigaretteB||0)+(r.cigaretteC||0)+(r.cigaretteD||0)
                +(r.boxSmallA||0)+(r.boxSmallB||0)+(r.boxSmallC||0)+(r.boxSmallD||0)
                +(r.cartonA||0)+(r.cartonB||0)+(r.cartonC||0)+(r.cartonD||0)
                +(r.caseAa||0)+(r.caseAb||0)+(r.caseAc||0)+(r.caseAd||0);
        });

        var user = JSON.parse(sessionStorage.getItem('qa_user') || '{}');
        var isAdmin = user.role === '系统管理员';

        var html = '';
        records.forEach(function (r) {
            html += '<tr>';
            html += td(r.date);
            html += td(r.partnerSite);
            html += td(r.brand);
            html += td(r.team);
            html += td(r.shift);
            html += td(r.machineId);
            html += td(r.sampleTime);
            html += td(r.sampleTicketNo);
            // 物测: 重量/X | SD | 圆周/X | SD | 吸阻/X | SD
            html += td(r._weightAvg);
            html += td(r._weightSd);
            html += td(r._circumAvg);
            html += td(r._circumSd);
            html += td(r._suctionAvg);
            html += td(r._suctionSd);
            // 烟支外观 ABCD
            html += td(r.cigaretteA, 'td-A');
            html += td(r.cigaretteB, 'td-B');
            html += td(r.cigaretteC, 'td-C');
            html += td(r.cigaretteD, 'td-D');
            // 小盒外观 ABCD
            html += td(r.boxSmallA, 'td-A');
            html += td(r.boxSmallB, 'td-B');
            html += td(r.boxSmallC, 'td-C');
            html += td(r.boxSmallD, 'td-D');
            // 大条外观 ABCD
            html += td(r.cartonA, 'td-A');
            html += td(r.cartonB, 'td-B');
            html += td(r.cartonC, 'td-C');
            html += td(r.cartonD, 'td-D');
            // 箱装外观 ABCD
            html += td(r.caseAa, 'td-A');
            html += td(r.caseAb, 'td-B');
            html += td(r.caseAc, 'td-C');
            html += td(r.caseAd, 'td-D');
            // 缺陷总数
            html += td(r._totalDefects);
            // 风险等级
            var riskCls = '';
            var rl = String(r.riskLevel || '');
            if (rl.indexOf('高') >= 0) riskCls = 'td-risk-high';
            else if (rl.indexOf('中度') >= 0) riskCls = 'td-risk-medium';
            else if (rl.indexOf('一般') >= 0) riskCls = 'td-risk-low';
            else riskCls = 'td-risk-safe';
            html += '<td class="' + riskCls + '">' + (r.riskLevel || '') + '</td>';
            html += td(r.uploader);
            html += td(r.uploadTime);
            if (isAdmin) {
                html += '<td><button class="btn-delete-record" onclick="deleteRecord(' + r.id + ')">删除</button></td>';
            }
            html += '</tr>';
        });
        $tbody.html(html);
    });

    function td(val, cls) {
        var v = val != null ? val : '';
        if (cls) return '<td class="' + cls + '">' + v + '</td>';
        return '<td>' + v + '</td>';
    }
}

// ==================== 删除记录（仅管理员） ====================
function deleteRecord(id) {
    if (!confirm('确认删除此记录？此操作不可撤销！')) return;
    $.ajax({
        url: 'api/inspection/' + id,
        method: 'DELETE',
        success: function (res) {
            if (res.success) {
                loadTable($('#filter_start').val(), $('#filter_end').val());
            } else {
                alert('删除失败：' + (res.message || '未知错误'));
            }
        },
        error: function () {
            alert('删除失败，请检查网络连接');
        }
    });
}

// ==================== 板块2：SPC控制图 ====================
function loadSPC(startDate, endDate, brand, partnerSite, shift, team) {
    var url = 'api/chart/spc';
    var params = [];
    if (startDate && endDate) {
        params.push('startDate=' + encodeURIComponent(startDate));
        params.push('endDate=' + encodeURIComponent(endDate));
    }
    if (brand) {
        params.push('brand=' + encodeURIComponent(brand));
    }
    if (partnerSite) {
        params.push('partnerSite=' + encodeURIComponent(partnerSite));
    }
    if (shift) {
        params.push('shift=' + encodeURIComponent(shift));
    }
    if (team) {
        params.push('team=' + encodeURIComponent(team));
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    $.get(url, function (data) {
        var keys = ['suction', 'weight', 'circumference', 'ventilation'];
        var titles = [
            '吸阻SPC控制图（内控标准950-1350Pa）',
            '单支重量SPC控制图（内控标准0.780-0.920g）',
            '圆周SPC控制图（内控标准24.00-24.40mm）',
            '通风度/长度SPC控制图（内控标准30-70）'
        ];
        var traces = [];

        keys.forEach(function (key, idx) {
            var d = data[key];
            var x = [];
            for (var i = 1; i <= d.values.length; i++) x.push('第' + i + '班次');

            traces.push({
                x: x, y: d.values, mode: 'lines+markers', name: d.label,
                line: { color: '#0071e3', width: 3 },
                marker: { size: 7, color: '#0071e3', line: { width: 2, color: '#fff' } },
                xaxis: 'x' + (idx + 1), yaxis: 'y' + (idx + 1),
                hovertemplate: '样本%{x}<br>' + d.label + ': %{y:.2f}<extra></extra>'
            });
            traces.push({
                x: x, y: Array(x.length).fill(d.ucl), mode: 'lines', name: 'UCL（上控制限）',
                line: { color: '#FF3B30', width: 2, dash: 'dash' },
                xaxis: 'x' + (idx + 1), yaxis: 'y' + (idx + 1),
                showlegend: idx === 0, hoverinfo: 'y+name'
            });
            traces.push({
                x: x, y: Array(x.length).fill(d.center), mode: 'lines', name: 'CL（中心线）',
                line: { color: '#34C759', width: 2, dash: 'solid' },
                xaxis: 'x' + (idx + 1), yaxis: 'y' + (idx + 1),
                showlegend: idx === 0, hoverinfo: 'y+name'
            });
            traces.push({
                x: x, y: Array(x.length).fill(d.lcl), mode: 'lines', name: 'LCL（下控制限）',
                line: { color: '#FF3B30', width: 2, dash: 'dash' },
                xaxis: 'x' + (idx + 1), yaxis: 'y' + (idx + 1),
                showlegend: idx === 0, hoverinfo: 'y+name'
            });

            if (d.severe && d.severe.length > 0) {
                var sx = [], sy = [], stxt = [];
                d.severe.forEach(function (pt) {
                    sx.push(x[pt.index]); sy.push(d.values[pt.index]); stxt.push('⚠ ' + pt.desc);
                });
                traces.push({
                    x: sx, y: sy, mode: 'markers+text', name: '严重异常（超3σ控制限）',
                    marker: { color: '#FF3B30', size: 16, symbol: 'x', line: { width: 3, color: '#fff' } },
                    text: stxt, textposition: 'top center',
                    textfont: { size: 11, color: '#FF3B30' },
                    xaxis: 'x' + (idx + 1), yaxis: 'y' + (idx + 1),
                    showlegend: idx === 0,
                    hovertemplate: '⚠严重异常<br>样本%{x}<br>值: %{y:.2f}<br>%{text}<extra></extra>'
                });
            }

            if (d.mild && d.mild.length > 0) {
                var mx = [], my = [], mtxt = [];
                d.mild.forEach(function (pt) {
                    mx.push(x[pt.index]); my.push(d.values[pt.index]); mtxt.push(pt.desc);
                });
                traces.push({
                    x: mx, y: my, mode: 'markers+text', name: '轻微偏离（2σ/1σ/趋势）',
                    marker: { color: '#FFCC00', size: 13, symbol: 'triangle-up', line: { width: 2, color: '#D4AC0D' } },
                    text: mtxt, textposition: 'bottom center',
                    textfont: { size: 9, color: '#7D6608' },
                    xaxis: 'x' + (idx + 1), yaxis: 'y' + (idx + 1),
                    showlegend: idx === 0,
                    hovertemplate: '轻微偏离<br>样本%{x}<br>值: %{y:.2f}<br>%{text}<extra></extra>'
                });
            }
        });

        var layout = {
            grid: { rows: 2, columns: 2, pattern: 'independent', xgap: 0.08, ygap: 0.12 },
            height: 760,
            font: LAYOUT_FONT,
            margin: { l: 70, r: 25, t: 50, b: 50 },
            showlegend: true,
            legend: { orientation: 'h', y: 1.12, x: 0.5, xanchor: 'center', font: { size: 11 } },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#fafafa',
            xaxis: { title: '样本序号', anchor: 'y', tickangle: -30, tickfont: { size: 10 } },
            yaxis: { title: '吸阻(Pa)', anchor: 'x', gridcolor: '#f0f0f0', zerolinecolor: '#e0e0e0' },
            xaxis2: { title: '样本序号', anchor: 'y2', tickangle: -30, tickfont: { size: 10 } },
            yaxis2: { title: '重量(g)', anchor: 'x2', gridcolor: '#f0f0f0', zerolinecolor: '#e0e0e0' },
            xaxis3: { title: '样本序号', anchor: 'y3', tickangle: -30, tickfont: { size: 10 } },
            yaxis3: { title: '圆周(mm)', anchor: 'x3', gridcolor: '#f0f0f0', zerolinecolor: '#e0e0e0' },
            xaxis4: { title: '样本序号', anchor: 'y4', tickangle: -30, tickfont: { size: 10 } },
            yaxis4: { title: '通风度/长度', anchor: 'x4', gridcolor: '#f0f0f0', zerolinecolor: '#e0e0e0' }
        };

        Plotly.newPlot('spcChart', traces, layout, { responsive: true, displayModeBar: true, modeBarButtonsToAdd: ['hoverClosestCartesian'] });
    });
}

// ==================== 板块3：综合质量汇总分析 ====================
var SUMMARY_TIME_PRESET = 'month'; // 默认本月

function applyTimePreset(preset) {
    var today = new Date();
    var start = '', end = '';
    var shift = '';
    switch (preset) {
        case 'shift':
            var h = today.getHours();
            shift = h < 8 ? '晚班' : (h < 16 ? '早班' : (h < 24 ? '中班' : '晚班'));
            start = end = today.toISOString().split('T')[0];
            break;
        case 'today':
            start = end = today.toISOString().split('T')[0];
            break;
        case 'week':
            var day = today.getDay();
            var monday = new Date(today);
            monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
            start = monday.toISOString().split('T')[0];
            end = today.toISOString().split('T')[0];
            break;
        case 'month':
            start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            end = today.toISOString().split('T')[0];
            break;
        case 'custom':
            start = $('#defect_filter_start').val();
            end = $('#defect_filter_end').val();
            shift = $('#defect_filter_shift').val();
            break;
    }
    $('#defect_filter_start').val(start);
    $('#defect_filter_end').val(end);
    if (preset === 'shift') {
        $('#defect_filter_shift').val(shift);
    }
    SUMMARY_TIME_PRESET = preset;
    // highlight active preset button
    $('.time-preset').removeClass('active');
    $('.time-preset[data-preset="' + preset + '"]').addClass('active');
    // toggle custom date inputs
    $('#summary-date-range').toggle(preset === 'custom');
}

function loadSummary(startDate, endDate, brand, partnerSite, shift, team, machine) {
    var url = 'api/chart/summary';
    var params = [];
    if (startDate && endDate) {
        params.push('startDate=' + encodeURIComponent(startDate));
        params.push('endDate=' + encodeURIComponent(endDate));
    }
    if (brand)  params.push('brand=' + encodeURIComponent(brand));
    if (partnerSite) params.push('partnerSite=' + encodeURIComponent(partnerSite));
    if (shift)  params.push('shift=' + encodeURIComponent(shift));
    if (team)   params.push('team=' + encodeURIComponent(team));
    if (machine) params.push('machine=' + encodeURIComponent(machine));
    if (params.length > 0) url += '?' + params.join('&');

    $.get(url, function (data) {
        renderKpi(data.kpi);
        renderSummaryPie(data.pie, data);
        renderDimChart('summaryPartnerChart', data.partnerAnalysis, data, '合作生产点');
        renderDimChart('summaryBrandChart', data.brandAnalysis, data, '牌号');
        renderDimChart('summaryMachineChart', data.machineAnalysis, data, '机台');
        renderSummaryTrend(data.defectTrend, data);
        renderWarnings(data.warnings, data);
        // 同时加载结论 + 缺陷TOP排行
        loadConclusion(startDate, endDate, brand, partnerSite, shift, team, machine);
        loadTopDefects(startDate, endDate, brand, partnerSite, shift, team, machine);
    });
}

// KPI 指标卡
function renderKpi(kpi) {
    if (!kpi) return;
    $('#kpi-quality').text((kpi.qualityRate || 0) + '%');
    $('#kpi-defect').text((kpi.defectRate || 0) + '%');
    $('#kpi-samples').text(kpi.sampleCount || 0);
    $('#kpi-warnings').text(kpi.warningCount || 0);
}

// ABCD 缺陷等级分布环形图
function renderSummaryPie(pie, data) {
    if (!pie) return;
    var total = (pie.a||0) + (pie.b||0) + (pie.c||0) + (pie.d||0);
    var pieColors = ['#FF3B30', '#FF9500', '#FFCC00', '#8E8E93'];
    var trace = {
        values: [pie.a, pie.b, pie.c, pie.d],
        labels: ['A类(严重)', 'B类(较重)', 'C类(一般)', 'D类(轻微)'],
        type: 'pie', hole: 0.55,
        marker: {
            colors: pieColors,
            line: { color: '#fff', width: 3 }
        },
        textfont: { size: 11, color: '#fff', family: LAYOUT_FONT.family },
        textinfo: 'label+percent',
        texttemplate: '%{label}<br>%{percent}',
        hovertemplate: '<b>%{label}</b><br>数量: %{value}个<br>占比: %{percent}<extra></extra>',
        direction: 'clockwise', sort: false,
        pull: [0.03, 0, 0, 0]
    };
    var layout = {
        height: 330, font: LAYOUT_FONT,
        margin: { l: 20, r: 20, t: 10, b: 20 },
        showlegend: true,
        legend: { orientation: 'h', y: -0.08, x: 0.5, xanchor: 'center', font: { size: 10 }, bgcolor: 'transparent' },
        plot_bgcolor: '#fff', paper_bgcolor: '#fff',
        annotations: total === 0
            ? [{ text: '暂无数据', showarrow: false, font: { size: 18, color: '#999' } }]
            : [{ text: '总计<br>' + total + '个', showarrow: false, font: { size: 18, color: '#333' }, x: 0.5, y: 0.5 }]
    };
    Plotly.newPlot('defectPieChart', [trace], layout, { responsive: true, displayModeBar: false });
}

// 维度分析柱状图（合作点/牌号/机台）——样本数/缺陷数分组柱 + 预警数折线 + 比率标签
function renderDimChart(divId, dimData, data, dimLabel) {
    if (!dimData || dimData.length === 0) {
        Plotly.newPlot(divId, [{ type: 'scatter', mode: 'text', text: ['暂无数据'], textfont: { size: 16, color: '#999' } }],
            { height: 360, font: LAYOUT_FONT, xaxis: { visible: false }, yaxis: { visible: false } },
            { responsive: true, displayModeBar: false });
        return;
    }
    var names = dimData.map(function(d) { return d.name; });
    var qCount = dimData.map(function(d) { return d.qualifiedCount || 0; });         // 合格样本数
    var dCount = dimData.map(function(d) {                                              // 不合格样本数
        var sc = d.sampleCount || 0, qc = d.qualifiedCount || 0;
        return sc - qc;
    });
    var sCount = dimData.map(function(d) { return d.sampleCount || 0; });              // 总样本数
    var wCount = dimData.map(function(d) { return d.warningCount || 0; });             // 预警数 = 缺陷总数
    var qRate = dimData.map(function(d) { return d.qualityRate; });
    var dRate = dimData.map(function(d) { return d.defectRate; });

    var maxCount = Math.max(Math.max.apply(null, sCount) || 1, Math.max.apply(null, wCount) || 5);
    var maxWarn = Math.max.apply(null, wCount) || 5;

    // 为每个 x 构建自定义标签（显示样本数+比率）
    var qText = [], dText = [];
    for (var i = 0; i < names.length; i++) {
        qText.push(qCount[i] > 0 ? qCount[i] + '个' : '');
        dText.push(dCount[i] > 0 ? dCount[i] + '个' : '');
    }

    var traces = [
        {
            x: names, y: qCount, name: '合格样本', type: 'bar',
            marker: {
                color: '#34C759',
                line: { width: 1, color: 'rgba(255,255,255,0.6)' }
            },
            text: qText, textposition: 'inside',
            textfont: { size: 9, color: '#fff', family: LAYOUT_FONT.family },
            hovertemplate: '<b>%{x}</b><br>合格样本: %{y}个<br>优质率: %{customdata:.1f}%<extra></extra>',
            customdata: qRate
        },
        {
            x: names, y: dCount, name: '缺陷样本', type: 'bar',
            marker: {
                color: '#FF3B30',
                line: { width: 1, color: 'rgba(255,255,255,0.6)' }
            },
            text: dText, textposition: 'inside',
            textfont: { size: 9, color: '#fff', family: LAYOUT_FONT.family },
            hovertemplate: '<b>%{x}</b><br>缺陷样本: %{y}个<br>缺陷率: %{customdata:.1f}%<extra></extra>',
            customdata: dRate
        },
        {
            x: names, y: wCount, name: '预警数', type: 'scatter', mode: 'lines+markers', yaxis: 'y2',
            line: { color: '#FF9500', width: 2.8, shape: 'spline', dash: 'solid' },
            marker: { size: 10, color: '#FF9500', line: { width: 2.5, color: '#fff' } },
            hovertemplate: '<b>%{x}</b><br>预警数: %{y}<extra></extra>'
        }
    ];

    var layout = {
        height: 380, font: LAYOUT_FONT,
        margin: { l: 55, r: 55, t: 15, b: dimData.length > 5 ? 85 : 55 },
        barmode: 'group',
        bargap: 0.25, bargroupgap: 0.12,
        showlegend: true,
        legend: {
            orientation: 'h', y: 1.08, x: 0.5, xanchor: 'center',
            font: { size: 10 }, bgcolor: 'transparent',
            itemwidth: 30
        },
        plot_bgcolor: '#fff', paper_bgcolor: '#fff',
        xaxis: {
            type: 'category',
            tickangle: dimData.length > 5 ? -35 : 0,
            tickfont: { size: 11, color: '#444' },
            gridcolor: 'transparent', zeroline: false
        },
        yaxis: {
            title: { text: '样本数（个）', font: { size: 10, color: '#999' } },
            gridcolor: '#F2F2F7', zerolinecolor: '#E5E5EA', side: 'left',
            range: [0, maxCount * 1.3],
            dtick: Math.max(Math.ceil(maxCount / 5), 1),
            rangemode: 'tozero'
        },
        yaxis2: {
            title: { text: '预警数（个）', font: { size: 10, color: '#999' } },
            gridcolor: 'transparent', zeroline: false, side: 'right', overlaying: 'y',
            range: [0, maxWarn * 1.5],
            dtick: Math.max(Math.ceil(maxWarn / 4), 1),
            rangemode: 'tozero'
        }
    };
    Plotly.newPlot(divId, traces, layout, { responsive: true, displayModeBar: false });
}

// ABCD 缺陷趋势折线图
function renderSummaryTrend(defectTrend, data) {
    if (!defectTrend || !defectTrend.labels || defectTrend.labels.length === 0) {
        Plotly.newPlot('summaryTrendChart', [{ type: 'scatter', mode: 'text', text: ['暂无数据'], textfont: { size: 16, color: '#999' } }],
            { height: 350, font: LAYOUT_FONT, xaxis: { visible: false }, yaxis: { visible: false } },
            { responsive: true, displayModeBar: false });
        return;
    }
    var configs = [
        { key: 'a', name: 'A类(严重)', color: '#FF3B30', width: 3, symbol: 'circle' },
        { key: 'b', name: 'B类(较重)', color: '#FF9500', width: 2.5, symbol: 'square' },
        { key: 'c', name: 'C类(一般)', color: '#FFCC00', width: 2, symbol: 'diamond' },
        { key: 'd', name: 'D类(轻微)', color: '#8E8E93', width: 1.8, symbol: 'triangle-up' }
    ];
    var traces = [];
    configs.forEach(function(cfg) {
        var yData = defectTrend[cfg.key];
        traces.push({
            x: defectTrend.labels, y: yData, mode: 'lines+markers', name: cfg.name,
            line: { color: cfg.color, width: cfg.width, shape: 'spline' },
            marker: { size: 6, symbol: cfg.symbol, line: { width: 1.5, color: '#fff' } },
            hovertemplate: '<b>' + cfg.name + '</b><br>%{x}<br>数量: %{y}个<extra></extra>'
        });
    });
    var layout = {
        height: 350, font: LAYOUT_FONT,
        margin: { l: 50, r: 25, t: 10, b: 70 },
        showlegend: true,
        legend: { x: 0.01, y: 0.99, xanchor: 'left', font: { size: 10 }, bgcolor: 'rgba(255,255,255,0.85)', bordercolor: '#E5E5EA', borderwidth: 1 },
        plot_bgcolor: '#fff', paper_bgcolor: '#fff',
        xaxis: { tickangle: -35, tickfont: { size: 9, color: '#666' }, gridcolor: '#F2F2F7', zeroline: false },
        yaxis: { title: { text: '数量（个）', font: { size: 10, color: '#999' } }, gridcolor: '#F2F2F7', zerolinecolor: '#E5E5EA', rangemode: 'nonnegative' }
    };
    Plotly.newPlot('summaryTrendChart', traces, layout, { responsive: true, displayModeBar: false });
}

// 预警中心
function renderWarnings(warnings, data) {
    var aCount = 0, bCount = 0, cCount = 0, dCount = 0;
    var html = '';
    if (warnings && warnings.length > 0) {
        warnings.forEach(function(w) {
            var level = w.defectLevel;
            if (level === 'A') aCount++;
            else if (level === 'B') bCount++;
            else if (level === 'C') cCount++;
            else dCount++;
            var badgeCls = 'warn-cell-' + level.toLowerCase();
            html += '<tr>';
            html += '<td>' + (w.time || '') + '</td>';
            html += '<td>' + (w.partner || '') + '</td>';
            html += '<td>' + (w.brand || '') + '</td>';
            html += '<td>' + (w.machine || '') + '</td>';
            html += '<td>' + (w.defectType || '') + '</td>';
            html += '<td><span class="' + badgeCls + '">' + level + '类</span></td>';
            html += '</tr>';
        });
    } else {
        html = '<tr><td colspan="6" class="empty-hint">暂无预警记录</td></tr>';
    }
    $('#warn-count-a').text(aCount);
    $('#warn-count-b').text(bCount);
    $('#warn-count-c').text(cCount);
    $('#warn-count-d').text(dCount);
    $('#tbody-warnings').html(html);
}

// 质量分析结论
function loadConclusion(startDate, endDate, brand, partnerSite, shift, team, machine) {
    var url = 'api/chart/conclusion';
    var params = [];
    if (startDate && endDate) {
        params.push('startDate=' + encodeURIComponent(startDate));
        params.push('endDate=' + encodeURIComponent(endDate));
    }
    if (brand)  params.push('brand=' + encodeURIComponent(brand));
    if (partnerSite) params.push('partnerSite=' + encodeURIComponent(partnerSite));
    if (shift)  params.push('shift=' + encodeURIComponent(shift));
    if (team)   params.push('team=' + encodeURIComponent(team));
    if (machine) params.push('machine=' + encodeURIComponent(machine));
    if (params.length > 0) url += '?' + params.join('&');

    $.get(url, function (data) {
        renderConclusion(data);
    }).fail(function () {
        $('#conclusionContent').html('<p class="empty-hint">暂无可比数据</p>');
    });
}

function renderConclusion(data) {
    if (!data || !data.conclusions || data.conclusions.length === 0) {
        $('#conclusionContent').html('<p class="empty-hint">暂无可比数据</p>');
        return;
    }
    var trend = data.overallTrend || 'stable';
    var label = data.overallLabel || '质量平稳';
    var trendCls = trend === 'improving' ? 'trend-good' : (trend === 'declining' ? 'trend-bad' : 'trend-stable');
    var trendIcon = trend === 'improving' ? '✅' : (trend === 'declining' ? '⚠️' : '➖');

    var html = '';
    // 综合趋势标签
    html += '<div class="conclusion-header">';
    html += '<span class="conclusion-trend ' + trendCls + '">' + trendIcon + ' ' + label + '</span>';
    html += '<span class="conclusion-period">' + (data.periodLabel || '') + '</span>';
    html += '</div>';

    // 结论文本列表
    html += '<ul class="conclusion-list">';
    data.conclusions.forEach(function (line) {
        html += '<li>' + line + '</li>';
    });
    html += '</ul>';

    // 对比明细
    if (data.current && data.previous) {
        html += '<div class="conclusion-compare">';
        html += '<table class="conclusion-table">';
        html += '<thead><tr><th>指标</th><th>本月</th><th>上月</th><th>变化</th></tr></thead>';
        html += '<tbody>';

        var qDelta = (data.deltas && data.deltas.qualityRateDelta) || 0;
        var dDelta = (data.deltas && data.deltas.defectRateDelta) || 0;
        var sDelta = (data.deltas && data.deltas.sampleCountDelta) || 0;
        var wDelta = (data.deltas && data.deltas.warningCountDelta) || 0;

        function deltaHtml(val, unit) {
            if (val > 0.05) return '<span class="delta-up">↑ ' + val.toFixed(2) + unit + '</span>';
            if (val < -0.05) return '<span class="delta-down">↓ ' + Math.abs(val).toFixed(2) + unit + '</span>';
            return '<span class="delta-zero">→ 持平</span>';
        }

        html += '<tr><td>优质率</td><td>' + data.current.qualityRate.toFixed(2) + '%</td><td>' + data.previous.qualityRate.toFixed(2) + '%</td><td>' + deltaHtml(qDelta, 'pp') + '</td></tr>';
        html += '<tr><td>缺陷率</td><td>' + data.current.defectRate.toFixed(2) + '%</td><td>' + data.previous.defectRate.toFixed(2) + '%</td><td>' + deltaHtml(dDelta, 'pp') + '</td></tr>';

        function countDelta(val) {
            if (val > 0) return '<span class="delta-up">↑ +' + val + '</span>';
            if (val < 0) return '<span class="delta-down">↓ ' + val + '</span>';
            return '<span class="delta-zero">→ 持平</span>';
        }
        html += '<tr><td>预警数量</td><td>' + data.current.warningCount + ' 次</td><td>' + data.previous.warningCount + ' 次</td><td>' + countDelta(wDelta) + '</td></tr>';
        html += '<tr><td>抽检样本</td><td>' + data.current.sampleCount + ' 个</td><td>' + data.previous.sampleCount + ' 个</td><td>' + countDelta(sDelta) + '</td></tr>';
        html += '</tbody></table></div>';
    }

    $('#conclusionContent').html(html);
}

// 缺陷类型统计分析 (TOP10)
function loadTopDefects(startDate, endDate, brand, partnerSite, shift, team, machine) {
    var url = 'api/chart/top-defects';
    var params = [];
    if (startDate && endDate) {
        params.push('startDate=' + encodeURIComponent(startDate));
        params.push('endDate=' + encodeURIComponent(endDate));
    }
    if (brand)  params.push('brand=' + encodeURIComponent(brand));
    if (partnerSite) params.push('partnerSite=' + encodeURIComponent(partnerSite));
    if (shift)  params.push('shift=' + encodeURIComponent(shift));
    if (team)   params.push('team=' + encodeURIComponent(team));
    if (machine) params.push('machine=' + encodeURIComponent(machine));
    if (params.length > 0) url += '?' + params.join('&');

    $.get(url, function (data) {
        renderTopDefectsChart(data);
    }).fail(function () {
        Plotly.newPlot('topDefectsChart',
            [{ type: 'scatter', mode: 'text', text: ['暂无数据'], textfont: { size: 16, color: '#999' } }],
            { height: 420, font: LAYOUT_FONT, xaxis: { visible: false }, yaxis: { visible: false } },
            { responsive: true, displayModeBar: false });
    });
}

function renderTopDefectsChart(data) {
    if (!data || data.length === 0) {
        Plotly.newPlot('topDefectsChart',
            [{ type: 'scatter', mode: 'text', text: ['暂无缺陷数据'], textfont: { size: 16, color: '#999' } }],
            { height: 420, font: LAYOUT_FONT, xaxis: { visible: false }, yaxis: { visible: false } },
            { responsive: true, displayModeBar: false });
        return;
    }

    // 模块颜色映射
    var moduleColors = {
        'cigarette': '#FF3B30',
        'boxSmall': '#FFCC00',
        'carton': '#FF9500',
        'case': '#8E8E93'
    };

    // labels: [模块名] 缺陷名称（纯文本）
    var labels = data.map(function (d) {
        return '[' + (d.moduleName || d.module) + '] ' + d.name;
    });
    var counts = data.map(function (d) { return d.count; });
    var ratios = data.map(function (d) { return d.ratio; });
    var colors = data.map(function (d) { return moduleColors[d.module] || '#666'; });
    var hoverTexts = data.map(function (d) {
        return '<b>' + d.name + '</b><br>类别: ' + (d.moduleName || d.module)
            + '<br>出现次数: ' + d.count + ' 次<br>占比: ' + d.ratio + '%';
    });

    // 点击跳转：存储 module 信息
    var customdata = data.map(function (d) { return d.module; });

    var trace = {
        y: labels,
        x: counts,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: colors,
            line: { width: 0 }
        },
        text: counts.map(function (c, i) { return c + '次 (' + ratios[i] + '%)'; }),
        textposition: 'auto',
        textfont: { size: 11, color: '#333', family: LAYOUT_FONT.family },
        hovertemplate: hoverTexts.map(function (h) { return h + '<extra></extra>'; }),
        customdata: customdata
    };

    var maxCount = Math.max.apply(null, counts) || 1;
    var layout = {
        height: Math.max(300, data.length * 36 + 60),
        font: LAYOUT_FONT,
        margin: { l: 30, r: 80, t: 10, b: 30 },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff',
        xaxis: {
            title: { text: '出现次数（次）', font: { size: 10, color: '#999' } },
            gridcolor: '#F2F2F7',
            zerolinecolor: '#E5E5EA',
            rangemode: 'nonnegative',
            dtick: Math.max(Math.ceil(maxCount / 5), 1)
        },
        yaxis: {
            autorange: 'reversed',
            tickfont: { size: 11, color: '#444' },
            gridcolor: 'transparent',
            zeroline: false
        },
        bargap: 0.3
    };

    var config = { responsive: true, displayModeBar: false };
    var chartDiv = document.getElementById('topDefectsChart');

    // 清除旧图表和事件监听
    Plotly.purge('topDefectsChart');
    Plotly.newPlot('topDefectsChart', [trace], layout, config);

    // 点击跳转到对应专项分析页面（预留联动能力）
    chartDiv.on('plotly_click', function (eventData) {
        var pt = eventData.points[0];
        if (!pt || !pt.customdata) return;
        var module = pt.customdata;
        var targetViewId;
        if (module === 'case') targetViewId = 'view-case-defect';
        else if (module === 'carton') targetViewId = 'view-carton-defect';
        else if (module === 'boxSmall') targetViewId = 'view-box-small-defect';
        else if (module === 'cigarette') targetViewId = 'view-cigarette-defect';
        if (targetViewId) {
            // 切换到目标视图
            var navItems = document.querySelectorAll('.sidebar-nav-item');
            var targetNavText;
            if (module === 'case') targetNavText = '箱装外观质量分析';
            else if (module === 'carton') targetNavText = '条装外观质量分析';
            else if (module === 'boxSmall') targetNavText = '盒装外观质量分析';
            else if (module === 'cigarette') targetNavText = '烟支外观质量分析';
            navItems.forEach(function (item) {
                if (item.textContent.trim() === targetNavText) {
                    item.click();
                }
            });
        }
    });
}

// 统一查询入口
function doSummaryQuery() {
    var startDate = $('#defect_filter_start').val();
    var endDate = $('#defect_filter_end').val();
    var brand = $('#defect_filter_brand').val();
    var partnerSite = $('#defect_filter_partner').val();
    var shift = $('#defect_filter_shift').val();
    var team = $('#defect_filter_team').val();
    var machine = $('#defect_filter_machine').val();
    loadSummary(startDate, endDate, brand, partnerSite, shift, team, machine);
}

// ==================== 箱装外观缺陷分析（按部位×日期×缺陷折线图） ====================
function loadCaseDefect(startDate, endDate, brand, partnerSite, shift, team) {
    var url = 'api/chart/case-defect?startDate=' + encodeURIComponent(startDate)
            + '&endDate=' + encodeURIComponent(endDate);
    if (brand) url += '&brand=' + encodeURIComponent(brand);
    if (partnerSite) url += '&partnerSite=' + encodeURIComponent(partnerSite);
    if (shift) url += '&shift=' + encodeURIComponent(shift);
    if (team) url += '&team=' + encodeURIComponent(team);

    $.get(url, function (data) {
        var bodyParts = data.bodyParts || [];
        var chartData = data.data || {};

        if (bodyParts.length === 0) {
            $('#caseDefectContainer').html('<p class="empty-hint">暂无数据</p>');
            return;
        }

        // 每个缺陷独立配色——专业美观的多色方案
        var colorPalette = [
            '#2563EB', // 宝蓝
            '#DC2626', // 丹红
            '#16A34A', // 翠绿
            '#F59E0B', // 琥珀
            '#7C3AED', // 紫罗兰
            '#EA580C', // 橘橙
            '#0891B2', // 青蓝
            '#DB2777', // 玫红
            '#4F46E5', // 靛蓝
            '#65A30D', // 石灰绿
            '#9333EA', // 深紫
            '#0284C7', // 天蓝
            '#E11D48', // 蔷薇红
            '#059669', // 翡翠绿
            '#CA8A04', // 金盏黄
            '#6D28D9', // 暗紫
            '#0EA5E9'  // 亮蓝
        ];

        var html = '';
        bodyParts.forEach(function (bp, idx) {
            var part = chartData[bp];
            var chartId = 'caseDefectChart_' + idx;
            html += '<div class="case-defect-part">';
            html += '<div class="case-defect-part-title">' + bp + '</div>';
            html += '<div id="' + chartId + '" class="case-defect-chart"></div>';
            html += '</div>';
        });
        $('#caseDefectContainer').html(html);

        // 逐个渲染折线图
        bodyParts.forEach(function (bp, idx) {
            var part = chartData[bp];
            if (!part) return;
            var chartId = 'caseDefectChart_' + idx;
            var dates = part.dates || [];
            var series = part.series || [];

            if (dates.length === 0 || series.length === 0) {
                $('#' + chartId).html('<p class="empty-hint">该部位暂无缺陷数据</p>');
                return;
            }

            var traces = [];
            series.forEach(function (s, si) {
                var color = colorPalette[si % colorPalette.length];
                // 用 rgba 生成半透明填充色
                var fillColor = 'rgba(' + hexToRgb(color) + ', 0.08)';
                traces.push({
                    x: dates,
                    y: s.values,
                    mode: 'lines+markers',
                    name: s.name + ' (' + s.grade + '类)',
                    line: { color: color, width: 2.5, shape: 'spline', smoothing: 0.3 },
                    marker: { size: 7, color: color, line: { width: 2, color: '#fff' } },
                    fill: 'tozeroy',
                    fillcolor: fillColor,
                    hovertemplate: '<b>' + s.name + '</b><br>日期: %{x}<br>缺陷数: %{y}个<extra></extra>'
                });
            });

            var layout = {
                height: 360,
                font: { family: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif', size: 11, color: '#374151' },
                margin: { l: 56, r: 32, t: 16, b: 60 },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.28,
                    x: 0.5,
                    xanchor: 'center',
                    font: { size: 10, color: '#6B7280' },
                    bgcolor: '#F9FAFB',
                    bordercolor: '#E5E7EB',
                    borderwidth: 1
                },
                plot_bgcolor: '#FAFBFC',
                paper_bgcolor: '#FFFFFF',
                hovermode: 'closest',
                xaxis: {
                    title: { text: '日期', font: { size: 11, color: '#6B7280' } },
                    type: 'category',
                    tickangle: -25,
                    tickfont: { size: 10, color: '#6B7280' },
                    gridcolor: '#F0F1F3',
                    zeroline: false,
                    linecolor: '#E5E7EB',
                    linewidth: 1
                },
                yaxis: {
                    title: { text: '缺陷数量（个）', font: { size: 11, color: '#6B7280' } },
                    gridcolor: '#F0F1F3',
                    zerolinecolor: '#D1D5DB',
                    zerolinewidth: 1,
                    dtick: 1,
                    tickfont: { size: 10, color: '#6B7280' },
                    linecolor: '#E5E7EB',
                    linewidth: 1
                }
            };

            var config = {
                responsive: true,
                displayModeBar: false,
                scrollZoom: false
            };
            Plotly.newPlot(chartId, traces, layout, config);
        });
    }).fail(function () {
        $('#caseDefectContainer').html('<p class="empty-hint">数据加载失败，请检查网络连接</p>');
    });
}

// hex颜色转rgb数值（用于生成半透明rgba）
function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return parseInt(h.substring(0, 2), 16) + ', '
         + parseInt(h.substring(2, 4), 16) + ', '
         + parseInt(h.substring(4, 6), 16);
}

// ==================== 条装外观缺陷分析 ====================
function loadCartonDefect(startDate, endDate, brand, partnerSite, shift, team) {
    var url = 'api/chart/carton-defect?startDate=' + encodeURIComponent(startDate)
            + '&endDate=' + encodeURIComponent(endDate);
    if (brand) url += '&brand=' + encodeURIComponent(brand);
    if (partnerSite) url += '&partnerSite=' + encodeURIComponent(partnerSite);
    if (shift) url += '&shift=' + encodeURIComponent(shift);
    if (team) url += '&team=' + encodeURIComponent(team);

    $.get(url, function (data) {
        var bodyParts = data.bodyParts || [];
        var chartData = data.data || {};

        if (bodyParts.length === 0) {
            $('#cartonDefectContainer').html('<p class="empty-hint">暂无数据</p>');
            return;
        }

        var colorPalette = [
            '#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED',
            '#EA580C', '#0891B2', '#DB2777', '#4F46E5', '#65A30D',
            '#9333EA', '#0284C7', '#E11D48', '#059669', '#CA8A04',
            '#6D28D9', '#0EA5E9'
        ];

        var html = '';
        bodyParts.forEach(function (bp, idx) {
            var chartId = 'cartonDefectChart_' + idx;
            html += '<div class="case-defect-part">';
            html += '<div class="case-defect-part-title">' + bp + '</div>';
            html += '<div id="' + chartId + '" class="case-defect-chart"></div>';
            html += '</div>';
        });
        $('#cartonDefectContainer').html(html);

        bodyParts.forEach(function (bp, idx) {
            var part = chartData[bp];
            if (!part) return;
            var chartId = 'cartonDefectChart_' + idx;
            var dates = part.dates || [];
            var series = part.series || [];

            if (dates.length === 0 || series.length === 0) {
                $('#' + chartId).html('<p class="empty-hint">该部位暂无缺陷数据</p>');
                return;
            }

            var traces = [];
            series.forEach(function (s, si) {
                var color = colorPalette[si % colorPalette.length];
                var fillColor = 'rgba(' + hexToRgb(color) + ', 0.08)';
                traces.push({
                    x: dates,
                    y: s.values,
                    mode: 'lines+markers',
                    name: s.name + ' (' + s.grade + '类)',
                    line: { color: color, width: 2.5, shape: 'spline', smoothing: 0.3 },
                    marker: { size: 7, color: color, line: { width: 2, color: '#fff' } },
                    fill: 'tozeroy',
                    fillcolor: fillColor,
                    hovertemplate: '<b>' + s.name + '</b><br>日期: %{x}<br>缺陷数: %{y}个<extra></extra>'
                });
            });

            var layout = {
                height: 360,
                font: { family: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif', size: 11, color: '#374151' },
                margin: { l: 56, r: 32, t: 16, b: 60 },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.28,
                    x: 0.5,
                    xanchor: 'center',
                    font: { size: 10, color: '#6B7280' },
                    bgcolor: '#F9FAFB',
                    bordercolor: '#E5E7EB',
                    borderwidth: 1
                },
                plot_bgcolor: '#FAFBFC',
                paper_bgcolor: '#FFFFFF',
                hovermode: 'closest',
                xaxis: {
                    title: { text: '日期', font: { size: 11, color: '#6B7280' } },
                    type: 'category',
                    tickangle: -25,
                    tickfont: { size: 10, color: '#6B7280' },
                    gridcolor: '#F0F1F3',
                    zeroline: false,
                    linecolor: '#E5E7EB',
                    linewidth: 1
                },
                yaxis: {
                    title: { text: '缺陷数量（条）', font: { size: 11, color: '#6B7280' } },
                    gridcolor: '#F0F1F3',
                    zerolinecolor: '#D1D5DB',
                    zerolinewidth: 1,
                    dtick: 1,
                    tickfont: { size: 10, color: '#6B7280' },
                    linecolor: '#E5E7EB',
                    linewidth: 1
                }
            };

            var config = { responsive: true, displayModeBar: false, scrollZoom: false };
            Plotly.newPlot(chartId, traces, layout, config);
        });
    }).fail(function () {
        $('#cartonDefectContainer').html('<p class="empty-hint">数据加载失败，请检查网络连接</p>');
    });
}

// ==================== 盒装外观缺陷分析 ====================
function loadBoxDefect(startDate, endDate, brand, partnerSite, shift, team) {
    var url = 'api/chart/box-defect?startDate=' + encodeURIComponent(startDate)
            + '&endDate=' + encodeURIComponent(endDate);
    if (brand) url += '&brand=' + encodeURIComponent(brand);
    if (partnerSite) url += '&partnerSite=' + encodeURIComponent(partnerSite);
    if (shift) url += '&shift=' + encodeURIComponent(shift);
    if (team) url += '&team=' + encodeURIComponent(team);

    $.get(url, function (data) {
        var bodyParts = data.bodyParts || [];
        var chartData = data.data || {};

        if (bodyParts.length === 0) {
            $('#boxDefectContainer').html('<p class="empty-hint">暂无数据</p>');
            return;
        }

        var colorPalette = [
            '#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED',
            '#EA580C', '#0891B2', '#DB2777', '#4F46E5', '#65A30D',
            '#9333EA', '#0284C7', '#E11D48', '#059669', '#CA8A04',
            '#6D28D9', '#0EA5E9'
        ];

        var html = '';
        bodyParts.forEach(function (bp, idx) {
            var chartId = 'boxDefectChart_' + idx;
            html += '<div class="case-defect-part">';
            html += '<div class="case-defect-part-title">' + bp + '</div>';
            html += '<div id="' + chartId + '" class="case-defect-chart"></div>';
            html += '</div>';
        });
        $('#boxDefectContainer').html(html);

        bodyParts.forEach(function (bp, idx) {
            var part = chartData[bp];
            if (!part) return;
            var chartId = 'boxDefectChart_' + idx;
            var dates = part.dates || [];
            var series = part.series || [];

            if (dates.length === 0 || series.length === 0) {
                $('#' + chartId).html('<p class="empty-hint">该部位暂无缺陷数据</p>');
                return;
            }

            var traces = [];
            series.forEach(function (s, si) {
                var color = colorPalette[si % colorPalette.length];
                var fillColor = 'rgba(' + hexToRgb(color) + ', 0.08)';
                traces.push({
                    x: dates,
                    y: s.values,
                    mode: 'lines+markers',
                    name: s.name + ' (' + s.grade + '类)',
                    line: { color: color, width: 2.5, shape: 'spline', smoothing: 0.3 },
                    marker: { size: 7, color: color, line: { width: 2, color: '#fff' } },
                    fill: 'tozeroy',
                    fillcolor: fillColor,
                    hovertemplate: '<b>' + s.name + '</b><br>日期: %{x}<br>缺陷数: %{y}个<extra></extra>'
                });
            });

            var layout = {
                height: 360,
                font: { family: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif', size: 11, color: '#374151' },
                margin: { l: 56, r: 32, t: 16, b: 60 },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.28,
                    x: 0.5,
                    xanchor: 'center',
                    font: { size: 10, color: '#6B7280' },
                    bgcolor: '#F9FAFB',
                    bordercolor: '#E5E7EB',
                    borderwidth: 1
                },
                plot_bgcolor: '#FAFBFC',
                paper_bgcolor: '#FFFFFF',
                hovermode: 'closest',
                xaxis: {
                    title: { text: '日期', font: { size: 11, color: '#6B7280' } },
                    type: 'category',
                    tickangle: -25,
                    tickfont: { size: 10, color: '#6B7280' },
                    gridcolor: '#F0F1F3',
                    zeroline: false,
                    linecolor: '#E5E7EB',
                    linewidth: 1
                },
                yaxis: {
                    title: { text: '缺陷数量（个）', font: { size: 11, color: '#6B7280' } },
                    gridcolor: '#F0F1F3',
                    zerolinecolor: '#D1D5DB',
                    zerolinewidth: 1,
                    dtick: 1,
                    tickfont: { size: 10, color: '#6B7280' },
                    linecolor: '#E5E7EB',
                    linewidth: 1
                }
            };

            var config = { responsive: true, displayModeBar: false, scrollZoom: false };
            Plotly.newPlot(chartId, traces, layout, config);
        });
    }).fail(function () {
        $('#boxDefectContainer').html('<p class="empty-hint">数据加载失败，请检查网络连接</p>');
    });
}

// ==================== 烟支外观缺陷分析 ====================
function loadCigDefect(startDate, endDate, brand, partnerSite, shift, team) {
    var url = 'api/chart/cig-defect?startDate=' + encodeURIComponent(startDate)
            + '&endDate=' + encodeURIComponent(endDate);
    if (brand) url += '&brand=' + encodeURIComponent(brand);
    if (partnerSite) url += '&partnerSite=' + encodeURIComponent(partnerSite);
    if (shift) url += '&shift=' + encodeURIComponent(shift);
    if (team) url += '&team=' + encodeURIComponent(team);

    $.get(url, function (data) {
        var bodyParts = data.bodyParts || [];
        var chartData = data.data || {};

        if (bodyParts.length === 0) {
            $('#cigDefectContainer').html('<p class="empty-hint">暂无数据</p>');
            return;
        }

        var colorPalette = [
            '#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED',
            '#EA580C', '#0891B2', '#DB2777', '#4F46E5', '#65A30D',
            '#9333EA', '#0284C7', '#E11D48', '#059669', '#CA8A04',
            '#6D28D9', '#0EA5E9'
        ];

        var html = '';
        bodyParts.forEach(function (bp, idx) {
            var chartId = 'cigDefectChart_' + idx;
            html += '<div class="case-defect-part">';
            html += '<div class="case-defect-part-title">' + bp + '</div>';
            html += '<div id="' + chartId + '" class="case-defect-chart"></div>';
            html += '</div>';
        });
        $('#cigDefectContainer').html(html);

        bodyParts.forEach(function (bp, idx) {
            var part = chartData[bp];
            if (!part) return;
            var chartId = 'cigDefectChart_' + idx;
            var dates = part.dates || [];
            var series = part.series || [];

            if (dates.length === 0 || series.length === 0) {
                $('#' + chartId).html('<p class="empty-hint">该部位暂无缺陷数据</p>');
                return;
            }

            var traces = [];
            series.forEach(function (s, si) {
                var color = colorPalette[si % colorPalette.length];
                var fillColor = 'rgba(' + hexToRgb(color) + ', 0.08)';
                traces.push({
                    x: dates,
                    y: s.values,
                    mode: 'lines+markers',
                    name: s.name + ' (' + s.grade + '类)',
                    line: { color: color, width: 2.5, shape: 'spline', smoothing: 0.3 },
                    marker: { size: 7, color: color, line: { width: 2, color: '#fff' } },
                    fill: 'tozeroy',
                    fillcolor: fillColor,
                    hovertemplate: '<b>' + s.name + '</b><br>日期: %{x}<br>缺陷数: %{y}支<extra></extra>'
                });
            });

            var layout = {
                height: 360,
                font: { family: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif', size: 11, color: '#374151' },
                margin: { l: 56, r: 32, t: 16, b: 60 },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.28,
                    x: 0.5,
                    xanchor: 'center',
                    font: { size: 10, color: '#6B7280' },
                    bgcolor: '#F9FAFB',
                    bordercolor: '#E5E7EB',
                    borderwidth: 1
                },
                plot_bgcolor: '#FAFBFC',
                paper_bgcolor: '#FFFFFF',
                hovermode: 'closest',
                xaxis: {
                    title: { text: '日期', font: { size: 11, color: '#6B7280' } },
                    type: 'category',
                    tickangle: -25,
                    tickfont: { size: 10, color: '#6B7280' },
                    gridcolor: '#F0F1F3',
                    zeroline: false,
                    linecolor: '#E5E7EB',
                    linewidth: 1
                },
                yaxis: {
                    title: { text: '缺陷数量（支）', font: { size: 11, color: '#6B7280' } },
                    gridcolor: '#F0F1F3',
                    zerolinecolor: '#D1D5DB',
                    zerolinewidth: 1,
                    dtick: 1,
                    tickfont: { size: 10, color: '#6B7280' },
                    linecolor: '#E5E7EB',
                    linewidth: 1
                }
            };

            var config = { responsive: true, displayModeBar: false, scrollZoom: false };
            Plotly.newPlot(chartId, traces, layout, config);
        });
    }).fail(function () {
        $('#cigDefectContainer').html('<p class="empty-hint">数据加载失败，请检查网络连接</p>');
    });
}

// ==================== 板块4：AI预测大图 ====================
function loadPredict() {
    $.get('api/chart/predict', function (data) {
        if (!data.historyDates || data.historyDates.length === 0) {
            $('#predictChart').html('<p class="empty-hint">数据不足，至少需要2条记录方可预测</p>');
            return;
        }

        var traces = [];

        traces.push({
            x: data.historyDates, y: data.historyRates,
            mode: 'lines+markers', name: '历史缺陷数',
            line: { color: '#0071e3', width: 4 },
            marker: { size: 10, color: '#0071e3', line: { width: 2, color: '#fff' } },
            hovertemplate: '日期: %{x}<br>缺陷数: %{y}<extra></extra>'
        });

        if (data.predDates && data.predDates.length > 0) {
            traces.push({
                x: data.predDates, y: data.predYhat,
                mode: 'lines+markers', name: 'Holt-Winters预测曲线',
                line: { color: '#FF3B30', width: 3.5, dash: 'dash' },
                marker: { size: 9, color: '#FF3B30', symbol: 'diamond', line: { width: 2, color: '#fff' } },
                hovertemplate: '预测日期: %{x}<br>预测缺陷数: %{y}<extra></extra>'
            });

            var upperX = data.predDates.concat(data.predDates.slice().reverse());
            var upperY = data.predUpper.concat(data.predLower.slice().reverse());
            traces.push({
                x: upperX, y: upperY,
                fill: 'toself', fillcolor: 'rgba(255,59,48,0.15)',
                line: { color: 'rgba(0,0,0,0)' }, name: '95%置信区间',
                hovertemplate: '置信区间上界: %{y:.2f}%<extra></extra>'
            });

            if (data.hasRisk) {
                traces.push({
                    x: [data.predDates[0], data.predDates[data.predDates.length - 1]],
                    y: [0, 0], mode: 'none',
                    fill: 'tozeroy', fillcolor: 'rgba(255,59,48,0.08)',
                    showlegend: false
                });
            }
        }

        var layout = {
            title: {
                text: '综合缺陷趋势AI预测大图（Holt-Winters双参数指数平滑）',
                font: { size: 18, family: LAYOUT_FONT.family, color: '#1d1d1f' }
            },
            height: 520,
            font: LAYOUT_FONT,
            xaxis: { title: '日期（历史+未来7天预测）', tickfont: { size: 11 }, gridcolor: '#f0f0f0', tickangle: -30 },
            yaxis: { title: '缺陷数', tickfont: { size: 11 }, gridcolor: '#f0f0f0', zerolinecolor: '#e0e0e0' },
            legend: { orientation: 'h', y: 1.08, x: 0.5, xanchor: 'center', font: { size: 12 } },
            margin: { l: 70, r: 35, t: 65, b: 55 },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#fafafa',
            annotations: []
        };

        if (data.hasRisk && data.predDates && data.predDates.length > 0) {
            layout.annotations.push({
                x: data.predDates[Math.floor(data.predDates.length / 2)],
                y: Math.max.apply(null, data.predUpper) * 1.08,
                text: '⚠ 预判存在批量质量风险\n（预测上限超过历史均值1.5倍且A/B类缺陷>0）',
                showarrow: true, arrowhead: 2, arrowcolor: '#FF3B30',
                font: { color: '#FF3B30', size: 14 },
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: '#FF3B30', borderwidth: 2, borderpad: 8
            });
        }

        Plotly.newPlot('predictChart', traces, layout, { responsive: true, displayModeBar: true, modeBarButtonsToAdd: ['hoverClosestCartesian', 'hoverCompareCartesian'] });
    });
}

// ==================== 工具函数 ====================
function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/** 从物测子表数组中提取某个字段的均值（忽略零值，零值视为未填写） */
function avgPhysField(pms, field) {
    if (!pms || pms.length === 0) return '';
    var sum = 0, cnt = 0;
    pms.forEach(function(pm) {
        var v = pm[field];
        if (v != null && !isNaN(v) && parseFloat(v) !== 0) { sum += parseFloat(v); cnt++; }
    });
    if (cnt === 0) return '';
    var avg = sum / cnt;
    return avg.toFixed(2);
}
