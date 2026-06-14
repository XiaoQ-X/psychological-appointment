export const BRAND_NAME = "拾光心理";
export const BRAND_EN = "LightCatch";
export const BRAND_FULL_NAME = `${BRAND_NAME} ${BRAND_EN}`;
export const BRAND_POSITIONING = "青少年心理陪伴与成长支持";
export const BRAND_TAGLINE = "在阴霾中，陪你拾起内心的光与希望";

const BRAND_BASE = "/static/brand/lightcatch";
const HOME_IMAGE_BASE = "/static/images/home";

export const BRAND_ASSETS = Object.freeze({
  logo: `${BRAND_BASE}/logo-small.webp`,
  logoSmall: `${BRAND_BASE}/logo-small.webp`,
  loginCenterLogo: `${BRAND_BASE}/login-center-logo.png`,
  defaultStudentAvatar: `${BRAND_BASE}/avatar-student.webp`,
  defaultCounselorAvatar: `${BRAND_BASE}/avatar-counselor.webp`,
  loginHero: `${BRAND_BASE}/kv-login.webp`,
  homeBanner: `${BRAND_BASE}/banner-home.webp`,
  counselorDashboardHero: `${BRAND_BASE}/banner-home.webp`,
  coverFallback: `${HOME_IMAGE_BASE}/cover-placeholder-default.webp`,
  contentCoverFallback: `${HOME_IMAGE_BASE}/cover-placeholder-default.webp`,
  homeCategoryMentalHealth: `${HOME_IMAGE_BASE}/category-mental-health.webp`,
  homeCategoryEmotion: `${HOME_IMAGE_BASE}/category-emotion.webp`,
  homeCategoryRelationship: `${HOME_IMAGE_BASE}/category-relationship.webp`,
  homeCategoryStudyPressure: `${HOME_IMAGE_BASE}/category-study-pressure.webp`,
  homeAssessmentCard: `${HOME_IMAGE_BASE}/card-mental-health-assessment.webp`,
  homeActivityEmotionGroupCover: `${HOME_IMAGE_BASE}/cover-activity-emotion-group.webp`,
  homeArticleExamAnxietyCover: `${HOME_IMAGE_BASE}/cover-article-exam-anxiety.webp`,
  emptyState: `${BRAND_BASE}/empty-state.webp`,
  riskIcon: `${BRAND_BASE}/icon-risk.png`,
  careIcon: `${BRAND_BASE}/icon-care.png`,
  feedbackIcon: `${BRAND_BASE}/icon-feedback.png`
});
