<template>
  <main class="mini-shell student-shell">
    <section v-if="!me" class="student-login-prototype mobile-container">
      <div class="status-bar">
        <span>09:41</span>
        <div class="status-icons">
          <Signal :size="12" />
          <Wifi :size="12" />
          <BatteryFull :size="13" />
        </div>
      </div>

      <div class="content-area login-prototype-content">
        <div class="login-brand primary-gradient">
          <div class="login-brand-icon">
            <HeartPulse :size="32" />
          </div>
          <h1>安心心理</h1>
          <p>学生心理健康服务中心</p>
          <small>登录以开始你的心理健康之旅</small>
        </div>

        <div class="login-form-wrap">
          <form class="login-mode-card" data-testid="student-login-form" @submit.prevent="login">
            <h2>学生登录</h2>
            <div v-if="error" class="prototype-error">
              <AlertCircle :size="16" />
              <span>{{ error }}</span>
            </div>
            <input v-model="loginForm.studentNo" class="input-field" data-testid="student-account" autocomplete="username" placeholder="请输入学号" type="text" />
            <input v-model="loginForm.password" class="input-field" data-testid="student-password" autocomplete="current-password" placeholder="请输入密码" type="password" />
            <label class="prototype-checkline">
              <input v-model="policyAccepted" type="checkbox" />
              <span>我已阅读并同意<a @click.prevent="page = 'privacy'">《隐私政策》</a>和《服务协议》</span>
            </label>
            <button class="btn-main" data-testid="student-login-submit" :disabled="loading">
              <LogIn :size="18" />
              {{ loading ? '登录中...' : '登录' }}
            </button>
            <div class="login-links">
              <span>账号由学校统一开通</span>
              <small>首次登录或忘记密码请联系心理中心管理员</small>
            </div>
            <div class="emergency-login-link">
              <button type="button" @click="showNotice('紧急帮助入口已保留，登录后可进入完整页面')">
                <PhoneCall :size="15" />
                紧急帮助
              </button>
            </div>
          </form>
        </div>
        <div class="login-bottom-spacer"></div>
      </div>
      <p v-if="error" class="toast error">{{ error }}</p>
    </section>

    <section v-else-if="mustChangePassword" class="student-login-prototype mobile-container">
      <div class="status-bar">
        <span>09:41</span>
        <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
      </div>
      <div class="content-area login-prototype-content password-change-content">
        <div class="login-brand primary-gradient">
          <div class="login-brand-icon"><ShieldCheck :size="32" /></div>
          <h1>首次登录安全设置</h1>
          <p>请先设置新的登录密码</p>
          <small>完成修改后才能进入预约服务</small>
        </div>
        <div class="login-form-wrap">
          <form class="login-mode-card password-change-card" data-testid="student-change-password-form" @submit.prevent="changePassword">
            <h2>修改密码</h2>
            <div v-if="error" class="prototype-error"><AlertCircle :size="16" /><span>{{ error }}</span></div>
            <input v-model="passwordForm.oldPassword" class="input-field" data-testid="student-old-password" autocomplete="current-password" placeholder="请输入临时密码" type="password" />
            <input v-model="passwordForm.newPassword" class="input-field" data-testid="student-new-password" autocomplete="new-password" placeholder="至少8位，包含字母和特殊字符" type="password" />
            <input v-model="passwordForm.confirmPassword" class="input-field" data-testid="student-confirm-password" autocomplete="new-password" placeholder="再次输入新密码" type="password" />
            <p class="password-policy">新密码不能为纯数字、常见弱密码或与临时密码相同。</p>
            <button class="btn-main" data-testid="student-change-password-submit" :disabled="loading">
              <ShieldCheck :size="18" />
              {{ loading ? '修改中...' : '完成修改并进入' }}
            </button>
            <button class="password-logout" type="button" :disabled="loading" @click="logout">退出当前账号</button>
          </form>
        </div>
      </div>
    </section>

    <section v-else class="app-frame">
      <header v-if="showTopbar" class="mini-navbar">
        <button class="nav-icon" @click="goBack"><ChevronLeft :size="21" /></button>
        <h1>{{ pageTitle }}</h1>
        <button class="nav-icon" @click="logout"><LogOut :size="18" /></button>
      </header>

      <p v-if="error" class="toast error">{{ error }}</p>
      <p v-if="notice" class="toast">{{ notice }}</p>

      <section v-if="page === 'home'" class="student-home mobile-container" data-testid="student-home">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons">
            <Signal :size="12" />
            <Wifi :size="12" />
            <BatteryFull :size="13" />
          </div>
        </div>

        <header class="prototype-header">
          <div class="brand-line">
            <div class="brand-logo primary-gradient">
              <HeartPulse :size="19" />
            </div>
            <h1>安心心理</h1>
          </div>
          <div class="header-actions">
            <button aria-label="搜索" @click="page = 'articles'"><Search :size="25" /></button>
            <button class="bell-button" aria-label="消息" @click="page = 'messages'">
              <Bell :size="25" />
              <span></span>
            </button>
          </div>
        </header>

        <div class="content-area home-prototype-content">
          <div class="banner-wrap">
            <div class="prototype-banner v23-clickable-banner" @click="page = 'announcement_detail'">
              <img v-if="prototypeBannerImage" :src="prototypeBannerImage" alt="Psychology Course Banner" />
              <div class="banner-mask">
                <span>热门课程</span>
                <h2>情绪调节：与焦虑握手言和</h2>
                <div class="banner-tags">
                  <span>1.2k人已学</span>
                </div>
              </div>
            </div>
          </div>

          <div class="prototype-categories">
            <button v-for="item in homeCategories" :key="item.label" @click="page = item.target">
              <span class="category-icon" :class="item.tone">
                <component :is="item.icon" :size="25" />
              </span>
              <span>{{ item.label }}</span>
            </button>
          </div>

          <div class="risk-entry-wrap">
            <button class="risk-entry" @click="page = 'risk_assessment'">
              <span class="risk-icon"><ClipboardCheck :size="21" /></span>
              <span class="risk-copy">
                <strong>心理健康自评</strong>
                <small>3分钟快速了解你的心理状态</small>
              </span>
              <ChevronRight :size="21" />
            </button>
          </div>

          <section class="prototype-section">
            <div class="prototype-section-head">
              <h3>近期活动</h3>
              <button @click="page = 'activities'">查看更多</button>
            </div>
            <button v-if="homeActivityCard" class="activity-home-card" @click="openHomeActivity">
              <span class="activity-thumb">
                <HeartPulse :size="28" />
              </span>
              <span class="activity-card-body">
                <strong>{{ homeActivityCard.title }}</strong>
                <small>{{ homeActivityCard.timeText }}</small>
                <span class="activity-meta">
                  <em>{{ homeActivityCard.statusText }}</em>
                  <b>{{ homeActivityCard.seatsText }}</b>
                </span>
              </span>
            </button>
            <div v-else class="empty-state"><h3>暂无活动</h3></div>
          </section>

          <section class="prototype-section article-section">
            <div class="prototype-section-head">
              <h3>热门资讯</h3>
              <button @click="page = 'articles'">查看更多</button>
            </div>
            <div class="article-list">
              <button v-for="item in homeArticleCards" :key="item.id" class="home-article-card" @click="openHomeArticle(item)">
                <img v-if="item.cover" :src="item.cover" alt="Article Cover" />
                <span class="article-card-body">
                  <strong>{{ item.title }}</strong>
                  <span class="article-foot">
                    <small>{{ item.author }}</small>
                    <span><Eye :size="12" /> {{ item.views }}</span>
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>

        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'">
            <Home :size="25" />
            <span>首页</span>
          </button>
          <button class="tab-inactive" @click="page = 'booking'">
            <CalendarClock :size="25" />
            <span>预约</span>
          </button>
          <button class="tab-inactive" @click="page = 'articles'">
            <Newspaper :size="25" />
            <span>资讯</span>
          </button>
          <button class="tab-inactive" @click="page = 'profile'">
            <UserRound :size="25" />
            <span>我的</span>
          </button>
        </nav>

      </section>

      <section v-if="page === 'announcement_detail'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>公告详情</h1>
        </header>
        <div class="content-area proto-content prototype-page-stack">
          <article class="prototype-detail-card v23-announcement-card">
            <div class="v23-meta-line">2026年6月15日 · 心理健康中心</div>
            <h2>心理健康月系列活动开始报名</h2>
            <div class="v23-rich-text">
              <p>亲爱的同学们：</p>
              <p>为促进我校学生心理健康发展，心理健康中心将于6月举办心理健康月系列活动，包括正念冥想工作坊、情绪管理团体辅导、心理剧体验、减压手工艺坊等多种活动形式，欢迎同学们踊跃参与。</p>
              <p><strong>活动安排：</strong></p>
              <ul>
                <li>正念冥想工作坊 · 6月20日 14:00-16:00 心理中心团体室</li>
                <li>情绪管理团体辅导 · 6月22日 15:00-17:00 活动中心302</li>
                <li>心理剧体验 · 6月25日 14:30-16:30 艺术楼多功能厅</li>
                <li>减压手工艺坊 · 6月28日 10:00-12:00 心理中心手工室</li>
              </ul>
              <p><strong>报名方式：</strong></p>
              <p>请通过本平台“活动”页面在线报名，每项活动名额有限，先到先得。如有疑问请致电心理健康中心：010-8888-6666。</p>
              <p>期待你的参与！</p>
              <p class="v23-signature">心理健康中心<br />2026年6月</p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="page === 'booking_rules'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>预约规则</h1>
        </header>
        <div class="content-area proto-content prototype-page-stack">
          <section class="prototype-detail-card v23-rule-card">
            <div class="v23-rule-head">
              <span class="mini-icon blue"><ClipboardList :size="18" /></span>
              <h3>预约流程说明</h3>
            </div>
            <div class="v23-flow-list">
              <div v-for="(step, index) in bookingRuleSteps" :key="step" class="v23-flow-step">
                <span :class="{ final: index === bookingRuleSteps.length - 1 }">{{ index + 1 }}</span>
                <p>{{ step }}</p>
              </div>
            </div>
          </section>
          <section v-for="rule in bookingRuleCards" :key="rule.title" class="prototype-detail-card v23-rule-card">
            <div class="v23-rule-head">
              <span :class="['mini-icon', rule.tone]"><component :is="rule.icon" :size="18" /></span>
              <h3>{{ rule.title }}</h3>
            </div>
            <ul class="v23-rule-list">
              <li v-for="line in rule.lines" :key="line">{{ line }}</li>
            </ul>
          </section>
        </div>
      </section>

      <section v-if="page === 'similar_counselors'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>相似咨询师推荐</h1>
        </header>
        <div class="content-area proto-content prototype-page-stack">
          <section class="v23-tip-card">
            <p><Info :size="15" /> 根据你查看的 <strong>{{ selectedCounselor?.name || '-' }}</strong> 的擅长领域，为你推荐以下咨询师</p>
          </section>
          <article v-for="item in similarCounselors" :key="item.id" class="prototype-detail-card v23-similar-card">
            <div class="v23-similar-main">
              <div :class="['v23-letter-avatar', item.tone]">{{ item.initial }}</div>
              <div>
                <h3>{{ item.name }}</h3>
                <p>{{ item.title }}</p>
                <div class="prototype-tags">
                  <span v-for="tag in item.tags" :key="tag" :class="item.tone">{{ tag }}</span>
                </div>
                <small>{{ item.desc }}</small>
              </div>
            </div>
            <div class="v23-card-actions">
              <button class="secondary-block" @click="openSimilarCounselor(item.targetId)">查看详情</button>
              <button class="primary-block" @click="startBooking(item.targetId)">预约</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="page === 'profile_edit'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>编辑个人资料</h1>
        </header>
        <div class="content-area proto-content prototype-form-stack v23-profile-edit-content">
          <div class="v23-profile-avatar">
            <div>
              <span>李</span>
              <em><UserRound :size="13" /></em>
            </div>
            <p>点击更换头像</p>
          </div>
          <section class="prototype-detail-card v23-profile-form">
            <label>姓名<input class="input-field muted-input" disabled value="李明" /></label>
            <label>学号<input class="input-field muted-input" disabled value="2023020110" /></label>
            <label>院系
              <select v-model="profileEdit.department" class="input-field">
                <option>计算机学院</option>
                <option>心理学系</option>
                <option>教育学系</option>
                <option>外国语学院</option>
                <option>经济管理学院</option>
              </select>
            </label>
            <label>年级
              <select v-model="profileEdit.grade" class="input-field">
                <option>2023级</option>
                <option>2022级</option>
                <option>2021级</option>
                <option>2020级</option>
              </select>
            </label>
            <label>校区
              <select v-model="profileEdit.campus" class="input-field">
                <option>校本部</option>
                <option>东校区</option>
                <option>西校区</option>
                <option>南校区</option>
              </select>
            </label>
            <label>手机号<span class="required-star">*</span><input v-model="profileEdit.phone" class="input-field" type="tel" placeholder="请输入手机号" /></label>
            <p class="v23-field-tip">填写常用手机号，用于接收预约通知</p>
            <label>邮箱<input v-model="profileEdit.email" class="input-field" type="email" placeholder="请输入邮箱" /></label>
            <label>微信号<input v-model="profileEdit.wechat" class="input-field" type="text" placeholder="请输入微信号" /></label>
          </section>
          <div class="proto-spacer"></div>
        </div>
        <div class="proto-fixed-actions">
          <button class="primary-block" @click="saveStudentProfile">保存</button>
        </div>
      </section>

      <section v-if="page === 'booking'" class="student-prototype-page mobile-container" data-testid="student-booking">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons">
            <Signal :size="12" />
            <Wifi :size="12" />
            <BatteryFull :size="13" />
          </div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'home'"><ChevronLeft :size="26" /></button>
          <h1>预约咨询</h1>
        </header>
        <div class="proto-tabs">
          <button class="active">全部</button>
          <button>情绪压力</button>
          <button>人际交往</button>
          <button>学业规划</button>
          <button>自我成长</button>
        </div>
        <div class="content-area proto-content has-tabbar">
          <div class="proto-search-wrap">
            <div class="proto-search">
              <Search :size="21" />
              <input v-model="keyword" placeholder="搜索咨询师姓名或擅长领域" type="text" />
            </div>
          </div>
          <div class="counselor-proto-list">
            <article v-for="item in visibleCounselors" :key="item.id" class="proto-counselor-card" data-testid="student-counselor-card">
              <div class="proto-counselor-main">
                <img v-if="item.avatarImage" :src="item.avatarImage" alt="Counselor Avatar" />
                <div class="proto-counselor-info">
                  <div class="proto-card-titleline">
                    <div>
                      <h3>{{ item.name }}</h3>
                      <p>{{ item.title }}</p>
                    </div>
                    <span class="proto-rating"><Star :size="13" />{{ item.rating }}</span>
                  </div>
                  <div class="proto-tag-row">
                    <span v-for="tag in item.specialties.slice(0, 3)" :key="tag" :class="item.tagTone">{{ tag }}</span>
                  </div>
                </div>
              </div>
              <div class="proto-card-footer">
                <span class="next-slot"><Clock :size="13" />最近可约：{{ item.nextSlot }}</span>
                <span class="proto-card-actions">
                  <button class="ghost" @click="openCounselor(item.id)">查看详情</button>
                  <button class="primary" data-testid="student-book-counselor" @click="startBooking(item.id)">立即预约</button>
                </span>
              </div>
            </article>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-active" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'counselor_detail' && selectedCounselor" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'booking'"><ChevronLeft :size="26" /></button>
          <h1>咨询师详情</h1>
        </header>
        <div class="content-area proto-content detail-with-actions">
          <section class="detail-profile-hero">
            <div class="detail-avatar">{{ selectedCounselor.name?.slice(0, 1) || '-' }}</div>
            <h2>{{ selectedCounselor.name }}</h2>
            <p>{{ selectedCounselor.subtitle || '心理中心咨询师' }}</p>
            <div class="detail-meta">
              <span><MapPin :size="13" />{{ selectedCounselor.campus?.name || '-' }}</span>
              <span><DoorOpen :size="13" />{{ selectedCounselor.room?.name || '-' }}</span>
            </div>
            <div class="detail-stars">
              <Star v-for="index in 4" :key="index" :size="15" fill="currentColor" />
              <StarHalf :size="15" fill="currentColor" />
              <span>{{ selectedCounselor.rating || '4.8' }}</span>
            </div>
          </section>
          <section class="proto-white-section">
            <h3>擅长领域</h3>
            <div class="detail-specialties">
              <span v-for="tag in (selectedCounselor.specialties || []).slice(0, 4)" :key="tag">{{ tag }}</span>
            </div>
          </section>
          <section class="proto-white-section">
            <h3>个人简介</h3>
            <p>{{ selectedCounselor.introduction || '暂无简介' }}</p>
            <div class="intro-meta">
              <span><strong>从业年限：</strong>{{ selectedCounselor.years || '-' }}</span>
              <span><strong>咨询流派：</strong>{{ selectedCounselor.approach || '-' }}</span>
            </div>
          </section>
          <section class="proto-white-section last">
            <h3 class="with-icon"><CalendarClock :size="17" />可预约时间</h3>
            <div class="detail-date-row">
              <button v-for="item in prototypeDateOptions" :key="item.date" :class="{ active: item.active }">
                <strong>{{ item.date }}</strong>
                <span>{{ item.week }}</span>
              </button>
            </div>
            <div class="detail-slot-list">
              <button
                v-for="slot in selectedCounselor.schedules || []"
                :key="slot.id"
                :class="{ disabled: slot.disabled, selected: booking.scheduleId === slot.id }"
                @click="!slot.disabled && (booking.scheduleId = slot.id)"
              >
                <span><Clock :size="15" />{{ slot.timeText || formatDateTime(slot.startAt) }}</span>
                <em>{{ slot.disabled ? '已约满' : '可预约' }}</em>
              </button>
            </div>
          </section>
          <div class="proto-spacer"></div>
        </div>
        <div class="proto-fixed-actions with-tabbar">
          <button class="secondary-block" @click="page = 'similar_counselors'">查看相似咨询师</button>
          <button class="primary-block" :disabled="!booking.scheduleId" @click="page = 'appointment_form'">预约咨询</button>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-active" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'messages'"><Bell :size="25" /><span>消息</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'appointment_form' && selectedCounselor" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'counselor_detail'"><ChevronLeft :size="26" /></button>
          <h1>预约申请</h1>
        </header>
        <div class="content-area proto-content">
          <section class="form-counselor-summary">
            <img v-if="selectedCounselor.detailAvatarImage || selectedCounselor.avatarImage" :src="selectedCounselor.detailAvatarImage || selectedCounselor.avatarImage" alt="Counselor" />
            <div>
              <h3>{{ selectedCounselor.name }}</h3>
              <p>{{ selectedCounselor.titleLine || '高级心理咨询师 | 擅长情绪管理' }}</p>
            </div>
          </section>
          <form class="appointment-proto-form" @submit.prevent="page = 'booking_confirm'">
            <section>
              <h4>选择预约日期</h4>
              <div class="booking-date-row">
                <button v-for="item in bookingDateOptions" :key="item.day" type="button" :class="{ active: item.active }">
                  <span>{{ item.week }}</span>
                  <strong>{{ item.day }}</strong>
                </button>
              </div>
            </section>
            <section>
              <h4>选择时间段</h4>
              <div class="booking-time-grid">
                <button
                  v-for="slot in selectedCounselor.schedules || []"
                  :key="slot.id"
                  type="button"
                  :class="{ active: booking.scheduleId === slot.id, disabled: slot.disabled }"
                  @click="!slot.disabled && (booking.scheduleId = slot.id)"
                >
                  {{ slot.label || slot.timeText || formatDateTime(slot.startAt) }}
                </button>
              </div>
            </section>
            <section>
              <h4>咨询方式</h4>
              <div class="method-row">
                <label class="active"><input v-model="booking.method" type="radio" value="线下咨询" /><UsersRound :size="17" /><span>线下咨询</span></label>
                <label><input v-model="booking.method" type="radio" value="线上视频" /><Video :size="17" /><span>线上视频</span></label>
              </div>
            </section>
            <section>
              <h4>咨询原因</h4>
              <textarea v-model="booking.concern" placeholder="请简要描述您目前遇到的困扰（限500字）..." rows="4"></textarea>
            </section>
            <label class="booking-consent">
              <input v-model="booking.consentAccepted" type="checkbox" />
              <span>我已阅读并同意 <a @click.prevent="previousPage = page; page = 'consent'">《心理咨询知情同意书》</a>，了解咨询流程及保密协议。</span>
            </label>
            <div class="form-submit-wrap">
              <button type="submit">提交预约申请</button>
            </div>
          </form>
        </div>
      </section>

      <section v-if="page === 'booking_confirm' && selectedCounselor" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'appointment_form'"><ChevronLeft :size="26" /></button>
          <h1>确认预约</h1>
        </header>
        <div class="step-indicator">
          <template v-for="(step, index) in bookingSteps" :key="step.label">
            <span class="step-item" :class="{ current: index === 3, done: index < 4 }"><b>{{ index + 1 }}</b><em>{{ step.label }}</em></span>
            <i v-if="index < bookingSteps.length - 1" :class="{ done: index < 3 }"></i>
          </template>
        </div>
        <div class="content-area proto-content confirm-content">
          <section class="confirm-card">
            <h3><ClipboardList :size="17" />预约摘要</h3>
            <dl>
              <div><dt>咨询师</dt><dd><img v-if="selectedCounselor.detailAvatarImage || selectedCounselor.avatarImage" :src="selectedCounselor.detailAvatarImage || selectedCounselor.avatarImage" alt="" />{{ selectedCounselor.name }}</dd></div>
              <div><dt>咨询类型</dt><dd>常规咨询（50分钟）</dd></div>
              <div><dt>预约时间</dt><dd>{{ selectedSlot?.confirmText || selectedSlot?.timeText || formatDateTime(selectedSlot?.startAt) }}</dd></div>
              <div><dt>咨询方式</dt><dd>{{ booking.method || '线下咨询' }}</dd></div>
              <div><dt>咨询地点</dt><dd>{{ selectedCounselor.room?.fullName || selectedCounselor.room?.name || '-' }}</dd></div>
            </dl>
          </section>
          <section class="confirm-card">
            <h3><MessageSquareText :size="17" />主诉摘要</h3>
            <p>{{ booking.concern || '-' }}</p>
          </section>
          <section class="confirm-card">
            <h3><ShieldCheck :size="17" />风险筛查结果</h3>
            <div class="risk-summary-row">
              <strong>8分</strong>
              <span><em>低风险</em><small>你的风险评估结果为低风险，可正常预约</small></span>
            </div>
          </section>
          <section class="confirm-card consent-status">
            <span><Check :size="19" /></span>
            <p>已阅读并同意《心理咨询知情同意书》</p>
            <button @click="previousPage = page; page = 'consent'">查看</button>
          </section>
          <section class="cancel-rule-card">
            <Clock :size="19" />
            <p><strong>取消规则提醒</strong><small>距离预约时间超过2小时可取消<br />30天内3次未到将限制预约30天</small></p>
          </section>
        </div>
        <div class="proto-fixed-actions confirm-actions">
          <button class="primary-block" data-testid="student-confirm-booking" @click="createAppointment">确认提交</button>
          <button class="plain-link" @click="page = 'appointment_form'">返回修改</button>
        </div>
      </section>

      <section v-if="page === 'booking_success'" class="booking-success-prototype mobile-container" data-testid="student-booking-success">
        <div class="success-check"><CheckCircle2 :size="62" /></div>
        <h1>预约提交成功</h1>
        <p>您的预约已提交，请耐心等待咨询师确认。确认结果将通过通知告知您。</p>
        <section class="success-summary">
          <div><span>预约咨询师</span><strong>{{ createdAppointment?.counselor?.name || '-' }}</strong></div>
          <div><span>预约时间</span><strong>{{ createdAppointment ? formatDateTime(createdAppointment.schedule?.startAt) : '-' }}</strong></div>
          <div><span>咨询方式</span><strong>{{ createdAppointment?.method || booking.method || '线下咨询' }}</strong></div>
        </section>
        <div class="success-actions">
          <button class="primary-block" @click="page = 'appointments'">查看我的预约</button>
          <button class="secondary-block" @click="page = 'home'">返回首页</button>
        </div>
      </section>

      <section v-if="page === 'appointments'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'profile'"><ChevronLeft :size="26" /></button>
          <h1>我的预约</h1>
        </header>
        <div class="proto-tabs">
          <button v-for="item in appointmentFilters" :key="item.key" :class="{ active: appointmentFilter === item.key }" @click="appointmentFilter = item.key">{{ item.label }}</button>
        </div>
        <div class="content-area proto-content appointments-content has-tabbar">
          <article
            v-for="item in visibleAppointments"
            :key="item.id"
            class="proto-appointment-card"
            :class="{ muted: item.status === 'completed' }"
            data-testid="student-appointment-card"
          >
            <div class="appointment-card-head">
              <div>
                <img v-if="item.avatarImage" :src="item.avatarImage" alt="Counselor" />
                <span><strong>{{ item.counselor?.name || item.counselorName || '-' }}</strong><small>{{ item.method || '-' }}</small></span>
              </div>
              <em :class="statusTagClass(item.status)">{{ statusLabels[item.status] || item.status }}</em>
            </div>
            <div class="appointment-card-meta">
              <p><CalendarClock :size="13" />{{ item.timeText || formatDateTime(item.schedule?.startAt) }}</p>
              <p><MapPin :size="13" />{{ item.locationText || item.room?.name || '-' }}</p>
            </div>
            <div class="appointment-actions">
              <button v-if="item.status === 'pending'" class="outline" data-testid="student-cancel-appointment" @click="openCancelAppointment(item)">取消预约</button>
              <button v-if="item.status === 'confirmed'" class="outline blue" @click="openReschedule(item)">申请改期</button>
              <button v-if="item.status === 'completed'" class="outline orange" @click="selectedAppointmentId = item.id; feedbackSubmitted = false; page = 'feedback'">去评价</button>
              <button v-if="item.status === 'pending'" class="filled-gray" @click="openAppointment(item)">查看详情</button>
              <button v-if="item.status === 'confirmed'" class="filled-blue" @click="openAppointment(item)">进入视频</button>
            </div>
          </article>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-active" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'appointment_detail' && currentAppointment" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'appointments'"><ChevronLeft :size="26" /></button>
          <h1>预约详情</h1>
        </header>
        <div class="content-area proto-content appointment-detail-content">
          <section class="appointment-status-card" :class="currentAppointment.status">
            <CheckCircle2 :size="30" />
            <div>
              <h2>{{ appointmentStatusMeta.title }}</h2>
              <p>{{ appointmentStatusMeta.desc }}</p>
            </div>
          </section>
          <section class="detail-info-card">
            <h3><ClipboardList :size="17" />预约信息</h3>
            <div class="detail-counselor-line">
              <div>{{ appointmentDetailData.counselorAvatar }}</div>
              <span><strong>{{ appointmentDetailData.counselorName }}</strong><small>{{ appointmentDetailData.counselorTitle }}</small></span>
            </div>
            <dl>
              <div><dt>咨询类型</dt><dd>{{ appointmentDetailData.consultType }}</dd></div>
              <div><dt>预约时间</dt><dd>{{ appointmentDetailData.time }}</dd></div>
              <div><dt>咨询地点</dt><dd>{{ appointmentDetailData.location }}</dd></div>
              <div><dt>咨询方式</dt><dd>{{ appointmentDetailData.method }}</dd></div>
              <div><dt>提交时间</dt><dd>{{ appointmentDetailData.submitTime }}</dd></div>
            </dl>
          </section>
          <section class="detail-info-card">
            <h3><MessageSquareText :size="17" />主诉摘要</h3>
            <p>{{ appointmentDetailData.issue }}</p>
            <div class="risk-level-line"><span>风险等级：</span><em>{{ appointmentDetailData.riskLevel }}</em></div>
          </section>
          <section class="detail-info-card notes">
            <h3><Info :size="17" />注意事项与取消规则</h3>
            <ul>
              <li>请提前5分钟到达心理中心签到</li>
              <li>预约时间前2小时以上可自行取消</li>
              <li>30天内3次未到将限制预约30天</li>
              <li>如需更改时间，请先取消后重新预约</li>
            </ul>
          </section>
          <section class="detail-info-card log">
            <h3><History :size="17" />操作日志 <ChevronRight :size="17" /></h3>
            <div class="log-row">
              <Circle :size="13" />
              <span><strong>学生提交预约</strong><small>{{ appointmentDetailData.submitTime }}</small></span>
            </div>
          </section>
        </div>
        <div class="proto-fixed-actions with-tabbar detail-actions">
          <template v-if="currentAppointment.status === 'pending'">
            <button class="secondary-block danger-soft" data-testid="student-cancel-appointment" @click="openCancelAppointment(currentAppointment)">取消预约</button>
            <button class="secondary-block" @click="showNotice('咨询师联系方式将在预约确认后开放')">联系咨询师</button>
          </template>
          <template v-else-if="currentAppointment.status === 'confirmed'">
            <button class="secondary-block" @click="showNotice('张静老师 工作电话：138****5678')">联系咨询师</button>
            <button class="secondary-block warning-soft" @click="openReschedule(currentAppointment)">申请改期</button>
            <button class="primary-block" @click="showNotice('视频入口将于咨询前10分钟开启')">进入咨询</button>
          </template>
          <button v-else-if="currentAppointment.status === 'completed'" class="primary-block" @click="feedbackSubmitted = false; page = 'feedback'">写评价</button>
          <button v-else class="primary-block" @click="page = 'booking'">再次预约</button>
          <p>{{ appointmentStatusMeta.rule }}</p>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-active" @click="page = 'appointments'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'reschedule' && currentAppointment" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>预约改期申请</h1>
        </header>
        <div v-if="!rescheduleSubmitted" class="content-area proto-content prototype-form-stack reschedule-prototype">
          <section class="prototype-detail-card">
            <h3><ClipboardList :size="17" />当前预约信息</h3>
            <div class="detail-counselor-line reschedule-counselor">
              <div>{{ appointmentDetailData.counselorAvatar }}</div>
              <span><strong>{{ appointmentDetailData.counselorName }}</strong><small>{{ appointmentDetailData.counselorTitle }}</small></span>
            </div>
            <dl class="reschedule-summary">
              <div><dt>当前时间</dt><dd>{{ appointmentDetailData.time }}</dd></div>
              <div><dt>咨询方式</dt><dd>{{ appointmentDetailData.method }}</dd></div>
              <div><dt>咨询地点</dt><dd>{{ appointmentDetailData.location }}</dd></div>
              <div><dt>当前状态</dt><dd><em class="tag-confirmed">已确认</em></dd></div>
            </dl>
          </section>

          <section class="prototype-detail-card">
            <h3><ClipboardCheck :size="17" />改期申请表单</h3>
            <label>
              希望改期日期
              <select v-model="rescheduleForm.date" class="input-field">
                <option value="">请选择日期</option>
                <option v-for="item in rescheduleDateOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </label>
            <label>
              希望改期时间段
              <select v-model="rescheduleForm.time" class="input-field">
                <option value="">请选择时间段</option>
                <option v-for="item in rescheduleTimeOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label>
              改期原因（选填）
              <textarea v-model="rescheduleForm.reason" class="input-field textarea" placeholder="请输入改期原因..." rows="3"></textarea>
            </label>
            <div class="reschedule-radio">
              <strong>接受系统推荐相近时间</strong>
              <div class="prototype-radio-card inline">
                <label><input v-model="rescheduleForm.acceptRecommend" name="acceptRecommend" type="radio" value="yes" />是</label>
                <label><input v-model="rescheduleForm.acceptRecommend" name="acceptRecommend" type="radio" value="no" />否</label>
              </div>
            </div>
          </section>

          <section class="reschedule-tip-card">
            <h4><Info :size="14" />温馨提示</h4>
            <ul>
              <li>改期申请需咨询师或管理员确认</li>
              <li>请尽量提前提交申请</li>
              <li>改期后原时段将释放给其他同学</li>
            </ul>
          </section>

          <div class="prototype-two-actions">
            <button @click="goBack">取消</button>
            <button @click="submitReschedule">提交改期申请</button>
          </div>
        </div>
        <div v-else class="content-area proto-content signup-success-content reschedule-success-content">
          <div class="success-icon green"><CheckCircle2 :size="52" /></div>
          <h2>已提交改期申请</h2>
          <p>等待咨询师确认...</p>
          <section class="success-summary-card">
            <div><span>申请编号</span><strong>RSK20250717001</strong></div>
            <div><span>当前状态</span><strong class="warning">待确认</strong></div>
            <p>您将在「我的预约」中查看处理进度</p>
          </section>
          <button class="btn-main" @click="page = 'appointments'">返回我的预约</button>
        </div>
      </section>

      <section v-if="page === 'profile'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header no-back">
          <h1>个人中心</h1>
        </header>
        <div class="content-area proto-content has-tabbar profile-prototype-content">
          <div class="profile-hero primary-gradient">
            <div class="profile-avatar"><UserRound :size="42" /></div>
            <h2>{{ studentName }}</h2>
            <p>2023020110 · {{ me.college || '计算机学院' }}</p>
          </div>
          <div class="profile-body">
            <section class="profile-stat-card">
              <div><strong>3</strong><span>进行中</span></div>
              <div><strong>8</strong><span>已完成</span></div>
              <div><strong>12</strong><span>总预约</span></div>
            </section>
            <section class="prototype-list-card">
              <button v-for="item in profileMenuTop" :key="item.label" @click="openProfileTarget(item.target)">
                <span :class="['menu-icon', item.tone]"><component :is="item.icon" :size="20" /></span>
                <span><strong>{{ item.label }}</strong><small>{{ item.desc }}</small></span>
                <ChevronRight :size="18" />
              </button>
            </section>
            <section class="prototype-list-card">
              <button @click="page = 'emergency'">
                <span class="menu-icon red"><PhoneCall :size="20" /></span>
                <span><strong>紧急帮助</strong><small>24小时心理援助热线</small></span>
                <ChevronRight :size="18" />
              </button>
              <button @click="logout">
                <span class="menu-icon gray"><LogOut :size="20" /></span>
                <span><strong class="logout-text">退出登录</strong><small>退出当前账号</small></span>
              </button>
            </section>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-active" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'assessment_list'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>心理测评</h1>
        </header>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <section class="assessment-intro">
            <h2>心理测评</h2>
            <p>选择一份测评量表，了解你当前的心理状态。测评结果仅供心理健康服务参考，不作为诊断依据。</p>
          </section>
          <article v-for="item in prototypeAssessments" :key="item.title" class="assessment-card">
            <div class="assessment-card-head">
              <span :class="['assessment-icon', item.tone]"><component :is="item.icon" :size="25" /></span>
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.meta }}</p>
                <small>{{ item.desc }}</small>
              </div>
            </div>
            <div class="prototype-tags">
              <span v-for="tag in item.tags" :key="tag" :class="item.tone">{{ tag }}</span>
            </div>
            <button class="btn-main" @click="startPrototypeAssessment">开始测评</button>
          </article>
          <div class="prototype-text-link">
            <button @click="page = 'assessment_history'">查看测评历史</button>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'assessment_quiz'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>心理测评</h1>
        </header>
        <div class="content-area proto-content has-tabbar quiz-prototype-content">
          <section class="quiz-progress-card">
            <div>
              <h2>PHQ-9 抑郁筛查量表</h2>
              <span>{{ quizProgressLabel }}</span>
            </div>
            <div class="quiz-progress-track"><i :style="{ width: quizProgressPercent }"></i></div>
          </section>
          <section class="quiz-question-card">
            <p>{{ currentQuizIndex + 1 }}. {{ currentQuizQuestion.text }}</p>
            <div class="quiz-option-grid">
              <button
                v-for="option in assessmentOptions"
                :key="option.value"
                :class="{ active: assessmentAnswers[currentQuizIndex] === option.value }"
                @click="assessmentAnswers[currentQuizIndex] = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </section>
          <div class="quiz-actions">
            <button @click="goBack">退出测评</button>
            <button @click="submitPrototypeAssessment">提交问卷</button>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'assessment_result'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>测评结果</h1>
        </header>
        <div class="content-area proto-content has-tabbar assessment-result-content">
          <div class="score-circle prototype-score-circle">
            <strong>12</strong>
            <span>分</span>
          </div>
          <h2>轻度至中度抑郁倾向</h2>
          <p>根据你的回答，你可能正经历一定程度的情绪困扰。建议你预约咨询师进行进一步评估。</p>
          <section class="result-advice-line">
            <Info :size="18" />
            <span>建议你预约专业咨询师，进行面对面的深入评估和辅导。</span>
          </section>
          <div class="result-button-group">
            <button class="btn-main" @click="page = 'booking'">预约咨询师</button>
            <button class="btn-second full" @click="page = 'assessment_history'">查看测评历史</button>
            <button class="outline-block" @click="page = 'home'">返回首页</button>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'articles'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>心理科普</h1>
        </header>
        <div class="proto-tabs article-tabs">
          <button v-for="item in articleCategories" :key="item" :class="{ active: activeArticleCategory === item }" @click="activeArticleCategory = item">{{ item }}</button>
        </div>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <article v-for="item in filteredPrototypeArticles" :key="item.id" class="prototype-article-card" @click="openArticle(item)">
            <img v-if="item.cover" :src="item.cover" alt="Article Cover" />
            <div>
              <h4>{{ item.title }}</h4>
              <p><span>{{ item.author }}</span><span><Eye :size="13" />{{ item.views }}</span></p>
            </div>
          </article>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-active" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'article_detail'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>文章详情</h1>
        </header>
        <div class="content-area proto-content has-tabbar article-detail-prototype">
          <div class="article-detail-hero"><BookOpen :size="58" /></div>
          <div class="article-detail-inner">
            <section class="prototype-detail-card">
              <h2>{{ currentArticle.title }}</h2>
              <p class="article-meta"><span>{{ currentArticle.author }}</span><span>·</span><span>2025年7月10日</span><span>·</span><span><Eye :size="13" />{{ currentArticle.views }}</span></p>
            </section>
            <section class="prototype-detail-card article-body-card">
              <p>期末考试临近，很多同学会感到不同程度的压力。适度的压力可以激发学习动力，但过度压力反而会降低效率，影响身心健康。</p>
              <h3>一、认识你的压力信号</h3>
              <p>出现失眠、食欲改变、注意力难以集中、易怒或情绪低落，都是压力过大的信号。</p>
              <h3>二、实用的减压方法</h3>
              <p>1. 番茄工作法：25分钟专注学习，5分钟休息。<br />2. 腹式呼吸法：深吸气4秒，憋气4秒，呼气6秒。<br />3. 适度运动：每天20分钟有氧运动。<br />4. 与他人倾诉：不要独自承受。</p>
              <h3>三、寻求专业帮助</h3>
              <p>如果压力已经严重影响到你的日常生活和学习，建议预约心理中心的咨询师进行专业辅导。</p>
            </section>
            <button class="btn-main" @click="page = 'booking'">预约咨询师</button>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-active" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'activities'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>心理活动</h1>
        </header>
        <div class="proto-tabs article-tabs">
          <button v-for="item in activityCategories" :key="item" :class="{ active: activityFilter === item }" @click="activityFilter = item">{{ item }}</button>
        </div>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <article v-for="item in visiblePrototypeActivities" :key="item.id" class="prototype-activity-card" @click="openActivity(item)">
            <div :class="['activity-image-panel', item.tone]">
              <HeartPulse :size="42" />
              <span>{{ item.category }}</span>
              <b>进行中</b>
            </div>
            <div class="prototype-activity-body">
              <h3>{{ item.title }}</h3>
              <p><CalendarClock :size="14" />{{ item.time }}</p>
              <p><MapPin :size="14" />{{ item.location }}</p>
              <div><small>{{ item.seats }}</small><ChevronRight :size="17" /></div>
            </div>
          </article>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'activity_detail'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>活动详情</h1>
        </header>
        <div class="content-area proto-content has-tabbar activity-detail-prototype">
          <div class="activity-detail-hero"><HeartPulse :size="62" /><span>{{ currentActivity.category }}</span></div>
          <div class="activity-detail-inner">
            <section class="prototype-detail-card">
              <h2>{{ currentActivity.title }}</h2>
              <div class="activity-info-list">
                <p><span class="mini-icon blue"><CalendarClock :size="17" /></span><strong>活动时间</strong><small>{{ currentActivity.detailTime }}</small></p>
                <p><span class="mini-icon green"><MapPin :size="17" /></span><strong>活动地点</strong><small>{{ currentActivity.locationDetail }}</small></p>
                <p><span class="mini-icon purple"><Home :size="17" /></span><strong>主办方</strong><small>心理中心</small></p>
              </div>
            </section>
            <section class="prototype-detail-card">
              <h3>活动介绍</h3>
              <p>正念减压（Mindfulness-Based Stress Reduction, MBSR）是一种科学的减压方法，通过正念冥想、身体扫描、正念呼吸等练习，帮助你觉察当下、缓解压力、改善情绪。</p>
              <p>本团体共6次活动，每周一次，面向全校学生开放。无需任何冥想经验，欢迎所有希望学习压力管理技巧的同学参加。</p>
            </section>
            <section class="prototype-detail-card">
              <h3>适合人群</h3>
              <div class="prototype-tags"><span class="blue">长期压力大</span><span class="blue">睡眠不佳</span><span class="blue">情绪易波动</span><span class="blue">想学习正念</span></div>
            </section>
            <button class="btn-main" @click="page = 'activity_signup'">立即报名</button>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'activity_signup'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>活动报名</h1>
        </header>
        <div class="content-area proto-content has-tabbar prototype-form-stack">
          <section class="prototype-detail-card activity-signup-info">
            <h3><ClipboardList :size="18" />活动信息</h3>
            <div>
              <h4>正念减压团体</h4>
              <p><CalendarClock :size="14" />时间：07-25 14:00-16:00</p>
              <p><MapPin :size="14" />地点：心理健康中心·团体室</p>
              <p><UsersRound :size="14" />报名人数：18/20</p>
            </div>
          </section>
          <h3 class="form-section-title"><ClipboardList :size="18" />报名信息</h3>
          <label>姓名<input class="input-field" readonly value="李明" /></label>
          <label>学号<input class="input-field" readonly value="S2024001" /></label>
          <label>联系方式<input class="input-field" placeholder="请输入手机号" /></label>
          <div class="prototype-radio-card">
            <p>是否有当前心理困扰</p>
            <label><input checked name="signupDistress" type="radio" />是</label>
            <label><input name="signupDistress" type="radio" />否</label>
          </div>
          <label>期望收获（选填）<textarea class="input-field textarea" placeholder="你希望通过本次活动获得什么？"></textarea></label>
          <div class="prototype-warn-line"><Info :size="15" />提交报名后不可自行取消，如需取消请联系管理员。</div>
          <div class="prototype-two-actions">
            <button @click="goBack">取消</button>
            <button @click="submitPrototypeSignup">提交报名</button>
          </div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'activity_signup_success'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'activities'"><ChevronLeft :size="26" /></button>
          <h1>报名成功</h1>
        </header>
        <div class="content-area proto-content has-tabbar signup-success-content">
          <div class="success-icon"><CheckCircle2 :size="52" /></div>
          <h2>报名成功！</h2>
          <p>活动开始前会通过消息通知你</p>
          <section class="prototype-detail-card signup-summary">
            <div><span>活动</span><strong>正念减压团体</strong></div>
            <div><span>状态</span><b>报名成功</b></div>
          </section>
          <button class="btn-main" @click="page = 'my_activities'">查看我的活动</button>
          <button class="btn-second full" @click="page = 'activities'">返回活动列表</button>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'messages'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>消息中心</h1>
        </header>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <article v-for="item in visibleMessages" :key="item.id || item.title" :class="['prototype-message-card', { read: item.read }]" @click="openMessage(item)">
            <span :class="['message-icon', item.tone]"><component :is="item.icon" :size="24" /></span>
            <div>
              <p><strong>{{ item.title }}</strong><small>{{ item.timeText }}</small></p>
              <em>{{ item.summary }}</em>
            </div>
            <i v-if="!item.read"></i>
          </article>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-active" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'message_detail'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>消息详情</h1>
        </header>
        <div class="content-area proto-content has-tabbar message-detail-prototype">
          <section class="message-detail-head">
            <span class="message-icon blue"><CalendarClock :size="25" /></span>
            <div><h3>{{ currentMessage.title }}</h3><p>{{ currentMessage.dateText }}</p></div>
          </section>
          <section class="prototype-detail-card">
            <p>同学你好！</p>
            <p>{{ currentMessage.content }}</p>
            <div class="message-appt-summary">
              <div><span>咨询师</span><strong>林晚晴</strong></div>
              <div><span>时间</span><strong>2025年7月15日 14:00</strong></div>
              <div><span>地点</span><strong>心理中心 302室</strong></div>
            </div>
            <p class="muted-note">如有任何问题，请提前24小时取消或改期。</p>
          </section>
          <button class="btn-main" @click="page = 'appointment_detail'">查看预约详情</button>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-active" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'assessment_history'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>测评历史</h1>
        </header>
        <div class="assessment-filter-bar">
          <button v-for="item in assessmentHistoryFilters" :key="item" :class="{ active: assessmentHistoryFilter === item }" @click="assessmentHistoryFilter = item">{{ item }}</button>
        </div>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <article v-for="item in prototypeAssessmentHistory" :key="item.title" class="history-card">
            <div><h3>{{ item.title }}</h3><span>{{ item.level }}</span></div>
            <p>{{ item.date }} · {{ item.score }}分</p>
            <small>{{ item.desc }}</small>
          </article>
          <div class="prototype-text-link"><button @click="page = 'assessment_list'">去测评</button></div>
          <p class="assessment-disclaimer">测评结果仅供心理健康服务参考，不作为诊断依据。</p>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-active" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'my_activities'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>我的活动</h1>
        </header>
        <div class="proto-tabs article-tabs">
          <button v-for="item in myActivityTabs" :key="item" :class="{ active: activeMyActivityTab === item }" @click="activeMyActivityTab = item">{{ item }}</button>
        </div>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <article v-for="item in filteredMyActivities" :key="item.title" class="my-activity-card">
            <div :class="['activity-image-panel compact', item.tone]"><CalendarClock :size="32" /><span>{{ item.category }}</span></div>
            <div>
              <h3>{{ item.title }}</h3>
              <p><CalendarClock :size="14" />{{ item.time }}</p>
              <p><MapPin :size="14" />{{ item.location }}</p>
              <span>{{ item.status }}</span>
            </div>
          </article>
          <div class="prototype-text-link"><button @click="page = 'activities'">去看看活动</button></div>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-active" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'feedback'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>咨询评价</h1>
        </header>
        <div v-if="!feedbackSubmitted" class="content-area proto-content has-tabbar prototype-form-stack feedback-prototype">
          <section class="feedback-counselor-card">
            <div><UserRound :size="34" /></div>
            <h3>张静 老师</h3>
            <p>2025年7月15日 14:00-15:00</p>
            <p>线下咨询 · 博学楼301</p>
          </section>
          <section class="prototype-detail-card centered-card">
            <h3>满意度评分</h3>
            <div class="feedback-stars"><Star v-for="index in 5" :key="index" :size="30" /></div>
            <p>点击星星进行评分</p>
          </section>
          <section class="prototype-detail-card">
            <h3>咨询体验评分</h3>
            <div class="experience-grid"><button v-for="item in ['很差','较差','一般','满意','非常满意']" :key="item">{{ item }}</button></div>
          </section>
          <section class="prototype-detail-card">
            <h3>是否愿意再次预约该咨询师</h3>
            <div class="prototype-radio-card inline"><label><input name="again" type="radio" />愿意</label><label><input checked name="again" type="radio" />不愿意</label></div>
          </section>
          <section class="prototype-detail-card">
            <h3>评价标签（多选）</h3>
            <div class="feedback-tags"><button v-for="tag in feedbackTags" :key="tag">{{ tag }}</button></div>
          </section>
          <label>文字评价（选填）<textarea class="input-field textarea" placeholder="分享你的咨询体验..."></textarea></label>
          <div class="prototype-two-actions">
            <button @click="goBack">取消</button>
            <button @click="feedbackSubmitted = true">提交评价</button>
          </div>
        </div>
        <div v-else class="content-area proto-content has-tabbar signup-success-content">
          <div class="success-icon pink"><HeartPulse :size="52" /></div>
          <h2>感谢你的评价！</h2>
          <p>你的反馈将帮助我们持续提升咨询服务质量</p>
          <button class="btn-main" @click="page = 'appointments'">返回我的预约</button>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-active" @click="page = 'appointments'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'feedback_form'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>意见反馈</h1>
        </header>
        <div v-if="!feedbackFormSubmitted" class="content-area proto-content prototype-form-stack feedback-form-prototype">
          <section class="prototype-detail-card">
            <h3><MessageSquareText :size="17" />反馈类型</h3>
            <div class="feedback-form-types">
              <button
                v-for="item in feedbackFormTypes"
                :key="item"
                :class="{ active: feedbackForm.type === item }"
                @click="feedbackForm.type = item"
              >
                {{ item }}
              </button>
            </div>
          </section>
          <section class="prototype-detail-card">
            <h3><ClipboardList :size="17" />反馈内容</h3>
            <label>
              请描述你遇到的问题或建议
              <textarea v-model="feedbackForm.content" class="input-field textarea" placeholder="例如：预约页面某个按钮无法点击，或希望增加某个功能入口..." rows="5"></textarea>
            </label>
          </section>
          <section class="prototype-detail-card">
            <h3><PhoneCall :size="17" />联系方式</h3>
            <label>
              手机号 / 邮箱（选填）
              <input v-model="feedbackForm.contact" class="input-field" placeholder="便于心理中心需要时与你确认" type="text" />
            </label>
          </section>
          <section class="feedback-form-privacy">
            <ShieldCheck :size="17" />
            <p>你提交的反馈仅用于系统体验改进和问题排查，不会公开展示。如涉及咨询内容，请优先联系心理中心老师。</p>
          </section>
          <button class="btn-main" @click="submitFeedbackForm">提交反馈</button>
        </div>
        <div v-else class="content-area proto-content signup-success-content feedback-form-success">
          <div class="success-icon green"><CheckCircle2 :size="52" /></div>
          <h2>反馈已提交</h2>
          <p>感谢你的建议，我们会持续优化安心心理服务体验。</p>
          <section class="success-summary-card">
            <div><span>反馈类型</span><strong>{{ feedbackForm.type }}</strong></div>
            <div><span>当前状态</span><strong class="warning">已记录</strong></div>
            <p>如需补充信息，可在个人中心再次提交意见反馈。</p>
          </section>
          <button class="btn-main" @click="finishFeedbackForm">返回个人中心</button>
        </div>
      </section>

      <section v-if="page === 'risk_assessment'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'home'"><ChevronLeft :size="26" /></button>
          <h1>心理状态自评</h1>
        </header>
        <div class="content-area proto-content risk-assessment-content">
          <div class="risk-intro-card">
            <h2>PHQ-9 抑郁筛查量表</h2>
            <p>在过去的两个星期里，你有多大程度受到以下问题的困扰？请根据您的真实感受作答。</p>
          </div>
          <div class="risk-question-list">
            <section v-for="question in riskQuestions" :key="question.id" class="risk-question">
              <p>{{ question.id }}. {{ question.text }}</p>
              <div class="risk-option-grid">
                <button
                  v-for="option in riskOptions"
                  :key="`${question.id}-${option.value}`"
                  :class="{ active: riskAnswers[question.id] === option.value }"
                  @click="riskAnswers[question.id] = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </section>
            <div class="risk-demo-note">--- 已展示前3道题，原型演示中 ---</div>
          </div>
          <button class="risk-submit-btn" @click="submitRisk">提交问卷</button>
        </div>
      </section>

      <section v-if="page === 'risk_result'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = 'home'"><ChevronLeft :size="26" /></button>
          <h1>评估结果</h1>
        </header>
        <div class="content-area proto-content risk-result-content">
          <section v-if="riskIsHigh" class="risk-warning">
            <span><AlertCircle :size="20" /></span>
            <div>
              <strong>你的评估结果提示需要关注</strong>
              <small>我们建议你优先联系心理中心获取专业支持</small>
            </div>
          </section>
          <div class="score-result-area">
            <div class="score-circle" :class="{ high: riskIsHigh }">
              <strong>{{ riskResultScore }}</strong>
              <span>总分 (0-27)</span>
            </div>
            <em :class="{ high: riskIsHigh }">{{ riskLevelText }}</em>
            <section class="result-advice-card" :class="{ high: riskIsHigh }">
              <h3>专业建议</h3>
              <p v-if="riskIsHigh">您的得分显示您近期可能正承受着较为明显的情绪困扰。请务必优先保障自身安全。</p>
              <p v-else>您的得分显示您近期可能正承受着一定程度的情绪困扰。这在大学生活中并不少见，可能是学业、人际或生活环境变化带来的挑战。</p>
              <p v-if="riskIsHigh">我们强烈建议您：<br />1. <strong>优先联系心理中心或紧急资源</strong>（见下方）；<br />2. 如有危急情况，请拨打 110 或前往最近医院急诊；<br />3. 在安全前提下，预约心理咨询师进行面对面评估。</p>
              <p v-else>我们建议您：<br />1. 尝试规律作息，保证充足睡眠；<br />2. 与信任的朋友或家人倾诉感受；<br />3. <strong>建议预约心理咨询师进一步评估</strong>，他们可以提供更专业的支持和指导。</p>
            </section>
            <section v-if="riskIsHigh" class="emergency-resource-card">
              <h3><PhoneCall :size="19" />紧急资源</h3>
              <div>
                <span><strong>学校心理中心热线</strong><b>010-8888-8888</b><small>24小时</small></span>
                <button><Phone :size="18" /></button>
              </div>
              <div>
                <span><strong>全国危机干预热线</strong><b>400-161-9995</b></span>
                <button><Phone :size="18" /></button>
              </div>
              <div class="emergency-actions">
                <button @click="page = 'emergency'">开启紧急帮助页</button>
                <button>一键联系</button>
              </div>
            </section>
            <div class="risk-result-actions">
              <button class="primary-block" @click="page = 'booking'">一键预约咨询师</button>
              <button class="secondary-block" @click="page = 'home'">回到首页</button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="page === 'consent'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>心理咨询知情同意书</h1>
        </header>
        <div class="content-area proto-content consent-content">
          <section>
            <h3>一、咨询服务说明</h3>
            <p>心理咨询是一个通过对话探讨个人困扰、促进自我成长的过程。咨询师将运用专业知识，协助您探索问题、缓解情绪、寻求应对策略。</p>
          </section>
          <section>
            <h3>二、保密原则与例外</h3>
            <p>咨询师对您的个人信息及咨询内容严格保密。但在以下特殊情况下，保密原则将不再适用：</p>
            <ul>
              <li>您有自伤或自杀的明确企图；</li>
              <li>您有伤害他人的明确企图；</li>
              <li>涉及未成年人遭受虐待或性侵犯；</li>
              <li>法律诉讼需要咨询师出庭作证。</li>
            </ul>
          </section>
          <section>
            <h3>三、咨询设置</h3>
            <p>常规咨询每次时长为 50 分钟，频率通常为每周一次。如需更改或取消预约，请至少提前 24 小时进行操作。</p>
          </section>
          <section>
            <h3>四、双方权利与义务</h3>
            <p>您有权随时提出终止咨询。咨询师有义务在咨询过程中保持专业伦理，并在必要时提供转介建议。</p>
          </section>
          <div class="consent-note">* 请认真阅读以上内容。点击“确认并同意”即表示您已充分理解并愿意遵守上述协议。</div>
          <button class="consent-submit" @click="goBack">确认并同意</button>
        </div>
      </section>

      <section v-if="page === 'privacy'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>隐私政策</h1>
        </header>
        <div class="content-area proto-content prototype-page-stack privacy-prototype">
          <section v-for="item in privacySections" :key="item.title" class="prototype-detail-card">
            <div class="privacy-title-row">
              <span :class="['mini-icon', item.tone]"><component :is="item.icon" :size="18" /></span>
              <h3>{{ item.title }}</h3>
            </div>
            <p>{{ item.content }}</p>
            <ul v-if="item.points">
              <li v-for="point in item.points" :key="point">{{ point }}</li>
            </ul>
          </section>
        </div>
      </section>

      <section v-if="page === 'referral'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="page = previousPage === 'messages' ? 'messages' : 'profile'"><ChevronLeft :size="26" /></button>
          <h1>转介通知</h1>
        </header>
        <div class="content-area proto-content has-tabbar referral-prototype">
          <section class="referral-notice-card">
            <div class="referral-card-head">
              <span><i :class="{ muted: referralAccepted }"></i>转介建议</span>
              <strong :class="referralAccepted ? 'accepted' : 'pending'">{{ referralAccepted ? '已确认' : '待处理' }}</strong>
            </div>
            <p class="referral-copy">
              您的原咨询师 <b>陈墨</b> 评估后认为，您目前的需求更适合由 <b>林晚晴</b> 提供支持。
            </p>
            <div class="referral-reason-box">
              <h4>转介原因</h4>
              <p>{{ referralReason }}</p>
            </div>
            <div class="referral-counselor-box">
              <h4>推荐新咨询师</h4>
              <div>
                <img :src="referralCounselor.avatar" alt="New Counselor" />
                <span>
                  <strong>{{ referralCounselor.name }}</strong>
                  <small>{{ referralCounselor.title }}</small>
                  <em>
                    <b v-for="tag in referralCounselor.tags" :key="tag">{{ tag }}</b>
                  </em>
                </span>
              </div>
            </div>
            <div v-if="!referralAccepted" class="referral-actions">
              <button class="btn-main" type="button" @click="confirmReferral">确认接受转介</button>
              <div>
                <button type="button" @click="openCounselor(referralCounselor.counselorId)">了解新咨询师</button>
                <button type="button" @click="showNotice('已保留联系原咨询师入口')">联系原咨询师</button>
              </div>
            </div>
            <div v-else class="referral-done">该转介已确认</div>
          </section>
          <h3 class="referral-history-title">历史记录</h3>
          <section class="referral-history-card">
            <div>
              <span>2026-03-12</span>
              <strong>{{ referralAccepted ? '已确认' : '待处理' }}</strong>
            </div>
            <p>从 陈墨 转介至 林晚晴</p>
          </section>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-inactive" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-active" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <section v-if="page === 'emergency'" class="student-prototype-page mobile-container">
        <div class="status-bar emergency-status">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header emergency-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>紧急帮助</h1>
        </header>
        <div class="content-area proto-content emergency-prototype">
          <section class="emergency-hero">
            <PhoneCall :size="50" />
            <h2>紧急帮助</h2>
            <p>你并不孤单，我们在这里等你</p>
          </section>
          <div class="emergency-card-stack">
            <section class="prototype-detail-card">
              <h3 class="danger-title"><PhoneCall :size="18" />24小时危机热线</h3>
              <a v-for="item in emergencyHotlines" :key="item.phone" :href="`tel:${item.phone}`" class="hotline-row">
                <span><strong>{{ item.name }}</strong><small>{{ item.phone }}</small></span>
                <Phone :size="20" />
              </a>
            </section>
            <section class="prototype-detail-card">
              <h3 class="orange-title"><AlertCircle :size="18" />立即行动</h3>
              <button class="emergency-action orange" @click="page = 'booking'"><strong>预约咨询师</strong><small>预约专业咨询师进行一对一心理辅导</small></button>
              <button class="emergency-action blue" @click="page = 'assessment_list'"><strong>心理健康自评</strong><small>3分钟快速了解你的心理状态</small></button>
            </section>
            <section class="prototype-detail-card">
              <h3><Info :size="18" />自我调节小贴士</h3>
              <p>做几次深呼吸，把注意力放在呼吸上</p>
              <p>联系信任的朋友或家人，说出你的感受</p>
              <p>如果感到安全受到威胁，请立即拨打110</p>
              <p>记住：求助是勇敢的表现，你值得被帮助</p>
            </section>
          </div>
        </div>
      </section>

      <section v-if="page === 'faq'" class="student-prototype-page mobile-container">
        <div class="status-bar">
          <span>09:41</span>
          <div class="status-icons"><Signal :size="12" /><Wifi :size="12" /><BatteryFull :size="13" /></div>
        </div>
        <header class="proto-page-header">
          <button class="proto-back" @click="goBack"><ChevronLeft :size="26" /></button>
          <h1>常见问题</h1>
        </header>
        <div class="proto-tabs article-tabs">
          <button v-for="item in faqCategories" :key="item" :class="{ active: activeFaqCategory === item }" @click="activeFaqCategory = item">{{ item }}</button>
        </div>
        <div class="content-area proto-content has-tabbar prototype-page-stack">
          <article v-for="(item, index) in filteredFaqs" :key="item.q" class="faq-card">
            <button @click="expandedFaqIndex = expandedFaqIndex === index ? -1 : index">
              <span>{{ item.q }}</span>
              <ChevronRight :class="{ open: expandedFaqIndex === index }" :size="18" />
            </button>
            <p v-if="expandedFaqIndex === index">{{ item.a }}</p>
          </article>
        </div>
        <nav class="prototype-tabbar">
          <button class="tab-active" @click="page = 'home'"><Home :size="25" /><span>首页</span></button>
          <button class="tab-inactive" @click="page = 'booking'"><CalendarClock :size="25" /><span>预约</span></button>
          <button class="tab-inactive" @click="page = 'articles'"><Newspaper :size="25" /><span>资讯</span></button>
          <button class="tab-inactive" @click="page = 'profile'"><UserRound :size="25" /><span>我的</span></button>
        </nav>
      </section>

      <div v-if="showStudentCancelModal" class="modal-overlay" @click="showStudentCancelModal = false">
        <div class="modal-card" @click.stop>
          <h3>确认取消预约？</h3>
          <p>取消后该时段将释放给其他同学，请确认是否继续。</p>
          <div class="modal-actions">
            <button class="btn-second full" @click="showStudentCancelModal = false">暂不取消</button>
            <button class="btn-warning" data-testid="student-confirm-cancel" @click="confirmCancelAppointment">确认取消</button>
          </div>
        </div>
      </div>

      <nav v-if="showTabbar" class="tabbar">
        <button v-for="item in tabs" :key="item.key" :class="{ active: page === item.key }" @click="page = item.key">
          <component :is="item.icon" :size="23" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  AlertCircle,
  ArrowLeftRight,
  BatteryFull,
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DoorOpen,
  Eye,
  GraduationCap,
  HeartPulse,
  History,
  Home,
  Info,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  Signal,
  Smile,
  Star,
  StarHalf,
  UserRound,
  UsersRound,
  Video,
  Wifi
} from "lucide-vue-next";
import { createApiClient } from "@anxin/api-client";

const api = createApiClient({ storageKey: "anxin_student_token" });

const statusLabels = {
  pending: "待确认",
  confirmed: "已确认",
  in_progress: "咨询中",
  completed: "已完成",
  cancelled: "已取消",
  rejected: "已拒绝",
  no_show: "未到"
};
const riskLabels = { low: "低风险", medium: "中风险", high: "高风险", crisis: "危机风险" };
const processLabels = { open: "待处理", following: "跟进中", handled: "已处理", closed: "已结案" };

const me = ref(null);
const mustChangePassword = ref(false);
const page = ref("home");
const previousPage = ref("home");
const loading = ref(false);
const error = ref("");
const notice = ref("");
const keyword = ref("");
const appointmentFilter = ref("all");
const selectedAppointmentId = ref("");
const showStudentCancelModal = ref(false);
const rescheduleSubmitted = ref(false);
const selectedCounselor = ref(null);
const createdAppointment = ref(null);
const home = ref({ recommendedCounselors: [], activities: [] });
const counselors = ref([]);
const appointments = ref([]);
const articles = ref([]);
const activities = ref([]);
const messages = ref([]);
const riskRecords = ref([]);
const riskScore = ref(22);
const riskAnswers = reactive({ 1: null, 2: null, 3: null });
const assessmentAnswers = reactive({});
const currentQuizIndex = ref(0);
const selectedArticle = ref(null);
const selectedActivity = ref(null);
const selectedMessage = ref(null);
const activityFilter = ref("全部");
const activeArticleCategory = ref("全部");
const assessmentHistoryFilter = ref("全部");
const activeMyActivityTab = ref("已报名");
const activeFaqCategory = ref("基础问题");
const expandedFaqIndex = ref(0);
const feedbackSubmitted = ref(false);
const feedbackFormSubmitted = ref(false);
const lastRiskResult = ref(null);
const referralAccepted = ref(false);
const referralReason = ref("学生需求超出本人擅长领域，建议由更擅长学业焦虑和深度干预方向的咨询师继续支持。");
const feedbackForm = reactive({
  type: "系统问题",
  content: "",
  contact: ""
});
const profileEdit = reactive({
  department: "计算机学院",
  grade: "2023级",
  campus: "校本部",
  phone: "138****5678",
  email: "liming@example.com",
  wechat: "liming_psy"
});

const loginForm = reactive({ studentNo: "", password: "" });
const passwordForm = reactive({ oldPassword: "", newPassword: "", confirmPassword: "" });
const policyAccepted = ref(false);
const booking = reactive({
  scheduleId: "",
  type: "首次咨询",
  method: "线下咨询",
  contactPhone: "",
  concern: "",
  consentAccepted: false
});
const rescheduleForm = reactive({
  date: "",
  time: "",
  reason: "",
  acceptRecommend: "no"
});

const prototypeBannerImage = "";
const prototypeArticleImage = "";
const referralCounselor = {
  counselorId: "proto-lin",
  name: "林晚晴",
  title: "资深专家 · 12年经验",
  avatar: "",
  tags: ["学业焦虑", "深度干预"]
};
const homeCategories = [
  { label: "心理科普", icon: BookOpen, tone: "blue", target: "articles" },
  { label: "情绪调节", icon: Smile, tone: "orange", target: "articles" },
  { label: "人际关系", icon: UsersRound, tone: "green", target: "articles" },
  { label: "学业压力", icon: GraduationCap, tone: "purple", target: "articles" }
];
const prototypeHomeActivity = {
  id: "prototype-activity",
  title: "「正念减压团体」",
  timeText: "7月20日 14:00 · 心理中心",
  statusText: "进行中",
  seatsText: "剩余 8/30人",
  raw: null
};
const prototypeHomeArticles = [
  { id: "prototype-article-1", title: "如何在期末考试前有效缓解过度压力？", author: "心理教研室", views: "2.5k", cover: prototypeArticleImage, raw: null },
  { id: "prototype-article-2", title: "大学生社交恐惧：学会与孤独和解", author: "成长中心", views: "1.8k", cover: prototypeArticleImage, raw: null },
  { id: "prototype-article-3", title: "深夜emo了怎么办？这几招帮你快速调节", author: "情绪实验室", views: "3.2k", cover: prototypeArticleImage, raw: null }
];
const prototypeCounselorAvatar = "";
const prototypeCounselorDetailAvatar = "";
const prototypeAppointmentAvatar = "";
const prototypeCounselorCards = [
  {
    id: "proto-lin",
    name: "林晚晴",
    title: "高级心理咨询师 | 8年经验",
    subtitle: "心理中心专职咨询师 · 高级",
    titleLine: "高级心理咨询师 | 擅长情绪管理",
    rating: "4.9",
    nextSlot: "明天 14:00",
    avatarImage: prototypeCounselorAvatar,
    detailAvatarImage: prototypeCounselorDetailAvatar,
    campus: { name: "主校区" },
    room: { name: "咨询室A", fullName: "心理中心 咨询室A" },
    years: "8年",
    approach: "认知行为疗法",
    specialties: ["抑郁缓解", "压力管理", "正念冥想", "自我成长"],
    tagTone: "blue",
    introduction: "国家二级心理咨询师，认知行为疗法（CBT）取向。毕业于北京师范大学心理学专业，从业8年，累计咨询时长超过3000小时。擅长处理大学生常见的情绪困扰、人际关系冲突、学业压力和自我探索议题。风格温和接纳，注重帮助学生发现自身的资源和力量。",
    schedules: [
      { id: "slot-0900", startAt: "2026-07-15T09:00:00+08:00", timeText: "09:00 - 09:50", confirmText: "2025年7月15日 14:00" },
      { id: "slot-1000", startAt: "2026-07-15T10:00:00+08:00", timeText: "10:00 - 10:50" },
      { id: "slot-1400", startAt: "2026-07-15T14:00:00+08:00", timeText: "14:00 - 14:50", disabled: true },
      { id: "slot-1530", startAt: "2026-07-15T15:00:00+08:00", timeText: "15:00 - 15:50" }
    ]
  },
  {
    id: "proto-chen",
    name: "陈墨",
    title: "资深青少年心理专家 | 12年经验",
    subtitle: "心理中心专职咨询师 · 资深",
    titleLine: "资深青少年心理专家 | 擅长人际关系",
    rating: "5.0",
    nextSlot: "周五 09:30",
    avatarImage: prototypeCounselorAvatar,
    detailAvatarImage: prototypeCounselorDetailAvatar,
    campus: { name: "主校区" },
    room: { name: "咨询室B", fullName: "心理中心 咨询室B" },
    years: "12年",
    approach: "家庭系统与叙事疗法",
    specialties: ["人际冲突", "亲子关系", "职业规划", "关系修复"],
    tagTone: "green",
    introduction: "擅长陪伴学生处理人际冲突、亲子关系和职业规划中的压力，咨询风格稳定、清晰并注重行动支持。",
    schedules: [
      { id: "chen-0930", startAt: "2026-07-18T09:30:00+08:00", timeText: "09:30 - 10:20", confirmText: "2025年7月18日 09:30" },
      { id: "chen-1430", startAt: "2026-07-18T14:30:00+08:00", timeText: "14:30 - 15:20" }
    ]
  },
  {
    id: "proto-wang",
    name: "王小曼",
    title: "注册心理咨询师 | 5年经验",
    subtitle: "心理中心专职咨询师 · 注册",
    titleLine: "注册心理咨询师 | 擅长学业焦虑",
    rating: "4.8",
    nextSlot: "下周一 15:00",
    avatarImage: prototypeCounselorAvatar,
    detailAvatarImage: prototypeCounselorDetailAvatar,
    campus: { name: "主校区" },
    room: { name: "咨询室C", fullName: "心理中心 咨询室C" },
    years: "5年",
    approach: "接纳承诺疗法",
    specialties: ["学业焦虑", "自我认同", "压力管理"],
    tagTone: "purple",
    introduction: "关注大学生学业焦虑、自我认同与成长困扰，善于使用温和的提问帮助学生建立稳定感。",
    schedules: [
      { id: "wang-1500", startAt: "2026-07-21T15:00:00+08:00", timeText: "15:00 - 15:50", confirmText: "2025年7月21日 15:00" }
    ]
  }
];
const prototypeDateOptions = [
  { date: "7/15", week: "周一", active: true },
  { date: "7/16", week: "周二" },
  { date: "7/17", week: "周三" },
  { date: "7/18", week: "周四" },
  { date: "7/19", week: "周五" },
  { date: "7/20", week: "周六" },
  { date: "7/21", week: "周日" }
];
const bookingDateOptions = [
  { week: "周一", day: "28", active: true },
  { week: "周二", day: "29" },
  { week: "周三", day: "30" },
  { week: "周四", day: "31" },
  { week: "周五", day: "01" }
];
const prototypeTimeOptions = [
  { id: "slot-0900", label: "09:00-10:00" },
  { id: "slot-1000", label: "10:30-11:30" },
  { id: "slot-1400", label: "14:00-15:00", disabled: true },
  { id: "slot-1530", label: "15:30-16:30" },
  { id: "slot-1700", label: "17:00-18:00" },
  { id: "slot-1930", label: "19:30-20:30" }
];
const rescheduleDateOptions = [
  { value: "2025-07-18", label: "2025年7月18日（周五）" },
  { value: "2025-07-21", label: "2025年7月21日（周一）" },
  { value: "2025-07-22", label: "2025年7月22日（周二）" },
  { value: "2025-07-23", label: "2025年7月23日（周三）" },
  { value: "2025-07-24", label: "2025年7月24日（周四）" },
  { value: "2025-07-25", label: "2025年7月25日（周五）" }
];
const rescheduleTimeOptions = ["09:00 - 09:50", "10:00 - 10:50", "14:00 - 14:50", "15:00 - 15:50", "16:00 - 16:50"];
const bookingSteps = [{ label: "选类型" }, { label: "选时间" }, { label: "填表单" }, { label: "确认" }, { label: "完成" }];
const prototypeAppointments = [
  {
    id: "proto-appt-1",
    status: "pending",
    counselor: { name: "林晚晴", title: "心理中心专职咨询师" },
    counselorName: "林晚晴",
    method: "线下咨询",
    avatarImage: prototypeAppointmentAvatar,
    schedule: { startAt: "2026-05-28T09:00:00+08:00" },
    room: { name: "心理中心 302 咨询室" },
    timeText: "2026-05-28 09:00 - 10:00",
    locationText: "心理中心 302 咨询室",
    concern: "最近两周持续失眠，情绪低落，对学习提不起兴趣",
    submitTime: "2025-07-14 10:30",
    riskLevel: "低"
  },
  {
    id: "proto-appt-2",
    status: "confirmed",
    counselor: { name: "陈墨", title: "心理中心专职咨询师" },
    counselorName: "陈墨",
    method: "线上视频",
    avatarImage: prototypeAppointmentAvatar,
    schedule: { startAt: "2026-05-25T14:00:00+08:00" },
    timeText: "2026-05-25 14:00 - 15:00",
    locationText: "视频链接将在咨询前10分钟开启",
    concern: "希望梳理近期人际关系压力",
    submitTime: "2025-07-12 09:10",
    riskLevel: "低"
  },
  {
    id: "proto-appt-3",
    status: "completed",
    counselor: { name: "王小曼", title: "心理中心专职咨询师" },
    counselorName: "王小曼",
    method: "线下咨询",
    avatarImage: prototypeAppointmentAvatar,
    schedule: { startAt: "2026-05-20T10:00:00+08:00" },
    timeText: "2026-05-20 10:00 - 11:00",
    locationText: "心理中心 302 咨询室",
    concern: "学业压力与自我认同困扰",
    submitTime: "2025-07-06 16:45",
    riskLevel: "低"
  }
];
const riskQuestions = [
  { id: 1, text: "做事时提不起劲或没有兴趣？" },
  { id: 2, text: "感到心情低落、沮丧或绝望？" },
  { id: 3, text: "入睡困难、睡得不稳或睡得太多？" }
];
const riskOptions = [
  { label: "完全不会", value: 0 },
  { label: "好几天", value: 1 },
  { label: "超过一半", value: 2 },
  { label: "几乎每天", value: 3 }
];
const prototypeAssessments = [
  { title: "PHQ-9 抑郁筛查量表", meta: "9道题 · 约3分钟", desc: "评估过去两周的情绪状态，了解抑郁倾向程度", tags: ["情绪", "抑郁"], tone: "blue", icon: ClipboardList },
  { title: "GAD-7 焦虑筛查量表", meta: "7道题 · 约2分钟", desc: "评估过去两周的焦虑症状，了解焦虑水平", tags: ["焦虑", "压力"], tone: "orange", icon: HeartPulse },
  { title: "心理状态综合评估", meta: "20道题 · 约5分钟", desc: "全面评估心理健康状况，包含情绪、压力、社交等多维度", tags: ["综合", "全面"], tone: "purple", icon: Smile }
];
const assessmentOptions = [
  { label: "完全不会", value: 0 },
  { label: "好几天", value: 1 },
  { label: "超过一半", value: 2 },
  { label: "几乎每天", value: 3 }
];
const prototypeQuizQuestions = [
  { text: "做事时提不起劲或没有兴趣？" },
  { text: "感到心情低落、沮丧或绝望？" },
  { text: "入睡困难、睡得不稳或睡得太多？" },
  { text: "感觉疲倦或没有活力？" },
  { text: "食欲不振或吃太多？" },
  { text: "对自己感到失望，或觉得自己让家人失望？" },
  { text: "注意力难以集中，例如阅读报纸或看电视时？" },
  { text: "动作或说话速度变得迟缓，或恰好相反变得坐立不安？" },
  { text: "有过伤害自己甚至结束生命的念头？" }
];
const prototypeAssessmentHistory = [
  { title: "PHQ-9 抑郁筛查量表", date: "2025-07-15", score: 12, level: "轻度至中度", desc: "建议预约咨询师进一步评估" },
  { title: "GAD-7 焦虑筛查量表", date: "2025-06-22", score: 7, level: "轻度焦虑", desc: "建议保持规律作息并持续观察" }
];
const articleCategories = ["全部", "情绪管理", "人际社交", "学业心理", "自我成长"];
const prototypeArticles = [
  { id: "proto-article-a", title: "大学生社交恐惧：学会与孤独和解", author: "成长中心", category: "自我成长", views: "1.8k", cover: "" },
  { id: "proto-article-b", title: "深夜emo了怎么办？这几招帮你快速调节", author: "情绪实验室", category: "情绪管理", views: "3.2k", cover: "" },
  { id: "proto-article-c", title: "建立健康人际关系的五个核心原则", author: "人际关系组", category: "人际社交", views: "1.2k", cover: "" },
  { id: "proto-article-d", title: "正念入门：每天10分钟改变你的大脑", author: "正念研究组", category: "学业心理", views: "3.8k", cover: "" }
];
const activityCategories = ["全部", "团体活动", "讲座沙龙", "工作坊", "主题活动"];
const prototypeActivities = [
  { id: "proto-act-1", title: "「正念减压团体」", category: "团体活动", time: "2025年7月20日 14:00", detailTime: "2025年7月20日 14:00 - 16:00", location: "心理中心活动室", locationDetail: "心理中心活动室（校本部）", seats: "剩余 8/30人", tone: "blue" },
  { id: "proto-act-2", title: "「考前焦虑应对讲座」", category: "讲座沙龙", time: "2025年7月18日 15:00", detailTime: "2025年7月18日 15:00 - 16:30", location: "心理中心活动室", locationDetail: "心理中心活动室（校本部）", seats: "剩余 15/50人", tone: "green" },
  { id: "proto-act-3", title: "「人际关系成长工作坊」", category: "工作坊", time: "2025年7月25日 09:00", detailTime: "2025年7月25日 09:00 - 11:00", location: "团体活动室", locationDetail: "团体活动室", seats: "剩余 12/20人", tone: "purple" }
];
const myActivityTabs = ["已报名", "待参加", "已结束", "已取消"];
const prototypeMyActivities = [
  { title: "正念减压团体", category: "团体活动", time: "2025年7月25日 14:00", location: "心理健康中心·团体室", status: "已报名", tone: "blue" },
  { title: "考前焦虑应对讲座", category: "讲座沙龙", time: "2025年7月18日 15:00", location: "心理中心活动室", status: "待参加", tone: "green" },
  { title: "人际关系成长工作坊", category: "工作坊", time: "2025年6月20日 09:00", location: "团体活动室", status: "已结束", tone: "purple" }
];
const prototypeMessages = [
  { title: "预约确认通知", summary: "您的预约已被咨询师林晚晴确认", content: "您的预约已获得咨询师林晚晴的确认。请按时前往心理中心进行咨询。", timeText: "10:30", dateText: "2025年7月14日 10:30", tone: "blue", icon: CalendarClock },
  { title: "林晚晴老师留言", summary: "同学你好，我已收到你的预约申请", content: "同学你好，我已收到你的预约申请，请在咨询前保持手机畅通。", timeText: "昨天", dateText: "2025年7月13日 18:20", tone: "green", icon: MessageCircle },
  { title: "转介通知", summary: "咨询师陈墨将您的个案转介给林晚晴", content: "为了让你获得更匹配的支持，原咨询师已建议转介至林晚晴老师。", timeText: "3天前", dateText: "2025年7月11日 09:00", tone: "purple", icon: ArrowLeftRight },
  { title: "系统通知", summary: "欢迎使用安心心理学生端", content: "欢迎使用安心心理学生端，你可以在这里预约咨询、查看资讯和参与活动。", timeText: "5天前", dateText: "2025年7月9日 08:00", tone: "gray", icon: Bell, read: true }
];
const profileMenuTop = [
  { label: "编辑资料", desc: "完善院系、校区和联系方式", target: "profile_edit", tone: "blue", icon: UserRound },
  { label: "预约规则", desc: "查看预约、取消、改期与爽约说明", target: "booking_rules", tone: "yellow", icon: ClipboardList },
  { label: "我的预约", desc: "查看和管理预约记录", target: "appointments", tone: "blue", icon: CalendarClock },
  { label: "测评历史", desc: "查看心理测评记录和结果", target: "assessment_history", tone: "orange", icon: ClipboardList },
  { label: "我的活动", desc: "查看已报名的心理活动", target: "my_activities", tone: "green", icon: CheckCircle2 },
  { label: "消息中心", desc: "查看通知和咨询师留言", target: "messages", tone: "green", icon: Bell },
  { label: "转介通知", desc: "查看咨询师转介建议", target: "referral", tone: "purple", icon: ArrowLeftRight },
  { label: "常见问题", desc: "查看FAQ了解心理咨询", target: "faq", tone: "purple", icon: MessageCircle },
  { label: "隐私政策", desc: "了解个人信息保护", target: "privacy", tone: "yellow", icon: ShieldCheck },
  { label: "意见反馈", desc: "提交系统问题和使用建议", target: "feedback_form", tone: "orange", icon: MessageSquareText }
];
const privacySections = [
  { title: "1. 信息收集", tone: "blue", icon: BookOpen, content: "我们收集的个人信息类型包括：学号、姓名、院系、年级、联系方式等基本信息，以及咨询预约时您主动填写的咨询诉求、主诉内容等相关信息。" },
  { title: "2. 信息使用", tone: "green", icon: Info, content: "您的个人信息仅用于心理健康服务目的，包括预约安排、咨询记录、风险评估和后续跟进。" },
  { title: "3. 信息保护", tone: "yellow", icon: ShieldCheck, content: "所有个人信息和咨询记录均采用加密存储，仅授权人员（你的咨询师及心理中心管理人员）可访问。" },
  { title: "4. 保密原则", tone: "purple", icon: ShieldCheck, content: "咨询内容严格保密，未经您的书面同意，不会向任何第三方披露。", points: ["您有伤害自己或他人的紧急风险", "法律法规要求披露", "存在严重公共卫生安全风险"] },
  { title: "5. 用户权利", tone: "red", icon: UserRound, content: "你可以查看个人信息和咨询记录；如需删除账号或撤回授权，请联系心理中心办理。" }
];
const emergencyHotlines = [
  { name: "全国心理援助热线", phone: "400-161-9995" },
  { name: "北京心理危机干预中心", phone: "010-8295-1332" },
  { name: "青少年心理服务热线", phone: "12355" }
];
const faqCategories = ["基础问题", "预约相关", "隐私相关"];
const prototypeFaqs = [
  { category: "基础问题", q: "心理咨询一般需要多长时间？", a: "常规咨询每次 50 分钟，每周一次。一般 4-6 次为一个短程咨询周期，具体情况视个人需求而定。" },
  { category: "预约相关", q: "如何取消或改期预约？", a: "在我的预约页面找到对应预约，点击取消预约或申请改期按钮。请至少提前24小时操作。" },
  { category: "基础问题", q: "心理咨询需要收费吗？", a: "在校学生首次咨询免费，后续咨询按学校规定收取一定费用。具体请咨询心理中心。" },
  { category: "隐私相关", q: "咨询内容会被保密吗？", a: "是的，咨询内容严格保密。只有在涉及自伤、伤人风险或法律要求等特殊情况下才会突破保密原则。" },
  { category: "预约相关", q: "线上视频咨询怎么进行？", a: "预约成功后，在预约时间前10分钟，你可以在我的预约页面找到进入视频按钮，点击即可开始视频咨询。" }
];
const assessmentHistoryFilters = ["全部", "近一月", "近三月", "高风险"];
const feedbackTags = ["专业耐心", "很有帮助", "环境舒适", "沟通流畅", "建议实用"];
const feedbackFormTypes = ["系统问题", "体验建议", "数据错误", "其他"];

const bookingRuleSteps = ["选择咨询师和时段", "填写预约表单", "完成风险筛查", "阅读知情同意书", "确认提交", "等待咨询师确认"];
const bookingRuleCards = [
  { title: "取消与改期", tone: "orange", icon: CalendarClock, lines: ["已提交但未确认的预约：学生可随时取消", "已确认的预约：需在预约开始前24小时取消，否则记爽约", "改期申请：在预约详情页提交改期申请，等待咨询师确认"] },
  { title: "爽约说明", tone: "red", icon: AlertCircle, lines: ["累计爽约2次：暂停预约权限30天", "累计爽约3次：本学期不可预约", "如有特殊情况，请联系心理健康中心说明"] },
  { title: "隐私保护", tone: "purple", icon: ShieldCheck, lines: ["咨询内容严格保密，签署知情同意书", "特殊情况（自伤、伤人风险等）依法通知相关人员", "测评结果仅用于咨询参考，不记入个人档案"] }
];
const similarCounselors = [];

const tabs = [
  { key: "home", label: "首页", icon: Home },
  { key: "booking", label: "预约", icon: CalendarClock },
  { key: "articles", label: "资讯", icon: BookOpen },
  { key: "profile", label: "我的", icon: UserRound }
];
const appointmentFilters = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "confirmed", label: "已确认" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" }
];

const pageTitles = {
  announcement_detail: "公告详情",
  booking_rules: "预约规则",
  similar_counselors: "相似咨询师推荐",
  profile_edit: "编辑个人资料",
  booking: "预约咨询",
  counselor_detail: "咨询师详情",
  appointment_form: "预约申请",
  booking_confirm: "预约确认",
  booking_success: "预约成功",
  appointments: "我的预约",
  appointment_detail: "预约详情",
  reschedule: "预约改期申请",
  profile: "个人中心",
  articles: "心理资讯",
  article_detail: "资讯详情",
  activities: "心理活动",
  activity_detail: "活动详情",
  messages: "消息中心",
  message_detail: "消息详情",
  assessment_list: "心理测评",
  assessment_quiz: "心理测评",
  assessment_result: "测评结果",
  assessment_history: "测评历史",
  risk_assessment: "风险筛查",
  risk_result: "筛查结果",
  privacy: "隐私协议",
  consent: "知情同意",
  activity_signup: "活动报名",
  activity_signup_success: "报名成功",
  my_activities: "我的活动",
  feedback: "咨询评价",
  feedback_form: "意见反馈",
  referral: "转介申请",
  emergency: "紧急帮助",
  faq: "常见问题"
};

const prototypePageKeys = new Set([
  "announcement_detail",
  "booking_rules",
  "similar_counselors",
  "profile_edit",
  "booking",
  "counselor_detail",
  "appointment_form",
  "booking_confirm",
  "booking_success",
  "appointments",
  "appointment_detail",
  "reschedule",
  "risk_assessment",
  "risk_result",
  "consent",
  "profile",
  "articles",
  "article_detail",
  "activities",
  "activity_detail",
  "activity_signup",
  "activity_signup_success",
  "messages",
  "message_detail",
  "assessment_list",
  "assessment_quiz",
  "assessment_result",
  "assessment_history",
  "my_activities",
  "privacy",
  "emergency",
  "faq",
  "feedback",
  "feedback_form",
  "referral"
]);
const pageTitle = computed(() => pageTitles[page.value] || "安心心理");
const showTopbar = computed(() => page.value !== "home" && !prototypePageKeys.has(page.value));
const showTabbar = computed(() => !prototypePageKeys.has(page.value) && ["articles", "activities", "profile", "messages"].includes(page.value));
const studentName = computed(() => me.value?.name || me.value?.user?.name || "同学");
const homeCounselors = computed(() => home.value.recommendedCounselors?.length ? home.value.recommendedCounselors : counselors.value.slice(0, 4));
const homeActivities = computed(() => home.value.activities?.length ? home.value.activities : activities.value.slice(0, 3));
function normalizeCounselorCard(item) {
  const specialties = Array.isArray(item.specialties) ? item.specialties : [];
  const nextSchedule = item.schedules?.find((slot) => !slot.status || slot.status === "available") || item.schedules?.[0];
  return {
    ...item,
    avatarImage: item.avatar || "",
    detailAvatarImage: item.avatar || "",
    subtitle: item.title || "心理中心咨询师",
    titleLine: `${item.title || "心理中心咨询师"}${specialties[0] ? ` | 擅长${specialties[0]}` : ""}`,
    rating: item.rating || "-",
    nextSlot: nextSchedule ? formatDateTime(nextSchedule.startAt) : "暂无可约时段",
    tagTone: "blue",
    room: nextSchedule?.room || item.room,
    schedules: (item.schedules || []).map((slot) => ({
      ...slot,
      disabled: slot.status && slot.status !== "available",
      timeText: slot.timeText || formatDateTime(slot.startAt)
    }))
  };
}

function normalizeAppointmentCard(item) {
  return {
    ...item,
    counselorName: item.counselor?.name || item.counselorName || "-",
    avatarImage: item.avatarImage || "",
    method: item.method || (item.room?.name?.includes("视频") ? "线上视频" : "线下咨询"),
    timeText: item.timeText || formatDateTime(item.schedule?.startAt),
    locationText: item.locationText || item.room?.name || "-",
    submitTime: item.submitTime || formatDateTime(item.createdAt),
    riskLevel: item.riskLevel || "未筛查"
  };
}

function normalizeArticleCard(item) {
  return {
    ...item,
    author: item.author || (item.authorRole === "admin" ? "心理中心" : "咨询师"),
    views: item.views || "0",
    cover: item.cover || prototypeArticleImage
  };
}

function normalizeActivityCard(item) {
  const signupCount = item.signups?.length || item.signupCount || 0;
  const capacity = item.capacity || 0;
  return {
    ...item,
    category: item.category || "活动",
    time: item.time || formatDateTime(item.startAt),
    detailTime: item.detailTime || `${formatDateTime(item.startAt)} - ${formatDateTime(item.endAt)}`,
    location: item.location || "-",
    locationDetail: item.location || "-",
    seats: capacity ? `剩余 ${Math.max(0, capacity - signupCount)}/${capacity}人` : "暂无名额信息",
    tone: item.tone || "blue"
  };
}

function normalizeMessageCard(item) {
  return {
    ...item,
    summary: item.summary || item.content || "",
    content: item.content || item.summary || "",
    timeText: item.timeText || formatDateTime(item.createdAt),
    dateText: item.dateText || formatDateTime(item.createdAt),
    tone: item.tone || "blue",
    icon: item.icon || Bell,
    read: Boolean(item.readAt || item.read)
  };
}

const homeActivityCard = computed(() => {
  const first = activities.value[0];
  if (!first) return null;
  const normalized = normalizeActivityCard(first);
  return { ...normalized, raw: first, statusText: statusLabels[first.status] || first.status || "活动", seatsText: normalized.seats, timeText: normalized.time };
});
const homeArticleCards = computed(() => articles.value.slice(0, 3).map((item) => ({ ...normalizeArticleCard(item), raw: item })));
const activityFilters = ["全部", "团体活动", "讲座沙龙", "工作坊", "主题活动"];
const visibleCounselors = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  const source = counselors.value.map(normalizeCounselorCard);
  if (!text) return source;
  return source.filter((item) => [item.name, item.title, item.introduction, item.campus?.name, ...(item.specialties || [])].join(" ").toLowerCase().includes(text));
});
const filteredCounselors = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return counselors.value;
  return counselors.value.filter((item) => [item.name, item.title, item.introduction, item.campus?.name, ...(item.specialties || [])].join(" ").toLowerCase().includes(text));
});
const filteredActivities = computed(() => {
  if (activityFilter.value === "全部") return activities.value;
  return activities.value.filter((item) => (item.category || "").includes(activityFilter.value));
});
const filteredAppointments = computed(() => {
  if (appointmentFilter.value === "all") return appointments.value;
  return appointments.value.filter((item) => item.status === appointmentFilter.value);
});
const visibleAppointments = computed(() => {
  const baseSource = appointments.value;
  const base = createdAppointment.value ? [createdAppointment.value, ...baseSource.filter((item) => item.id !== createdAppointment.value.id)] : baseSource;
  const normalized = base.map(normalizeAppointmentCard);
  if (appointmentFilter.value === "all") return normalized;
  return normalized.filter((item) => item.status === appointmentFilter.value);
});
const allVisibleAppointments = computed(() => {
  const baseSource = appointments.value;
  const base = createdAppointment.value ? [createdAppointment.value, ...baseSource.filter((item) => item.id !== createdAppointment.value.id)] : baseSource;
  return base.map(normalizeAppointmentCard);
});
const currentAppointment = computed(() => allVisibleAppointments.value.find((item) => item.id === selectedAppointmentId.value) || allVisibleAppointments.value[0]);
const selectedSlot = computed(() => selectedCounselor.value?.schedules?.find((item) => item.id === booking.scheduleId));
const completedCount = computed(() => appointments.value.filter((item) => item.status === "completed").length);
const currentQuizQuestion = computed(() => prototypeQuizQuestions[currentQuizIndex.value] || prototypeQuizQuestions[0]);
const quizProgressLabel = computed(() => `${currentQuizIndex.value + 1}/${prototypeQuizQuestions.length}`);
const quizProgressPercent = computed(() => `${Math.round(((currentQuizIndex.value + 1) / prototypeQuizQuestions.length) * 100)}%`);
const filteredPrototypeArticles = computed(() => {
  const source = articles.value.map(normalizeArticleCard);
  if (activeArticleCategory.value === "全部") return source;
  return source.filter((item) => item.category === activeArticleCategory.value);
});
const currentArticle = computed(() => selectedArticle.value || filteredPrototypeArticles.value[0] || {});
const visiblePrototypeActivities = computed(() => {
  const source = activities.value.map(normalizeActivityCard);
  if (activityFilter.value === "全部") return source;
  return source.filter((item) => item.category === activityFilter.value);
});
const currentActivity = computed(() => selectedActivity.value || visiblePrototypeActivities.value[0] || {});
const visibleMessages = computed(() => messages.value.map(normalizeMessageCard));
const currentMessage = computed(() => selectedMessage.value || visibleMessages.value[0] || {});
const filteredMyActivities = computed(() => []);
const filteredFaqs = computed(() => prototypeFaqs.filter((item) => item.category === activeFaqCategory.value));
const riskResultScore = computed(() => Number(lastRiskResult.value?.score ?? riskScore.value));
const riskResultClass = computed(() => (riskResultScore.value >= 20 ? "danger" : riskResultScore.value >= 10 ? "warning" : "completed"));
const riskResultTitle = computed(() => (riskResultScore.value >= 20 ? "需要立即关注" : riskResultScore.value >= 10 ? "建议持续观察" : "当前风险较低"));
const riskResultText = computed(() => `本次筛查分数为 ${riskResultScore.value} 分，请结合近两周实际状态理解结果。`);
const riskIsHigh = computed(() => riskResultScore.value >= 20);
const riskLevelText = computed(() => (riskIsHigh.value ? "高风险倾向" : "中度抑郁倾向"));
const appointmentStatusMeta = computed(() => {
  const status = currentAppointment.value?.status || "pending";
  return {
    pending: { title: "正在等待老师确认", desc: "请耐心等待，确认结果将通过消息通知你", rule: "" },
    confirmed: { title: "预约已确认", desc: "请按时前往咨询地点，咨询前请提前5分钟签到", rule: "咨询前10分钟可进入视频或查看签到信息" },
    completed: { title: "咨询已完成", desc: "希望你感觉好一些。如果需要，可以随时再次预约。", rule: "" },
    cancelled: { title: "预约已取消", desc: "该时段已释放，如需支持可重新预约咨询。", rule: "" },
    rejected: { title: "预约未通过", desc: "该时段可能已被占用，请重新选择时间。", rule: "" }
  }[status] || { title: statusLabels[status] || "预约状态", desc: statusHint(status), rule: "" };
});
const appointmentDetailData = computed(() => {
  const item = currentAppointment.value || {};
  return {
    counselorAvatar: (item.counselor?.name || item.counselorName || "-").slice(0, 1),
    counselorName: item.counselor?.name || item.counselorName || "-",
    counselorTitle: item.counselor?.title || "心理中心咨询师",
    consultType: item.type || "-",
    time: item.timeText || formatDateTime(item.schedule?.startAt),
    location: item.locationText || item.room?.name || "-",
    method: item.method || "-",
    submitTime: item.submitTime || formatDateTime(item.createdAt),
    issue: item.concern || "-",
    riskLevel: item.riskLevel || "未筛查"
  };
});
const faqs = [
  { q: "预约后多久会确认？", a: "咨询师通常会在工作时间内处理预约，确认结果会同步到消息中心。" },
  { q: "咨询内容会保密吗？", a: "平台遵循保密原则，涉及生命安全、重大风险等情形会按规范启动保护流程。" },
  { q: "可以取消预约吗？", a: "已提交或已确认的预约可在详情页取消，建议尽量提前操作。" }
];

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function statusHint(status) {
  return {
    pending: "请耐心等待，确认结果将通过消息通知你",
    confirmed: "预约已确认，请按时前往咨询地点",
    in_progress: "咨询正在进行中",
    completed: "本次咨询已完成，欢迎提交反馈",
    cancelled: "该预约已取消",
    rejected: "该预约未通过，请重新选择时间",
    no_show: "该预约被标记为未到"
  }[status] || "预约状态已更新";
}

function statusTagClass(status) {
  return `status-tag ${status || "pending"}`;
}

function showNotice(text) {
  notice.value = text;
  window.setTimeout(() => { notice.value = ""; }, 2600);
}

async function guard(action) {
  loading.value = true;
  error.value = "";
  try {
    return await action();
  } catch (err) {
    error.value = err.message || "操作失败";
    return null;
  } finally {
    loading.value = false;
  }
}

async function login() {
  if (!policyAccepted.value) {
    error.value = "请先阅读并同意隐私政策和服务协议";
    return;
  }
  await guard(async () => {
    const data = await api.loginStudent({ ...loginForm, policyAccepted: true });
    me.value = data.user;
    mustChangePassword.value = Boolean(data.mustChangePassword || data.user?.mustChangePassword);
    booking.contactPhone = data.user?.phone || "";
    if (!mustChangePassword.value) {
      await loadAll();
      page.value = "home";
    }
  });
}

async function changePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = "两次输入的新密码不一致";
    return;
  }
  await guard(async () => {
    const data = await api.request("/api/auth/change-password", {
      method: "POST",
      body: {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }
    });
    if (data.token) api.setToken(data.token);
    me.value = data.user;
    mustChangePassword.value = false;
    Object.assign(passwordForm, { oldPassword: "", newPassword: "", confirmPassword: "" });
    await loadAll();
    page.value = "home";
    showNotice("密码修改成功");
  });
}

async function logout() {
  await api.logout();
  me.value = null;
  mustChangePassword.value = false;
  Object.assign(passwordForm, { oldPassword: "", newPassword: "", confirmPassword: "" });
  page.value = "home";
}

function goBack() {
  if (page.value === "booking_confirm") page.value = "appointment_form";
  else if (page.value === "booking_success") page.value = "appointments";
  else if (page.value === "announcement_detail") page.value = "home";
  else if (page.value === "booking_rules") page.value = "profile";
  else if (page.value === "similar_counselors") page.value = "counselor_detail";
  else if (page.value === "profile_edit") page.value = "profile";
  else if (page.value === "appointment_form") page.value = "counselor_detail";
  else if (page.value === "counselor_detail") page.value = "booking";
  else if (page.value === "appointment_detail") page.value = "appointments";
  else if (page.value === "reschedule") page.value = "appointment_detail";
  else if (page.value === "assessment_list") page.value = "home";
  else if (page.value === "assessment_quiz") page.value = "assessment_list";
  else if (page.value === "assessment_result") page.value = "assessment_quiz";
  else if (page.value === "assessment_history") page.value = "profile";
  else if (page.value === "my_activities") page.value = "profile";
  else if (page.value === "article_detail") page.value = "articles";
  else if (page.value === "articles") page.value = "home";
  else if (page.value === "activity_detail") page.value = "activities";
  else if (page.value === "activity_signup") page.value = "activity_detail";
  else if (page.value === "activity_signup_success") page.value = "activities";
  else if (page.value === "activities") page.value = "home";
  else if (page.value === "message_detail") page.value = "messages";
  else if (page.value === "messages") page.value = "profile";
  else if (page.value === "referral") page.value = previousPage.value === "messages" ? "messages" : "profile";
  else if (page.value === "privacy") page.value = "profile";
  else if (page.value === "faq") page.value = "profile";
  else if (page.value === "emergency") page.value = "profile";
  else if (page.value === "feedback") page.value = "appointment_detail";
  else if (page.value === "feedback_form") page.value = "profile";
  else if (page.value === "risk_result") page.value = "risk_assessment";
  else if (page.value === "consent") page.value = previousPage.value === "consent" ? "appointment_form" : (previousPage.value || "appointment_form");
  else page.value = previousPage.value || "home";
}

function openProfileTarget(target) {
  if (target === "feedback_form") {
    feedbackFormSubmitted.value = false;
    feedbackForm.type = "系统问题";
    feedbackForm.content = "";
    feedbackForm.contact = "";
  }
  page.value = target;
}

async function loadAll() {
  await guard(async () => {
    const [homeData, counselorData, appointmentData, articleData, activityData, messageData] = await Promise.all([
      api.request("/api/student/home"),
      api.request("/api/student/counselors"),
      api.request("/api/student/appointments"),
      api.request("/api/student/articles"),
      api.request("/api/student/activities"),
      api.request("/api/student/messages")
    ]);
    home.value = homeData;
    counselors.value = counselorData;
    appointments.value = appointmentData;
    if (createdAppointment.value?.id) {
      createdAppointment.value = appointmentData.find((item) => item.id === createdAppointment.value.id) || createdAppointment.value;
    }
    articles.value = articleData;
    activities.value = activityData;
    messages.value = messageData;
  });
}

async function openCounselor(id) {
  previousPage.value = page.value;
  const counselor = await guard(() => api.request(`/api/student/counselors/${id}`));
  selectedCounselor.value = counselor ? normalizeCounselorCard(counselor) : null;
  booking.scheduleId = selectedCounselor.value?.schedules?.find((slot) => !slot.disabled)?.id || "";
  page.value = "counselor_detail";
}

async function openSimilarCounselor(id) {
  await openCounselor(id);
  previousPage.value = "similar_counselors";
}

async function startBooking(id) {
  await openCounselor(id);
  if (booking.scheduleId) page.value = "appointment_form";
}

async function createAppointment() {
  loading.value = true;
  error.value = "";
  try {
    const appointment = await api.request("/api/student/appointments", { method: "POST", body: booking });
    createdAppointment.value = appointment;
    selectedAppointmentId.value = appointment.id;
    showNotice("预约已提交，等待咨询师确认");
    await loadAll();
    page.value = "booking_success";
  } catch (err) {
    error.value = err.message || "预约提交失败";
    showNotice(error.value);
  } finally {
    loading.value = false;
  }
}

function openAppointment(item) {
  selectedAppointmentId.value = item.id;
  page.value = "appointment_detail";
}

function openCancelAppointment(item) {
  if (!item?.id) return;
  selectedAppointmentId.value = item.id;
  showStudentCancelModal.value = true;
}

function openReschedule(item) {
  if (item?.id) selectedAppointmentId.value = item.id;
  rescheduleSubmitted.value = false;
  rescheduleForm.date = "";
  rescheduleForm.time = "";
  rescheduleForm.reason = "";
  rescheduleForm.acceptRecommend = "no";
  page.value = "reschedule";
}

function submitReschedule() {
  rescheduleSubmitted.value = true;
  showNotice("改期申请已提交");
}

function submitFeedbackForm() {
  feedbackFormSubmitted.value = true;
  showNotice("反馈已提交");
}

function finishFeedbackForm() {
  feedbackFormSubmitted.value = false;
  feedbackForm.type = "系统问题";
  feedbackForm.content = "";
  feedbackForm.contact = "";
  page.value = "profile";
}

function saveStudentProfile() {
  showNotice("资料已保存");
  page.value = "profile";
}

function openArticle(item) {
  selectedArticle.value = item;
  previousPage.value = page.value;
  page.value = "article_detail";
}

function openHomeArticle(item) {
  if (item.raw) {
    openArticle(item.raw);
    return;
  }
  selectedArticle.value = item;
  previousPage.value = "home";
  page.value = "article_detail";
}

function openActivity(item) {
  selectedActivity.value = item;
  previousPage.value = page.value;
  page.value = "activity_detail";
}

function openHomeActivity() {
  if (!homeActivityCard.value) {
    page.value = "activities";
    return;
  }
  if (homeActivityCard.value.raw) {
    openActivity(homeActivityCard.value.raw);
    return;
  }
  page.value = "activities";
}

function openMessage(item) {
  selectedMessage.value = item;
  previousPage.value = page.value;
  page.value = item.title === "转介通知" ? "referral" : "message_detail";
}

function confirmReferral() {
  referralAccepted.value = true;
  showNotice("已确认接受转介，将为你安排新的咨询师");
}

function startPrototypeAssessment() {
  currentQuizIndex.value = 0;
  Object.keys(assessmentAnswers).forEach((key) => { delete assessmentAnswers[key]; });
  previousPage.value = "assessment_list";
  page.value = "assessment_quiz";
}

function submitPrototypeAssessment() {
  previousPage.value = "assessment_quiz";
  page.value = "assessment_result";
}

function submitPrototypeSignup() {
  previousPage.value = "activity_signup";
  page.value = "activity_signup_success";
}

function remainingSeats(item) {
  return Math.max(0, Number(item.capacity || 30) - Number(item.signups?.length || item.signupCount || 0));
}

async function signupActivity(id) {
  await guard(async () => {
    await api.request(`/api/student/activities/${id}/signup`, { method: "POST", body: {} });
    showNotice("活动报名已提交");
    await loadAll();
    page.value = "activities";
  });
}

async function cancelAppointment(id) {
  await guard(async () => {
    await api.request(`/api/student/appointments/${id}/cancel`, { method: "POST", body: { reason: "学生主动取消" } });
    showNotice("预约已取消");
    await loadAll();
    page.value = "appointments";
  });
}

async function confirmCancelAppointment() {
  if (!currentAppointment.value) return;
  showStudentCancelModal.value = false;
  await cancelAppointment(currentAppointment.value.id);
}

async function sendFeedback(id) {
  await guard(async () => {
    await api.request(`/api/student/appointments/${id}/feedback`, {
      method: "POST",
      body: { rating: 5, tags: ["专业", "有帮助"], content: "老师很耐心，建议清晰。" }
    });
    showNotice("评价已提交");
    await loadAll();
  });
}

async function submitRisk() {
  const answeredScore = Object.values(riskAnswers).reduce((sum, value) => sum + Number(value ?? 0), 0);
  const fallbackRisk = {
    id: `prototype-risk-${Date.now()}`,
    score: Number(riskScore.value || answeredScore || 22),
    level: "high",
    processStatus: "open"
  };
  loading.value = true;
  error.value = "";
  try {
    const risk = await api.request("/api/student/risk-assessments", {
      method: "POST",
      body: {
        score: fallbackRisk.score,
        answers: riskQuestions.map((item) => ({ question: item.id, value: Number(riskAnswers[item.id] ?? 0) }))
      }
    });
    lastRiskResult.value = risk || fallbackRisk;
    riskRecords.value.unshift(risk || fallbackRisk);
  } catch (err) {
    lastRiskResult.value = fallbackRisk;
    riskRecords.value.unshift(fallbackRisk);
  } finally {
    loading.value = false;
  }
  page.value = "risk_result";
}

onMounted(async () => {
  try {
    const data = await api.refreshSession();
    me.value = data.user;
    mustChangePassword.value = Boolean(data.mustChangePassword || data.user?.mustChangePassword);
    booking.contactPhone = data.user?.phone || "";
    if (!mustChangePassword.value) await loadAll();
  } catch {
    api.setToken(null);
  }
});
</script>
