/**
 * Mock Service layer for SkillHub
 * Conforming to Section 10 API contracts:
 * - { data: [], meta: { page, pageSize, total } }
 * - { data: {} }
 * - { error: { code, message, fields, requestId } }
 */

import {
  mockUsers,
  mockGroups,
  mockSubjects,
  mockTopics,
  mockQuestionFolders,
  mockQuestions,
  mockAssessments,
  mockExams,
  mockCourses,
  mockArticles,
  mockGradingSubmissions,
  mockNotifications,
  mockAuditLogs,
} from './mockData';
import { storage } from '../shared/lib/storage';

// Local reactive storage for mutated mock data
let usersState = [...mockUsers];
let groupsState = [...mockGroups];
let questionFoldersState = [...mockQuestionFolders];
let questionsState = [...mockQuestions];
let assessmentsState = [...mockAssessments];
let gradingState = [...mockGradingSubmissions];
let notificationsState = [...mockNotifications];
let coursesState = [...mockCourses];
let articlesState = [...mockArticles];
let auditLogsState = [...mockAuditLogs];

// Active attempts simulation: { [attemptId]: { attempt, answers, submissionReceipt } }
let activeAttempts = {};

export const mockApi = {
  // --- USERS & AUTH & REGISTRATION ---
  async getCurrentUser() {
    const savedUserId = storage.get('current_user_id', 'u-1');
    const user = usersState.find((u) => u.id === savedUserId) || usersState[0];
    return { data: user };
  },

  async switchRole(userId) {
    const user = usersState.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    storage.set('current_user_id', user.id);
    return { data: user };
  },

  async getUsers({ search = '', role = '', groupId = '' } = {}) {
    let result = [...usersState];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }
    if (role) {
      result = result.filter((u) => (u.roles ? u.roles.includes(role) : u.role === role));
    }
    if (groupId) {
      result = result.filter((u) => u.assignedGroups && u.assignedGroups.includes(groupId));
    }
    return { data: result, meta: { total: result.length } };
  },

  async createUser(userData) {
    const newId = 'u-' + Date.now();
    const newUser = {
      id: newId,
      name: userData.name,
      email: userData.email,
      role: userData.roles?.[0] || 'learner',
      roles: userData.roles || ['learner'],
      roleName: userData.roles?.includes('admin')
        ? 'Quản trị viên (Full Quyền)'
        : userData.roles?.length > 1
        ? 'Nhiều vai trò (' + userData.roles.length + ' vai trò)'
        : 'Người học',
      rank: userData.rank || 'Sơ cấp / Fresher (Bậc 1)',
      rankLevel: userData.rankLevel || 1,
      avatar: userData.name ? userData.name.trim().charAt(0).toUpperCase() : 'U',
      department: userData.department || 'Trung tâm Nghiên cứu & Sản xuất',
      unit: userData.unit || 'Khối MES & Nhà máy Thông minh',
      assignedGroups: userData.assignedGroups || [],
      permissions: userData.roles?.includes('admin')
        ? ['admin:all', 'users:manage', 'catalog:manage', 'audit:view']
        : userData.roles?.map((r) => `${r}:read`),
    };

    usersState = [newUser, ...usersState];

    // Update group counts if assigned
    if (userData.assignedGroups && userData.assignedGroups.length > 0) {
      groupsState = groupsState.map((g) => {
        if (userData.assignedGroups.includes(g.id)) {
          return { ...g, memberCount: (g.memberCount || 0) + 1 };
        }
        return g;
      });
    }

    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      actor: 'Admin Quản trị Toàn quyền',
      action: 'Đăng ký tài khoản mới',
      details: `Đăng ký tài khoản cho ${newUser.name} (${newUser.email}) - Vai trò: ${newUser.roles.join(', ')} - Cấp bậc: ${newUser.rank}`,
      ip: '127.0.0.1',
    });

    return { data: newUser };
  },

  async assignUserToGroup(userId, groupId) {
    const uIdx = usersState.findIndex((u) => u.id === userId);
    if (uIdx !== -1) {
      const currentGroups = usersState[uIdx].assignedGroups || [];
      if (!currentGroups.includes(groupId)) {
        usersState[uIdx].assignedGroups = [...currentGroups, groupId];
        const gIdx = groupsState.findIndex((g) => g.id === groupId);
        if (gIdx !== -1) {
          groupsState[gIdx].memberCount = (groupsState[gIdx].memberCount || 0) + 1;
        }
      }
    }
    return { data: usersState[uIdx] };
  },

  // --- GROUPS ---
  async getGroups() {
    return { data: groupsState };
  },

  async createGroup(groupData) {
    const newGroup = {
      id: 'grp-' + Date.now(),
      name: groupData.name,
      code: groupData.code || 'GRP-' + Math.floor(Math.random() * 1000),
      memberCount: 0,
      leader: groupData.leader || 'Chưa chỉ định',
      description: groupData.description || '',
    };
    groupsState = [newGroup, ...groupsState];
    return { data: newGroup };
  },

  // --- QUESTION FOLDERS (NGÂN HÀNG THƯ MỤC CÂU HỎI) ---
  async getQuestionFolders({ search = '', level = '' } = {}) {
    let result = [...questionFoldersState];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))
      );
    }
    if (level) {
      result = result.filter((f) => f.level === level || f.level === 'All');
    }

    // Dynamic recount based on current questionsState
    result = result.map((folder) => {
      let count = 0;
      let critCount = 0;
      if (folder.id === 'f-critical') {
        count = questionsState.filter((q) => q.isCritical).length;
        critCount = count;
      } else {
        const matching = questionsState.filter((q) => q.folderId === folder.id || q.level === folder.level);
        count = matching.length;
        critCount = matching.filter((q) => q.isCritical).length;
      }
      return {
        ...folder,
        questionCount: count || folder.questionCount,
        criticalCount: critCount || folder.criticalCount,
      };
    });

    return { data: result };
  },

  async createQuestionFolder(folderData) {
    const newFolder = {
      id: 'f-' + Date.now(),
      name: folderData.name,
      level: folderData.level || 'All',
      questionCount: 0,
      criticalCount: 0,
      updatedAt: new Date().toISOString(),
      description: folderData.description || '',
    };
    questionFoldersState = [newFolder, ...questionFoldersState];
    return { data: newFolder };
  },

  async deleteQuestionFolder(id) {
    questionFoldersState = questionFoldersState.filter((f) => f.id !== id);
    return { success: true };
  },

  // --- QUESTIONS ---
  async getQuestions({ search = '', subjectId = '', difficulty = '', status = '', targetGroup = '', level = '', format = '', isCritical = '', folderId = '', page = 1, pageSize = 0 } = {}) {
    let result = [...questionsState];
    if (folderId) {
      if (folderId === 'f-critical') {
        result = result.filter((item) => !!item.isCritical);
      } else {
        result = result.filter((item) => item.folderId === folderId || item.level === folderId.replace('f-', '').toUpperCase());
      }
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) => item.content.toLowerCase().includes(q) || (item.topicName && item.topicName.toLowerCase().includes(q)) || (item.id && item.id.toLowerCase().includes(q)));
    }
    if (subjectId) {
      result = result.filter((item) => item.subjectId === subjectId);
    }
    if (difficulty) {
      result = result.filter((item) => item.difficulty === difficulty);
    }
    if (status) {
      result = result.filter((item) => item.status === status);
    }
    if (targetGroup) {
      result = result.filter((item) => item.targetGroup === targetGroup || item.targetGroup === 'all');
    }
    if (level) {
      result = result.filter((item) => item.level === level);
    }
    if (format) {
      result = result.filter((item) => item.format === format);
    }
    if (isCritical !== '' && isCritical !== undefined) {
      const critBool = isCritical === 'true' || isCritical === true;
      result = result.filter((item) => !!item.isCritical === critBool);
    }

    const total = result.length;
    let paginatedData = result;

    if (pageSize > 0) {
      const startIndex = (page - 1) * pageSize;
      paginatedData = result.slice(startIndex, startIndex + pageSize);
    }

    return {
      data: paginatedData,
      meta: {
        page: page || 1,
        pageSize: pageSize > 0 ? pageSize : total,
        total,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
      },
    };
  },

  async seed10kQuestions() {
    const topics = [
      'Cảm biến quang & tiệm cận', 'Đấu nối điện 24VDC', 'Tín hiệu tương tự 4-20mA',
      'Bộ đếm tốc độ cao HSC', 'Ngắt phần cứng Hardware Interrupt', 'Truyền thông Modbus RTU / TCP',
      'Giao thức mạng Profinet', 'Thiết kế giao diện HMI trạm máy', 'Mô phỏng SCADA trạm trộn',
      'Cảnh báo liên động an toàn Interlock', 'Điều độ lệnh sản xuất Work Order', 'Phả hệ sản phẩm Genealogy',
      'Kiểm soát chất lượng SPC & OEE', 'Thu hồi sản phẩm Recall khẩn cấp', 'Quy trình chuẩn GMP/FDA'
    ];
    const levels = ['L0', 'L1', 'L2', 'L3'];
    const formats = ['theory', 'theory', 'case_study', 'simulation_hmi', 'essay'];
    const statuses = ['published', 'published', 'published', 'pending_review', 'draft'];
    const difficulties = ['remember', 'comprehension', 'application', 'analysis'];

    const new10k = [];
    const now = Date.now();
    for (let i = 1; i <= 10000; i++) {
      const lvl = levels[i % levels.length];
      const fmt = formats[i % formats.length];
      const isCrit = (i % 12 === 0); // ~8.3% critical
      const tName = topics[i % topics.length];
      new10k.push({
        id: `q-10k-${String(i).padStart(5, '0')}`,
        folderId: `f-${lvl.toLowerCase()}`,
        subjectId: 'sub-mes',
        topicId: `top-mes-${(i % 5) + 1}`,
        topicName: `${tName} (${lvl})`,
        targetGroup: i % 2 === 0 ? 'grp-mes' : 'grp-1',
        targetGroupName: i % 2 === 0 ? 'Nhóm Kỹ sư MES (Smart Factory)' : 'Kỹ sư Phần mềm',
        level: lvl,
        levelName: `Level ${lvl.replace('L', '')}`,
        format: fmt,
        formatLabel: fmt === 'simulation_hmi' ? 'Mô phỏng HMI' : fmt === 'case_study' ? 'Tình huống' : 'Trắc nghiệm',
        isCritical: isCrit,
        criticalReason: isCrit ? 'Quy chuẩn an toàn vận hành & truy vết lô (Zero-tolerance)' : undefined,
        type: fmt === 'essay' ? 'essay' : 'single_choice',
        difficulty: difficulties[i % difficulties.length],
        status: statuses[i % statuses.length],
        version: (i % 3) + 1,
        author: i % 2 === 0 ? 'Kỹ sư Trưởng MES' : 'Ban Khảo thí OT/IT',
        content: `[#${i}] Đánh giá ${tName} — Kiểm tra quy trình vận hành cấp độ ${lvl} theo tiêu chuẩn ISA-95 (Dữ liệu kiểm thử tải lớn Q-${i})`,
        options: [
          { id: `opt-1-${i}`, text: `Phương án chuẩn kỹ thuật cấp ${lvl}`, isCorrect: true },
          { id: `opt-2-${i}`, text: `Phương án vận hành thử nghiệm chưa tối ưu` },
          { id: `opt-3-${i}`, text: `Bỏ qua bước kiểm tra an toàn cảm biến` },
          { id: `opt-4-${i}`, text: `Tắt cảnh báo quá nhiệt trên hệ thống` },
        ],
        explanation: `Giải thích chi tiết cho câu hỏi mã #${i}: Tuân thủ quy định tiêu chuẩn kỹ thuật nhà máy thông minh cấp độ ${lvl}.`,
        updatedAt: new Date(now - (i * 360000)).toISOString(),
      });
    }

    questionsState = [...mockQuestions, ...new10k];
    return { count: questionsState.length };
  },

  async resetQuestionsToDefault() {
    questionsState = [...mockQuestions];
    return { count: questionsState.length };
  },

  async createQuestion(questionData) {
    const newQuestion = {
      ...questionData,
      id: 'q-' + Date.now(),
      version: 1,
      status: questionData.status || 'draft',
      updatedAt: new Date().toISOString(),
    };
    questionsState = [newQuestion, ...questionsState];
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      actor: questionData.author || 'Người biên soạn',
      action: 'Tạo câu hỏi',
      details: `Tạo câu hỏi mới: ${newQuestion.content.substring(0, 50)}...`,
      ip: '127.0.0.1',
    });
    return { data: newQuestion };
  },

  async createQuestionsBatch(batchArray) {
    const created = batchArray.map((q, idx) => ({
      ...q,
      id: q.id || `q-batch-${Date.now()}-${idx + 1}`,
      version: 1,
      status: q.status || 'published',
      updatedAt: new Date().toISOString(),
    }));
    questionsState = [...created, ...questionsState];
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      actor: 'Quản trị viên',
      action: 'Nhập hàng loạt câu hỏi',
      details: `Nhập thành công ${created.length} câu hỏi vào Ngân hàng câu hỏi.`,
      ip: '127.0.0.1',
    });
    return { data: created };
  },

  async toggleQuestionCritical(id) {
    const index = questionsState.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');
    questionsState[index] = {
      ...questionsState[index],
      isCritical: !questionsState[index].isCritical,
      criticalReason: !questionsState[index].isCritical
        ? 'Câu hỏi điểm liệt thiết lập bởi Quản trị viên / Trưởng ban khảo thí'
        : undefined,
      updatedAt: new Date().toISOString(),
    };
    return { data: questionsState[index] };
  },

  async updateQuestionStatus(id, newStatus, reason = '') {
    const index = questionsState.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');
    const updated = {
      ...questionsState[index],
      status: newStatus,
      rejectReason: reason,
      updatedAt: new Date().toISOString(),
    };
    questionsState[index] = updated;
    return { data: updated };
  },

  // --- CANDIDATE EXAM PROVISIONING (CẤP TÀI KHOẢN VÀO THI) ---
  async getCandidates() {
    const candidateList = usersState.map((u, idx) => ({
      ...u,
      sbd: `SBD-MES-${202600 + idx + 1}`,
      passcode: `PASS-${8000 + idx + 1}`,
      assignedExam: 'EXAM-MES-2026-Q1',
      examTitle: 'Kỳ thi Chuẩn hóa Năng lực Kỹ sư MES & Nhà máy Thông minh 2026',
      status: idx % 2 === 0 ? 'Chưa vào thi' : 'Đã nộp bài',
    }));
    return { data: candidateList };
  },

  async issueCandidatePasscode({ name, email, examId, group }) {
    const newId = 'u-cand-' + Date.now();
    const sbd = `SBD-MES-${Math.floor(1000 + Math.random() * 9000)}`;
    const passcode = `PASS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCandidate = {
      id: newId,
      name,
      email,
      role: 'learner',
      roles: ['learner'],
      roleName: 'Thí sinh dự thi',
      rank: 'Kỹ sư Vận hành MES',
      sbd,
      passcode,
      assignedExam: examId || 'EXAM-MES-2026-Q1',
      assignedGroups: [group || 'grp-mes'],
      status: 'Chưa vào thi',
      unit: 'Khối Sản xuất & Nhà máy Thông minh',
    };
    usersState = [newCandidate, ...usersState];
    return { data: newCandidate };
  },

  async verifyCandidatePasscode(sbdOrEmail, passcode) {
    const found = usersState.find(
      (u) =>
        (u.email?.toLowerCase() === sbdOrEmail?.toLowerCase() ||
         u.sbd?.toLowerCase() === sbdOrEmail?.toLowerCase())
    );
    if (!found) {
      throw new Error('Không tìm thấy Số Báo Danh (SBD) hoặc Email thí sinh trong hệ thống!');
    }
    return {
      data: {
        user: found,
        examId: 'exam-mes-2026',
        examTitle: 'Kỳ thi Chuẩn hóa Năng lực Kỹ sư MES & Nhà máy Thông minh 2026',
        targetAttemptId: 'att-001',
      },
    };
  },

  // --- ASSESSMENTS (BỘ ĐỀ) ---
  async getAssessments() {
    return {
      data: assessmentsState,
      meta: { page: 1, pageSize: assessmentsState.length, total: assessmentsState.length },
    };
  },

  async getAssessmentById(id) {
    const asm = assessmentsState.find((a) => a.id === id);
    if (!asm) throw new Error('Bộ đề không tồn tại');
    const questions = questionsState.filter((q) => asm.questions.includes(q.id));
    return { data: { ...asm, questionsList: questions } };
  },

  async createAssessment(assessmentData) {
    const newAsm = {
      ...assessmentData,
      id: 'asm-' + Date.now(),
      version: 1,
      status: 'draft',
      questionCount: assessmentData.questions?.length || 0,
      publishedAt: null,
    };
    assessmentsState = [newAsm, ...assessmentsState];
    return { data: newAsm };
  },

  // --- EXAMINATIONS & SESSIONS ---
  async getExams() {
    return {
      data: mockExams,
      meta: { page: 1, pageSize: mockExams.length, total: mockExams.length },
    };
  },

  async getExamById(id) {
    const exam = mockExams.find((e) => e.id === id);
    if (!exam) throw new Error('Kỳ thi không tồn tại');
    const assessment = assessmentsState.find((a) => a.id === exam.assessmentId);
    return { data: { ...exam, assessment } };
  },

  // --- ATTEMPTS & LOBBY ---
  async startAttempt(examId, userId = 'u-1') {
    const exam = mockExams.find((e) => e.id === examId);
    if (!exam) throw new Error('Kỳ thi không tồn tại');
    const assessment = assessmentsState.find((a) => a.id === exam.assessmentId);

    // Retrieve full question list for the assessment
    const questions = questionsState.filter((q) => assessment.questions.includes(q.id));

    const attemptId = 'att-' + Date.now();
    const durationSeconds = exam.durationMinutes * 60;
    const now = new Date();
    const deadline = new Date(now.getTime() + durationSeconds * 1000).toISOString();

    const attempt = {
      id: attemptId,
      examId,
      examTitle: exam.title,
      userId,
      startTime: now.toISOString(),
      deadline,
      durationSeconds,
      status: 'in_progress',
      questions,
      totalQuestions: questions.length,
      answers: {},
    };

    activeAttempts[attemptId] = attempt;
    return { data: attempt };
  },

  async getAttempt(attemptId) {
    const attempt = activeAttempts[attemptId];
    if (!attempt) {
      // Create a fallback demo attempt for seamless review if direct link is accessed
      const fallbackExam = mockExams[0];
      const fallbackAsm = assessmentsState[0];
      const questions = questionsState.filter((q) => fallbackAsm.questions.includes(q.id));
      const newAttempt = {
        id: attemptId,
        examId: fallbackExam.id,
        examTitle: fallbackExam.title,
        userId: 'u-1',
        startTime: new Date().toISOString(),
        deadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        durationSeconds: 45 * 60,
        status: 'in_progress',
        questions,
        totalQuestions: questions.length,
        answers: {},
      };
      activeAttempts[attemptId] = newAttempt;
      return { data: newAttempt };
    }
    return { data: attempt };
  },

  async saveAnswer(attemptId, questionId, answerValue) {
    if (!activeAttempts[attemptId]) {
      activeAttempts[attemptId] = { answers: {} };
    }
    activeAttempts[attemptId].answers = {
      ...activeAttempts[attemptId].answers,
      [questionId]: answerValue,
    };
    // Cache draft locally as specified in section 4
    storage.saveAttemptAnswersDraft(attemptId, activeAttempts[attemptId].answers);

    return {
      data: {
        saved: true,
        savedAt: new Date().toISOString(),
        answers: activeAttempts[attemptId].answers,
      },
    };
  },

  async submitAttempt(attemptId, idempotencyKey) {
    const attempt = activeAttempts[attemptId] || { answers: {}, questions: [] };

    // Idempotency check: if already submitted with this key or attempt is submitted, return receipt
    if (attempt.submissionReceipt) {
      return { data: attempt.submissionReceipt };
    }

    const answeredCount = Object.keys(attempt.answers || {}).length;
    const receipt = {
      receiptNumber: 'RCPT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      attemptId,
      submittedAt: new Date().toISOString(),
      idempotencyKey,
      totalQuestions: attempt.questions?.length || 4,
      answeredCount,
      status: 'submitted',
      message: 'Bài thi đã được ghi nhận thành công trên máy chủ.',
    };

    attempt.status = 'submitted';
    attempt.submissionReceipt = receipt;
    // Clear temporary local draft upon successful submission per Section 4
    storage.clearAttemptAnswersDraft(attemptId);

    // Add to audit logs
    auditLogsState.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      actor: 'Hoàng Minh Tuấn',
      action: 'Nộp bài thi',
      details: `Nộp bài thi mã ${attemptId} với biên nhận ${receipt.receiptNumber}`,
      ip: '127.0.0.1',
    });

    return { data: receipt };
  },

  // --- PRACTICE ---
  async getPracticeQuestions({ subjectId, difficulty, count = 5 }) {
    let pool = [...questionsState.filter((q) => q.status === 'published' && q.type === 'single_choice')];
    if (subjectId) pool = pool.filter((q) => q.subjectId === subjectId);
    if (difficulty) pool = pool.filter((q) => q.difficulty === difficulty);

    // Take count
    const selected = pool.slice(0, count);
    return { data: selected };
  },

  // --- GRADING ---
  async getGradingQueue() {
    return { data: gradingState, meta: { total: gradingState.length } };
  },

  async saveGradingScores(submissionId, rubricScores, feedback, isFinal = false) {
    const index = gradingState.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error('Submission not found');

    const total = rubricScores.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
    const updated = {
      ...gradingState[index],
      rubrics: rubricScores,
      graderFeedback: feedback,
      finalScore: total,
      status: isFinal ? 'graded' : 'pending',
    };
    gradingState[index] = updated;

    if (isFinal) {
      auditLogsState.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        actor: 'Lê Thanh Hương',
        action: 'Chốt điểm thi',
        details: `Chốt điểm bài thi ${submissionId}: ${total}/10`,
        ip: '127.0.0.1',
      });
    }

    return { data: updated };
  },

  // --- LEARNING & COURSES ---
  async getCourses() {
    return { data: coursesState };
  },

  async getCourseById(id) {
    const course = coursesState.find((c) => c.id === id);
    if (!course) throw new Error('Khóa học không tồn tại');
    return { data: course };
  },

  async updateLessonProgress(courseId, lessonId, completed = true) {
    const cIndex = coursesState.findIndex((c) => c.id === courseId);
    if (cIndex !== -1) {
      const course = coursesState[cIndex];
      const lIndex = course.lessons.findIndex((l) => l.id === lessonId);
      if (lIndex !== -1) {
        course.lessons[lIndex].completed = completed;
        const compCount = course.lessons.filter((l) => l.completed).length;
        course.progress = Math.round((compCount / course.lessons.length) * 100);
      }
    }
    return { data: { success: true } };
  },

  // --- KNOWLEDGE BASE ---
  async getArticles({ search = '' } = {}) {
    let result = [...articlesState];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return { data: result };
  },

  async toggleSaveArticle(articleId) {
    const index = articlesState.findIndex((a) => a.id === articleId);
    if (index !== -1) {
      articlesState[index].saved = !articlesState[index].saved;
      return { data: articlesState[index] };
    }
    return { data: null };
  },

  // --- NOTIFICATIONS ---
  async getNotifications() {
    return { data: notificationsState };
  },

  async markAllNotificationsAsRead() {
    notificationsState = notificationsState.map((n) => ({ ...n, read: true }));
    return { data: notificationsState };
  },

  // --- AUDIT LOGS ---
  async getAuditLogs() {
    return { data: auditLogsState };
  },

  // --- CATALOG & ORG ---
  async getCatalog() {
    return {
      data: {
        subjects: mockSubjects,
        topics: mockTopics,
        groups: mockGroups,
        users: mockUsers,
      },
    };
  },
};
