<template>
  <main v-if="!me" class="admin-login-page">
    <form class="admin-login-card" data-testid="admin-login-form" @submit.prevent="login">
      <div class="login-logo-row">
        <AdminLogo class="logo-large" />
        <div>
          <h1>拾光心理</h1>
          <p>LightCatch 管理平台</p>
        </div>
      </div>

      <section class="login-title">
        <h2>管理员登录</h2>
        <p>请使用管理员账号登录管理后台</p>
      </section>

      <div v-if="loginError" class="login-error">账号或密码错误，请重新输入</div>

      <label class="field-block">
        <span>账号</span>
        <input v-model="loginForm.account" data-testid="admin-account" autocomplete="username" placeholder="请输入管理员账号" type="text" />
      </label>
      <label class="field-block">
        <span>密码</span>
        <input v-model="loginForm.password" data-testid="admin-password" autocomplete="current-password" placeholder="请输入密码" type="password" />
      </label>

      <div class="login-options">
        <label class="checkbox-line"><input v-model="loginForm.remember" type="checkbox" /> <span>记住我</span></label>
        <span>忘记密码请联系系统管理员</span>
      </div>

      <button class="btn btn-primary login-submit" data-testid="admin-login-submit" :disabled="loading" type="submit">{{ loading ? '登录中...' : '登 录' }}</button>
      <p class="login-footnote">仅供校内心理中心授权管理员使用</p>
    </form>
  </main>

  <main v-else class="admin-shell">
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <AdminLogo class="logo-sidebar" />
        <div>
          <h1>拾光心理</h1>
          <p>LightCatch 管理平台</p>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="管理员导航">
        <button
          v-for="item in navItems"
          :key="item.key"
          :class="{ active: activeNav === item.key }"
          type="button"
          @click="go(item.key)"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <button class="sidebar-user" type="button" @click="logout">
        <span class="sidebar-avatar">拾光</span>
        <span>
          <strong>超级管理员</strong>
          <small>退出登录</small>
        </span>
      </button>
    </aside>

    <section class="admin-main">
      <header class="admin-topbar">
        <div class="topbar-left">
          <Menu :size="24" />
          <div class="topbar-search">
            <Search :size="17" />
            <input :placeholder="searchPlaceholder" type="text" />
          </div>
        </div>
        <div class="topbar-right">
          <button class="bell-btn" type="button" @click="openModal('notice', '通知中心', '当前暂无待处理提醒。')">
            <Bell :size="24" />
          </button>
          <button class="topbar-profile" type="button" @click="page = 'settings'">
            <span class="avatar-img">拾</span>
            <span>管理员</span>
          </button>
        </div>
      </header>

      <div class="admin-content">
        <p v-if="notice" class="toast">{{ notice }}</p>

        <section v-if="page === 'dashboard'" class="page-section" data-testid="admin-dashboard">
          <h1 class="page-title">数据看板</h1>
          <p v-if="dashboardError" class="state-banner state-error">
            <span>{{ dashboardError }}</span>
            <button class="btn btn-light" type="button" @click="loadDashboard">重试</button>
          </p>
          <p v-else-if="dashboardLoading" class="state-banner">看板数据加载中...</p>
          <article class="brand-welcome-card custom-shadow">
            <div>
              <p>拾光心理 LightCatch</p>
              <h2>在阴霾中，陪你拾起内心的光与希望</h2>
              <span>青少年心理陪伴与成长支持</span>
            </div>
          </article>
          <div class="stat-grid stat-grid-four">
            <button v-for="item in dashboardStats.slice(0, 4)" :key="item.label" class="dashboard-stat custom-shadow" type="button" @click="go(item.target)">
              <div>
                <p>{{ item.label }}</p>
                <strong :class="item.textClass">{{ item.value }}</strong>
                <small :class="item.hintClass">{{ item.hint }}</small>
              </div>
              <span :class="['stat-icon', item.iconClass]"><component :is="item.icon" :size="26" /></span>
            </button>
          </div>
          <div class="stat-grid stat-grid-three">
            <button v-for="item in dashboardStats.slice(4)" :key="item.label" class="dashboard-stat custom-shadow" type="button" @click="go(item.target)">
              <div>
                <p>{{ item.label }}</p>
                <strong :class="item.textClass">{{ item.value }}</strong>
                <small :class="item.hintClass">{{ item.hint }}</small>
              </div>
              <span :class="['stat-icon', item.iconClass]"><component :is="item.icon" :size="26" /></span>
            </button>
          </div>

          <div class="chart-grid">
            <article class="panel-card custom-shadow">
              <h3>预约趋势（近7日）</h3>
              <div class="chart-box trend-bars" :class="{ empty: !dashboardTrend.length }">
                <template v-if="dashboardTrend.length">
                  <div v-for="item in dashboardTrend" :key="item.date" class="trend-bar-item">
                    <span class="trend-bar-value">{{ item.count }}</span>
                    <span class="trend-bar-track"><i :style="{ height: item.height + '%' }"></i></span>
                    <span class="trend-bar-label">{{ item.label }}</span>
                  </div>
                </template>
                <p v-else class="empty-state">近 7 日暂无预约数据</p>
                <div v-if="false">
                <svg class="trend-chart" viewBox="0 0 360 180" role="img" aria-label="预约趋势折线图">
                  <polyline points="16,136 70,106 124,118 178,72 232,86 286,58 344,76" />
                  <polygon points="16,136 70,106 124,118 178,72 232,86 286,58 344,76 344,164 16,164" />
                  <g>
                    <circle v-for="point in trendPoints" :key="point" :cx="point.split(',')[0]" :cy="point.split(',')[1]" r="4" />
                  </g>
                </svg>
                </div>
              </div>
            </article>
            <article class="panel-card custom-shadow">
              <h3>咨询类型分布</h3>
              <div class="chart-box chart-box-center type-distribution" :class="{ empty: !dashboardTypes.length }">
                <template v-if="dashboardTypes.length">
                  <div class="donut-chart" :style="{ background: typeDonutBackground }"></div>
                  <ul class="chart-legend">
                    <li v-for="item in dashboardTypes" :key="item.type"><span :style="{ background: item.color }"></span>{{ item.type }} {{ item.percent }}%</li>
                  </ul>
                </template>
                <p v-else class="empty-state">暂无咨询类型数据</p>
                <div v-if="false">
                <div class="donut-chart"></div>
                <ul class="chart-legend">
                  <li><span class="legend-blue"></span>常规咨询 45%</li>
                  <li><span class="legend-green"></span>初访评估 30%</li>
                  <li><span class="legend-orange"></span>危机干预 15%</li>
                </ul>
                </div>
              </div>
            </article>
          </div>
          <p class="inline-note dashboard-note">图表为概览展示，核心运营数据以接口统计卡片和最近预约列表为准。</p>

          <article class="panel-card custom-shadow">
            <h3>最近预约</h3>
            <p v-if="!recentDashboardAppointments.length" class="empty-state">暂无最近预约</p>
            <AdminTable v-else :columns="recentAppointmentColumns" :rows="recentDashboardAppointments" />
          </article>
        </section>

        <section v-if="page === 'students'" class="page-section" data-testid="admin-students">
          <div class="page-heading-row">
            <h1 class="page-title">学生管理</h1>
            <div class="heading-actions">
              <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="openAccountForm('students', 'add')">
                <Plus :size="17" />新增学生
              </button>
              <button class="btn btn-light" type="button" @click="downloadTemplate('students')">
                <Download :size="17" />下载模板
              </button>
              <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="openImportPicker('students')">
                <Plus :size="17" />导入学生
              </button>
              <input ref="studentImportInput" class="visually-hidden" type="file" accept=".xlsx" @change="handleImportFile($event, 'students')" />
              <button class="btn btn-light" type="button" disabled title="当前接口未提供学生导出文件">
                <Download :size="17" />导出不可用
              </button>
            </div>
          </div>

          <FilterCard>
            <label><span>关键词</span><input v-model="studentFilters.keyword" placeholder="输入搜索" type="text" /></label>
            <label><span>院系</span><select><option>全部院系</option><option>心理学系</option><option>计算机学院</option></select></label>
            <label><span>账号状态</span><select v-model="studentFilters.status"><option value="">全部状态</option><option value="active">启用</option><option value="disabled">禁用</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="loadStudents">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetStudentFilters">重置</button></div>
          </FilterCard>

          <section v-if="importState.open && importState.kind === 'students'" class="import-result-card custom-shadow">
            <div>
              <h3>{{ importState.title }}</h3>
              <p>{{ importState.summary }}</p>
            </div>
            <ul v-if="importState.errors.length">
              <li v-for="item in importState.errors" :key="`${item.rowNumber}-${item.field}-${item.message}`">
                第{{ item.rowNumber }}行 · {{ item.field }}：{{ item.message }}
              </li>
            </ul>
            <div v-if="importState.credentials.length" class="temporary-credentials">
              <p>以下临时密码仅显示一次，请通过安全渠道分别交付，并提醒用户首次登录立即修改。</p>
              <code v-for="item in importState.credentials" :key="item.account">{{ item.account }} · {{ item.name }} · {{ item.temporaryPassword }}</code>
              <button class="btn btn-light" type="button" @click="copyTemporaryCredentials(importState.credentials)">复制临时凭据</button>
            </div>
          </section>

          <AdminTable :columns="studentColumns" :rows="students">
            <template #actions="{ row }">
              <button class="link-btn" type="button" @click="openStudent(row)">查看</button>
              <button class="link-btn" type="button" @click="openAccountForm('students', 'edit', row)">编辑</button>
              <button class="link-btn" type="button" :disabled="actionBusy" @click="confirmResetPassword('students', row)">重置密码</button>
              <button :class="['link-btn', row.status === 'active' ? 'danger' : 'green']" type="button" :disabled="actionBusy" @click="toggleAccountStatus('students', row)">
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </button>
              <button class="link-btn danger" type="button" :disabled="actionBusy" @click="confirmDeleteStudent(row)">删除</button>
            </template>
          </AdminTable>
          <Pagination />
        </section>

        <section v-if="page === 'student_detail'" class="page-section">
          <button class="back-link" type="button" @click="page = 'students'">← 返回学生列表</button>
          <div class="profile-layout">
            <article class="profile-card custom-shadow">
              <div class="profile-hero">
                <img class="profile-avatar image" :src="currentStudent.avatarSrc" :alt="`${currentStudent.name}头像`" @error="useFallbackAvatar($event, studentDefaultAvatar)" />
                <h2>{{ currentStudent.name }}</h2>
                <p>学号：{{ currentStudent.studentNo }}</p>
                <p>{{ currentStudent.college }} · {{ currentStudent.grade }}</p>
                <span class="status-tag green">{{ currentStudent.status }}</span>
              </div>
              <div class="info-list">
                <p><span>性别</span><strong>{{ currentStudent.gender }}</strong></p>
                <p><span>校区</span><strong>{{ currentStudent.campus }}</strong></p>
                <p><span>累计咨询</span><strong>{{ currentStudent.sessions }} 次</strong></p>
                <p><span>首次咨询</span><strong>{{ currentStudent.firstConsultAt || '-' }}</strong></p>
                <p><span>最近咨询</span><strong>{{ currentStudent.lastConsultAt || '-' }}</strong></p>
              </div>
            </article>

            <div class="detail-stack">
              <article class="panel-card custom-shadow">
                <h3>咨询记录</h3>
                <Timeline :items="studentTimeline" />
              </article>
              <article class="panel-card custom-shadow">
                <h3>风险信息</h3>
                <div class="safe-line"><CheckCircle :size="18" />当前无风险标记</div>
              </article>
            </div>
          </div>
        </section>

        <section v-if="page === 'counselors'" class="page-section" data-testid="admin-counselors">
          <div class="page-heading-row">
            <h1 class="page-title">咨询师管理</h1>
            <div class="heading-actions">
              <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="openAccountForm('counselors', 'add')">
                <Plus :size="17" />新增咨询师
              </button>
              <button class="btn btn-light" type="button" @click="downloadTemplate('counselors')">
                <Download :size="17" />下载模板
              </button>
              <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="openImportPicker('counselors')">
                <Plus :size="17" />导入咨询师
              </button>
              <input ref="counselorImportInput" class="visually-hidden" type="file" accept=".xlsx" @change="handleImportFile($event, 'counselors')" />
            </div>
          </div>
          <FilterCard>
            <label><span>关键词</span><input v-model="counselorFilters.keyword" placeholder="搜索姓名、工号、职称" type="text" /></label>
            <label><span>账号状态</span><select v-model="counselorFilters.status"><option value="">全部状态</option><option value="active">启用</option><option value="disabled">禁用</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="loadCounselors">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetCounselorFilters">重置</button></div>
          </FilterCard>

          <section v-if="importState.open && importState.kind === 'counselors'" class="import-result-card custom-shadow">
            <div>
              <h3>{{ importState.title }}</h3>
              <p>{{ importState.summary }}</p>
            </div>
            <ul v-if="importState.errors.length">
              <li v-for="item in importState.errors" :key="`${item.rowNumber}-${item.field}-${item.message}`">
                第{{ item.rowNumber }}行 · {{ item.field }}：{{ item.message }}
              </li>
            </ul>
            <div v-if="importState.credentials.length" class="temporary-credentials">
              <p>以下临时密码仅显示一次，请通过安全渠道分别交付，并提醒用户首次登录立即修改。</p>
              <code v-for="item in importState.credentials" :key="item.account">{{ item.account }} · {{ item.name }} · {{ item.temporaryPassword }}</code>
              <button class="btn btn-light" type="button" @click="copyTemporaryCredentials(importState.credentials)">复制临时凭据</button>
            </div>
          </section>

          <div class="counselor-grid">
            <article v-for="item in counselors" :key="item.id" class="counselor-card custom-shadow">
              <div class="counselor-head">
                <img class="profile-avatar image" :src="item.avatarSrc" :alt="`${item.name}头像`" @error="useFallbackAvatar($event, counselorDefaultAvatar)" />
                <div>
                  <h3><button class="link-title" type="button" @click="openCounselor(item)">{{ item.name }}</button></h3>
                  <p>{{ item.role }} · {{ item.campus }}</p>
                </div>
              </div>
              <div class="info-list compact">
                <p><span>擅长领域</span><strong>{{ item.specialties }}</strong></p>
                <p><span>本月已接</span><strong>{{ item.monthSessions }} 次</strong></p>
                <p><span>满意度</span><strong class="green-text">{{ item.rating }} ★</strong></p>
              </div>
              <div class="card-actions">
                <button class="link-btn" type="button" @click="openCounselor(item)">查看</button>
                <button class="link-btn" type="button" @click="openAccountForm('counselors', 'edit', item)">编辑</button>
                <button class="link-btn" type="button" :disabled="actionBusy" @click="confirmResetPassword('counselors', item)">重置密码</button>
                <button :class="['link-btn', item.status === 'active' ? 'danger' : 'green']" type="button" :disabled="actionBusy" @click="toggleAccountStatus('counselors', item)">
                  {{ item.status === 'active' ? '禁用' : '启用' }}
                </button>
              </div>
            </article>
          </div>
          <section v-if="!counselors.length" class="table-card custom-shadow empty-counselor-card">暂无数据</section>
        </section>

        <section v-if="page === 'counselor_detail'" class="page-section">
          <button class="back-link" type="button" @click="page = 'counselors'">← 返回咨询师列表</button>
          <div class="profile-layout">
            <article class="profile-card custom-shadow">
              <div class="profile-hero">
                <img class="profile-avatar image" :src="currentCounselor.avatarSrc" :alt="`${currentCounselor.name}头像`" @error="useFallbackAvatar($event, counselorDefaultAvatar)" />
                <h2>{{ currentCounselor.name }}</h2>
                <p>{{ currentCounselor.role }} · {{ currentCounselor.campus }}</p>
                <span class="status-tag green">在职</span>
              </div>
              <div class="info-list">
                <p><span>工号</span><strong>{{ currentCounselor.jobNo }}</strong></p>
                <p><span>擅长领域</span><strong>{{ currentCounselor.specialties }}</strong></p>
                <p><span>本月已接</span><strong>{{ currentCounselor.monthSessions }} 次</strong></p>
                <p><span>总咨询量</span><strong>{{ currentCounselor.totalSessions }} 次</strong></p>
                <p><span>满意度</span><strong class="green-text">{{ currentCounselor.rating }} ★</strong></p>
              </div>
            </article>
            <div class="detail-stack">
              <article class="panel-card custom-shadow">
                <h3>近期预约</h3>
                <AdminTable :columns="counselorAppointmentColumns" :rows="appointments.slice(0, 2)" />
              </article>
              <article class="panel-card custom-shadow">
                <h3>本周排班</h3>
                <div class="weekly-list">
                  <p v-for="item in currentCounselor.week" :key="item.day"><span>{{ item.day }}</span><strong>{{ item.time }}</strong></p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section v-if="page === 'appointments'" class="page-section" data-testid="admin-appointments">
          <h1 class="page-title">预约管理</h1>
          <FilterCard>
            <label><span>关键词</span><input v-model="appointmentFilters.keyword" placeholder="搜索学生/咨询师..." type="text" /></label>
            <label><span>预约状态</span><select v-model="appointmentFilters.status"><option value="">全部状态</option><option value="pending">待确认</option><option value="confirmed">已确认</option><option value="in_progress">咨询中</option><option value="completed">已完成</option><option value="cancelled">已取消</option><option value="rejected">已拒绝</option></select></label>
            <label><span>咨询类型</span><select v-model="appointmentFilters.type"><option value="">全部类型</option><option>首次咨询</option><option>常规咨询</option><option>初访评估</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="loadAppointments">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetAppointmentFilters">重置</button></div>
          </FilterCard>
          <AdminTable :columns="appointmentColumns" :rows="displayedAppointments">
            <template #actions="{ row }">
              <button class="link-btn" type="button" @click="openAppointment(row)">查看详情</button>
              <button class="link-btn green" type="button" disabled title="管理端本批仅查看预约状态，处理操作由咨询师端完成">确认</button>
              <button class="link-btn danger" type="button" disabled title="管理端本批仅查看预约状态，处理操作由咨询师端完成">拒绝</button>
              <button class="link-btn green" type="button" disabled title="管理端本批仅查看预约状态，签到操作由咨询师端完成">签到</button>
            </template>
          </AdminTable>
          <Pagination />
        </section>

        <section v-if="page === 'appointment_detail'" class="page-section">
          <div class="detail-topbar">
            <div class="breadcrumb-line">
              <button type="button" @click="page = 'appointments'">预约管理</button>
              <span>/</span>
              <strong>预约详情</strong>
            </div>
            <button class="btn btn-light" type="button" @click="page = 'appointments'">← 返回预约管理</button>
          </div>

          <article class="detail-status-card custom-shadow">
            <div class="status-main">
              <p><span>预约编号：</span><strong>{{ currentAppointment.code || '-' }}</strong><span :class="['status-tag', appointmentStatusColor(currentAppointment.status)]">{{ currentAppointment.status }}</span></p>
              <div class="status-meta">
                <span><CalendarClock :size="16" />{{ currentAppointment.time }}</span>
                <span><ClipboardCheck :size="16" />咨询类型：{{ currentAppointment.type }}</span>
              </div>
            </div>
          </article>

          <div class="detail-grid-two">
            <article class="panel-card custom-shadow">
              <h3 class="card-title-icon blue"><Users :size="18" />学生信息</h3>
              <div class="info-list detail-info">
                <p><span>姓名</span><strong>{{ currentAppointment.student || '-' }}</strong></p>
                <p><span>学号</span><strong>{{ currentAppointment.detail?.studentNo || '-' }}</strong></p>
                <p><span>学院/班级</span><strong>{{ currentAppointment.detail?.studentClass || '-' }}</strong></p>
                <p><span>手机号</span><strong>{{ currentAppointment.detail?.studentPhone || '-' }}</strong></p>
                <p><span>风险等级</span><strong><span class="status-tag gray">{{ currentAppointment.detail?.riskLevel || '未筛查' }}</span></strong></p>
              </div>
              <button class="link-btn detail-link" type="button" :disabled="actionBusy" @click="openAppointmentRelated('student_detail')">查看学生档案</button>
            </article>
            <article class="panel-card custom-shadow">
              <h3 class="card-title-icon mint"><Stethoscope :size="18" />咨询师信息</h3>
              <div class="info-list detail-info">
                <p><span>姓名</span><strong>{{ currentAppointment.counselor || '-' }}</strong></p>
                <p><span>工号</span><strong>{{ currentAppointment.detail?.counselorNo || '-' }}</strong></p>
                <p><span>校区</span><strong>{{ currentAppointment.detail?.campus || '-' }}</strong></p>
                <p><span>擅长方向</span><strong>{{ currentAppointment.detail?.specialties || '-' }}</strong></p>
                <p><span>咨询室</span><strong>{{ currentAppointment.detail?.room || '-' }}</strong></p>
              </div>
              <button class="link-btn detail-link" type="button" :disabled="actionBusy" @click="openAppointmentRelated('counselor_detail')">查看咨询师详情</button>
            </article>
          </div>

          <article class="panel-card custom-shadow">
            <h3 class="card-title-icon blue"><FilePenLine :size="18" />预约申请信息</h3>
            <div class="detail-field-grid">
              <p><span>主诉/预约原因：</span>{{ currentAppointment.detail?.concern || '-' }}</p>
              <p><span>希望解决的问题：</span>{{ currentAppointment.type || '-' }}</p>
              <p><span>是否首次咨询：</span>{{ currentAppointment.type === '首次咨询' ? '是' : '-' }}</p>
              <p><span>备注：</span>{{ currentAppointment.detail?.note || '-' }}</p>
            </div>
          </article>

          <article class="panel-card custom-shadow">
            <h3 class="card-title-icon blue"><ShieldCheck :size="18" />风险筛查结果</h3>
            <div class="risk-summary-line">
              <span>分数：<strong>{{ currentAppointment.detail?.riskScore || '-' }}</strong></span>
              <span>风险等级：<em class="status-tag gray">{{ currentAppointment.detail?.riskLevel || '未筛查' }}</em></span>
              <span>建议：{{ currentAppointment.detail?.riskAdvice || '-' }}</span>
              <button class="link-btn" type="button" disabled title="当前页面展示测评摘要">查看测评摘要</button>
            </div>
          </article>

          <article class="panel-card custom-shadow">
            <h3 class="card-title-icon blue"><History :size="18" />状态流转</h3>
            <div class="status-timeline">
              <div v-for="(item, index) in appointmentSteps" :key="item.label" :class="['status-step', { done: item.done }]">
                <span>{{ item.done ? '✓' : '' }}</span>
                <p>{{ item.label }}</p>
                <small>{{ item.time }}</small>
                <i v-if="index < appointmentSteps.length - 1"></i>
              </div>
            </div>
          </article>

          <article class="table-card custom-shadow">
            <div class="table-title-row"><h3 class="card-title-icon blue"><History :size="18" />操作记录</h3></div>
            <table>
              <thead><tr><th>时间</th><th>操作人</th><th>操作类型</th><th>说明</th></tr></thead>
              <tbody>
                <tr v-for="record in appointmentLogs" :key="record.time">
                  <td>{{ record.time }}</td>
                  <td>{{ record.operator }}</td>
                  <td><span :class="['status-tag', record.color]">{{ record.action }}</span></td>
                  <td>{{ record.desc }}</td>
                </tr>
              </tbody>
            </table>
          </article>

          <div class="detail-bottom-actions">
            <div>
              <button class="btn btn-light" type="button" @click="page = 'appointments'">← 返回列表</button>
              <button class="btn btn-light" type="button" disabled title="当前接口未提供预约操作记录导出文件"><Download :size="16" />导出不可用</button>
            </div>
            <button class="btn btn-danger-outline" type="button" @click="openModal('abnormal-appointment', '确认标记为异常', '标记为异常后该预约将进入异常流程。', { danger: true, confirmText: '确认标记' })">
              <AlertTriangle :size="16" />标记异常
            </button>
          </div>
        </section>

        <section v-if="page === 'scheduling'" class="page-section">
          <h1 class="page-title">排班管理</h1>
          <article class="panel-card custom-shadow">
            <div class="schedule-head">
              <div class="week-switch">
                <button type="button"><ChevronLeft :size="18" /></button>
                <strong>当前周排班</strong>
                <button type="button"><ChevronRight :size="18" /></button>
              </div>
              <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="openScheduleForm('add')">
                <Plus :size="17" />新增排班
              </button>
            </div>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>咨询师</th>
                  <th v-for="day in scheduleDays" :key="day.label">{{ day.label }}<small>{{ day.date }}</small></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in scheduleRows" :key="row.name">
                  <td>{{ row.name }}</td>
                  <td v-for="slot in row.slots" :key="slot.day"><span :class="['schedule-pill', slot.rest ? 'rest' : 'work']">{{ slot.text }}</span></td>
                </tr>
              </tbody>
            </table>
          </article>
          <AdminTable :columns="scheduleColumns" :rows="schedules">
            <template #actions="{ row }">
              <button class="link-btn" type="button" :disabled="!canManageSchedule(row) || actionBusy" @click="openScheduleForm('edit', row)">编辑</button>
              <button class="link-btn danger" type="button" :disabled="!canManageSchedule(row) || actionBusy" @click="confirmDisableSchedule(row)">禁用</button>
            </template>
          </AdminTable>
        </section>

        <section v-if="page === 'shift_approval'" class="page-section">
          <h1 class="page-title">调班审批</h1>
          <TabBar :items="['待审批', '已通过', '已拒绝']" />
          <div class="approval-list">
            <article v-for="item in shifts" :key="item.id" class="approval-card custom-shadow">
              <div>
                <h3>{{ item.teacher }} 申请调班</h3>
                <p>{{ item.from }} → {{ item.to }}</p>
                <small>原因：{{ item.reason }}</small>
              </div>
              <div class="approval-actions">
                <button class="btn btn-success" type="button" :disabled="item.status !== 'pending' || actionBusy" @click="confirmShiftAction(item, 'approve')">通过</button>
                <button class="btn btn-danger-outline" type="button" :disabled="item.status !== 'pending' || actionBusy" @click="confirmShiftAction(item, 'reject')">拒绝</button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="page === 'risk_center'" class="page-section">
          <h1 class="page-title">风险预警中心</h1>
          <div class="risk-stat-grid">
            <article class="risk-stat red custom-shadow"><div><p>高风险</p><strong>{{ riskSummary.high }}</strong></div><AlertTriangle :size="34" /><small>需立即干预</small></article>
            <article class="risk-stat orange custom-shadow"><div><p>中风险</p><strong>{{ riskSummary.medium }}</strong></div><CircleAlert :size="34" /><small>需关注</small></article>
            <article class="risk-stat yellow custom-shadow"><div><p>低风险</p><strong>{{ riskSummary.low }}</strong></div><Info :size="34" /><small>常规提醒</small></article>
          </div>
          <AdminTable :columns="riskColumns" :rows="risks">
            <template #actions="{ row }">
              <button class="link-btn" type="button" @click="openRiskDetail(row)">查看详情</button>
              <button v-if="row.status !== 'closed'" class="link-btn" type="button" :disabled="actionBusy" @click="confirmRiskFollowup(row)">添加跟进</button>
              <button v-if="row.status !== 'closed'" class="link-btn green" type="button" :disabled="actionBusy" @click="confirmRiskClose(row)">关闭风险</button>
            </template>
          </AdminTable>
        </section>

        <section v-if="page === 'referral'" class="page-section">
          <h1 class="page-title">转介管理</h1>
          <TabBar :items="['全部', '待接收', '已接收', '已完成']" />
          <div class="referral-list">
            <article v-for="item in referrals" :key="item.id" class="referral-card custom-shadow">
              <div class="referral-main">
                <img class="profile-avatar small image" :src="item.avatarSrc" :alt="`${item.student}头像`" @error="useFallbackAvatar($event, studentDefaultAvatar)" />
                <div>
                  <h3>转介：{{ item.student }}（{{ item.from }} → {{ item.to }}）</h3>
                  <p>原因：{{ item.reason }}</p>
                  <small>发起时间：{{ item.createdAt }}</small>
                </div>
              </div>
              <div v-if="item.status === 'pending'" class="referral-actions">
                <button class="btn btn-success" type="button" :disabled="actionBusy" @click="confirmReferralAction(item, 'approve')">审批通过</button>
                <button class="btn btn-danger-outline" type="button" :disabled="actionBusy" @click="confirmReferralAction(item, 'reject')">审批拒绝</button>
              </div>
              <span v-else :class="['status-tag', statusTagColor(item.status)]">{{ statusLabel(item.status) }}</span>
            </article>
          </div>
        </section>

        <section v-if="page === 'system_feedbacks'" class="page-section">
          <div class="page-heading-row">
            <div>
              <h1 class="page-title">系统反馈</h1>
              <p class="page-subtitle">处理学生提交的系统问题、体验建议和数据反馈</p>
            </div>
          </div>
          <FilterCard>
            <label><span>反馈状态</span><select v-model="systemFeedbackFilters.status"><option value="">全部状态</option><option value="pending">待处理</option><option value="processing">处理中</option><option value="resolved">已解决</option><option value="closed">已关闭</option></select></label>
            <label><span>反馈类型</span><select v-model="systemFeedbackFilters.type"><option value="">全部类型</option><option>系统问题</option><option>体验建议</option><option>数据错误</option><option>其他</option></select></label>
            <label><span>每页数量</span><select v-model.number="systemFeedbackFilters.pageSize"><option :value="10">10 条</option><option :value="20">20 条</option><option :value="50">50 条</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="applySystemFeedbackFilters">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetSystemFeedbackFilters">重置</button></div>
          </FilterCard>
          <AdminTable :columns="systemFeedbackColumns" :rows="systemFeedbacks">
            <template #actions="{ row }">
              <button class="link-btn" type="button" :disabled="actionBusy" @click="openSystemFeedbackDetail(row)">查看详情</button>
              <button v-if="row.status === 'pending'" class="link-btn" type="button" :disabled="actionBusy" @click="confirmSystemFeedbackProcessing(row)">标记处理中</button>
              <button v-if="row.status !== 'closed'" class="link-btn green" type="button" :disabled="actionBusy" @click="confirmSystemFeedbackReply(row)">回复</button>
              <button v-if="row.status !== 'closed'" class="link-btn danger" type="button" :disabled="actionBusy" @click="confirmSystemFeedbackClose(row)">关闭</button>
            </template>
          </AdminTable>
          <div class="pagination">
            <button type="button" :disabled="systemFeedbackFilters.page <= 1 || dataLoading" @click="changeSystemFeedbackPage(-1)">上一页</button>
            <button class="active" type="button">{{ systemFeedbackFilters.page }}</button>
            <button type="button" :disabled="systemFeedbackFilters.page * systemFeedbackFilters.pageSize >= systemFeedbackTotal || dataLoading" @click="changeSystemFeedbackPage(1)">下一页</button>
            <span>共 {{ systemFeedbackTotal }} 条</span>
          </div>

          <article v-if="selectedSystemFeedback" class="panel-card custom-shadow">
            <div class="page-heading-row">
              <div>
                <h3 class="card-title-icon blue"><Info :size="18" />反馈详情</h3>
                <p class="page-subtitle">编号：{{ selectedSystemFeedback.id }}</p>
              </div>
              <span :class="['status-tag', statusTagColor(selectedSystemFeedback.status)]">{{ statusLabel(selectedSystemFeedback.status) }}</span>
            </div>
            <div class="detail-grid-two">
              <div class="info-list detail-info">
                <p><span>学生姓名</span><strong>{{ selectedSystemFeedback.studentName }}</strong></p>
                <p><span>学号</span><strong>{{ selectedSystemFeedback.studentNo }}</strong></p>
                <p><span>学院</span><strong>{{ selectedSystemFeedback.college }}</strong></p>
                <p><span>联系方式</span><strong>{{ selectedSystemFeedback.contact }}</strong></p>
              </div>
              <div class="info-list detail-info">
                <p><span>反馈类型</span><strong>{{ selectedSystemFeedback.type }}</strong></p>
                <p><span>提交时间</span><strong>{{ selectedSystemFeedback.createdAtText }}</strong></p>
                <p><span>处理人</span><strong>{{ selectedSystemFeedback.handledByText }}</strong></p>
                <p><span>处理时间</span><strong>{{ selectedSystemFeedback.handledAtText }}</strong></p>
              </div>
            </div>
            <div class="detail-field-grid">
              <p class="full"><span>反馈内容：</span>{{ selectedSystemFeedback.content }}</p>
              <p class="full"><span>管理员回复：</span>{{ selectedSystemFeedback.adminReply || '暂未回复' }}</p>
            </div>
            <div class="form-actions">
              <button v-if="selectedSystemFeedback.status === 'pending'" class="btn btn-light" type="button" :disabled="actionBusy" @click="confirmSystemFeedbackProcessing(selectedSystemFeedback)">标记处理中</button>
              <button v-if="selectedSystemFeedback.status !== 'closed'" class="btn btn-primary" type="button" :disabled="actionBusy" @click="confirmSystemFeedbackReply(selectedSystemFeedback)">回复反馈</button>
              <button v-if="selectedSystemFeedback.status !== 'closed'" class="btn btn-danger-outline" type="button" :disabled="actionBusy" @click="confirmSystemFeedbackClose(selectedSystemFeedback)">关闭反馈</button>
            </div>
          </article>
        </section>

        <section v-if="page === 'assessments'" class="page-section">
          <div class="page-heading-row">
            <div>
              <h1 class="page-title">测评管理</h1>
              <p class="page-subtitle">管理学生端心理测评、题目配置与测评结果</p>
            </div>
            <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="openAssessmentForm('add')">
              <Plus :size="17" />新增测评
            </button>
          </div>
          <FilterCard>
            <label><span>测评状态</span><select v-model="assessmentFilters.status"><option value="">全部状态</option><option value="active">启用</option><option value="inactive">停用</option><option value="archived">已归档</option></select></label>
            <label><span>关键词</span><input v-model="assessmentFilters.keyword" placeholder="搜索测评标题或说明" type="text" /></label>
            <label><span>每页数量</span><select v-model.number="assessmentFilters.pageSize"><option :value="10">10 条</option><option :value="20">20 条</option><option :value="50">50 条</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="applyAssessmentFilters">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetAssessmentFilters">重置</button></div>
          </FilterCard>
          <AdminTable :columns="assessmentColumns" :rows="assessments">
            <template #actions="{ row }">
              <button class="link-btn" type="button" :disabled="actionBusy" @click="openAssessmentDetail(row)">查看</button>
              <button v-if="row.status !== 'archived'" class="link-btn" type="button" :disabled="actionBusy" @click="openAssessmentForm('edit', row)">编辑</button>
              <button v-if="row.status !== 'archived'" class="link-btn" type="button" :disabled="actionBusy" @click="toggleAssessmentStatus(row)">{{ row.status === 'active' ? '停用' : '启用' }}</button>
              <button class="link-btn" type="button" :disabled="actionBusy" @click="openAssessmentResults(row)">结果</button>
              <button v-if="row.status !== 'archived'" class="link-btn danger" type="button" :disabled="actionBusy" @click="confirmArchiveAssessment(row)">归档</button>
            </template>
          </AdminTable>
          <div class="pagination">
            <button type="button" :disabled="assessmentFilters.page <= 1 || dataLoading" @click="changeAssessmentPage(-1)">上一页</button>
            <button class="active" type="button">{{ assessmentFilters.page }}</button>
            <button type="button" :disabled="assessmentFilters.page * assessmentFilters.pageSize >= assessmentTotal || dataLoading" @click="changeAssessmentPage(1)">下一页</button>
            <span>共 {{ assessmentTotal }} 条</span>
          </div>

          <article v-if="selectedAssessment" class="panel-card custom-shadow">
            <div class="page-heading-row">
              <div>
                <h3 class="card-title-icon blue"><ShieldCheck :size="18" />测评详情</h3>
                <p class="page-subtitle">编号：{{ selectedAssessment.code || selectedAssessment.id }}</p>
              </div>
              <span :class="['status-tag', statusTagColor(selectedAssessment.status)]">{{ statusLabel(selectedAssessment.status) }}</span>
            </div>
            <div class="detail-grid-two">
              <div class="info-list detail-info">
                <p><span>测评名称</span><strong>{{ selectedAssessment.title }}</strong></p>
                <p><span>测评类型</span><strong>{{ selectedAssessment.type }}</strong></p>
                <p><span>题目数量</span><strong>{{ selectedAssessment.questionCount }}</strong></p>
                <p><span>更新时间</span><strong>{{ selectedAssessment.updatedAtText }}</strong></p>
              </div>
              <div class="info-list detail-info">
                <p><span>创建时间</span><strong>{{ selectedAssessment.createdAtText }}</strong></p>
                <p><span>当前状态</span><strong>{{ statusLabel(selectedAssessment.status) }}</strong></p>
                <p><span>说明</span><strong>{{ selectedAssessment.description || '-' }}</strong></p>
              </div>
            </div>
            <div class="detail-field-grid">
              <p v-for="item in selectedAssessment.questions" :key="item.id || item.order" class="full"><span>题目 {{ item.order }}：</span>{{ item.title }}<br />选项：{{ assessmentOptionText(item) }}</p>
            </div>
            <div class="form-actions">
              <button v-if="selectedAssessment.status !== 'archived'" class="btn btn-primary" type="button" :disabled="actionBusy" @click="openAssessmentForm('edit', selectedAssessment)">编辑测评</button>
              <button class="btn btn-light" type="button" :disabled="actionBusy" @click="openAssessmentResults(selectedAssessment)">查看结果</button>
              <button v-if="selectedAssessment.status !== 'archived'" class="btn btn-danger-outline" type="button" :disabled="actionBusy" @click="confirmArchiveAssessment(selectedAssessment)">归档测评</button>
            </div>
          </article>

          <article class="panel-card custom-shadow">
            <div class="page-heading-row">
              <div>
                <h3 class="card-title-icon blue"><ClipboardCheck :size="18" />测评结果</h3>
                <p class="page-subtitle">{{ assessmentResultFilters.assessmentId ? '当前按测评筛选结果' : '全部测评提交记录' }}</p>
              </div>
              <button class="btn btn-light" type="button" :disabled="dataLoading" @click="clearAssessmentResultFilter">查看全部结果</button>
            </div>
            <AdminTable :columns="assessmentResultColumns" :rows="assessmentResults" />
            <div class="pagination">
              <button type="button" :disabled="assessmentResultFilters.page <= 1 || dataLoading" @click="changeAssessmentResultPage(-1)">上一页</button>
              <button class="active" type="button">{{ assessmentResultFilters.page }}</button>
              <button type="button" :disabled="assessmentResultFilters.page * assessmentResultFilters.pageSize >= assessmentResultTotal || dataLoading" @click="changeAssessmentResultPage(1)">下一页</button>
              <span>共 {{ assessmentResultTotal }} 条</span>
            </div>
          </article>
        </section>

        <section v-if="page === 'articles'" class="page-section">
          <div class="page-heading-row">
            <h1 class="page-title">心理资讯管理</h1>
            <button class="btn btn-primary" type="button" @click="openArticleForm('add')">
              <Plus :size="17" />新增文章
            </button>
          </div>
          <FilterCard>
            <label><span>标题</span><input v-model="articleFilters.keyword" placeholder="搜索文章标题或摘要" type="text" /></label>
            <label><span>分类</span><select v-model="articleFilters.category"><option value="">全部分类</option><option>情绪调节</option><option>人际关系</option><option>学习压力</option><option>睡眠健康</option><option>危机应对</option></select></label>
            <label><span>状态</span><select v-model="articleFilters.status"><option value="">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option><option value="archived">已归档</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="loadArticles">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetArticleFilters">重置</button></div>
          </FilterCard>
          <AdminTable :columns="articleColumns" :rows="articles">
            <template #actions="{ row }">
              <button class="link-btn" type="button" @click="openArticleForm('edit', row)">编辑</button>
              <button class="link-btn danger" type="button" :disabled="actionBusy" @click="confirmArticleArchive(row)">删除</button>
            </template>
          </AdminTable>
          <Pagination single />
        </section>

        <section v-if="page === 'activities'" class="page-section">
          <div class="page-heading-row">
            <div>
              <h1 class="page-title">活动管理</h1>
              <p class="page-subtitle">管理校园心理健康活动与报名信息</p>
            </div>
            <div class="heading-actions">
              <button class="btn btn-primary" type="button" @click="openActivityForm('add')"><Plus :size="17" />新增活动</button>
              <button class="btn btn-light" type="button" disabled title="当前接口未提供活动报名导出文件"><Download :size="17" />导出不可用</button>
            </div>
          </div>
          <FilterCard class="filter-five">
            <label><span>活动名称</span><input v-model="activityFilters.keyword" placeholder="搜索活动名称或介绍" type="text" /></label>
            <label><span>活动类型</span><select v-model="activityFilters.category"><option value="">全部</option><option>团体辅导</option><option>心理讲座</option><option>工作坊</option><option>心理测评</option><option>心理健康月</option></select></label>
            <label><span>活动状态</span><select v-model="activityFilters.status"><option value="">全部</option><option value="published">已发布</option><option value="draft">草稿</option><option value="cancelled">已取消</option></select></label>
            <label><span>活动时间</span><input v-model="activityFilters.date" type="date" /></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="dataLoading" @click="loadActivities">查询</button><button class="btn btn-light" type="button" :disabled="dataLoading" @click="resetActivityFilters">重置</button></div>
          </FilterCard>
          <AdminTable :columns="activityColumns" :rows="activities">
            <template #actions="{ row }">
              <button class="link-btn" type="button" @click="openRegistrationDrawer(row)">报名名单</button>
              <button class="link-btn" type="button" @click="openActivityForm('edit', row)">编辑</button>
              <button class="link-btn danger" type="button" :disabled="actionBusy" @click="confirmActivityCancel(row)">取消</button>
            </template>
          </AdminTable>
          <Pagination single />
        </section>

        <section v-if="page === 'settings'" class="page-section settings-page">
          <div class="settings-inner">
            <h1 class="page-title">系统设置</h1>
            <TabBar :items="['基本设置', '预约规则', '通知设置', '安全设置']" settings />
            <article class="settings-form custom-shadow">
              <label><span>平台名称</span><input v-model="settingsForm.platformName" type="text" /></label>
              <label><span>咨询室数量</span><input :value="roomOptions.length" disabled type="number" /></label>
              <label><span>咨询时长（分钟）</span><select v-model.number="settingsForm.durationMinutes"><option :value="30">30</option><option :value="50">50</option><option :value="80">80</option></select></label>
              <label><span>最大提前预约天数</span><input v-model.number="settingsForm.advanceDays" type="number" /></label>
              <label><span>单日可请假次数上限</span><input v-model.number="settingsForm.dailyLeaveLimit" type="number" /></label>
              <div class="settings-checks">
                <label class="checkbox-line"><input v-model="settingsForm.autoConfirm" type="checkbox" /> <span>自动确认预约</span></label>
                <label class="checkbox-line"><input v-model="settingsForm.allowStudentCancel" type="checkbox" /> <span>允许学生取消预约</span></label>
              </div>
              <h3 class="form-subtitle">学生端首页轮播</h3>
              <p class="page-subtitle">轮播配置保存到系统设置，学生端首页实时读取；轮播内容只能选择已发布文章或活动。</p>
              <div v-for="(item, index) in homeCarouselItems" :key="item.localId" class="settings-carousel-item">
                <div class="form-grid two">
                  <label><span>内容类型</span><select v-model="item.type" @change="item.targetId = ''"><option value="article">文章</option><option value="activity">活动</option></select></label>
                  <label><span>选择内容</span><select v-model="item.targetId"><option value="">请选择</option><option v-for="target in carouselTargetOptions(item.type)" :key="target.id" :value="target.id">{{ target.title }}</option></select></label>
                  <label><span>标题</span><input v-model="item.title" placeholder="为空时使用内容标题" type="text" /></label>
                  <label><span>副标题</span><input v-model="item.subtitle" placeholder="可填写推荐语或分类" type="text" /></label>
                  <label><span>封面 URL</span><input v-model="item.cover" placeholder="填写已审核图片 URL；为空则使用内容封面或默认图标" type="url" /></label>
                  <label><span>排序</span><input v-model.number="item.order" min="1" type="number" /></label>
                </div>
                <div class="settings-checks">
                  <label class="checkbox-line"><input v-model="item.enabled" type="checkbox" /> <span>启用</span></label>
                  <button class="btn btn-light" type="button" :disabled="actionBusy" @click="removeCarouselItem(index)">移除</button>
                </div>
              </div>
              <button class="btn btn-light" type="button" :disabled="actionBusy" @click="addCarouselItem">新增轮播项</button>
              <div class="form-actions">
                <button class="btn btn-light" type="button" :disabled="actionBusy" @click="loadSettings">取消</button>
                <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="saveSettings">{{ actionBusy ? '保存中...' : '保存设置' }}</button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="page === 'campus'" class="page-section">
          <div class="page-heading-row">
            <h1 class="page-title">校区管理</h1>
            <button class="btn btn-primary" type="button" @click="openCampusForm('add')"><Plus :size="17" />新增校区</button>
          </div>
          <div class="campus-grid">
            <article v-for="item in campuses" :key="item.id || item.name" class="campus-card custom-shadow">
              <div class="campus-card-head">
                <h3>{{ item.name }}</h3>
                <span class="status-tag green">{{ item.status }}</span>
              </div>
              <div class="campus-facts">
                <p><span>咨询室</span><strong>{{ item.rooms }} 间</strong></p>
                <p><span>咨询师</span><strong>{{ item.counselors }} 人</strong></p>
                <p><span>地址</span><strong>{{ item.address }}</strong></p>
              </div>
              <div class="card-actions">
                <button class="link-btn" type="button" @click="openCampusForm('edit', item)" title="查看当前校区信息">编辑</button>
                <button class="link-btn danger" type="button" :disabled="actionBusy" @click="confirmCampusDisable(item)">禁用</button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="page === 'logs'" class="page-section">
          <h1 class="page-title">操作日志</h1>
          <FilterCard>
            <label><span>操作人</span><input disabled placeholder="当前显示最近100条真实日志" type="text" /></label>
            <label><span>操作类型</span><select disabled><option>全部类型</option><option>登录</option><option>审批</option><option>编辑</option></select></label>
            <label><span>时间范围</span><select disabled><option>最近100条</option><option>今天</option><option>本周</option></select></label>
            <div class="filter-actions"><button class="btn btn-primary" type="button" disabled title="当前接口按最近100条返回">查询</button><button class="btn btn-light" type="button" disabled title="当前接口按最近100条返回">重置</button></div>
          </FilterCard>
          <AdminTable :columns="logColumns" :rows="logs">
            <template #actions="{ row }">
              <button class="link-btn" type="button" @click="openLogDrawer(row)">查看详情</button>
            </template>
          </AdminTable>
          <Pagination single />
        </section>
      </div>
    </section>

    <div v-if="modal.open" class="modal-mask" @click.self="closeModal">
      <section class="modal-card">
        <div v-if="modal.icon" :class="['modal-icon', modal.icon]">
          <component :is="modal.icon === 'danger' ? AlertTriangle : modal.icon === 'success' ? CheckCircle : Info" :size="30" />
        </div>
        <h3>{{ modal.title }}</h3>
        <p>{{ modal.message }}</p>
        <textarea v-if="modal.textarea" v-model="modal.textValue" placeholder="请输入原因或记录..."></textarea>
        <div class="modal-actions">
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="closeModal">取消</button>
          <button :class="['btn', modal.danger ? 'btn-danger' : modal.success ? 'btn-success' : 'btn-primary']" type="button" :disabled="actionBusy" @click="confirmModal">
            {{ actionBusy ? '处理中...' : modal.confirmText }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="accountFormOpen" class="modal-mask" @click.self="closeAccountForm">
      <section class="form-modal large">
        <header class="form-modal-head">
          <h2>{{ accountFormMode === 'edit' ? `编辑${accountFormTitle}` : `新增${accountFormTitle}` }}</h2>
          <button type="button" :disabled="actionBusy" @click="closeAccountForm">×</button>
        </header>
        <div class="form-modal-body">
          <div v-if="accountFormKind === 'students'" class="form-grid two">
            <label><span>学号 <em>*</em></span><input v-model="accountForm.studentNo" :disabled="accountFormMode === 'edit'" placeholder="请输入学号" type="text" /></label>
            <label><span>姓名 <em>*</em></span><input v-model="accountForm.name" placeholder="请输入姓名" type="text" /></label>
            <label v-if="accountFormMode === 'add'"><span>身份核验码</span><input v-model="accountForm.idCardLast6" maxlength="6" placeholder="请输入6位数字" type="text" /></label>
            <label><span>性别</span><select v-model="accountForm.gender"><option value="">未填写</option><option>男</option><option>女</option></select></label>
            <label><span>学院 <em>*</em></span><input v-model="accountForm.college" placeholder="请输入学院" type="text" /></label>
            <label><span>专业</span><input v-model="accountForm.major" placeholder="请输入专业" type="text" /></label>
            <label><span>年级</span><input v-model="accountForm.grade" placeholder="请输入年级" type="text" /></label>
            <label><span>班级</span><input v-model="accountForm.className" placeholder="请输入班级" type="text" /></label>
            <label><span>手机号</span><input v-model="accountForm.phone" placeholder="请输入手机号" type="tel" /></label>
            <label><span>校区</span><select v-model="accountForm.campusId"><option value="">未选择</option><option v-for="item in campuses" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
            <label><span>状态</span><select v-model="accountForm.status"><option value="active">启用</option><option value="disabled">禁用</option></select></label>
          </div>

          <div v-else class="form-grid two">
            <label><span>工号 <em>*</em></span><input v-model="accountForm.jobNo" :disabled="accountFormMode === 'edit'" placeholder="请输入工号" type="text" /></label>
            <label><span>姓名 <em>*</em></span><input v-model="accountForm.name" placeholder="请输入姓名" type="text" /></label>
            <label v-if="accountFormMode === 'add'"><span>身份核验码</span><input v-model="accountForm.idCardLast6" maxlength="6" placeholder="请输入6位数字" type="text" /></label>
            <label><span>性别</span><select v-model="accountForm.gender"><option value="">未填写</option><option>男</option><option>女</option></select></label>
            <label><span>职称</span><input v-model="accountForm.title" placeholder="请输入职称" type="text" /></label>
            <label><span>手机号</span><input v-model="accountForm.phone" placeholder="请输入手机号" type="tel" /></label>
            <label><span>校区</span><select v-model="accountForm.campusId"><option value="">未选择</option><option v-for="item in campuses" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
            <label><span>状态</span><select v-model="accountForm.status"><option value="active">启用</option><option value="disabled">禁用</option></select></label>
            <label class="full"><span>擅长领域 <em>*</em></span><input v-model="accountForm.specialtiesText" placeholder="用逗号分隔，如 情绪调节,人际关系" type="text" /></label>
            <label class="full"><span>简介 <em>*</em></span><textarea v-model="accountForm.introduction" placeholder="请输入咨询师简介" rows="4"></textarea></label>
          </div>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="closeAccountForm">取消</button>
          <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="saveAccountForm">{{ actionBusy ? '保存中...' : '保存' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="credentialState.open" class="modal-mask" @click.self="closeCredentialState">
      <section class="form-modal credential-modal">
        <header class="form-modal-head">
          <h2>临时登录凭据</h2>
          <button type="button" @click="closeCredentialState">×</button>
        </header>
        <div class="form-modal-body temporary-credentials">
          <p>临时密码仅在此处显示一次。请通过安全渠道交付，并提醒用户首次登录立即修改。</p>
          <code>{{ credentialState.account }} · {{ credentialState.temporaryPassword }}</code>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" @click="copyTemporaryCredentials([credentialState])">复制</button>
          <button class="btn btn-primary" type="button" @click="closeCredentialState">我已记录</button>
        </footer>
      </section>
    </div>

    <div v-if="scheduleFormOpen" class="modal-mask" @click.self="closeScheduleForm">
      <section class="form-modal large">
        <header class="form-modal-head">
          <h2>{{ scheduleFormMode === 'edit' ? '编辑排班' : '新增排班' }}</h2>
          <button type="button" :disabled="actionBusy" @click="closeScheduleForm">×</button>
        </header>
        <div class="form-modal-body">
          <div class="form-grid two">
            <label><span>咨询师 <em>*</em></span><select v-model="scheduleForm.counselorId" :disabled="scheduleFormMode === 'edit'"><option value="">请选择咨询师</option><option v-for="item in counselors" :key="item.id" :value="item.id">{{ item.name }} · {{ item.jobNo }}</option></select></label>
            <label><span>咨询室 <em>*</em></span><select v-model="scheduleForm.roomId"><option value="">请选择咨询室</option><option v-for="item in roomOptions" :key="item.id" :value="item.id">{{ item.campusName }} · {{ item.name }}</option></select></label>
            <label><span>开始时间 <em>*</em></span><input v-model="scheduleForm.startAt" type="datetime-local" /></label>
            <label><span>结束时间 <em>*</em></span><input v-model="scheduleForm.endAt" type="datetime-local" /></label>
            <label><span>排班状态</span><select v-model="scheduleForm.status"><option value="available">可预约</option><option value="disabled">禁用</option></select></label>
            <label class="full"><span>备注</span><textarea v-model="scheduleForm.note" placeholder="可填写排班说明" rows="3"></textarea></label>
          </div>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="closeScheduleForm">取消</button>
          <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="saveScheduleForm">{{ actionBusy ? '保存中...' : '保存排班' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="appointmentDrawerOpen" class="drawer-mask">
      <button class="drawer-backdrop" type="button" @click="closeAppointmentDrawer"></button>
      <aside class="drawer-panel appointment-drawer">
        <header class="drawer-head">
          <div>
            <h2>预约详情</h2>
            <p>查看预约状态、学生信息与处理记录</p>
          </div>
          <button type="button" @click="closeAppointmentDrawer">×</button>
        </header>

        <section class="drawer-appointment-status">
          <div>
            <span :class="['status-tag', appointmentStatusColor(currentAppointment.status)]">{{ currentAppointment.status }}</span>
            <h3>{{ currentAppointment.code || '-' }}</h3>
            <p>{{ currentAppointment.time }} · {{ currentAppointment.type }}</p>
          </div>
          <button class="btn btn-light" type="button" disabled title="当前接口未提供预约操作记录导出文件"><Download :size="16" />导出不可用</button>
        </section>

        <div class="drawer-detail-grid">
          <article class="panel-card compact">
            <h3 class="card-title-icon blue"><Users :size="18" />学生信息</h3>
            <div class="info-list detail-info">
              <p><span>姓名</span><strong>{{ currentAppointment.student || '-' }}</strong></p>
              <p><span>学号</span><strong>{{ currentAppointment.detail?.studentNo || '-' }}</strong></p>
              <p><span>学院/班级</span><strong>{{ currentAppointment.detail?.studentClass || '-' }}</strong></p>
              <p><span>手机号</span><strong>{{ currentAppointment.detail?.studentPhone || '-' }}</strong></p>
              <p><span>风险等级</span><strong><span class="status-tag gray">{{ currentAppointment.detail?.riskLevel || '未筛查' }}</span></strong></p>
            </div>
            <button class="link-btn detail-link" type="button" @click="goFromAppointmentDrawer('student_detail')">查看学生档案</button>
          </article>
          <article class="panel-card compact">
            <h3 class="card-title-icon mint"><Stethoscope :size="18" />咨询师信息</h3>
            <div class="info-list detail-info">
              <p><span>姓名</span><strong>{{ currentAppointment.counselor || '李老师' }}</strong></p>
              <p><span>工号</span><strong>{{ currentAppointment.detail?.counselorNo || '-' }}</strong></p>
              <p><span>校区</span><strong>{{ currentAppointment.detail?.campus || '-' }}</strong></p>
              <p><span>擅长方向</span><strong>{{ currentAppointment.detail?.specialties || '-' }}</strong></p>
              <p><span>咨询室</span><strong>{{ currentAppointment.detail?.room || '-' }}</strong></p>
            </div>
            <button class="link-btn detail-link" type="button" @click="goFromAppointmentDrawer('counselor_detail')">查看咨询师详情</button>
          </article>
        </div>

        <section class="panel-card compact">
          <h3 class="card-title-icon blue"><FilePenLine :size="18" />预约申请信息</h3>
          <div class="detail-field-grid drawer-field-grid">
            <p><span>咨询类型：</span>{{ currentAppointment.type }}</p>
            <p><span>预约时间：</span>{{ currentAppointment.time }}</p>
            <p><span>咨询地点：</span>{{ currentAppointment.detail?.room || '-' }}</p>
            <p><span>是否首次咨询：</span>是</p>
            <p class="full"><span>主诉/预约原因：</span>{{ currentAppointment.detail?.concern || '-' }}</p>
            <p class="full"><span>希望解决的问题：</span>{{ currentAppointment.type || '-' }}</p>
          </div>
        </section>

        <section class="panel-card compact">
          <h3 class="card-title-icon blue"><ShieldCheck :size="18" />风险筛查结果</h3>
          <div class="drawer-risk-line">
            <span>筛查分数：<strong>{{ currentAppointment.detail?.riskScore || '-' }}</strong></span>
            <span>风险等级：<em class="status-tag gray">{{ currentAppointment.detail?.riskLevel || '未筛查' }}</em></span>
            <span>处理建议：{{ currentAppointment.detail?.riskAdvice || '-' }}</span>
          </div>
        </section>

        <section class="panel-card compact">
          <h3 class="card-title-icon blue"><History :size="18" />状态流转</h3>
          <div class="status-timeline drawer-timeline">
            <div v-for="(item, index) in appointmentSteps" :key="item.label" :class="['status-step', { done: item.done }]">
              <span>{{ item.done ? '✓' : '' }}</span>
              <p>{{ item.label }}</p>
              <small>{{ item.time }}</small>
              <i v-if="index < appointmentSteps.length - 1"></i>
            </div>
          </div>
        </section>

        <article class="table-card drawer-table">
          <div class="table-title-row"><h3 class="card-title-icon blue"><History :size="18" />操作记录</h3></div>
          <table>
            <thead><tr><th>时间</th><th>操作人</th><th>操作类型</th><th>说明</th></tr></thead>
            <tbody>
              <tr v-for="record in appointmentLogs" :key="record.time">
                <td>{{ record.time }}</td>
                <td>{{ record.operator }}</td>
                <td><span :class="['status-tag', record.color]">{{ record.action }}</span></td>
                <td>{{ record.desc }}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <footer class="drawer-actions">
          <button class="btn btn-light" type="button" @click="closeAppointmentDrawer">关闭</button>
          <button class="btn btn-primary" type="button" disabled title="管理端本批仅查看预约状态，处理操作由咨询师端完成">确认预约</button>
          <button class="btn btn-success" type="button" disabled title="管理端本批仅查看预约状态，签到操作由咨询师端完成">签到</button>
          <button class="btn btn-danger-outline" type="button" disabled title="管理端本批仅查看预约状态，拒绝操作由咨询师端完成">拒绝预约</button>
        </footer>
      </aside>
    </div>

    <div v-if="assessmentFormOpen" class="modal-mask" @click.self="closeAssessmentForm">
      <section class="form-modal large">
        <header class="form-modal-head">
          <h2>{{ assessmentFormMode === 'edit' ? '编辑心理测评' : '新增心理测评' }}</h2>
          <button type="button" :disabled="actionBusy" @click="closeAssessmentForm">脳</button>
        </header>
        <div class="form-modal-body">
          <div class="form-grid two">
            <label><span>测评标题 <em>*</em></span><input v-model="assessmentForm.title" placeholder="请输入测评标题" type="text" /></label>
            <label><span>测评类型</span><input v-model="assessmentForm.type" placeholder="例如 情绪测评 / 压力量表" type="text" /></label>
            <label><span>测评状态</span><select v-model="assessmentForm.status"><option value="active">启用</option><option value="inactive">停用</option><option value="archived">已归档</option></select></label>
            <label class="full"><span>测评说明</span><textarea v-model="assessmentForm.description" placeholder="请输入测评说明" rows="3"></textarea></label>
          </div>
          <label>
            <span>题目和选项 <em>*</em></span>
            <textarea v-model="assessmentForm.questionsText" placeholder="每行一个题目，用 | 分隔选项，例如：最近一周情绪是否稳定|非常稳定|一般|不稳定" rows="8"></textarea>
          </label>
          <p class="page-subtitle">题目将保存到现有 questions Json 字段，测评类型同步写入 questions.meta.type，不修改数据库结构。</p>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="closeAssessmentForm">取消</button>
          <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="saveAssessment">{{ actionBusy ? '保存中...' : '保存测评' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="articleFormOpen" class="modal-mask" @click.self="closeArticleForm">
      <section class="form-modal large">
        <header class="form-modal-head">
          <h2>{{ articleFormMode === 'edit' ? '编辑心理资讯' : '新增心理资讯' }}</h2>
          <button type="button" @click="closeArticleForm">×</button>
        </header>
        <div class="form-modal-body">
          <div class="form-grid two">
            <label><span>文章标题 <em>*</em></span><input v-model="articleForm.title" placeholder="请输入文章标题" type="text" /></label>
            <label><span>文章分类</span><select v-model="articleForm.category"><option>请选择分类</option><option>情绪调节</option><option>人际关系</option><option>学习压力</option><option>睡眠健康</option><option>危机应对</option></select></label>
            <label><span>作者</span><input v-model="articleForm.author" placeholder="请输入作者姓名" type="text" /></label>
            <div class="radio-field">
              <span>发布状态</span>
              <label><input v-model="articleForm.status" name="article-status" type="radio" value="草稿" />草稿</label>
              <label><input v-model="articleForm.status" name="article-status" type="radio" value="已发布" />已发布</label>
            </div>
          </div>
          <label class="full"><span>封面图 URL</span><input v-model="articleForm.cover" placeholder="填写已审核图片 URL；为空时学生端显示默认图标" type="url" /></label>
          <label><span>摘要</span><textarea v-model="articleForm.summary" placeholder="请输入文章摘要（选填）" rows="2"></textarea></label>
          <label>
            <span>正文内容</span>
            <div class="editor-box">
              <div class="editor-toolbar"><button type="button"><b>B</b></button><button type="button"><i>I</i></button><button type="button"><u>U</u></button><i></i><button type="button">H</button><button type="button">≡</button><button type="button">"</button><button type="button">图</button></div>
              <textarea v-model="articleForm.content" placeholder="请输入文章正文内容" rows="10"></textarea>
            </div>
          </label>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" @click="closeArticleForm">取消</button>
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="saveArticleDraft">{{ actionBusy ? '保存中...' : '保存草稿' }}</button>
          <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="publishArticle">{{ actionBusy ? '发布中...' : '发布' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="activityFormOpen" class="modal-mask" @click.self="closeActivityForm">
      <section class="form-modal large">
        <header class="form-modal-head">
          <h2>{{ activityFormMode === 'edit' ? '编辑心理活动' : '新增心理活动' }}</h2>
          <button type="button" @click="closeActivityForm">×</button>
        </header>
        <div class="form-modal-body">
          <div class="form-grid two">
            <label><span>活动名称 <em>*</em></span><input v-model="activityForm.title" placeholder="请输入活动名称" type="text" /></label>
            <label><span>活动类型</span><select v-model="activityForm.type"><option>团体辅导</option><option>心理讲座</option><option>工作坊</option><option>心理测评</option><option>心理健康月</option></select></label>
            <label><span>所属校区</span><select v-model="activityForm.campus"><option value="">请选择校区</option><option v-for="item in campuses" :key="item.id" :value="item.name">{{ item.name }}</option></select></label>
            <label><span>一句话简介</span><input v-model="activityForm.intro" placeholder="用于列表展示" type="text" /></label>
          </div>
          <h3 class="form-subtitle">时间与地点</h3>
          <div class="form-grid two">
            <label><span>开始时间</span><input v-model="activityForm.startTime" type="datetime-local" /></label>
            <label><span>结束时间</span><input v-model="activityForm.endTime" type="datetime-local" /></label>
            <label><span>报名截止</span><input v-model="activityForm.deadline" type="datetime-local" /></label>
            <label><span>活动地点</span><input v-model="activityForm.place" placeholder="请输入活动地点" type="text" /></label>
          </div>
          <h3 class="form-subtitle">报名设置</h3>
          <div class="form-grid two">
            <label><span>人数上限</span><input v-model="activityForm.limit" type="number" /></label>
            <div class="check-list">
              <label><input v-model="activityForm.needReview" type="checkbox" />报名需审核</label>
              <label><input v-model="activityForm.allowCancel" type="checkbox" />允许学生取消报名</label>
            </div>
          </div>
          <label><span>活动介绍</span><textarea v-model="activityForm.description" placeholder="请输入活动介绍" rows="5"></textarea></label>
          <p class="page-subtitle">活动封面由学生端首页轮播配置统一维护，保存后学生端按配置读取。</p>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" @click="closeActivityForm">取消</button>
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="saveActivityDraft">{{ actionBusy ? '保存中...' : '保存草稿' }}</button>
          <button class="btn btn-primary" type="button" :disabled="actionBusy" @click="publishActivity">{{ actionBusy ? '发布中...' : '发布活动' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="campusFormOpen" class="modal-mask" @click.self="closeCampusForm">
      <section class="form-modal campus-modal">
        <header class="form-modal-head">
          <h2>{{ campusFormMode === 'edit' ? '编辑校区' : '新增校区' }}</h2>
          <button type="button" @click="closeCampusForm">×</button>
        </header>
        <div class="form-modal-body">
          <p v-if="campusFormMode === 'edit'" class="inline-note">当前弹窗用于查看真实校区信息，编辑控件保持禁用。</p>
          <label><span>校区名称 <em>*</em></span><input v-model="campusForm.name" :disabled="campusFormMode === 'edit'" placeholder="请输入校区名称" type="text" /></label>
          <label><span>校区地址</span><input v-model="campusForm.address" :disabled="campusFormMode === 'edit'" placeholder="请输入校区地址" type="text" /></label>
          <div class="form-grid two">
            <label><span>负责人</span><input v-model="campusForm.manager" disabled placeholder="当前校区数据未包含负责人" title="当前校区数据未包含负责人" type="text" /></label>
            <label><span>联系电话</span><input v-model="campusForm.phone" :disabled="campusFormMode === 'edit'" placeholder="请输入联系电话" type="tel" /></label>
          </div>
          <label><span>状态</span><select v-model="campusForm.status" :disabled="campusFormMode === 'edit'"><option>启用</option><option>停用</option></select></label>
        </div>
        <footer class="form-modal-foot">
          <button class="btn btn-light" type="button" :disabled="actionBusy" @click="closeCampusForm">取消</button>
          <button class="btn btn-primary" type="button" :disabled="actionBusy || campusFormMode === 'edit'" :title="campusFormMode === 'edit' ? '编辑控件已禁用' : ''" @click="saveCampus">{{ campusFormMode === 'edit' ? '仅查看' : actionBusy ? '保存中...' : '保存' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="activityDrawerOpen" class="drawer-mask">
      <button class="drawer-backdrop" type="button" @click="closeRegistrationDrawer"></button>
      <aside class="drawer-panel activity-drawer">
        <header class="drawer-head">
          <div>
            <h2>活动报名名单</h2>
            <p>查看与管理活动报名学生</p>
          </div>
          <button type="button" @click="closeRegistrationDrawer">×</button>
        </header>
        <section class="drawer-activity-summary">
          <h3>{{ selectedActivity.title }}</h3>
          <div>
            <span>活动时间：{{ selectedActivity.time }}</span>
            <span>活动地点：{{ selectedActivity.place }}</span>
            <span>报名人数：{{ selectedActivity.joined }}/{{ selectedActivity.limit }}</span>
            <span>活动状态：<strong>{{ selectedActivity.status }}</strong></span>
          </div>
        </section>
        <section class="drawer-stats">
          <article><strong>{{ selectedActivity.joined }}</strong><span>已报名</span></article>
          <article><strong>{{ registrationStats.checked }}</strong><span>已签到</span></article>
          <article><strong>{{ registrationStats.unchecked }}</strong><span>未签到</span></article>
          <article><strong>{{ registrationStats.cancelled }}</strong><span>已取消</span></article>
        </section>
        <div class="drawer-filter-row">
          <input placeholder="搜索姓名/学号/手机号" type="text" />
          <select><option>报名状态</option><option>已报名</option><option>已取消</option></select>
          <select><option>签到状态</option><option>已签到</option><option>未签到</option></select>
          <button class="btn btn-light" type="button" disabled title="当前接口未提供活动报名导出文件"><Download :size="16" />导出不可用</button>
        </div>
        <div class="table-card drawer-table">
          <table>
            <thead><tr><th>学生信息</th><th>联系方式</th><th>报名时间</th><th>报名状态</th><th>签到状态</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="item in registrations" :key="item.id">
                <td><strong>{{ item.name }}</strong><small>{{ item.studentNo }} · {{ item.college }}</small></td>
                <td>{{ item.phone }}</td>
                <td>{{ item.registeredAt }}</td>
                <td><span class="status-tag green">{{ item.status }}</span></td>
                <td><span :class="['status-tag', item.checked ? 'blue' : 'yellow']">{{ item.checked ? '已签到' : '未签到' }}</span></td>
                <td><button v-if="!item.checked" class="link-btn green" type="button" disabled title="当前仅查看真实报名名单">标记签到</button><button v-else class="link-btn" type="button" disabled title="当前仅查看真实报名名单">查看</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination single />
      </aside>
    </div>

    <div v-if="checkinConfirmOpen" class="modal-mask nested" @click.self="closeCheckinConfirm">
      <section class="modal-card checkin-modal">
        <div class="modal-icon success"><CheckCircle :size="30" /></div>
        <h3>确认签到</h3>
        <p>确认将该学生标记为已签到吗？</p>
        <div class="modal-actions">
          <button class="btn btn-light" type="button" @click="closeCheckinConfirm">取消</button>
          <button class="btn btn-success" type="button" @click="confirmCheckin">确认签到</button>
        </div>
      </section>
    </div>

    <div v-if="logDrawerOpen" class="drawer-mask">
      <button class="drawer-backdrop" type="button" @click="closeLogDrawer"></button>
      <aside class="drawer-panel log-drawer">
        <header class="drawer-head">
          <div>
            <h2>操作日志详情</h2>
            <p>使用日志列表返回的真实行数据展示</p>
          </div>
          <button type="button" @click="closeLogDrawer">×</button>
        </header>
        <section class="log-detail-section">
          <p class="inline-note">当前后端未提供独立日志详情接口，此处仅展开本条日志列表行中的真实字段。</p>
        </section>
        <section class="log-detail-section">
          <h3>基础信息</h3>
          <p><span>操作时间</span><strong>{{ selectedLog.time }}</strong></p>
          <p><span>操作人</span><strong>{{ selectedLog.operator }}</strong></p>
          <p><span>操作类型</span><strong>{{ selectedLog.action }}</strong></p>
          <p><span>IP 地址</span><strong>{{ selectedLog.ip }}</strong></p>
        </section>
        <section class="log-detail-section">
          <h3>操作对象</h3>
          <p><span>对象类型</span><strong>{{ selectedLog.targetType || '预约记录' }}</strong></p>
          <p><span>对象编号</span><strong>{{ selectedLog.targetId || selectedLog.entityId || '-' }}</strong></p>
        </section>
        <section class="log-detail-section">
          <h3>操作内容</h3>
          <p class="log-remark">{{ selectedLog.detail }}</p>
        </section>
        <section class="log-detail-section">
          <h3>来源说明</h3>
          <p><span>数据来源</span><strong>操作日志列表行数据</strong></p>
          <p><span>详情接口</span><strong>暂未提供独立详情接口</strong></p>
        </section>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, h, onMounted, reactive, ref } from "vue";
import { createApiClient } from "@anxin/api-client";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Download,
  FilePenLine,
  History,
  Info,
  LayoutDashboard,
  Menu,
  Plus,
  School,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  Users
} from "lucide-vue-next";
import brandIcon from "./assets/brand/lightcatch/logo-small.png";
import coverFallback from "./assets/brand/lightcatch/cover-fallback.webp";
import counselorDefaultAvatar from "./assets/brand/lightcatch/avatar-counselor.png";
import studentDefaultAvatar from "./assets/brand/lightcatch/avatar-student.png";

const AdminLogo = {
  props: { class: String },
  setup(props) {
    return () => h(
      "img",
      { class: props.class, src: brandIcon, alt: "拾光心理 LightCatch" }
    );
  }
};

function safeCellText(value, fallback = "暂无") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number" && Number.isNaN(value)) return fallback;
  const text = Array.isArray(value)
    ? value.length ? value.join("、") : fallback
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return safeVisibleText(text, fallback);
}

function safeVisibleText(value, fallback = "暂无") {
  const text = String(value || "").trim();
  if (!text || isHistoricalTestText(text)) return fallback;
  return text;
}

function isHistoricalTestText(text) {
  return /\?{2,}|E2E|Batch|Fixed|regression/i.test(String(text || ""));
}

const appointmentTypeLabels = {
  offline: "线下咨询",
  online: "线上咨询",
  first: "首次咨询",
  initial: "初访评估",
  regular: "常规咨询",
  crisis: "危机干预"
};

function appointmentTypeLabel(value) {
  const text = String(value || "").trim();
  return safeVisibleText(appointmentTypeLabels[text] || text, "咨询预约");
}

const AdminTable = {
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, required: true }
  },
  setup(props, { slots }) {
    return () => h("div", { class: "table-card custom-shadow" }, [
      h("table", { class: "admin-data-table" }, [
        h("thead", [
          h("tr", props.columns.map((col) => h("th", { class: col.headerClass }, col.label)))
        ]),
        h("tbody", props.rows.length
          ? props.rows.map((row, rowIndex) => h("tr", { key: row.id || rowIndex }, props.columns.map((col) => h(
            "td",
            { class: col.cellClass, "data-label": col.label },
            col.key === "actions" && slots.actions
              ? slots.actions({ row })
              : col.render
                ? col.render(row)
                : h("span", { class: "table-cell-text", title: safeCellText(row[col.key]) }, safeCellText(row[col.key]))
          ))))
          : [h("tr", [h("td", { colspan: props.columns.length, class: "empty-cell" }, "暂无数据")])])
      ])
    ]);
  }
};

const FilterCard = {
  setup(_, { slots, attrs }) {
    return () => h("section", { class: ["filter-card custom-shadow", attrs.class] }, slots.default?.());
  }
};

const Pagination = {
  props: { single: Boolean },
  setup(props) {
    return () => h("div", { class: "pagination" }, [
      h("button", "上一页"),
      h("button", { class: "active" }, "1"),
      !props.single && h("button", "2"),
      !props.single && h("button", "3"),
      h("button", "下一页")
    ].filter(Boolean));
  }
};

const TabBar = {
  props: { items: { type: Array, required: true }, settings: Boolean },
  setup(props) {
    return () => h("div", { class: props.settings ? "settings-tabs custom-shadow" : "tab-card custom-shadow" }, props.items.map((item, index) => h(
      "button",
      {
        class: index === 0 ? "active" : "",
        disabled: index !== 0,
        title: index === 0 ? "" : "当前页面展示基础配置"
      },
      item
    )));
  }
};

const Timeline = {
  props: { items: { type: Array, required: true } },
  setup(props) {
    return () => h("div", { class: "timeline" }, props.items.map((item) => h("div", { class: "timeline-item" }, [
      h("span", { class: item.color || "green" }),
      h("div", [h("strong", item.title), h("p", item.meta), h("small", item.desc)])
    ])));
  }
};

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
const api = createApiClient({ storageKey: "anxin_admin_token" });
const loginForm = reactive({ account: "", password: "", remember: false });
const loginError = ref(false);
const me = ref(false);
const page = ref("dashboard");
const notice = ref("");
const loading = ref(false);
const dataLoading = ref(false);
const actionBusy = ref(false);

const selectedStudent = ref(null);
const selectedCounselor = ref(null);
const selectedAppointment = ref(null);
const selectedActivity = ref({});
const selectedRegistration = ref(null);
const selectedLog = ref({});
const selectedSystemFeedback = ref(null);
const selectedAssessment = ref(null);
const modal = reactive({ open: false, title: "", message: "", confirmText: "确认", danger: false, success: false, textarea: false, textValue: "", icon: "", onConfirm: null });
const studentImportInput = ref(null);
const counselorImportInput = ref(null);
const importState = reactive({ open: false, kind: "", title: "", summary: "", errors: [], credentials: [] });
const credentialState = reactive({ open: false, account: "", name: "", temporaryPassword: "" });
const studentFilters = reactive({ keyword: "", status: "" });
const counselorFilters = reactive({ keyword: "", status: "" });
const appointmentFilters = reactive({ keyword: "", status: "", type: "" });
const systemFeedbackFilters = reactive({ status: "", type: "", page: 1, pageSize: 20 });
const assessmentFilters = reactive({ status: "", keyword: "", page: 1, pageSize: 20 });
const assessmentResultFilters = reactive({ assessmentId: "", page: 1, pageSize: 20 });
const articleFilters = reactive({ keyword: "", category: "", status: "" });
const activityFilters = reactive({ keyword: "", category: "", status: "", date: "" });
const assessmentFormOpen = ref(false);
const assessmentFormMode = ref("add");
const articleFormOpen = ref(false);
const articleFormMode = ref("add");
const activityFormOpen = ref(false);
const activityFormMode = ref("add");
const campusFormOpen = ref(false);
const campusFormMode = ref("add");
const accountFormOpen = ref(false);
const accountFormKind = ref("students");
const accountFormMode = ref("add");
const scheduleFormOpen = ref(false);
const scheduleFormMode = ref("add");
const activityDrawerOpen = ref(false);
const checkinConfirmOpen = ref(false);
const logDrawerOpen = ref(false);
const appointmentDrawerOpen = ref(false);

const articleForm = reactive({ id: "", title: "", category: "请选择分类", author: "", status: "草稿", summary: "", content: "", cover: "" });
const activityForm = reactive({
  id: "",
  title: "",
  type: "工作坊",
  campus: "",
  intro: "",
  startTime: "",
  endTime: "",
  deadline: "",
  place: "",
  limit: 20,
  needReview: false,
  allowCancel: true,
  description: ""
});
const campusForm = reactive({ id: "", name: "", address: "", manager: "", phone: "", status: "启用" });
const settingsForm = reactive({
  platformName: "拾光心理 LightCatch 管理平台",
  durationMinutes: 50,
  advanceDays: 14,
  dailyLeaveLimit: 3,
  autoConfirm: false,
  allowStudentCancel: true
});
const homeCarouselItems = ref([]);
const accountForm = reactive({
  id: "",
  studentNo: "",
  jobNo: "",
  name: "",
  idCardLast6: "",
  gender: "",
  college: "",
  major: "",
  grade: "",
  className: "",
  phone: "",
  title: "",
  campusId: "",
  status: "active",
  specialtiesText: "",
  introduction: ""
});
const scheduleForm = reactive({
  id: "",
  counselorId: "",
  roomId: "",
  startAt: "",
  endAt: "",
  status: "available",
  note: ""
});
const assessmentForm = reactive({
  id: "",
  title: "",
  description: "",
  type: "心理测评",
  status: "active",
  questionsText: ""
});

const navItems = [
  { key: "assessments", label: "测评管理", icon: ShieldCheck, search: "搜索测评..." },
  { key: "dashboard", label: "数据看板", icon: LayoutDashboard, search: "搜索..." },
  { key: "students", label: "学生管理", icon: Users, search: "搜索学生姓名、学号..." },
  { key: "counselors", label: "咨询师管理", icon: Stethoscope, search: "搜索咨询师..." },
  { key: "appointments", label: "预约管理", icon: CalendarCheck, search: "搜索学生/咨询师..." },
  { key: "scheduling", label: "排班管理", icon: CalendarClock, search: "搜索咨询师..." },
  { key: "shift_approval", label: "调班审批", icon: ClipboardCheck, search: "搜索..." },
  { key: "risk_center", label: "风险预警", icon: AlertTriangle, search: "搜索..." },
  { key: "referral", label: "转介管理", icon: ArrowLeftRight, search: "搜索..." },
  { key: "system_feedbacks", label: "系统反馈", icon: Info, search: "搜索反馈..." },
  { key: "articles", label: "文章管理", icon: FilePenLine, search: "搜索文章..." },
  { key: "activities", label: "活动管理", icon: UserRoundCheck, search: "搜索功能、学生、活动..." },
  { key: "campus", label: "校区管理", icon: School, search: "搜索..." },
  { key: "settings", label: "系统设置", icon: Settings, search: "搜索..." },
  { key: "logs", label: "操作日志", icon: History, search: "搜索..." }
];

const parentMap = {
  student_detail: "students",
  counselor_detail: "counselors",
  appointment_detail: "appointments"
};

const activeNav = computed(() => parentMap[page.value] || page.value);
const searchPlaceholder = computed(() => navItems.find((item) => item.key === activeNav.value)?.search || "搜索...");
const accountFormTitle = computed(() => accountFormKind.value === "students" ? "学生" : "咨询师");

const dashboardData = ref({
  students: 0,
  counselors: 0,
  appointments: 0,
  pendingAppointments: 0,
  activeRisks: 0,
  activities: 0,
  pendingShifts: 0,
  pendingReferrals: 0,
  pendingFeedbacks: 0,
  schedules: 0,
  appointmentStatus: [],
  appointmentTrend: [],
  appointmentTypes: [],
  recentAppointments: [],
  recentLogs: []
});
const dashboardLoading = ref(false);
const dashboardError = ref("");

const dashboardStats = computed(() => [
  { label: "学生总数", value: dashboardData.value.students, hint: "以导入账号为准", target: "students", icon: Users, iconClass: "blue", textClass: "", hintClass: "" },
  { label: "预约总数", value: dashboardData.value.appointments, hint: "来自真实预约", target: "appointments", icon: CalendarCheck, iconClass: "blue", textClass: "", hintClass: "" },
  { label: "待处理预约", value: dashboardData.value.pendingAppointments, hint: "待咨询师处理", target: "appointments", icon: CalendarClock, iconClass: "orange", textClass: "", hintClass: "hint-orange" },
  { label: "咨询师数", value: dashboardData.value.counselors, hint: "以导入账号为准", target: "counselors", icon: Stethoscope, iconClass: "green", textClass: "", hintClass: "" },
  { label: "风险预警数", value: dashboardData.value.activeRisks, hint: "高风险/危机未关闭", target: "risk_center", icon: AlertTriangle, iconClass: "red", textClass: "red-text", hintClass: dashboardData.value.activeRisks ? "hint-red" : "" },
  { label: "待审批调班", value: dashboardData.value.pendingShifts, hint: "来自调班申请", target: "shift_approval", icon: ClipboardCheck, iconClass: "orange", textClass: "orange-text", hintClass: "" },
  { label: "待处理转介", value: dashboardData.value.pendingReferrals, hint: "来自转介流程", target: "referral", icon: ArrowLeftRight, iconClass: "purple", textClass: "purple-text", hintClass: "" }
]);

const chartColors = ["#2563eb", "#16a34a", "#f97316", "#9333ea", "#dc2626", "#0891b2", "#64748b"];
const dashboardTrend = computed(() => {
  const rows = Array.isArray(dashboardData.value.appointmentTrend) ? dashboardData.value.appointmentTrend : [];
  if (!rows.some((item) => Number(item.count || 0) > 0)) return [];
  const max = Math.max(...rows.map((item) => Number(item.count || 0)), 1);
  return rows.map((item) => ({
    ...item,
    label: String(item.date || "").slice(5),
    count: Number(item.count || 0),
    height: Math.max(8, Math.round((Number(item.count || 0) / max) * 100))
  }));
});
const dashboardTypes = computed(() => {
  const rows = Array.isArray(dashboardData.value.appointmentTypes) ? dashboardData.value.appointmentTypes : [];
  const total = rows.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!total) return [];
  return rows.map((item, index) => ({
    type: item.type || "未分类",
    count: Number(item.count || 0),
    percent: Math.round((Number(item.count || 0) / total) * 100),
    color: chartColors[index % chartColors.length]
  }));
});
const typeDonutBackground = computed(() => {
  if (!dashboardTypes.value.length) return "";
  let start = 0;
  const stops = dashboardTypes.value.map((item) => {
    const end = start + item.percent;
    const segment = `${item.color} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  return `conic-gradient(${stops.join(", ")})`;
});
const recentDashboardAppointments = computed(() => {
  const rows = Array.isArray(dashboardData.value.recentAppointments) ? dashboardData.value.recentAppointments : [];
  return rows.map(mapAppointment);
});

const students = ref([]);
const counselors = ref([]);
const appointments = ref([]);
const schedules = ref([]);
const shifts = ref([]);
const risks = ref([]);
const referrals = ref([]);
const systemFeedbacks = ref([]);
const systemFeedbackTotal = ref(0);
const assessments = ref([]);
const assessmentTotal = ref(0);
const assessmentResults = ref([]);
const assessmentResultTotal = ref(0);
const articles = ref([]);
const activities = ref([]);
const campuses = ref([]);
const logs = ref([]);

const scheduleDays = [
  { label: "周一", date: "7/21" },
  { label: "周二", date: "7/22" },
  { label: "周三", date: "7/23" },
  { label: "周四", date: "7/24" },
  { label: "周五", date: "7/25" }
];

const scheduleRows = ref([]);
const trendPoints = ["16,164", "70,164", "124,164", "178,164", "232,164", "286,164", "344,164"];
const emptyStudent = { avatar: "", avatarText: "-", avatarSrc: studentDefaultAvatar, studentNo: "-", name: "-", college: "-", grade: "-", gender: "-", campus: "-", sessions: 0, status: "active" };
const emptyCounselor = { avatar: "", avatarText: "-", avatarSrc: counselorDefaultAvatar, name: "-", jobNo: "-", role: "-", campus: "-", specialties: "-", monthSessions: 0, totalSessions: 0, rating: "-", status: "active", week: [] };
const emptyAppointment = { id: "", code: "-", student: "-", counselor: "-", time: "-", type: "-", status: "待处理", detail: {} };
const currentStudent = computed(() => selectedStudent.value || students.value[0] || emptyStudent);
const currentCounselor = computed(() => selectedCounselor.value || counselors.value[0] || emptyCounselor);
const currentAppointment = computed(() => selectedAppointment.value || appointments.value[0] || emptyAppointment);
const displayedAppointments = computed(() => {
  const keyword = appointmentFilters.keyword.trim().toLowerCase();
  const type = appointmentFilters.type;
  return appointments.value.filter((item) => {
    const keywordMatched = !keyword || [item.student, item.counselor, item.code].some((value) => String(value || "").toLowerCase().includes(keyword));
    const typeMatched = !type || item.type === type;
    return keywordMatched && typeMatched;
  });
});
const roomOptions = computed(() => campuses.value.flatMap((campus) => (campus.roomItems || []).map((room) => ({
  ...room,
  campusName: campus.name
}))));
const riskSummary = computed(() => ({
  high: risks.value.filter((item) => ["high", "crisis", "高风险", "危机风险"].includes(item.level)).length,
  medium: risks.value.filter((item) => ["medium", "中风险"].includes(item.level)).length,
  low: risks.value.filter((item) => ["low", "低风险"].includes(item.level)).length
}));
const registrationStats = computed(() => ({
  checked: registrations.value.filter((item) => item.checked).length,
  unchecked: registrations.value.filter((item) => !item.checked).length,
  cancelled: 0
}));

const appointmentSteps = computed(() => {
  const status = currentAppointment.value.status;
  return [
    { label: "学生提交预约", time: currentAppointment.value.createdAt || "待生成", done: Boolean(currentAppointment.value.id) },
    { label: "咨询师已确认", time: status === "pending" ? "待确认" : currentAppointment.value.updatedAt || "已处理", done: ["confirmed", "in_progress", "checked_in", "completed", "已确认", "已完成"].includes(status) },
    { label: "已签到", time: ["in_progress", "checked_in", "completed"].includes(status) ? currentAppointment.value.updatedAt || "已签到" : "待签到", done: ["in_progress", "checked_in", "completed"].includes(status) },
    { label: "咨询完成", time: status === "completed" || status === "已完成" ? currentAppointment.value.updatedAt || "已完成" : "待完成", done: status === "completed" || status === "已完成" },
    { label: "已评价", time: currentAppointment.value.feedbackAt || "待评价", done: Boolean(currentAppointment.value.feedbackAt) }
  ];
});

const appointmentLogs = computed(() => currentAppointment.value.logs || []);
const registrations = ref([]);
const studentTimeline = ref([]);

const studentColumns = [
  { label: "学号", key: "studentNo" },
  { label: "姓名", key: "name" },
  { label: "院系", key: "college" },
  { label: "年级", key: "grade" },
  { label: "咨询次数", key: "sessions" },
  { label: "账号状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "操作", key: "actions" }
];

const recentAppointmentColumns = [
  { label: "学生", key: "student" },
  { label: "咨询师", key: "counselor" },
  { label: "时间", key: "time" },
  { label: "类型", key: "type" },
  { label: "状态", key: "status", render: (row) => statusTag(row.status) }
];

const appointmentColumns = [
  { label: "预约编号", key: "code" },
  { label: "学生", key: "student" },
  { label: "咨询师", key: "counselor" },
  { label: "时间", key: "time" },
  { label: "类型", key: "type" },
  { label: "状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "操作", key: "actions" }
];

const counselorAppointmentColumns = [
  { label: "时间", key: "time" },
  { label: "学生", key: "student" },
  { label: "类型", key: "type" },
  { label: "状态", key: "status", render: (row) => statusTag(row.status) }
];

const scheduleColumns = [
  { label: "咨询师", key: "counselorName" },
  { label: "日期", key: "date" },
  { label: "时段", key: "timeRange" },
  { label: "咨询室", key: "roomName" },
  { label: "校区", key: "campusName" },
  { label: "状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "关联预约", key: "appointmentState", render: (row) => statusTag(row.appointmentState) },
  { label: "操作", key: "actions" }
];

const riskColumns = [
  { label: "学生", key: "student" },
  { label: "风险等级", key: "level", render: (row) => statusTag(row.level) },
  { label: "风险类型", key: "type" },
  { label: "发现时间", key: "foundAt" },
  { label: "处理状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "操作", key: "actions" }
];

const articleColumns = [
  { label: "标题", key: "title" },
  { label: "分类", key: "category" },
  { label: "作者", key: "author" },
  { label: "发布时间", key: "publishedAt" },
  { label: "状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "操作", key: "actions" }
];

const activityColumns = [
  { label: "封面", key: "cover", render: (row) => h("img", { class: "cover-thumb", src: row.coverSrc || coverFallback, alt: `${row.title || "活动"}封面` }) },
  { label: "活动名称", key: "title" },
  { label: "活动类型", key: "type" },
  { label: "活动时间", key: "time" },
  { label: "活动地点", key: "place" },
  { label: "报名人数", key: "joined", cellClass: "center-cell" },
  { label: "人数上限", key: "limit", cellClass: "center-cell" },
  { label: "活动状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "操作", key: "actions" }
];

const logColumns = [
  { label: "时间", key: "time" },
  { label: "操作人", key: "operator" },
  { label: "操作类型", key: "action", render: (row) => statusTag(row.action) },
  { label: "操作详情", key: "detail" },
  { label: "IP地址", key: "ip" },
  { label: "操作", key: "actions" }
];

const systemFeedbackColumns = [
  { label: "提交时间", key: "createdAtText" },
  { label: "学生", key: "studentName" },
  { label: "学号", key: "studentNo" },
  { label: "类型", key: "type" },
  { label: "反馈内容", key: "summary" },
  { label: "状态", key: "status", render: (row) => systemFeedbackStatusTag(row.status) },
  { label: "操作", key: "actions" }
];

const assessmentColumns = [
  { label: "测评名称", key: "title" },
  { label: "类型", key: "type" },
  { label: "题目数", key: "questionCount", cellClass: "center-cell" },
  { label: "更新时间", key: "updatedAtText" },
  { label: "状态", key: "status", render: (row) => statusTag(row.status) },
  { label: "操作", key: "actions" }
];

const assessmentResultColumns = [
  { label: "学生", key: "studentName" },
  { label: "学号", key: "studentNo" },
  { label: "测评名称", key: "assessmentTitle" },
  { label: "分数", key: "score", cellClass: "center-cell" },
  { label: "等级", key: "level", render: (row) => statusTag(row.level) },
  { label: "提交时间", key: "createdAtText" }
];

function weekFor(defaultTime) {
  return [
    { day: "周一", time: defaultTime },
    { day: "周二", time: "09:00-12:00" },
    { day: "周三", time: "休息" },
    { day: "周四", time: "14:00-17:00" },
    { day: "周五", time: "09:00-12:00, 14:00-17:00" }
  ];
}

function statusTag(text) {
  const map = {
    active: "green",
    inactive: "gray",
    disabled: "gray",
    deleted: "red",
    pending: "yellow",
    confirmed: "green",
    in_progress: "blue",
    checked_in: "blue",
    completed: "blue",
    cancelled: "gray",
    rejected: "red",
    no_show: "red",
    available: "green",
    booked: "blue",
    high: "red",
    crisis: "red",
    medium: "orange",
    low: "yellow",
    following: "blue",
    processing: "blue",
    resolved: "green",
    closed: "green",
    approved: "green",
    accepted: "green",
    published: "green",
    draft: "yellow",
    archived: "gray",
    已激活: "green",
    未激活: "gray",
    已确认: "green",
    待确认: "yellow",
    已完成: "blue",
    高风险: "red",
    中风险: "orange",
    低风险: "yellow",
    待处理: "yellow",
    跟进中: "blue",
    已处理: "green",
    已发布: "green",
    草稿: "yellow",
    报名中: "green",
    已满员: "orange",
    未开始: "blue",
    预约确认: "blue",
    登录: "green",
    系统设置: "yellow",
    新增: "blue"
  };
  const labelMap = {
    active: "启用",
    disabled: "禁用",
    deleted: "已删除",
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "咨询中",
    checked_in: "已签到",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    no_show: "未到场",
    available: "可预约",
    booked: "已预约",
    high: "高风险",
    crisis: "危机风险",
    medium: "中风险",
    low: "低风险",
    following: "跟进中",
    processing: "处理中",
    resolved: "已解决",
    closed: "已处理",
    approved: "已通过",
    accepted: "已接收",
    published: "已发布",
    draft: "草稿",
    archived: "已归档"
  };
  if (text === "inactive") return h("span", { class: ["status-tag", "gray"] }, "停用");
  return h("span", { class: ["status-tag", map[text] || "gray"] }, labelMap[text] || text);
}

function systemFeedbackStatusTag(text) {
  const map = { pending: "yellow", processing: "blue", resolved: "green", closed: "gray" };
  const labelMap = { pending: "待处理", processing: "处理中", resolved: "已解决", closed: "已关闭" };
  return h("span", { class: ["status-tag", map[text] || "gray"] }, labelMap[text] || text || "-");
}

function statusTagColor(text) {
  const map = {
    active: "green",
    disabled: "gray",
    pending: "yellow",
    confirmed: "green",
    completed: "blue",
    cancelled: "gray",
    rejected: "red",
    available: "green",
    booked: "blue",
    high: "red",
    crisis: "red",
    medium: "orange",
    low: "yellow",
    open: "yellow",
    following: "blue",
    processing: "blue",
    resolved: "green",
    closed: "green",
    approved: "green",
    accepted: "green"
  };
  return map[text] || "gray";
}

function statusLabel(text) {
  const map = {
    active: "启用",
    disabled: "禁用",
    pending: "待处理",
    confirmed: "已确认",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    available: "可预约",
    booked: "已预约",
    high: "高风险",
    crisis: "危机风险",
    medium: "中风险",
    low: "低风险",
    open: "待处理",
    following: "跟进中",
    processing: "处理中",
    resolved: "已解决",
    closed: "已关闭",
    approved: "已通过",
    accepted: "已接收"
  };
  if (text === "inactive") return "停用";
  return map[text] || text || "-";
}

function authHeaders(extra = {}) {
  const token = api.token();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

function handleAdminError(error, fallback = "操作失败") {
  if (error?.status === 401) {
    void api.logout().catch(() => api.setToken(null));
    me.value = false;
    page.value = "dashboard";
    showNotice("登录状态已失效，请重新登录");
    return;
  }
  showNotice(error?.message || fallback);
}

async function adminRequest(path, config = {}, fallback = "请求失败") {
  try {
    return await api.request(path, config);
  } catch (error) {
    handleAdminError(error, fallback);
    throw error;
  }
}

function initials(name) {
  return String(name || "-").slice(0, 1);
}

function resolveAdminAssetUrl(url) {
  const text = String(url || "").trim();
  if (!text) return "";
  if (/^(https?:|data:|blob:)/i.test(text)) return text;
  if (text.startsWith("/")) return `${API_BASE_URL}${text}`;
  return `${API_BASE_URL}/${text}`;
}

function avatarSrc(url, fallback) {
  const text = String(url || "").trim();
  if (!text || isHistoricalTestText(text)) return fallback;
  return resolveAdminAssetUrl(text) || fallback;
}

function useFallbackAvatar(event, fallback) {
  const image = event?.target;
  if (image && image.src !== fallback) image.src = fallback;
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function datetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mapAppointment(item) {
  const scheduleTime = item.schedule?.startAt || item.createdAt;
  const studentId = item.studentId || item.student?.id || "";
  const counselorId = item.counselorId || item.counselor?.id || "";
  return {
    ...item,
    studentId,
    counselorId,
    code: item.appointmentNo || item.id,
    student: safeVisibleText(item.student?.name, "暂无"),
    counselor: safeVisibleText(item.counselor?.name, "暂无"),
    time: formatDateTime(scheduleTime),
    type: appointmentTypeLabel(item.type),
    status: item.status || "pending",
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt),
    feedbackAt: item.feedback?.updatedAt ? formatDateTime(item.feedback.updatedAt) : "",
    logs: [],
    detail: {
      studentId,
      counselorId,
      studentNo: item.student?.studentNo || "-",
      studentClass: [item.student?.college, item.student?.major, item.student?.className].filter(Boolean).join(" / ") || "-",
      studentPhone: item.student?.phone || "-",
      counselorNo: item.counselor?.jobNo || "-",
      campus: item.campus?.name || item.counselor?.campus?.name || "-",
      specialties: Array.isArray(item.counselor?.specialties) ? item.counselor.specialties.join("、") : "-",
      room: item.room?.name || "-",
      concern: item.concern || "-",
      note: item.rejectReason || "",
      riskScore: "-",
      riskLevel: "未筛查",
      riskAdvice: "-"
    }
  };
}

function mapSchedule(item) {
  return {
    ...item,
    counselorName: safeVisibleText(item.counselor?.name, "暂无"),
    counselorId: item.counselorId || item.counselor?.id || "",
    roomName: item.room?.name || "-",
    roomId: item.roomId || item.room?.id || "",
    campusName: item.campus?.name || item.room?.campus?.name || "-",
    date: formatDate(item.startAt),
    timeRange: `${formatTime(item.startAt)} - ${formatTime(item.endAt)}`,
    status: item.status || "available",
    appointmentState: item.appointment ? "已关联预约" : "无预约",
    hasAppointment: Boolean(item.appointment),
    startAtInput: datetimeLocal(item.startAt),
    endAtInput: datetimeLocal(item.endAt)
  };
}

function mapScheduleRows(items) {
  const dayLabels = ["周一", "周二", "周三", "周四", "周五"];
  const rows = new Map();
  for (const item of items) {
    const name = safeVisibleText(item.counselor?.name, "暂无");
    if (!rows.has(name)) {
      rows.set(name, { name, slots: dayLabels.map((_, day) => ({ day, text: "休息", rest: true })) });
    }
    const day = new Date(item.startAt).getDay() - 1;
    if (day >= 0 && day < 5) {
      rows.get(name).slots[day] = {
        day,
        text: `${formatDateTime(item.startAt).slice(-5)}-${formatDateTime(item.endAt).slice(-5)}`,
        rest: item.status === "disabled"
      };
    }
  }
  return [...rows.values()];
}

function mapStudent(item) {
  return {
    ...item,
    name: safeVisibleText(item.name, "暂无"),
    college: safeVisibleText(item.college, "暂无"),
    grade: safeVisibleText(item.grade, "暂无"),
    avatarText: initials(safeVisibleText(item.name, "")),
    avatarSrc: avatarSrc(item.avatar, studentDefaultAvatar),
    campus: safeVisibleText(item.campus?.name, "-"),
    sessions: item.appointments?.length || item._count?.appointments || 0,
    status: item.status || "active",
    firstConsultAt: item.appointments?.[0]?.createdAt ? formatDateTime(item.appointments[0].createdAt) : "",
    lastConsultAt: item.appointments?.[0]?.updatedAt ? formatDateTime(item.appointments[0].updatedAt) : ""
  };
}

function mapCounselor(item) {
  const specialties = Array.isArray(item.specialties) ? item.specialties : [];
  const name = safeVisibleText(item.name, "待确认咨询师");
  return {
    ...item,
    name,
    avatarText: initials(name),
    avatarSrc: avatarSrc(item.avatar, counselorDefaultAvatar),
    role: safeVisibleText(item.title, "心理咨询师"),
    campus: safeVisibleText(item.campus?.name, "-"),
    specialties: safeVisibleText(specialties.join("、"), "未填写"),
    monthSessions: item.appointments?.length || 0,
    totalSessions: item.appointments?.length || 0,
    rating: "5.0",
    color: item.status === "disabled" ? "gray" : "blue",
    status: item.status || "active",
    week: weekFor("以排班表为准")
  };
}

function mapShift(item) {
  return {
    ...item,
    teacher: item.counselor?.name || "-",
    from: `${formatDateTime(item.fromStartAt)} - ${formatDateTime(item.fromEndAt)}`,
    to: `${formatDateTime(item.toStartAt)} - ${formatDateTime(item.toEndAt)}`,
    reason: safeVisibleText(item.reason, "历史调班原因待整理"),
    status: item.status || "pending"
  };
}

function mapRisk(item) {
  const studentName = item.student?.name || "-";
  return {
    ...item,
    student: studentName,
    studentNo: item.student?.studentNo || "-",
    college: item.student?.college || "-",
    type: item.source || item.assessmentType || "风险筛查",
    score: item.score ?? "-",
    level: item.level || "-",
    advice: safeVisibleText(item.advice || item.suggestion, "-"),
    followupNotes: safeVisibleText(item.followupNotes, ""),
    foundAt: formatDateTime(item.createdAt),
    status: item.processStatus || "pending"
  };
}

function mapReferral(item) {
  const status = item.status || "pending";
  return {
    ...item,
    avatarText: initials(item.student?.name),
    avatarSrc: avatarSrc(item.student?.avatar, studentDefaultAvatar),
    color: status === "rejected" ? "red" : status === "approved" || status === "accepted" ? "green" : "blue",
    student: item.student?.name || "-",
    from: item.sourceCounselor?.name || "-",
    to: item.targetCounselor?.name || "-",
    reason: safeVisibleText(item.reason, "历史转介原因待整理"),
    adminNote: safeVisibleText(item.adminNote, ""),
    createdAt: formatDateTime(item.createdAt),
    handledAt: item.handledAt ? formatDateTime(item.handledAt) : "-",
    status
  };
}

function mapArticle(item) {
  return {
    ...item,
    author: item.authorRole === "admin" ? "管理员" : "咨询师",
    publishedAt: formatDateTime(item.publishedAt || item.createdAt),
    category: item.category || "-",
    summary: item.summary || "",
    content: item.content || "",
    cover: item.cover || "",
    status: item.status || "draft"
  };
}

function mapActivity(item) {
  return {
    ...item,
    cover: item.cover || "",
    coverSrc: resolveAdminAssetUrl(item.cover) || coverFallback,
    type: item.category || "-",
    category: item.category || "-",
    time: formatDateTime(item.startAt),
    startTime: datetimeLocal(item.startAt),
    endTime: datetimeLocal(item.endAt),
    deadline: datetimeLocal(item.signupEndAt),
    place: item.location || "-",
    location: item.location || "-",
    joined: item.signups?.length || 0,
    limit: item.capacity || 0,
    signups: (item.signups || []).map(mapRegistration),
    status: item.status || "draft"
  };
}

function mapRegistration(item) {
  const student = item.student || {};
  return {
    ...item,
    name: item.name || student.name || "-",
    studentNo: student.studentNo || "-",
    college: student.college || "-",
    phone: item.phone || student.phone || "-",
    registeredAt: formatDateTime(item.createdAt),
    status: item.status || "signed",
    checked: item.status === "checked_in" || item.checked === true
  };
}

function mapCampus(item) {
  const campusName = safeVisibleText(item.name, "历史校区名称待整理");
  return {
    ...item,
    name: campusName,
    roomItems: item.rooms || [],
    rooms: item.rooms?.length || 0,
    counselors: counselors.value.filter((counselor) => counselor.campus === campusName).length,
    manager: item.manager || "-",
    status: item.status === "active" ? "启用" : "停用"
  };
}

function mapLog(item) {
  return {
    ...item,
    time: formatDateTime(item.createdAt),
    operator: item.actorRole || "system",
    detail: safeVisibleText(item.detail || item.metadata?.message || `${item.entity || "-"} ${item.entityId || ""}`.trim(), "历史日志内容待整理"),
    ip: item.ip || "-",
    targetType: item.entity || "-",
    targetId: item.entityId || "-"
  };
}

function mapSystemFeedback(item) {
  const student = item.student || {};
  const content = String(item.content || "");
  return {
    ...item,
    type: item.type || "-",
    content: content || "-",
    summary: content.length > 28 ? `${content.slice(0, 28)}...` : content || "-",
    contact: item.contact || "-",
    status: item.status || "pending",
    studentName: student.name || "-",
    studentNo: student.studentNo || "-",
    college: student.college || "-",
    studentPhone: student.phone || "-",
    campus: student.campus?.name || "-",
    adminReply: item.adminReply || "",
    handledByText: item.handledBy || "-",
    handledAtText: formatDateTime(item.handledAt),
    createdAtText: formatDateTime(item.createdAt),
    updatedAtText: formatDateTime(item.updatedAt)
  };
}

function normalizeAssessmentQuestionsForAdmin(questions) {
  const source = Array.isArray(questions)
    ? questions
    : Array.isArray(questions?.items)
      ? questions.items
      : Array.isArray(questions?.questions)
        ? questions.questions
        : [];
  return source.map((question, index) => ({
    ...question,
    id: question.id || question.code || String(index + 1),
    title: question.title || question.question || question.text || "-",
    options: Array.isArray(question.options) ? question.options : Array.isArray(question.choices) ? question.choices : [],
    order: Number(question.order || index + 1)
  }));
}

function mapAssessment(item) {
  const questions = normalizeAssessmentQuestionsForAdmin(item.questions);
  return {
    ...item,
    title: item.title || "-",
    description: item.description || "",
    type: item.type || item.questions?.meta?.type || "心理测评",
    status: item.status || "active",
    questions,
    questionCount: questions.length,
    createdAtText: formatDateTime(item.createdAt),
    updatedAtText: formatDateTime(item.updatedAt || item.createdAt)
  };
}

function mapAssessmentResult(item) {
  const student = item.student || {};
  return {
    ...item,
    assessmentTitle: item.assessmentTitle || item.assessment?.title || "-",
    studentName: student.name || item.studentName || "-",
    studentNo: student.studentNo || item.studentNo || "-",
    college: student.college || "-",
    score: item.score ?? "-",
    level: item.level || "-",
    summary: item.summary || item.suggestion || "-",
    createdAtText: formatDateTime(item.createdAt)
  };
}

function newCarouselItem(index = homeCarouselItems.value.length) {
  return {
    localId: `carousel-${Date.now()}-${index}`,
    id: "",
    type: "article",
    targetId: "",
    title: "",
    subtitle: "",
    cover: "",
    order: index + 1,
    enabled: true
  };
}

function normalizeCarouselSettingItems(value = []) {
  const items = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  return items.map((item, index) => ({
    ...newCarouselItem(index),
    localId: item.localId || item.id || `carousel-${Date.now()}-${index}`,
    id: item.id || "",
    type: item.type === "activity" ? "activity" : "article",
    targetId: item.targetId || item.contentId || item.articleId || item.activityId || "",
    title: item.title || "",
    subtitle: item.subtitle || "",
    cover: item.cover || "",
    order: Number(item.order || index + 1),
    enabled: item.enabled !== false
  }));
}

function carouselTargetOptions(type) {
  if (type === "activity") {
    return activities.value.filter((item) => item.status !== "cancelled").map((item) => ({ id: item.id, title: item.title || item.name || "-" }));
  }
  return articles.value.filter((item) => item.status !== "archived").map((item) => ({ id: item.id, title: item.title || "-" }));
}

function addCarouselItem() {
  homeCarouselItems.value.push(newCarouselItem());
}

function removeCarouselItem(index) {
  homeCarouselItems.value.splice(index, 1);
}

function carouselSettingsPayload() {
  return homeCarouselItems.value
    .map((item, index) => ({
      id: item.id || `${item.type}-${item.targetId || index}`,
      type: item.type === "activity" ? "activity" : "article",
      targetId: item.targetId,
      title: item.title || "",
      subtitle: item.subtitle || "",
      cover: item.cover || "",
      order: Number(item.order || index + 1),
      enabled: item.enabled !== false
    }))
    .filter((item) => item.targetId);
}

function assessmentOptionText(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (!options.length) return "未配置选项";
  return options.map((option) => typeof option === "string" ? option : option.label || option.text || option.value || "-").join(" / ");
}

function applySettings(data = []) {
  const byKey = Object.fromEntries(data.map((item) => [item.key, item]));
  const appointmentRules = byKey.appointmentRules?.value || {};
  const platform = byKey.platform?.value || byKey.basicSettings?.value || {};
  homeCarouselItems.value = normalizeCarouselSettingItems(byKey.studentHomeCarousel?.value || []);
  Object.assign(settingsForm, {
    platformName: platform.name || platform.platformName || settingsForm.platformName,
    durationMinutes: Number(appointmentRules.durationMinutes || settingsForm.durationMinutes),
    advanceDays: Number(appointmentRules.advanceDays || settingsForm.advanceDays),
    dailyLeaveLimit: Number(appointmentRules.dailyLeaveLimit || settingsForm.dailyLeaveLimit),
    autoConfirm: Boolean(appointmentRules.autoConfirm),
    allowStudentCancel: appointmentRules.allowStudentCancel !== false
  });
}

async function loadStudents() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (studentFilters.keyword) params.set("keyword", studentFilters.keyword);
    if (studentFilters.status) params.set("status", studentFilters.status);
    const data = await adminRequest(`/api/admin/students${params.toString() ? `?${params}` : ""}`, {}, "学生列表加载失败");
    students.value = data.map(mapStudent);
  } finally {
    dataLoading.value = false;
  }
}

async function loadCounselors() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (counselorFilters.keyword) params.set("keyword", counselorFilters.keyword);
    if (counselorFilters.status) params.set("status", counselorFilters.status);
    const data = await adminRequest(`/api/admin/counselors${params.toString() ? `?${params}` : ""}`, {}, "咨询师列表加载失败");
    counselors.value = data.map(mapCounselor);
  } finally {
    dataLoading.value = false;
  }
}

async function loadDashboard() {
  dashboardLoading.value = true;
  dashboardError.value = "";
  try {
    const data = await adminRequest("/api/admin/dashboard", {}, "数据看板加载失败");
    dashboardData.value = { ...dashboardData.value, ...data };
    if (Array.isArray(data.recentAppointments)) {
      appointments.value = data.recentAppointments.map(mapAppointment);
    }
  } catch (error) {
    dashboardError.value = error.message || "数据看板加载失败";
    throw error;
  } finally {
    dashboardLoading.value = false;
  }
}

async function loadAppointments() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (appointmentFilters.status) params.set("status", appointmentFilters.status);
    const data = await adminRequest(`/api/admin/appointments${params.toString() ? `?${params}` : ""}`, {}, "预约列表加载失败");
    appointments.value = data.map(mapAppointment);
  } finally {
    dataLoading.value = false;
  }
}

async function loadSchedules() {
  dataLoading.value = true;
  try {
  const data = await adminRequest("/api/admin/schedules", {}, "排班列表加载失败");
    schedules.value = data.map(mapSchedule);
    scheduleRows.value = mapScheduleRows(data);
  } finally {
    dataLoading.value = false;
  }
}

async function loadShifts() {
  const data = await adminRequest("/api/admin/shift-applications", {}, "调班列表加载失败");
  shifts.value = data.map(mapShift);
  dashboardData.value.pendingShifts = shifts.value.filter((item) => item.status === "pending").length;
}

async function loadRisks() {
  dataLoading.value = true;
  try {
    const data = await adminRequest("/api/admin/risk-records", {}, "风险列表加载失败");
    risks.value = data.map(mapRisk);
  } finally {
    dataLoading.value = false;
  }
}

async function loadReferrals() {
  dataLoading.value = true;
  try {
    const data = await adminRequest("/api/admin/referrals", {}, "转介列表加载失败");
    referrals.value = data.map(mapReferral);
    dashboardData.value.pendingReferrals = referrals.value.filter((item) => item.status === "pending").length;
  } finally {
    dataLoading.value = false;
  }
}

async function loadSystemFeedbacks() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (systemFeedbackFilters.status) params.set("status", systemFeedbackFilters.status);
    if (systemFeedbackFilters.type) params.set("type", systemFeedbackFilters.type);
    params.set("page", String(systemFeedbackFilters.page));
    params.set("pageSize", String(systemFeedbackFilters.pageSize));
    const data = await adminRequest(`/api/admin/system-feedbacks?${params}`, {}, "系统反馈列表加载失败");
    systemFeedbacks.value = (data.items || []).map(mapSystemFeedback);
    systemFeedbackTotal.value = Number(data.total || 0);
    if (selectedSystemFeedback.value) {
      const latest = systemFeedbacks.value.find((item) => item.id === selectedSystemFeedback.value.id);
      if (latest) selectedSystemFeedback.value = latest;
    }
  } finally {
    dataLoading.value = false;
  }
}

async function loadAssessments() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (assessmentFilters.status) params.set("status", assessmentFilters.status);
    if (assessmentFilters.keyword) params.set("keyword", assessmentFilters.keyword);
    params.set("page", String(assessmentFilters.page));
    params.set("pageSize", String(assessmentFilters.pageSize));
    const data = await adminRequest(`/api/admin/assessments?${params}`, {}, "测评列表加载失败");
    assessments.value = (data.items || []).map(mapAssessment);
    assessmentTotal.value = Number(data.total || 0);
    if (selectedAssessment.value) {
      const latest = assessments.value.find((item) => item.id === selectedAssessment.value.id);
      if (latest) selectedAssessment.value = latest;
    }
  } finally {
    dataLoading.value = false;
  }
}

async function loadAssessmentResults() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (assessmentResultFilters.assessmentId) params.set("assessmentId", assessmentResultFilters.assessmentId);
    params.set("page", String(assessmentResultFilters.page));
    params.set("pageSize", String(assessmentResultFilters.pageSize));
    const data = await adminRequest(`/api/admin/assessment-results?${params}`, {}, "测评结果加载失败");
    assessmentResults.value = (data.items || []).map(mapAssessmentResult);
    assessmentResultTotal.value = Number(data.total || 0);
  } finally {
    dataLoading.value = false;
  }
}

async function loadArticles() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (articleFilters.keyword) params.set("keyword", articleFilters.keyword);
    if (articleFilters.category) params.set("category", articleFilters.category);
    if (articleFilters.status) params.set("status", articleFilters.status);
    const data = await adminRequest(`/api/admin/articles${params.toString() ? `?${params}` : ""}`, {}, "文章列表加载失败");
    articles.value = data.map(mapArticle);
  } finally {
    dataLoading.value = false;
  }
}

async function loadActivities() {
  dataLoading.value = true;
  const params = new URLSearchParams();
  try {
    if (activityFilters.keyword) params.set("keyword", activityFilters.keyword);
    if (activityFilters.category) params.set("category", activityFilters.category);
    if (activityFilters.status) params.set("status", activityFilters.status);
    if (activityFilters.date) params.set("date", activityFilters.date);
    const data = await adminRequest(`/api/admin/activities${params.toString() ? `?${params}` : ""}`, {}, "活动列表加载失败");
    activities.value = data.map(mapActivity);
  } finally {
    dataLoading.value = false;
  }
}

async function loadCampuses() {
  const data = await adminRequest("/api/admin/campuses", {}, "校区列表加载失败");
  campuses.value = data.map(mapCampus);
}

async function loadLogs() {
  const data = await adminRequest("/api/admin/logs", {}, "日志列表加载失败");
  logs.value = data.map(mapLog);
}

async function loadSettings() {
  const data = await adminRequest("/api/admin/settings", {}, "系统设置加载失败");
  applySettings(data);
}

async function loadAccounts() {
  await Promise.all([loadStudents(), loadCounselors()]);
}

async function loadAdminData() {
  await loadAccounts();
  await Promise.all([
    loadDashboard(),
    loadAppointments(),
    loadSchedules(),
    loadShifts(),
    loadRisks(),
    loadReferrals(),
    loadSystemFeedbacks(),
    loadAssessments(),
    loadAssessmentResults(),
    loadArticles(),
    loadActivities(),
    loadCampuses(),
    loadLogs(),
    loadSettings()
  ]);
}

async function login() {
  loginError.value = false;
  if (!loginForm.account || !loginForm.password) {
    loginError.value = true;
    return;
  }
  loading.value = true;
  try {
    await api.loginAdmin({ username: loginForm.account, password: loginForm.password });
    me.value = true;
    page.value = "dashboard";
    await loadAdminData();
  } catch (error) {
    loginError.value = true;
  } finally {
    loading.value = false;
  }
}

async function logout() {
  await api.logout();
  me.value = false;
  page.value = "dashboard";
}

function go(target) {
  page.value = target;
  if (target === "students") loadStudents().catch((error) => showNotice(error.message || "学生列表加载失败"));
  if (target === "counselors") loadCounselors().catch((error) => showNotice(error.message || "咨询师列表加载失败"));
  if (target === "dashboard") loadDashboard().catch((error) => showNotice(error.message || "看板加载失败"));
  if (target === "appointments") loadAppointments().catch((error) => showNotice(error.message || "预约列表加载失败"));
  if (target === "scheduling") loadSchedules().catch((error) => showNotice(error.message || "排班列表加载失败"));
  if (target === "shift_approval") loadShifts().catch((error) => showNotice(error.message || "调班列表加载失败"));
  if (target === "risk_center") loadRisks().catch((error) => showNotice(error.message || "风险列表加载失败"));
  if (target === "referral") loadReferrals().catch((error) => showNotice(error.message || "转介列表加载失败"));
  if (target === "system_feedbacks") loadSystemFeedbacks().catch((error) => showNotice(error.message || "系统反馈列表加载失败"));
  if (target === "articles") loadArticles().catch((error) => showNotice(error.message || "文章列表加载失败"));
  if (target === "activities") loadActivities().catch((error) => showNotice(error.message || "活动列表加载失败"));
  if (target === "campus") loadCampuses().catch((error) => showNotice(error.message || "校区列表加载失败"));
  if (target === "logs") loadLogs().catch((error) => showNotice(error.message || "日志列表加载失败"));
  if (target === "settings") loadSettings().catch((error) => showNotice(error.message || "系统设置加载失败"));
  if (target === "assessments") {
    loadAssessments().catch((error) => showNotice(error.message || "测评列表加载失败"));
    loadAssessmentResults().catch((error) => showNotice(error.message || "测评结果加载失败"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetStudentFilters() {
  studentFilters.keyword = "";
  studentFilters.status = "";
  loadStudents();
}

function resetCounselorFilters() {
  counselorFilters.keyword = "";
  counselorFilters.status = "";
  loadCounselors();
}

function resetAppointmentFilters() {
  appointmentFilters.keyword = "";
  appointmentFilters.status = "";
  appointmentFilters.type = "";
  loadAppointments();
}

function applySystemFeedbackFilters() {
  systemFeedbackFilters.page = 1;
  loadSystemFeedbacks();
}

function resetSystemFeedbackFilters() {
  systemFeedbackFilters.status = "";
  systemFeedbackFilters.type = "";
  systemFeedbackFilters.page = 1;
  loadSystemFeedbacks();
}

function changeSystemFeedbackPage(delta) {
  const nextPage = Math.max(1, systemFeedbackFilters.page + delta);
  if (nextPage === systemFeedbackFilters.page) return;
  systemFeedbackFilters.page = nextPage;
  loadSystemFeedbacks();
}

function applyAssessmentFilters() {
  assessmentFilters.page = 1;
  loadAssessments();
}

function resetAssessmentFilters() {
  assessmentFilters.status = "";
  assessmentFilters.keyword = "";
  assessmentFilters.page = 1;
  loadAssessments();
}

function resetArticleFilters() {
  articleFilters.keyword = "";
  articleFilters.category = "";
  articleFilters.status = "";
  loadArticles();
}

function resetActivityFilters() {
  activityFilters.keyword = "";
  activityFilters.category = "";
  activityFilters.status = "";
  activityFilters.date = "";
  loadActivities();
}

function changeAssessmentPage(delta) {
  const nextPage = Math.max(1, assessmentFilters.page + delta);
  if (nextPage === assessmentFilters.page) return;
  assessmentFilters.page = nextPage;
  loadAssessments();
}

function changeAssessmentResultPage(delta) {
  const nextPage = Math.max(1, assessmentResultFilters.page + delta);
  if (nextPage === assessmentResultFilters.page) return;
  assessmentResultFilters.page = nextPage;
  loadAssessmentResults();
}

function clearAssessmentResultFilter() {
  assessmentResultFilters.assessmentId = "";
  assessmentResultFilters.page = 1;
  loadAssessmentResults();
}

function openImportPicker(kind) {
  if (kind === "students") studentImportInput.value?.click();
  if (kind === "counselors") counselorImportInput.value?.click();
}

async function downloadTemplate(kind) {
  const path = kind === "students" ? "/api/admin/students/import-template" : "/api/admin/counselors/import-template";
  const filename = kind === "students" ? "学生账号导入模板.xlsx" : "咨询师账号导入模板.xlsx";
  actionBusy.value = true;
  try {
    const response = await fetch(`${import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000"}${path}`, {
      headers: authHeaders()
    });
    if (response.status === 401) {
      handleAdminError({ status: 401 });
      return;
    }
    if (!response.ok) {
      showNotice("模板下载失败");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("模板已下载");
  } catch (error) {
    showNotice(error.message || "模板下载失败");
  } finally {
    actionBusy.value = false;
  }
}

async function handleImportFile(event, kind) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  const path = kind === "students" ? "/api/admin/students/import" : "/api/admin/counselors/import";
  actionBusy.value = true;
  try {
    const response = await fetch(`${import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000"}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: formData
    });
    if (response.status === 401) {
      handleAdminError({ status: 401 });
      return;
    }
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      importState.open = true;
      importState.kind = kind;
      importState.title = "导入失败";
      importState.summary = payload.message || "导入校验失败，未写入任何数据";
      importState.errors = payload.error?.errors || [];
      importState.credentials = [];
      return;
    }
    importState.open = true;
    importState.kind = kind;
    importState.title = "导入成功";
    importState.summary = `成功导入 ${payload.data?.imported || 0} 个账号`;
    importState.errors = [];
    importState.credentials = payload.data?.credentials || [];
    if (kind === "students") await loadStudents();
    if (kind === "counselors") await loadCounselors();
    await loadDashboard();
    await loadCampuses();
  } catch (error) {
    importState.open = true;
    importState.kind = kind;
    importState.title = "导入失败";
    importState.summary = error.message || "文件上传失败";
    importState.errors = [];
    importState.credentials = [];
  } finally {
    actionBusy.value = false;
  }
}

async function openStudent(row) {
  try {
    actionBusy.value = true;
    const detail = await adminRequest(`/api/admin/students/${row.id}`, {}, "学生详情加载失败");
    selectedStudent.value = mapStudent(detail);
    studentTimeline.value = (detail.appointments || []).slice(0, 5).map((item) => ({
      title: item.appointmentNo || item.id,
      meta: formatDateTime(item.createdAt),
      desc: item.status || "pending",
      color: item.status === "completed" ? "green" : item.status === "cancelled" ? "gray" : "blue"
    }));
    go("student_detail");
  } catch (error) {
    // handleAdminError has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

async function openCounselor(row) {
  try {
    actionBusy.value = true;
    const detail = await adminRequest(`/api/admin/counselors/${row.id}`, {}, "咨询师详情加载失败");
    selectedCounselor.value = mapCounselor(detail);
    go("counselor_detail");
  } catch (error) {
    // handleAdminError has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

function resetAccountForm() {
  Object.assign(accountForm, {
    id: "",
    studentNo: "",
    jobNo: "",
    name: "",
    idCardLast6: "",
    gender: "",
    college: "",
    major: "",
    grade: "",
    className: "",
    phone: "",
    title: "",
    campusId: "",
    status: "active",
    specialtiesText: "",
    introduction: ""
  });
}

function openAccountForm(kind, mode, row = {}) {
  resetAccountForm();
  accountFormKind.value = kind;
  accountFormMode.value = mode;
  if (mode === "edit") {
    Object.assign(accountForm, {
      id: row.id || "",
      studentNo: row.studentNo || "",
      jobNo: row.jobNo || "",
      name: row.name || "",
      gender: row.gender || "",
      college: row.college || "",
      major: row.major || "",
      grade: row.grade || "",
      className: row.className || "",
      phone: row.phone || "",
      title: row.title || row.role || "",
      campusId: row.campusId || "",
      status: row.status || "active",
      specialtiesText: Array.isArray(row.specialties) ? row.specialties.join(",") : row.specialties || "",
      introduction: row.introduction || ""
    });
  } else {
    accountForm.idCardLast6 = "";
    accountForm.college = "";
    accountForm.title = kind === "counselors" ? "心理咨询师" : "";
    accountForm.introduction = "";
  }
  accountFormOpen.value = true;
}

function closeAccountForm() {
  if (actionBusy.value) return;
  accountFormOpen.value = false;
}

function accountRequestBody() {
  if (accountFormKind.value === "students") {
    const body = {
      name: accountForm.name.trim(),
      gender: accountForm.gender,
      college: accountForm.college.trim(),
      major: accountForm.major,
      grade: accountForm.grade,
      className: accountForm.className,
      phone: accountForm.phone,
      campusId: accountForm.campusId || null,
      status: accountForm.status
    };
    if (accountFormMode.value === "add") {
      body.studentNo = accountForm.studentNo.trim();
      body.idCardLast6 = accountForm.idCardLast6.trim();
    }
    return body;
  }
  const specialties = accountForm.specialtiesText
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const body = {
    name: accountForm.name.trim(),
    gender: accountForm.gender,
    title: accountForm.title.trim() || "心理咨询师",
    phone: accountForm.phone,
    campusId: accountForm.campusId || null,
    specialties,
    introduction: accountForm.introduction.trim() || "暂无简介",
    status: accountForm.status
  };
  if (accountFormMode.value === "add") {
    body.jobNo = accountForm.jobNo.trim();
    body.idCardLast6 = accountForm.idCardLast6.trim();
  }
  return body;
}

async function saveAccountForm() {
  const kind = accountFormKind.value;
  const label = kind === "students" ? "学生" : "咨询师";
  const identity = kind === "students" ? accountForm.studentNo : accountForm.jobNo;
  if (!accountForm.name.trim() || (accountFormMode.value === "add" && !identity.trim())) {
    showNotice(`请填写${label}姓名和${kind === "students" ? "学号" : "工号"}`);
    return;
  }
  if (accountFormMode.value === "add" && !/^\d{6}$/.test(accountForm.idCardLast6.trim())) {
    showNotice("请填写6位数字身份核验码");
    return;
  }
  if (kind === "students" && !accountForm.college.trim()) {
    showNotice("请填写学生学院");
    return;
  }
  if (kind === "counselors" && (!accountForm.specialtiesText.trim() || !accountForm.introduction.trim())) {
    showNotice("请填写咨询师擅长领域和简介");
    return;
  }
  actionBusy.value = true;
  try {
    const method = accountFormMode.value === "edit" ? "PUT" : "POST";
    const path = accountFormMode.value === "edit" ? `/api/admin/${kind}/${accountForm.id}` : `/api/admin/${kind}`;
    const result = await adminRequest(path, { method, body: accountRequestBody() }, `${label}保存失败`);
    accountFormOpen.value = false;
    if (kind === "students") await loadStudents();
    if (kind === "counselors") await loadCounselors();
    await loadDashboard();
    if (accountFormMode.value === "add" && result?.temporaryPassword) {
      showTemporaryCredential(identity.trim(), accountForm.name.trim(), result.temporaryPassword);
    } else {
      showNotice(`${label}信息已保存`);
    }
  } catch (error) {
    // handleAdminError has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

function resetScheduleForm() {
  Object.assign(scheduleForm, {
    id: "",
    counselorId: "",
    roomId: "",
    startAt: "",
    endAt: "",
    status: "available",
    note: ""
  });
}

async function openScheduleForm(mode, row = {}) {
  if (!counselors.value.length) await loadCounselors();
  if (!campuses.value.length || !roomOptions.value.length) await loadCampuses();
  resetScheduleForm();
  scheduleFormMode.value = mode;
  if (mode === "edit") {
    Object.assign(scheduleForm, {
      id: row.id || "",
      counselorId: row.counselorId || "",
      roomId: row.roomId || "",
      startAt: row.startAtInput || datetimeLocal(row.startAt),
      endAt: row.endAtInput || datetimeLocal(row.endAt),
      status: row.status === "booked" ? "available" : row.status || "available",
      note: row.note || ""
    });
  }
  scheduleFormOpen.value = true;
}

function closeScheduleForm() {
  if (actionBusy.value) return;
  scheduleFormOpen.value = false;
}

function canManageSchedule(row) {
  return !row.hasAppointment && row.status !== "booked";
}

function scheduleRequestBody() {
  return {
    counselorId: scheduleForm.counselorId,
    roomId: scheduleForm.roomId,
    startAt: scheduleForm.startAt,
    endAt: scheduleForm.endAt,
    status: scheduleForm.status,
    note: scheduleForm.note
  };
}

async function saveScheduleForm() {
  if (!scheduleForm.counselorId || !scheduleForm.roomId || !scheduleForm.startAt || !scheduleForm.endAt) {
    showNotice("请完整填写咨询师、咨询室和排班时间");
    return;
  }
  if (new Date(scheduleForm.startAt).getTime() >= new Date(scheduleForm.endAt).getTime()) {
    showNotice("结束时间必须晚于开始时间");
    return;
  }
  actionBusy.value = true;
  try {
    const method = scheduleFormMode.value === "edit" ? "PUT" : "POST";
    const path = scheduleFormMode.value === "edit" ? `/api/admin/schedules/${scheduleForm.id}` : "/api/admin/schedules";
    await adminRequest(path, { method, body: scheduleRequestBody() }, "排班保存失败");
    scheduleFormOpen.value = false;
    await loadSchedules();
    await loadDashboard();
    showNotice("排班已保存，学生端可约时段将同步更新");
  } catch (error) {
    // adminRequest has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

function confirmDisableSchedule(row) {
  if (!canManageSchedule(row)) {
    showNotice("已有关联预约的排班不能在管理端直接禁用");
    return;
  }
  openModal("disable-schedule", "禁用排班", `确认禁用「${row.counselorName} ${row.date} ${row.timeRange}」排班？`, {
    danger: true,
    confirmText: "确认禁用",
    onConfirm: async () => {
      await adminRequest(`/api/admin/schedules/${row.id}`, { method: "DELETE" }, "排班禁用失败");
      await loadSchedules();
      await loadDashboard();
      showNotice("排班已禁用");
    }
  });
}

function openAppointment(row) {
  selectedAppointment.value = row;
  appointmentDrawerOpen.value = true;
}

function closeAppointmentDrawer() {
  appointmentDrawerOpen.value = false;
}

async function openAppointmentRelated(target, options = {}) {
  const appointment = currentAppointment.value || {};
  if (target === "student_detail") {
    const studentId = appointment.studentId || appointment.student?.id || appointment.detail?.studentId || "";
    if (!studentId) {
      showNotice("当前预约缺少学生编号，无法打开学生档案");
      return;
    }
    if (options.closeDrawer) closeAppointmentDrawer();
    await openStudent({ id: studentId });
    return;
  }
  if (target === "counselor_detail") {
    const counselorId = appointment.counselorId || appointment.counselor?.id || appointment.detail?.counselorId || "";
    if (!counselorId) {
      showNotice("当前预约缺少咨询师编号，无法打开咨询师详情");
      return;
    }
    if (options.closeDrawer) closeAppointmentDrawer();
    await openCounselor({ id: counselorId });
    return;
  }
  if (options.closeDrawer) closeAppointmentDrawer();
  go(target);
}

function goFromAppointmentDrawer(target) {
  openAppointmentRelated(target, { closeDrawer: true });
}

function appointmentStatusColor(status) {
  const map = {
    pending: "yellow",
    confirmed: "green",
    in_progress: "blue",
    checked_in: "blue",
    completed: "blue",
    cancelled: "gray",
    rejected: "red",
    no_show: "red",
    已确认: "green",
    待确认: "yellow",
    已完成: "blue",
    已取消: "gray",
    已拒绝: "red"
  };
  return map[status] || "gray";
}

function showNotice(message) {
  notice.value = message;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => {
    notice.value = "";
  }, 2200);
}

function openDeleteConfirm(message) {
  openModal("delete-confirm", "确认删除", message || "此操作不可撤销，确认删除该记录？", { danger: true, confirmText: "确认删除" });
}

function confirmShiftAction(row, action) {
  const approving = action === "approve";
  openModal(
    action === "approve" ? "approve-shift" : "reject-shift",
    approving ? "确认通过" : "驳回申请",
    approving ? "确认通过该调班申请？" : "确认拒绝该调班申请？",
    {
      confirmText: approving ? "确认通过" : "确认拒绝",
      success: approving,
      danger: !approving,
      onConfirm: async () => {
        await adminRequest(`/api/admin/shift-applications/${row.id}/${action}`, { method: "POST", body: { note: approving ? "管理员审批通过" : "管理员审批驳回" } }, "调班审批失败");
        await loadShifts();
        await loadSchedules();
        await loadDashboard();
        showNotice(approving ? "调班申请已通过" : "调班申请已拒绝");
      }
    }
  );
}

function openRiskDetail(row) {
  openModal(
    "risk-detail",
    "风险详情",
    `学生：${row.student || "-"}；学号：${row.studentNo || "-"}；风险等级：${statusLabel(row.level)}；分数：${row.score || "-"}；建议：${row.advice || "-"}；处理状态：${statusLabel(row.status)}；跟进记录：${row.followupNotes || "暂无"}`,
    { confirmText: "我知道了" }
  );
}

function confirmRiskFollowup(row) {
  openModal(
    "risk-followup",
    "添加跟进记录",
    `请填写「${row.student || "-"}」的风险跟进内容：`,
    {
      textarea: true,
      confirmText: "确认提交",
      onConfirm: async (note) => {
        await adminRequest(`/api/admin/risk-records/${row.id}/followup`, { method: "POST", body: { note: note || "管理员已添加风险跟进记录" } }, "风险跟进提交失败");
        await loadRisks();
        await loadDashboard();
        showNotice("风险跟进记录已提交");
      }
    }
  );
}

function confirmRiskClose(row) {
  openModal(
    "risk-close",
    "关闭风险记录",
    `确认关闭「${row.student || "-"}」的风险记录？`,
    {
      textarea: true,
      success: true,
      confirmText: "确认关闭",
      onConfirm: async (note) => {
        await adminRequest(`/api/admin/risk-records/${row.id}/close`, { method: "POST", body: { note: note || "管理员确认风险已处理完成" } }, "风险关闭失败");
        await loadRisks();
        await loadDashboard();
        showNotice("风险记录已关闭");
      }
    }
  );
}

function confirmReferralAction(row, action) {
  const approving = action === "approve";
  openModal(
    approving ? "approve-referral" : "reject-referral",
    approving ? "转介审批通过" : "转介审批拒绝",
    approving ? `确认通过「${row.student || "-"}」的转介申请？` : `请填写「${row.student || "-"}」转介申请的拒绝原因：`,
    {
      textarea: !approving,
      success: approving,
      danger: !approving,
      confirmText: approving ? "确认通过" : "确认拒绝",
      onConfirm: async (note) => {
        await adminRequest(`/api/admin/referrals/${row.id}/${action}`, { method: "POST", body: { note: note || (approving ? "管理员审批通过" : "管理员审批拒绝") } }, "转介审批失败");
        await loadReferrals();
        await loadDashboard();
        showNotice(approving ? "转介申请已通过" : "转介申请已拒绝");
      }
    }
  );
}

async function openSystemFeedbackDetail(row) {
  try {
    actionBusy.value = true;
    const detail = await adminRequest(`/api/admin/system-feedbacks/${row.id}`, {}, "系统反馈详情加载失败");
    selectedSystemFeedback.value = mapSystemFeedback(detail);
  } catch (error) {
    // handleAdminError has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

async function refreshSystemFeedbackDetail(id) {
  if (!id) return;
  const detail = await adminRequest(`/api/admin/system-feedbacks/${id}`, {}, "系统反馈详情刷新失败");
  selectedSystemFeedback.value = mapSystemFeedback(detail);
}

function confirmSystemFeedbackProcessing(row) {
  openModal("system-feedback-processing", "标记处理中", `确认将「${row.studentName || "-"}」的系统反馈标记为处理中？`, {
    confirmText: "确认标记",
    onConfirm: async () => {
      await adminRequest(`/api/admin/system-feedbacks/${row.id}`, { method: "PUT", body: { status: "processing" } }, "系统反馈状态更新失败");
      await loadSystemFeedbacks();
      await refreshSystemFeedbackDetail(row.id);
      await loadLogs();
      showNotice("系统反馈已标记为处理中");
    }
  });
}

function confirmSystemFeedbackReply(row) {
  openModal("system-feedback-reply", "回复系统反馈", `请填写给「${row.studentName || "-"}」的反馈回复：`, {
    textarea: true,
    confirmText: "提交回复",
    onConfirm: async (adminReply) => {
      if (!String(adminReply || "").trim()) {
        showNotice("请填写回复内容");
        return;
      }
      await adminRequest(`/api/admin/system-feedbacks/${row.id}/reply`, { method: "POST", body: { adminReply: String(adminReply).trim() } }, "系统反馈回复失败");
      await loadSystemFeedbacks();
      await refreshSystemFeedbackDetail(row.id);
      await loadLogs();
      showNotice("系统反馈回复已保存");
    }
  });
}

function confirmSystemFeedbackClose(row) {
  openModal("system-feedback-close", "关闭系统反馈", `确认关闭「${row.studentName || "-"}」提交的系统反馈？`, {
    danger: true,
    confirmText: "确认关闭",
    onConfirm: async () => {
      await adminRequest(`/api/admin/system-feedbacks/${row.id}/close`, { method: "POST" }, "系统反馈关闭失败");
      await loadSystemFeedbacks();
      await refreshSystemFeedbackDetail(row.id);
      await loadLogs();
      showNotice("系统反馈已关闭");
    }
  });
}

async function openAssessmentDetail(row) {
  try {
    actionBusy.value = true;
    const detail = await adminRequest(`/api/admin/assessments/${row.id}`, {}, "测评详情加载失败");
    selectedAssessment.value = mapAssessment(detail);
  } catch (error) {
    // handleAdminError has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

async function refreshAssessmentDetail(id) {
  if (!id) return;
  const detail = await adminRequest(`/api/admin/assessments/${id}`, {}, "测评详情刷新失败");
  selectedAssessment.value = mapAssessment(detail);
}

function resetAssessmentForm() {
  Object.assign(assessmentForm, {
    id: "",
    title: "",
    description: "",
    type: "心理测评",
    status: "active",
    questionsText: ""
  });
}

function assessmentQuestionsToText(questions) {
  return normalizeAssessmentQuestionsForAdmin(questions)
    .map((question) => {
      const options = (question.options || []).map((option) => typeof option === "string" ? option : option.label || option.text || option.value || "").filter(Boolean);
      return [question.title || "", ...options].join("|");
    })
    .join("\n");
}

function openAssessmentForm(mode, row = {}) {
  resetAssessmentForm();
  assessmentFormMode.value = mode;
  if (mode === "edit") {
    Object.assign(assessmentForm, {
      id: row.id || "",
      title: row.title || "",
      description: row.description || "",
      type: row.type || "心理测评",
      status: row.status || "active",
      questionsText: assessmentQuestionsToText(row.questions || [])
    });
  }
  assessmentFormOpen.value = true;
}

function closeAssessmentForm() {
  if (actionBusy.value) return;
  assessmentFormOpen.value = false;
}

function parseAssessmentQuestionsText() {
  return assessmentForm.questionsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title, ...options] = line.split("|").map((item) => item.trim()).filter(Boolean);
      return {
        id: String(index + 1),
        title,
        options,
        order: index + 1
      };
    });
}

function assessmentRequestBody() {
  return {
    title: assessmentForm.title.trim(),
    description: assessmentForm.description.trim(),
    type: assessmentForm.type.trim() || "心理测评",
    status: assessmentForm.status,
    questions: parseAssessmentQuestionsText()
  };
}

async function saveAssessment() {
  if (!assessmentForm.title.trim()) {
    showNotice("请填写测评标题");
    return;
  }
  const questions = parseAssessmentQuestionsText();
  if (!questions.length || questions.some((item) => !item.title)) {
    showNotice("请至少配置一道有效题目");
    return;
  }
  actionBusy.value = true;
  try {
    const method = assessmentFormMode.value === "edit" ? "PUT" : "POST";
    const path = assessmentFormMode.value === "edit" ? `/api/admin/assessments/${assessmentForm.id}` : "/api/admin/assessments";
    const saved = await adminRequest(path, { method, body: assessmentRequestBody() }, "测评保存失败");
    assessmentFormOpen.value = false;
    await loadAssessments();
    selectedAssessment.value = mapAssessment(saved);
    await loadAssessmentResults();
    showNotice(assessmentFormMode.value === "edit" ? "测评已更新" : "测评已新增");
  } catch (error) {
    // handleAdminError has already surfaced the failure.
  } finally {
    actionBusy.value = false;
  }
}

function toggleAssessmentStatus(row) {
  const nextStatus = row.status === "active" ? "inactive" : "active";
  openModal("assessment-status", nextStatus === "active" ? "启用测评" : "停用测评", `确认${nextStatus === "active" ? "启用" : "停用"}测评《${row.title || "-"}》？`, {
    confirmText: nextStatus === "active" ? "确认启用" : "确认停用",
    onConfirm: async () => {
      await adminRequest(`/api/admin/assessments/${row.id}`, { method: "PUT", body: { status: nextStatus } }, "测评状态更新失败");
      await loadAssessments();
      if (selectedAssessment.value?.id === row.id) await refreshAssessmentDetail(row.id);
      showNotice(nextStatus === "active" ? "测评已启用" : "测评已停用");
    }
  });
}

function confirmArchiveAssessment(row) {
  openModal("assessment-archive", "归档测评", `确认归档测评《${row.title || "-"}》？历史测评结果不会被删除。`, {
    danger: true,
    confirmText: "确认归档",
    onConfirm: async () => {
      await adminRequest(`/api/admin/assessments/${row.id}`, { method: "DELETE" }, "测评归档失败");
      await loadAssessments();
      if (selectedAssessment.value?.id === row.id) await refreshAssessmentDetail(row.id);
      await loadAssessmentResults();
      showNotice("测评已归档");
    }
  });
}

function openAssessmentResults(row) {
  selectedAssessment.value = row;
  assessmentResultFilters.assessmentId = row.id;
  assessmentResultFilters.page = 1;
  loadAssessmentResults();
}

function openArticleForm(mode, row = {}) {
  articleFormMode.value = mode;
  Object.assign(articleForm, {
    id: row.id || "",
    title: row.title || "",
    category: row.category || "心理科普",
    author: row.author || "心理中心",
    status: row.status || "draft",
    summary: row.summary || "",
    content: row.content || "",
    cover: row.cover || ""
  });
  articleFormOpen.value = true;
}

function closeArticleForm() {
  articleFormOpen.value = false;
}

function articleRequestBody(status) {
  return {
    title: articleForm.title.trim(),
    category: articleForm.category || "心理科普",
    summary: articleForm.summary || "",
    content: articleForm.content || "",
    cover: articleForm.cover || "",
    status
  };
}

async function saveArticle(status) {
  if (!articleForm.title.trim()) {
    showNotice("请填写文章标题");
    return;
  }
  actionBusy.value = true;
  try {
    const method = articleFormMode.value === "edit" ? "PUT" : "POST";
    const path = articleFormMode.value === "edit" ? `/api/admin/articles/${articleForm.id}` : "/api/admin/articles";
    await adminRequest(path, { method, body: articleRequestBody(status) }, "文章保存失败");
    closeArticleForm();
    await loadArticles();
    await loadDashboard();
    showNotice(status === "published" ? "文章已发布" : "文章草稿已保存");
  } finally {
    actionBusy.value = false;
  }
}

function saveArticleDraft() {
  articleForm.status = "draft";
  return saveArticle("draft");
}

function publishArticle() {
  articleForm.status = "published";
  return saveArticle("published");
}

function confirmArticleArchive(row) {
  openModal("archive-article", "归档文章", `确认归档文章《${row.title || "-"}》？`, {
    danger: true,
    confirmText: "确认归档",
    onConfirm: async () => {
      await adminRequest(`/api/admin/articles/${row.id}`, { method: "DELETE" }, "文章归档失败");
      await loadArticles();
      await loadDashboard();
      showNotice("文章已归档");
    }
  });
}

function openActivityForm(mode, row = {}) {
  activityFormMode.value = mode;
  Object.assign(activityForm, {
    id: row.id || "",
    title: row.title || "",
    type: row.type || "工作坊",
    campus: row.campus || campuses.value[0]?.name || "",
    intro: row.intro || "",
    startTime: row.startTime || "",
    endTime: row.endTime || "",
    deadline: row.deadline || "",
    place: row.place || row.location || "",
    limit: row.limit || 20,
    needReview: Boolean(row.needReview),
    allowCancel: row.allowCancel ?? true,
    description: row.description || ""
  });
  activityFormOpen.value = true;
}

function closeActivityForm() {
  activityFormOpen.value = false;
}

function activityRequestBody(status) {
  return {
    title: activityForm.title.trim(),
    category: activityForm.type || "心理活动",
    location: activityForm.place || activityForm.campus || "心理中心",
    startAt: activityForm.startTime,
    endAt: activityForm.endTime,
    signupEndAt: activityForm.deadline || activityForm.startTime,
    capacity: Number(activityForm.limit || 0),
    description: activityForm.description || activityForm.intro || "",
    status
  };
}

async function saveActivity(status) {
  if (!activityForm.title.trim()) {
    showNotice("请填写活动名称");
    return;
  }
  if (!activityForm.startTime || !activityForm.endTime) {
    showNotice("请填写活动开始和结束时间");
    return;
  }
  if (new Date(activityForm.endTime) <= new Date(activityForm.startTime)) {
    showNotice("活动结束时间必须晚于开始时间");
    return;
  }
  actionBusy.value = true;
  try {
    const method = activityFormMode.value === "edit" ? "PUT" : "POST";
    const path = activityFormMode.value === "edit" ? `/api/admin/activities/${activityForm.id}` : "/api/admin/activities";
    await adminRequest(path, { method, body: activityRequestBody(status) }, "活动保存失败");
    closeActivityForm();
    await loadActivities();
    await loadDashboard();
    showNotice(status === "published" ? "活动已发布" : "活动草稿已保存");
  } finally {
    actionBusy.value = false;
  }
}

function saveActivityDraft() {
  return saveActivity("draft");
}

function publishActivity() {
  return saveActivity("published");
}

function confirmActivityCancel(row) {
  openModal("cancel-activity", "取消活动", `确认取消活动「${row.title || "-"}」？`, {
    danger: true,
    confirmText: "确认取消",
    onConfirm: async () => {
      await adminRequest(`/api/admin/activities/${row.id}`, { method: "DELETE" }, "活动取消失败");
      await loadActivities();
      await loadDashboard();
      showNotice("活动已取消");
    }
  });
}

function openCampusForm(mode, row = {}) {
  campusFormMode.value = mode;
  Object.assign(campusForm, {
    id: row.id || "",
    name: row.name || "",
    address: row.address || "",
    manager: row.manager || "",
    phone: row.phone || "",
    status: row.status || "启用"
  });
  campusFormOpen.value = true;
}

function closeCampusForm() {
  campusFormOpen.value = false;
}

async function saveCampus() {
  if (campusFormMode.value === "edit") {
    showNotice("当前校区信息为只读展示");
    return;
  }
  if (!campusForm.name.trim()) {
    showNotice("请填写校区名称");
    return;
  }
  actionBusy.value = true;
  try {
    await adminRequest("/api/admin/campuses", {
      method: "POST",
      body: {
        name: campusForm.name.trim(),
        address: campusForm.address || "",
        phone: campusForm.phone || ""
      }
    }, "校区新增失败");
    closeCampusForm();
    await loadCampuses();
    await loadLogs();
    showNotice("校区已新增");
  } finally {
    actionBusy.value = false;
  }
}

function confirmCampusDisable(row) {
  openModal("disable-campus", "确认禁用校区", `确认禁用校区「${row.name || "-"}」？`, {
    danger: true,
    confirmText: "确认禁用",
    onConfirm: async () => {
      await adminRequest(`/api/admin/campuses/${row.id}`, { method: "DELETE" }, "校区禁用失败");
      await loadCampuses();
      await loadLogs();
      showNotice("校区已禁用");
    }
  });
}

async function saveSettings() {
  actionBusy.value = true;
  try {
    await adminRequest("/api/admin/settings", {
      method: "PUT",
      body: {
        settings: [
          {
            key: "platform",
            value: { name: settingsForm.platformName },
            description: "平台基础设置"
          },
          {
            key: "appointmentRules",
            value: {
              durationMinutes: Number(settingsForm.durationMinutes || 50),
              advanceDays: Number(settingsForm.advanceDays || 14),
              dailyLeaveLimit: Number(settingsForm.dailyLeaveLimit || 3),
              autoConfirm: Boolean(settingsForm.autoConfirm),
              allowStudentCancel: Boolean(settingsForm.allowStudentCancel)
            },
            description: "预约规则"
          },
          {
            key: "studentHomeCarousel",
            value: carouselSettingsPayload(),
            description: "学生端首页轮播配置"
          }
        ]
      }
    }, "系统设置保存失败");
    await loadSettings();
    await loadLogs();
    showNotice("设置已保存");
  } finally {
    actionBusy.value = false;
  }
}

function openRegistrationDrawer(row) {
  selectedActivity.value = row;
  registrations.value = (row.signups || []).map(mapRegistration);
  activityDrawerOpen.value = true;
}

function closeRegistrationDrawer() {
  activityDrawerOpen.value = false;
  registrations.value = [];
}

function openCheckinConfirm(row) {
  selectedRegistration.value = row;
  checkinConfirmOpen.value = true;
}

function closeCheckinConfirm() {
  checkinConfirmOpen.value = false;
}

function confirmCheckin() {
  closeCheckinConfirm();
  showNotice("当前仅查看真实报名名单");
}

function openLogDrawer(row) {
  selectedLog.value = row;
  logDrawerOpen.value = true;
}

function closeLogDrawer() {
  logDrawerOpen.value = false;
}

function confirmResetPassword(kind, row) {
  const label = kind === "students" ? "学生" : "咨询师";
  openModal(
    "reset-password",
    "重置密码",
    `确认重置${label}「${row.name}」的密码？系统将生成一次性随机临时密码。`,
    {
      confirmText: "确认重置",
      onConfirm: async () => {
        const result = await adminRequest(`/api/admin/${kind}/${row.id}/reset-password`, { method: "POST" }, "重置密码失败");
        if (kind === "students") await loadStudents();
        if (kind === "counselors") await loadCounselors();
        showTemporaryCredential(row.studentNo || row.jobNo, row.name, result.temporaryPassword);
      }
    }
  );
}

function showTemporaryCredential(account, name, temporaryPassword) {
  Object.assign(credentialState, {
    open: true,
    account,
    name,
    temporaryPassword
  });
}

function closeCredentialState() {
  Object.assign(credentialState, {
    open: false,
    account: "",
    name: "",
    temporaryPassword: ""
  });
}

async function copyTemporaryCredentials(credentials) {
  const text = credentials
    .map((item) => `${item.account}\t${item.name || ""}\t${item.temporaryPassword}`)
    .join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showNotice("临时凭据已复制，请安全保管");
  } catch {
    showNotice("复制失败，请手动记录临时凭据");
  }
}

function toggleAccountStatus(kind, row) {
  const nextStatus = row.status === "active" ? "disabled" : "active";
  const label = nextStatus === "active" ? "启用" : "禁用";
  openModal(
    "toggle-account",
    `${label}账号`,
    `确认${label}「${row.name}」账号？`,
    {
      danger: nextStatus === "disabled",
      confirmText: `确认${label}`,
      onConfirm: async () => {
        await adminRequest(`/api/admin/${kind}/${row.id}`, { method: "PUT", body: { status: nextStatus } }, "账号状态更新失败");
        if (kind === "students") await loadStudents();
        if (kind === "counselors") await loadCounselors();
        showNotice(`账号已${label}`);
      }
    }
  );
}

function confirmDeleteStudent(row) {
  openModal(
    "delete-student",
    "确认删除",
    `确认删除学生账号「${row.name}」？删除后账号不可登录。`,
    {
      danger: true,
      confirmText: "确认删除",
      onConfirm: async () => {
        await adminRequest(`/api/admin/students/${row.id}`, { method: "DELETE" }, "删除学生失败");
        await loadStudents();
        showNotice("学生账号已删除");
      }
    }
  );
}

function openModal(name, title, message, options = {}) {
  Object.assign(modal, {
    open: true,
    name,
    title,
    message,
    confirmText: options.confirmText || "确认",
    danger: Boolean(options.danger),
    success: Boolean(options.success),
    textarea: Boolean(options.textarea),
    textValue: options.textValue || "",
    icon: options.danger ? "danger" : options.success ? "success" : "info",
    onConfirm: options.onConfirm || null
  });
}

function closeModal() {
  modal.open = false;
  modal.onConfirm = null;
}

async function confirmModal() {
  const action = modal.onConfirm;
  const textValue = modal.textValue;
  closeModal();
  if (action) {
    actionBusy.value = true;
    try {
      await action(textValue);
    } catch (error) {
      // Individual actions surface their own errors through adminRequest.
    } finally {
      actionBusy.value = false;
    }
    return;
  }
  showNotice("操作已完成");
}

onMounted(async () => {
  try {
    const session = await api.refreshSession();
    if (session.role === "admin") {
      me.value = true;
      await loadAdminData();
    }
  } catch (error) {
    api.setToken(null);
  }
});
</script>
