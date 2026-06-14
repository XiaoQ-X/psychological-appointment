<template>
  <main class="counselor-shell">
    <section v-if="!me" class="counselor-mobile mobile-container">
      <div class="status-bar">
        <span>09:41</span>
        <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
      </div>
      <div class="content-area login-content">
        <section class="login-hero primary-gradient">
          <div class="login-logo"><Stethoscope :size="34" /></div>
          <h1>安心心理</h1>
          <p>咨询师工作台</p>
          <small>预约处理、学生档案、排班与风险反馈</small>
        </section>
        <form class="prototype-card login-card" @submit.prevent="login">
          <h2>老师登录</h2>
          <div v-if="error" class="error-card"><AlertCircle :size="16" />{{ error }}</div>
          <label>工号<input v-model="loginForm.jobNo" class="input-field" autocomplete="username" placeholder="请输入工号" /></label>
          <label>密码<input v-model="loginForm.password" class="input-field" type="password" autocomplete="current-password" placeholder="请输入密码" /></label>
          <button class="btn-main" :disabled="loading"><LogIn :size="18" />{{ loading ? '登录中...' : '登录' }}</button>
          <p class="login-support">账号或密码问题请联系心理中心管理员</p>
        </form>
      </div>
    </section>

    <section v-else class="counselor-mobile mobile-container">
      <div class="status-bar">
        <span>09:41</span>
        <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
      </div>
      <header v-if="page !== 'dashboard'" class="proto-header">
        <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
        <h1>{{ pageTitle }}</h1>
      </header>

      <p v-if="notice" class="toast">{{ notice }}</p>

      <div class="content-area page-scroll">
        <section v-if="page === 'dashboard'" class="page-section dashboard-page">
          <header class="dashboard-greeting">
            <div>
              <h2>{{ me?.name || '老师' }}，您好</h2>
              <p>{{ me?.title || '心理中心咨询师' }}</p>
            </div>
            <button @click="page = 'profile'"><UserRound :size="22" /></button>
          </header>
          <div class="dashboard-main-card">
            <span class="icon-bubble blue"><CalendarCheck :size="22" /></span>
            <div>
              <p>今日预约</p>
              <h3>{{ dashboardMetrics.today }} 个待处理</h3>
            </div>
            <button @click="page = 'appointments'">查看全部</button>
          </div>
          <div class="v23-dashboard-shortcuts">
            <button @click="page = 'today_appointments'"><CalendarCheck :size="16" /> 今日全部预约</button>
          </div>
          <div class="dashboard-metrics">
            <button class="orange" @click="page = 'appointments'"><span>待确认</span><strong>{{ dashboardMetrics.pending }}</strong><em>查看</em></button>
            <button class="red" @click="page = 'risk_records'"><span>风险提醒</span><strong>{{ dashboardMetrics.risks }}</strong><em>查看</em></button>
            <button class="green" @click="page = 'appointments'"><span>已确认</span><strong>{{ dashboardMetrics.confirmed }}</strong><em>查看</em></button>
          </div>
          <div class="quick-strip">
            <button class="blue" @click="page = 'schedule'"><CalendarPlus :size="18" />开始排班</button>
            <button class="green" @click="page = 'messages'"><Bell :size="18" />我的消息</button>
            <button class="orange" @click="page = 'referral_create'"><ArrowLeftRight :size="18" />发起转介</button>
          </div>
          <section class="prototype-card">
            <div class="section-head compact"><h3>今日日程</h3><button @click="page = 'schedule'">查看全部</button></div>
            <article v-if="todayAppointments[0]" class="timeline-row">
              <i></i>
              <div>
                <span>{{ todayAppointments[0].time }}</span>
                <strong>{{ todayAppointments[0].student }} ({{ todayAppointments[0].location }})</strong>
              </div>
              <button @click="page = 'appointment_detail'">详情</button>
            </article>
            <p v-else class="muted">暂无今日日程</p>
          </section>
          <section class="prototype-list">
            <button @click="page = 'risk_records'">
              <span class="icon-bubble red"><ShieldAlert :size="20" /></span>
              <span><strong>高风险评估待审核</strong><small>{{ riskStudents.length }} 条待处理风险记录</small></span>
              <ChevronRight :size="18" />
            </button>
            <button @click="page = 'students'">
              <span class="icon-bubble orange"><Search :size="20" /></span>
              <span><strong>学生档案</strong><small>{{ studentList.length }} 位学生</small></span>
              <ChevronRight :size="18" />
            </button>
            <button @click="page = 'referral'">
              <span class="icon-bubble blue"><ArrowLeftRight :size="20" /></span>
              <span><strong>转介协作</strong><small>查看转介记录</small></span>
              <ChevronRight :size="18" />
            </button>
          </section>
        </section>

        <section v-if="page === 'appointments'" class="page-section">
          <div class="tabs-row">
            <button v-for="tab in appointmentTabs" :key="tab.key" :class="{ active: appointmentTab === tab.key }" @click="appointmentTab = tab.key">{{ tab.label }}</button>
          </div>
          <div class="v23-appointment-toolbar">
            <button @click="page = 'appointment_history'"><Clock :size="15" /> 历史记录</button>
          </div>
          <div class="page-stack">
            <article v-for="item in visibleAppointments" :key="item.student" class="appointment-list-card">
              <div>
                <span :class="['icon-bubble', item.tone]"><Clock :size="20" /></span>
                <div>
                  <h4>{{ item.student }} · {{ item.statusText }}</h4>
                  <p>{{ item.time }} · {{ item.method }}</p>
                </div>
                <em :class="item.tagClass">{{ item.statusText }}</em>
              </div>
              <div class="two-actions" v-if="item.status === 'pending'">
                <button @click="showNotice('已打开拒绝原因弹窗')">拒绝</button>
                <button @click="page = 'appointment_detail'">处理</button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="page === 'today_appointments'" class="page-section">
          <div class="page-stack v23-today-page">
            <section class="prototype-card v23-today-summary">
              <div>
                <CalendarCheck :size="22" />
                <span>今日共 <strong>6</strong> 个预约</span>
              </div>
              <p><span><i class="green"></i>已完成 <strong>1</strong></span><span><i class="orange"></i>待确认 <strong>1</strong></span></p>
            </section>
            <article v-for="item in todayAppointments" :key="item.time" class="v23-today-card">
              <span :class="['v23-time-dot', item.tone]"></span>
              <section class="prototype-card" :class="`v23-card-border-${item.tone}`">
                <div class="v23-appointment-line">
                  <div>
                    <small>{{ item.time }}</small>
                    <h4>{{ item.student }}</h4>
                  </div>
                  <div class="v23-status-group">
                    <em v-if="item.highRisk" class="tag-high">高风险</em>
                    <em :class="item.tagClass">{{ item.statusText }}</em>
                  </div>
                </div>
                <p>{{ item.type }} · {{ item.location }}</p>
                <div class="v23-mini-actions">
                  <button v-for="action in item.actions" :key="action.label" :class="action.kind" @click="action.target ? page = action.target : showNotice(action.notice)">{{ action.label }}</button>
                </div>
              </section>
            </article>
            <div class="v23-update-time">数据更新于 08:23</div>
          </div>
        </section>

        <section v-if="page === 'appointment_history'" class="page-section">
          <div class="v23-history-tabs">
            <button class="active">本周</button>
            <button>本月</button>
            <button>本学期</button>
            <button>全部</button>
          </div>
          <div class="v23-history-search">
            <Search :size="16" />
            <input class="input-field" placeholder="按学生姓名搜索" />
          </div>
          <div class="page-stack v23-history-list">
            <article v-for="item in historyAppointments" :key="item.time + item.student" class="prototype-card v23-history-card">
              <div class="v23-appointment-line">
                <div>
                  <small>{{ item.time }}</small>
                  <h4>{{ item.student }}</h4>
                  <p>{{ item.type }} · {{ item.location }}</p>
                </div>
                <em :class="item.tagClass">{{ item.statusText }}</em>
              </div>
              <button v-if="item.action" :class="item.actionKind" @click="page = 'appointment_detail'">{{ item.action }}</button>
              <div v-else class="v23-disabled-action">{{ item.statusText }}</div>
            </article>
          </div>
        </section>

        <section v-if="page === 'appointment_detail'" class="page-section detail-bottom-space">
          <div class="page-stack">
            <section class="status-hero primary-gradient">
              <div><span>预约编号</span><strong>BK20250715001</strong></div>
              <em>待确认</em>
              <p>请及时处理该预约</p>
            </section>
            <section class="prototype-card">
              <div class="person-row">
                <span class="avatar blue">李</span>
                <div><h3>李明</h3><p>计算机科学与技术学院 · 2024级</p></div>
              </div>
              <dl class="info-list">
                <div><dt><CalendarClock :size="15" />预约时间</dt><dd>2025-07-15 14:00</dd></div>
                <div><dt><Clock :size="15" />时长</dt><dd>50分钟</dd></div>
                <div><dt><FileText :size="15" />咨询类型</dt><dd>常规咨询</dd></div>
                <div><dt><MapPin :size="15" />咨询室</dt><dd>待分配</dd></div>
              </dl>
              <div class="note-block"><span>主诉问题</span><p>最近两周持续失眠，情绪低落，对学习提不起兴趣</p></div>
            </section>
          </div>
          <div class="bottom-actions">
            <button class="btn-main" @click="page = 'appointment_process'">确认预约</button>
            <button class="btn-danger-outline" @click="showNotice('已打开拒绝预约弹窗')">拒绝预约</button>
            <button class="btn-second" @click="page = 'write_record'">填写咨询记录</button>
          </div>
        </section>

        <section v-if="page === 'appointment_process'" class="page-section detail-bottom-space">
          <div class="page-stack">
            <section class="prototype-card form-card">
              <h3>确认预约</h3>
              <label>学生信息<input class="input-field" readonly value="李明 · 计算机学院 · 2024级" /></label>
              <label>预约时间<input class="input-field" readonly value="2025-07-15 14:00 - 14:50" /></label>
              <div>
                <label>选择咨询室</label>
                <div class="room-options">
                  <button v-for="room in ['咨询室A','咨询室B','咨询室C']" :key="room" :class="{ active: selectedRoom === room }" @click="selectedRoom = room">{{ room }}<Check v-if="selectedRoom === room" :size="14" /></button>
                </div>
              </div>
            </section>
          </div>
          <div class="bottom-actions"><button class="btn-main" @click="showNotice('预约已确认')">确认预约</button></div>
        </section>

        <section v-if="page === 'students'" class="page-section">
          <div class="tabs-row">
            <button v-for="tab in studentTabs" :key="tab.key" :class="{ active: studentTab === tab.key }" @click="studentTab = tab.key">{{ tab.label }}</button>
          </div>
          <div class="page-stack">
            <article v-for="item in visibleStudents" :key="item.name" class="student-card" @click="page = 'student_detail'">
              <div>
                <img v-if="studentAvatar" :src="studentAvatar" alt="Student avatar" />
                <span><strong>{{ item.name }}</strong><small>{{ item.meta }}</small></span>
              </div>
              <em :class="item.riskClass">{{ item.risk }}</em>
              <p><span>最近咨询：{{ item.last }}</span><span>累计咨询：{{ item.count }}次</span></p>
            </article>
          </div>
        </section>

        <section v-if="page === 'student_detail'" class="page-section">
          <div class="tabs-row">
            <button v-for="tab in detailTabs" :key="tab.key" :class="{ active: studentDetailTab === tab.key }" @click="studentDetailTab = tab.key">{{ tab.label }}</button>
          </div>
          <div class="page-stack">
            <template v-if="studentDetailTab === 'info'">
              <section class="prototype-card">
                <div class="person-row">
                  <img v-if="studentAvatar" :src="studentAvatar" alt="Student avatar" />
                  <div><h3>张*华</h3><p>机械学院 · 大四</p></div>
                </div>
                <div class="profile-grid">
                  <div><span>学号</span><strong>2022****0123</strong></div>
                  <div><span>性别</span><strong>男</strong></div>
                  <div><span>累计咨询</span><strong>8 次</strong></div>
                  <div><span>最近咨询</span><strong>2026-05-25</strong></div>
                </div>
              </section>
              <section class="prototype-card">
                <h3>风险等级</h3>
                <div class="risk-line"><em class="tag-high">高风险</em><span>PHQ-9: 18分 (重度)</span></div>
              </section>
              <div class="two-actions prominent">
                <button @click="page = 'risk_feedback'">风险处理反馈</button>
                <button @click="page = 'referral_create'">发起转介</button>
              </div>
            </template>
            <section v-else-if="studentDetailTab === 'records'" class="prototype-card">
              <div class="section-head compact"><h3>第5次咨询</h3><em class="tag-done">已完成</em></div>
              <p class="muted">2026-05-25 · 情绪低落与学业压力跟进</p>
            </section>
            <section v-else class="prototype-card">
              <h3>PHQ-9 评估报告</h3>
              <p class="muted">总分：18/27 · 重度抑郁</p>
              <p class="muted">评估日期：2026-05-27</p>
            </section>
          </div>
        </section>

        <section v-if="page === 'schedule'" class="page-section">
          <div class="page-stack">
            <div class="section-head"><h3>当日可用时段</h3><button @click="showAddSchedule = !showAddSchedule"><Plus :size="14" />添加排班</button></div>
            <section v-if="showAddSchedule" class="prototype-card form-card blue-soft">
              <h3>新增排班</h3>
              <label>日期<input class="input-field" type="date" /></label>
              <label>时间段<select class="input-field"><option>上午 (08:00-12:00)</option><option>下午 (13:00-17:00)</option><option>晚上 (18:00-21:00)</option></select></label>
              <label>咨询室<select class="input-field"><option>咨询室A</option><option>咨询室B</option><option>咨询室C</option></select></label>
              <div class="two-actions"><button @click="showAddSchedule = false">取消</button><button @click="showNotice('排班已保存')">保存</button></div>
            </section>
            <article v-for="slot in scheduleSlots" :key="slot.time" class="schedule-card">
              <span :class="['icon-bubble', slot.busy ? 'blue' : 'gray']"><Clock :size="18" /></span>
              <div><strong>{{ slot.time }}</strong><small :class="{ busy: slot.busy }">{{ slot.text }}</small></div>
              <button>{{ slot.busy ? '•••' : '删除' }}</button>
            </article>
            <button class="btn-main" @click="showNotice('排班更改已保存')">保存排班更改</button>
            <button class="btn-second" @click="page = 'shift_apply'">申请调班</button>
          </div>
        </section>

        <section v-if="page === 'shift_apply'" class="page-section detail-bottom-space">
          <div class="page-stack">
            <section class="prototype-card">
              <h3>申请类型</h3>
              <div class="type-grid">
                <button v-for="type in shiftTypes" :key="type.key" :class="{ active: shiftType === type.key }" @click="shiftType = type.key">
                  <component :is="type.icon" :size="22" />
                  <span>{{ type.label }}</span>
                </button>
              </div>
            </section>
            <section class="prototype-card form-card">
              <label>原始时段<input class="input-field" value="2026-06-20 09:00-10:00" /></label>
              <label>目标时段<input class="input-field" placeholder="请选择目标时段" /></label>
              <label>调班原因<textarea class="input-field textarea" placeholder="请详细说明调班原因"></textarea></label>
              <p class="char-count">0/200</p>
            </section>
          </div>
          <div class="bottom-actions"><button class="btn-main" @click="showNotice('调班申请已提交')">提交申请</button></div>
        </section>

        <section v-if="page === 'write_record'" class="page-section detail-bottom-space">
          <div class="page-stack">
            <section class="prototype-card form-card">
              <h3>填写咨询记录</h3>
              <p class="muted">李明 · 2025-07-15 14:00</p>
              <label>主诉与进展<textarea class="input-field textarea" placeholder="描述本次咨询的主诉问题与进展..."></textarea></label>
              <label>咨询方法与技术<textarea class="input-field textarea" placeholder="使用的咨询方法和技巧..."></textarea></label>
              <div>
                <label>风险评估</label>
                <div class="risk-options">
                  <button class="active">低风险</button><button>中风险</button><button>高风险</button>
                </div>
              </div>
              <label>下次计划<textarea class="input-field textarea" placeholder="下次咨询的计划和安排..."></textarea></label>
            </section>
          </div>
          <div class="bottom-actions"><button class="btn-second" @click="page = 'appointment_detail'">返回</button><button class="btn-main" @click="showNotice('咨询记录已提交')">提交记录</button></div>
        </section>

        <section v-if="page === 'risk_records'" class="page-section">
          <div class="page-stack">
            <article v-for="item in riskStudents" :key="item.name" class="risk-record-card">
              <b v-if="item.urgent">紧急待办</b>
              <div class="person-row small">
                <img v-if="studentAvatar" :src="studentAvatar" alt="Student avatar" />
                <div><h3>{{ item.name }}</h3><p>提交于：{{ item.time }}</p></div>
              </div>
              <div class="risk-score"><span>PHQ-9 抑郁筛查</span><strong>{{ item.score }}分 (重度)</strong></div>
              <div class="two-actions"><button @click="page = 'student_detail'">查看详情</button><button @click="page = 'risk_feedback'">风险处理反馈</button></div>
            </article>
          </div>
        </section>

        <section v-if="page === 'risk_feedback'" class="page-section detail-bottom-space">
          <div class="page-stack">
            <section class="prototype-card form-card">
              <h3>风险处理反馈</h3>
              <div class="risk-alert-mini"><em class="tag-high">高风险</em><span>张*华 · PHQ-9: 18分</span></div>
              <label>处理方式</label>
              <div class="radio-list">
                <label v-for="method in riskMethods" :key="method"><input type="radio" name="riskMethod" :checked="method === '已面谈'" />{{ method }}</label>
              </div>
              <label>处理描述<textarea class="input-field textarea" placeholder="请描述你采取的处理措施..."></textarea></label>
              <label>结果附件（选填）</label>
              <button class="upload-box"><Upload :size="20" />点击上传附件</button>
            </section>
          </div>
          <div class="bottom-actions"><button class="btn-second" @click="page = 'risk_records'">取消</button><button class="btn-main" @click="showNotice('风险处理结果已提交')">提交处理结果</button></div>
        </section>

        <section v-if="page === 'referral'" class="page-section">
          <div class="tabs-row">
            <button :class="{ active: referralTab === 'sent' }" @click="referralTab = 'sent'">我发起的</button>
            <button :class="{ active: referralTab === 'received' }" @click="referralTab = 'received'">收到的</button>
          </div>
          <div class="page-stack">
            <article v-if="referralTab === 'sent'" class="referral-card" @click="page = 'referral_detail'">
              <div class="person-row small">
                <img v-if="counselorAvatar" :src="counselorAvatar" alt="Counselor avatar" />
                <div><h3>转介至 李华 老师</h3><p>学生：张*华 · 2026-05-27 15:30</p></div>
                <em class="tag-warn">待审批</em>
              </div>
              <p>转介原因：学生需求超出本人擅长领域</p>
            </article>
            <article v-else class="referral-card">
              <div class="person-row small">
                <img v-if="counselorAvatar" :src="counselorAvatar" alt="Counselor avatar" />
                <div><h3>来自 陈墨 老师的转介</h3><p>学生：张*华 · 2026-05-27 15:30</p></div>
                <em class="tag-info">待处理</em>
              </div>
              <p>转介原因：学生需要更高级别的评估和干预</p>
              <div class="two-actions"><button @click="page = 'referral_receive'">接收</button><button @click="showNotice('已打开拒绝转介弹窗')">拒绝</button></div>
            </article>
            <button class="btn-main" @click="page = 'referral_create'">发起新转介</button>
          </div>
        </section>

        <section v-if="page === 'referral_create'" class="page-section detail-bottom-space">
          <div class="page-stack">
            <section class="prototype-card form-card">
              <h3>发起转介</h3>
              <label>目标咨询师<select class="input-field"><option>请选择目标咨询师</option><option>李华 · 心理中心专职咨询师</option><option>王芳 · 心理中心专职咨询师</option></select></label>
              <label>学生姓名<input class="input-field" value="张*华" /></label>
              <label>转介原因<textarea class="input-field textarea" placeholder="请详细说明转介原因..."></textarea></label>
              <label>备注<textarea class="input-field textarea small" placeholder="备注信息（选填）"></textarea></label>
            </section>
          </div>
          <div class="bottom-actions"><button class="btn-main" @click="showNotice('转介已提交')">提交转介</button><button class="btn-second" @click="page = 'referral'">取消</button></div>
        </section>

        <section v-if="page === 'referral_detail'" class="page-section">
          <div class="page-stack">
            <section class="prototype-card">
              <h3>转介详情</h3>
              <dl class="kv-list">
                <div><dt>发起人</dt><dd>陈墨 老师</dd></div>
                <div><dt>接收人</dt><dd>张静 老师（我）</dd></div>
                <div><dt>学生</dt><dd>张*华</dd></div>
                <div><dt>状态</dt><dd class="blue-text">待主任审批</dd></div>
              </dl>
            </section>
            <section class="prototype-card"><h3>转介原因</h3><p class="muted">学生需要更高级别的评估和干预</p></section>
          </div>
        </section>

        <section v-if="page === 'referral_receive'" class="page-section">
          <div class="page-stack">
            <section class="prototype-card">
              <h3>接收转介</h3>
              <dl class="kv-list">
                <div><dt>发起人</dt><dd>陈墨 老师</dd></div>
                <div><dt>学生</dt><dd>张*华</dd></div>
              </dl>
            </section>
            <div class="two-actions prominent"><button @click="showNotice('已接收转介')">确认接收</button><button @click="showNotice('已打开拒绝原因')">拒绝接收</button></div>
          </div>
        </section>

        <section v-if="page === 'messages'" class="page-section">
          <div class="page-stack">
            <article v-for="item in messageList" :key="item.title" class="message-row" @click="openMessage(item)">
              <span :class="['icon-bubble', item.tone]"><component :is="item.icon" :size="20" /></span>
              <div><p><strong>{{ item.title }}</strong><small>{{ item.time }}</small></p><em>{{ item.desc }}</em></div>
              <i v-if="item.unread"></i>
            </article>
          </div>
        </section>

        <section v-if="page === 'message_detail'" class="page-section">
          <div class="page-stack">
            <section class="message-detail-card">
              <span class="icon-bubble blue"><Bell :size="22" /></span>
              <h3>{{ currentMessage.title }}</h3>
              <small>{{ currentMessage.time }}</small>
              <p>{{ currentMessage.detail }}</p>
            </section>
          </div>
        </section>

        <section v-if="page === 'profile'" class="page-section">
          <div class="page-stack">
            <section class="prototype-card profile-card v23-profile-card-editable" @click="page = 'profile_edit'">
              <span class="avatar blue">张</span>
              <div><h3>张静</h3><p>机械学院 · 心理中心专职咨询师</p><p>工号：CS2021001</p></div>
            </section>
            <section class="prototype-list">
              <button @click="page = 'schedule'"><span class="icon-bubble blue"><CalendarDays :size="20" /></span><span><strong>排班设置</strong></span><ChevronRight :size="18" /></button>
              <button @click="page = 'shift_apply'"><span class="icon-bubble orange"><ArrowLeftRight :size="20" /></span><span><strong>调班申请</strong></span><ChevronRight :size="18" /></button>
              <button @click="page = 'articles'"><span class="icon-bubble purple"><Newspaper :size="20" /></span><span><strong>资讯管理</strong></span><ChevronRight :size="18" /></button>
              <button @click="page = 'article_edit'"><span class="icon-bubble purple"><Edit3 :size="20" /></span><span><strong>文章编辑</strong></span><ChevronRight :size="18" /></button>
              <button @click="page = 'messages'"><span class="icon-bubble green"><Bell :size="20" /></span><span><strong>消息中心</strong></span><ChevronRight :size="18" /></button>
            </section>
            <button class="logout-button" @click="logout">退出登录</button>
          </div>
        </section>

        <section v-if="page === 'profile_edit'" class="page-section detail-bottom-space">
          <div class="page-stack v23-counselor-profile-edit">
            <div class="v23-counselor-avatar">
              <div>
                <span>张</span>
                <em><UserRound :size="13" /></em>
              </div>
              <p>点击更换头像</p>
            </div>
            <section class="prototype-card form-card">
              <label>姓名 <small>（只读）</small><input class="input-field" readonly value="张静" /></label>
              <label>工号 <small>（只读）</small><input class="input-field" readonly value="CS2021001" /></label>
              <label>院系
                <select v-model="counselorProfileEdit.department" class="input-field">
                  <option>机械学院</option>
                  <option>计算机学院</option>
                  <option>经管学院</option>
                  <option>法学院</option>
                  <option>心理中心</option>
                </select>
              </label>
              <label>职称
                <select v-model="counselorProfileEdit.title" class="input-field">
                  <option>讲师</option>
                  <option>副教授</option>
                  <option>教授</option>
                  <option>心理师</option>
                  <option>高级心理师</option>
                </select>
              </label>
              <div>
                <label>擅长领域 <small>（可多选）</small></label>
                <div class="v23-expertise-tags">
                  <button v-for="tag in counselorExpertiseTags" :key="tag" :class="{ selected: counselorProfileEdit.expertise.includes(tag) }" @click="toggleCounselorExpertise(tag)">{{ tag }}</button>
                </div>
              </div>
              <label>手机号<input v-model="counselorProfileEdit.phone" class="input-field" type="tel" /></label>
              <label>邮箱<input v-model="counselorProfileEdit.email" class="input-field" type="email" /></label>
            </section>
          </div>
          <div class="bottom-actions"><button class="btn-main" @click="saveCounselorProfile">保存</button></div>
        </section>

        <section v-if="page === 'articles'" class="page-section">
          <div class="page-stack">
            <div class="section-head"><h3>资讯管理</h3><button @click="page = 'article_edit'"><Plus :size="14" />新建</button></div>
            <article v-for="item in articleList" :key="item.title" class="article-manage-card">
              <div><h3>{{ item.title }}</h3><p>{{ item.date }}</p></div>
              <em :class="item.status === '已发布' ? 'tag-done' : 'tag-warn'">{{ item.status }}</em>
              <button @click="page = 'article_edit'">编辑</button>
            </article>
          </div>
        </section>

        <section v-if="page === 'article_edit'" class="page-section">
          <div class="page-stack">
            <section class="prototype-card form-card">
              <h3>编辑文章</h3>
              <label>文章标题<input class="input-field" value="大学生心理健康指南" /></label>
              <label>分类<select class="input-field"><option>心理健康</option><option>学术指导</option></select></label>
              <label>文章内容<textarea class="input-field textarea large">新学期开始了，很多同学可能会感到焦虑和压力。以下是一些心理健康的小建议...</textarea></label>
              <div class="two-actions"><button @click="showNotice('草稿已保存')">保存草稿</button><button @click="page = 'article_preview'"><Eye :size="15" />预览</button></div>
            </section>
            <section class="prototype-card">
              <h3>已发布文章</h3>
              <div class="published-row"><span><strong>心理咨询的常见误区</strong><small>2026-05-20</small></span><em class="tag-done">已发布</em></div>
            </section>
          </div>
        </section>

        <section v-if="page === 'article_preview'" class="page-section">
          <div class="page-stack">
            <article class="prototype-card article-preview">
              <h3>大学生心理健康指南</h3>
              <p class="muted">分类：心理健康 · 2026-05-30</p>
              <div>
                <p>新学期开始了，很多同学可能会感到焦虑和压力。以下是一些心理健康的小建议...</p>
                <p>1. 保持规律作息，每天保证7-8小时的睡眠时间。</p>
                <p>2. 适当运动，每周至少进行3次有氧运动。</p>
                <p>3. 学会表达情绪，遇到困难及时寻求帮助。</p>
              </div>
            </article>
            <div class="two-actions prominent"><button @click="page = 'article_edit'">返回编辑</button><button @click="showNotice('文章已提交发布')">提交发布</button></div>
          </div>
        </section>
      </div>

      <nav class="prototype-tabbar">
        <button v-for="item in tabs" :key="item.key" :class="{ active: activeTab === item.key }" @click="page = item.target">
          <component :is="item.icon" :size="23" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  AlertCircle,
  ArrowLeftRight,
  BatteryFull,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogIn,
  MapPin,
  MessageCircle,
  Newspaper,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Signal,
  Stethoscope,
  Upload,
  UserRound,
  Users,
  Wifi,
  XCircle
} from "lucide-vue-next";
import { createApiClient } from "@anxin/api-client";

const api = createApiClient({ storageKey: "anxin_counselor_token" });

const me = ref(null);
const page = ref("dashboard");
const loading = ref(false);
const error = ref("");
const notice = ref("");
const appointmentTab = ref("pending");
const studentTab = ref("all");
const studentDetailTab = ref("info");
const referralTab = ref("sent");
const selectedRoom = ref("咨询室A");
const showAddSchedule = ref(false);
const shiftType = ref("leave");
const currentMessage = ref({});
const loginForm = reactive({ jobNo: "", password: "" });
const counselorProfileEdit = reactive({
  department: "机械学院",
  title: "心理师",
  expertise: ["情绪管理", "人际关系", "家庭关系"],
  phone: "138****5678",
  email: "zhangjing@example.com"
});

const studentAvatar = "";
const counselorAvatar = "";

const pageTitles = {
  today_appointments: "今日预约",
  appointment_history: "预约历史",
  profile_edit: "编辑个人资料",
  appointments: "预约管理",
  appointment_detail: "预约详情",
  appointment_process: "处理预约",
  students: "学生列表",
  student_detail: "学生详情",
  schedule: "我的排班",
  shift_apply: "调班申请",
  write_record: "填写咨询记录",
  risk_records: "风险记录",
  risk_feedback: "风险处理反馈",
  referral: "转介协作",
  referral_create: "发起转介",
  referral_detail: "转介详情",
  referral_receive: "接收转介",
  messages: "消息中心",
  message_detail: "消息详情",
  profile: "个人中心",
  articles: "资讯管理",
  article_edit: "文章编辑",
  article_preview: "资讯预览"
};
const tabForPage = {
  dashboard: "dashboard",
  today_appointments: "dashboard",
  appointments: "appointments",
  appointment_history: "appointments",
  appointment_detail: "appointments",
  appointment_process: "appointments",
  write_record: "appointments",
  students: "students",
  student_detail: "students",
  referral: "referral",
  referral_create: "referral",
  referral_detail: "referral",
  referral_receive: "referral",
  profile: "profile",
  schedule: "dashboard",
  shift_apply: "dashboard",
  risk_records: "dashboard",
  risk_feedback: "dashboard",
  messages: "dashboard",
  message_detail: "dashboard",
  profile_edit: "profile",
  articles: "profile",
  article_edit: "profile",
  article_preview: "profile"
};
const parentMap = {
  today_appointments: "dashboard",
  appointment_history: "appointments",
  appointment_detail: "appointments",
  appointment_process: "appointments",
  write_record: "appointment_detail",
  students: "dashboard",
  student_detail: "students",
  schedule: "dashboard",
  shift_apply: "schedule",
  risk_records: "dashboard",
  risk_feedback: "risk_records",
  referral: "dashboard",
  referral_create: "referral",
  referral_detail: "referral",
  referral_receive: "referral",
  messages: "dashboard",
  message_detail: "messages",
  profile: "dashboard",
  profile_edit: "profile",
  articles: "profile",
  article_edit: "articles",
  article_preview: "article_edit"
};
const tabs = [
  { key: "dashboard", target: "dashboard", label: "工作台", icon: LayoutDashboard },
  { key: "appointments", target: "appointments", label: "预约", icon: CalendarClock },
  { key: "students", target: "students", label: "学生", icon: Users },
  { key: "referral", target: "referral", label: "转介", icon: Send },
  { key: "profile", target: "profile", label: "我的", icon: UserRound }
];
const appointmentTabs = [{ key: "pending", label: "待处理" }, { key: "today", label: "今日预约" }, { key: "all", label: "全部" }];
const studentTabs = [{ key: "all", label: "全部学生" }, { key: "high", label: "高风险" }, { key: "recent", label: "近期咨询" }];
const counselorExpertiseTags = ["情绪管理", "人际关系", "学业压力", "自我成长", "家庭关系", "焦虑疏导", "危机干预"];
const detailTabs = [{ key: "info", label: "基本信息" }, { key: "records", label: "咨询记录" }, { key: "assess", label: "评估报告" }];
const shiftTypes = [
  { key: "leave", label: "请假调班", icon: CalendarClock },
  { key: "swap", label: "换班", icon: ArrowLeftRight },
  { key: "overtime", label: "加班", icon: Clock },
  { key: "add", label: "加排班", icon: CalendarPlus },
  { key: "close", label: "关班", icon: XCircle }
];
const riskMethods = ["已面谈", "已转介", "已通知辅导员", "持续观察"];
const prototypeAppointments = ref([]);
const studentList = ref([]);
const scheduleSlots = ref([]);
const riskStudents = ref([]);
const messageList = ref([]);
const articleList = ref([]);

const pageTitle = computed(() => pageTitles[page.value] || "工作台");
const activeTab = computed(() => tabForPage[page.value] || "dashboard");
const dashboardMetrics = computed(() => ({
  today: prototypeAppointments.value.filter((item) => item.status === "pending").length,
  pending: prototypeAppointments.value.filter((item) => item.status === "pending").length,
  confirmed: prototypeAppointments.value.filter((item) => item.status === "confirmed").length,
  risks: riskStudents.value.length
}));
const todayAppointments = computed(() => prototypeAppointments.value.filter((item) => item.status !== "completed"));
const historyAppointments = computed(() => prototypeAppointments.value.filter((item) => ["completed", "cancelled", "rejected", "no_show"].includes(item.status)));
const visibleAppointments = computed(() => {
  if (appointmentTab.value === "all") return prototypeAppointments.value;
  if (appointmentTab.value === "today") return todayAppointments.value;
  return prototypeAppointments.value.filter((item) => item.status === appointmentTab.value);
});
const visibleStudents = computed(() => {
  if (studentTab.value === "all") return studentList.value;
  if (studentTab.value === "high") return studentList.value.filter((item) => item.group === "high");
  return studentList.value.filter((item) => item.group === "recent");
});

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function statusText(status) {
  return {
    pending: "待确认",
    confirmed: "已确认",
    checked_in: "已签到",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    no_show: "未到"
  }[status] || status || "-";
}

function statusClass(status) {
  return {
    pending: "tag-pending",
    confirmed: "tag-checked",
    checked_in: "tag-done",
    completed: "tag-done",
    cancelled: "tag-muted",
    rejected: "tag-muted",
    no_show: "tag-warn"
  }[status] || "tag-muted";
}

function mapAppointment(item) {
  const time = formatDateTime(item.schedule?.startAt || item.createdAt);
  return {
    ...item,
    student: item.student?.name || "-",
    time,
    method: item.room?.name || item.type || "-",
    statusText: statusText(item.status),
    tagClass: statusClass(item.status),
    tone: item.status === "pending" ? "orange" : item.status === "completed" ? "gray" : "green",
    type: item.type || "咨询预约",
    location: item.room?.name || "-",
    actions: [{ label: "查看详情", kind: "primary", target: "appointment_detail" }]
  };
}

function mapStudent(item) {
  return {
    ...item,
    name: item.name || "-",
    meta: [item.college, item.grade].filter(Boolean).join(" · ") || "-",
    risk: item.latestRisk?.level || "未筛查",
    riskClass: item.latestRisk?.level === "high" ? "tag-high" : "tag-muted",
    last: item.lastAppointmentAt ? formatDateTime(item.lastAppointmentAt) : "无",
    count: item.appointments?.length || item._count?.appointments || 0,
    group: item.latestRisk?.level === "high" ? "high" : "all"
  };
}

function mapSchedule(item) {
  return {
    ...item,
    time: `${formatDateTime(item.startAt)} - ${formatDateTime(item.endAt).slice(-5)}`,
    text: item.status === "available" ? "空闲 (可预约人数：1)" : `已预约：${item.appointment?.student?.name || "-"}`,
    busy: item.status !== "available"
  };
}

function mapRisk(item) {
  return {
    ...item,
    name: item.student?.name || "-",
    time: formatDateTime(item.createdAt),
    score: item.score || 0,
    urgent: ["high", "crisis"].includes(item.level)
  };
}

function mapMessage(item) {
  return {
    ...item,
    desc: item.content || "",
    time: formatDateTime(item.createdAt),
    tone: item.readAt ? "blue" : "orange",
    icon: item.type === "risk" ? AlertCircle : Bell,
    unread: !item.readAt,
    detail: item.content || ""
  };
}

function mapArticle(item) {
  return {
    ...item,
    date: formatDateTime(item.createdAt),
    status: item.status === "published" ? "已发布" : item.status || "草稿"
  };
}

async function loadCounselorData() {
  const [appointments, students, schedules, risks, messages, articles] = await Promise.all([
    api.request("/api/counselor/appointments"),
    api.request("/api/counselor/students"),
    api.request("/api/counselor/schedules"),
    api.request("/api/counselor/risk-records"),
    api.request("/api/counselor/messages"),
    api.request("/api/counselor/articles")
  ]);
  prototypeAppointments.value = appointments.map(mapAppointment);
  studentList.value = students.map(mapStudent);
  scheduleSlots.value = schedules.map(mapSchedule);
  riskStudents.value = risks.map(mapRisk);
  messageList.value = messages.map(mapMessage);
  articleList.value = articles.map(mapArticle);
  currentMessage.value = messageList.value[0] || {};
}

async function login() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.loginCounselor(loginForm);
    me.value = data.user;
    await loadCounselorData();
    page.value = "dashboard";
  } catch (err) {
    error.value = err.message || "登录失败";
  } finally {
    loading.value = false;
  }
}

function logout() {
  api.logout();
  me.value = null;
  page.value = "dashboard";
}

function goBack() {
  page.value = parentMap[page.value] || "dashboard";
}

function openMessage(item) {
  currentMessage.value = item;
  page.value = "message_detail";
}

function showNotice(text) {
  notice.value = text;
  window.setTimeout(() => { notice.value = ""; }, 2200);
}

function toggleCounselorExpertise(tag) {
  const index = counselorProfileEdit.expertise.indexOf(tag);
  if (index >= 0) counselorProfileEdit.expertise.splice(index, 1);
  else counselorProfileEdit.expertise.push(tag);
}

function saveCounselorProfile() {
  showNotice("资料已保存");
  page.value = "profile";
}

onMounted(async () => {
  if (!api.token()) return;
  try {
    const data = await api.request("/api/auth/me");
    me.value = data.user;
    await loadCounselorData();
  } catch {
    api.logout();
  }
});
</script>
