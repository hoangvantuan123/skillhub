/**
 * Application Constants
 * Aligned with ARCHITECTURE.md specifications
 */

export const APP_CONFIG = {
  NAME: 'Đánh giá năng lực MES',
  TAGLINE: 'Học · Luyện · Thi — Goldsun Packaging',
  COMPANY: 'Goldsun Packaging',
  DEFAULT_TIMEZONE: 'Asia/Ho_Chi_Minh',
  API_PREFIX: '/api/v1',
  PAGE_SIZE_DEFAULT: 10,
};

export const ROLES = {
  LEARNER: 'learner',       // Người học: xem nội dung, luyện tập, thi, xem kết quả
  AUTHOR: 'author',         // Người biên soạn: soạn học liệu, câu hỏi, bộ đề
  REVIEWER: 'reviewer',     // Người duyệt: duyệt và xuất bản câu hỏi, đề
  EXAM_MANAGER: 'exam_mgr', // Người tổ chức thi: tạo kỳ/ca thi, giao người tham gia, lịch
  GRADER: 'grader',         // Người chấm: chấm bài tự luận/rubric, nhận xét
  ADMIN: 'admin',           // Quản trị: tài khoản, quyền, đơn vị, danh mục, cấu hình
};

export const ROLE_LABELS = {
  [ROLES.LEARNER]: 'Người học',
  [ROLES.AUTHOR]: 'Người biên soạn',
  [ROLES.REVIEWER]: 'Người duyệt',
  [ROLES.EXAM_MANAGER]: 'Người tổ chức thi',
  [ROLES.GRADER]: 'Người chấm thi',
  [ROLES.ADMIN]: 'Quản trị viên',
};

export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice', // Trắc nghiệm 1 đáp án
  ESSAY: 'essay',                 // Tự luận
  RUBRIC_CASE: 'rubric_case',     // Tình huống chấm theo rubric
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE_CHOICE]: 'Trắc nghiệm (1 đáp án)',
  [QUESTION_TYPES.ESSAY]: 'Tự luận',
  [QUESTION_TYPES.RUBRIC_CASE]: 'Tình huống (Rubric)',
};

export const DIFFICULTY_LEVELS = {
  KNOWLEDGE: 'knowledge',         // Nhận biết
  COMPREHENSION: 'comprehension', // Thông hiểu
  APPLICATION: 'application',     // Vận dụng
  ANALYSIS: 'analysis',           // Vận dụng cao
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTY_LEVELS.KNOWLEDGE]: 'Nhận biết',
  [DIFFICULTY_LEVELS.COMPREHENSION]: 'Thông hiểu',
  [DIFFICULTY_LEVELS.APPLICATION]: 'Vận dụng',
  [DIFFICULTY_LEVELS.ANALYSIS]: 'Vận dụng cao',
};

export const LIFECYCLE_STATUS = {
  DRAFT: 'draft',                 // Nháp
  PENDING_REVIEW: 'pending_review',// Chờ duyệt
  PUBLISHED: 'published',         // Đã xuất bản
  REJECTED: 'rejected',           // Bị từ chối
  ARCHIVED: 'archived',           // Lưu trữ
};

export const LIFECYCLE_LABELS = {
  [LIFECYCLE_STATUS.DRAFT]: 'Bản nháp',
  [LIFECYCLE_STATUS.PENDING_REVIEW]: 'Chờ duyệt',
  [LIFECYCLE_STATUS.PUBLISHED]: 'Đã xuất bản',
  [LIFECYCLE_STATUS.REJECTED]: 'Bị từ chối',
  [LIFECYCLE_STATUS.ARCHIVED]: 'Lưu trữ',
};

export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',     // Đang làm
  SUBMITTED: 'submitted',         // Đã nộp
  TIMED_OUT: 'timed_out',         // Hết giờ
  GRADED: 'graded',               // Đã chấm
};
