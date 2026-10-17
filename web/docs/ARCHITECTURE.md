# SkillHub — Đặc tả chức năng và kiến trúc khung code

Trạng thái: thiết kế mục tiêu cho các bước triển khai tiếp theo. Frontend hiện có React JSX + Vite, JavaScript và CSS; mới có trang tổng quan và khung điều hướng. Các thư mục, API và nghiệp vụ bên dưới chưa được triển khai nếu không ghi rõ.

## 1. Phạm vi sản phẩm

SkillHub kết nối: học tập → tra cứu → luyện tập → thi theo lịch/cấp độ → chấm điểm → học bổ sung.

- Giao diện bám bố cục tham khảo: sidebar xanh dạng icon, topbar tài khoản, nền sáng, banner và thẻ thao tác.
- Responsive trên điện thoại, tablet và máy tính; hỗ trợ bàn phím và reduced motion.
- Không có point, VIP, thanh toán hoặc gói nâng cấp.
- MVP hỗ trợ bài học văn bản/tệp, trắc nghiệm một đáp án, tự luận và tình huống chấm theo tiêu chí. Các dạng câu khác bổ sung sau.
- Chưa bao gồm AI sinh câu hỏi, camera giám sát, chứng chỉ, bán khóa học.

## 2. Vai trò và phạm vi quyền

| Vai trò | Trách nhiệm |
| --- | --- |
| Người học | Xem nội dung được cấp quyền, luyện tập, thi, xem kết quả được công bố |
| Người biên soạn | Soạn học liệu, câu hỏi, bộ đề trong phạm vi được giao |
| Người duyệt | Duyệt và xuất bản nội dung, phiên bản đề |
| Người tổ chức thi | Tạo kỳ/ca thi, giao người tham gia, cấu hình lịch và công bố |
| Người chấm | Chấm bài được phân công, nhận xét theo rubric |
| Quản trị | Quản lý tài khoản, quyền, đơn vị, danh mục và cấu hình |

Một tài khoản có nhiều quyền. Quyền phải gồm hành động và phạm vi đơn vị/nhóm/tài nguyên; không chỉ kiểm tra tên vai trò. Frontend ẩn thao tác không được phép, backend luôn xác thực lại. Mặc định từ chối truy cập khi chưa có quyền.

## 3. Danh mục chức năng

| Module | Chức năng MVP | Màn hình chính |
| --- | --- | --- |
| auth | Đăng nhập/đăng xuất, phiên hiện tại, xử lý hết phiên | Login, AccessDenied |
| dashboard | Việc cần làm, bài đang học, kỳ thi gần nhất | DashboardPage |
| organization | Đơn vị, tài khoản, nhóm và thành viên | UserList, GroupList, GroupDetail |
| catalog | Chuyên môn, chủ đề, cấp độ, khung năng lực | SubjectList, TopicTree, LevelList |
| learning | Khóa học, bài học, tệp, xuất bản, tiến độ | CourseList, CourseDetail, LessonPage, CourseEditor |
| knowledge | Tra cứu học liệu được phép, lọc, lưu tài liệu | KnowledgeSearch, ArticleDetail, SavedResources |
| questions | Soạn, lọc, phân loại, duyệt, tạo phiên bản câu hỏi | QuestionList, QuestionEditor, QuestionDetail |
| assessments | Bộ đề, ma trận, chọn thủ công/ngẫu nhiên, xem trước, xuất bản | AssessmentList, AssessmentEditor, AssessmentPreview |
| examinations | Kỳ thi, ca thi, giao nhóm/cá nhân, lịch, điều kiện vào thi | ExamList, ExamEditor, ExamDetail, ExamCalendar |
| attempts | Kiểm tra điều kiện, nhận đề, trả lời, tự lưu, nộp, hết giờ | ExamLobby, AttemptPage, SubmissionReceipt |
| practice | Chọn chủ đề/mức độ, luyện lại, xem giải thích | PracticeSetup, PracticePlayer, PracticeResult |
| grading | Danh sách bài, rubric, điểm tạm/chính thức, nhận xét | GradingQueue, GradingDetail |
| reports | Điểm cá nhân/nhóm, kết quả theo chủ đề, xuất báo cáo | MyResults, ResultDetail, GroupReport |
| notifications | Danh sách thông báo, đánh dấu đã đọc, nhắc lịch | NotificationList |
| settings | Hồ sơ, cấu hình tổ chức, nhật ký theo quyền | ProfilePage, OrganizationSettings, AuditLog |

Tra cứu khai thác học liệu và tài liệu đã xuất bản; không nhân bản nội dung thành một kho riêng. Thông báo là một phân hệ, không phải nguồn xác định lịch hay quyền vào thi.

## 4. Quy tắc nghiệp vụ cốt lõi

### Nội dung và đề

- Chuyên môn có nhiều chủ đề; bài học và câu hỏi liên kết với chủ đề bằng ID.
- Tách mức độ câu hỏi, cấp độ bộ đề, cấp tổ chức và mức năng lực đạt được.
- Ma trận ghi rõ tỷ lệ theo số câu hay số điểm; tổng phải hợp lệ. Thiếu câu phải báo rõ, không tự thay đổi cấu trúc.
- Câu hỏi và bộ đề có trạng thái nháp → chờ duyệt → xuất bản → lưu trữ. Nội dung bị từ chối quay về nháp kèm lý do.
- Phiên bản xuất bản là bất biến; sửa tạo phiên bản mới. Không xóa cứng nội dung đã được dùng thi.
- Với MVP, bộ đề xuất bản chốt danh sách phiên bản câu hỏi; đề ngẫu nhiên theo ma trận được tạo và xem trước trước khi xuất bản.

### Kỳ thi và ca thi

- Bộ đề là nội dung; kỳ thi là đợt tổ chức; ca thi là khung giờ; lượt làm là bài của một người.
- Mỗi ca tham chiếu một phiên bản bộ đề. Kỳ thi đơn giản có một ca mặc định.
- Lịch gồm mở vào thi, hạn bắt đầu, thời lượng, hạn nộp cứng tùy chọn, công bố điểm/đáp án riêng biệt.
- Lưu thời gian UTC, hiển thị theo múi giờ cấu hình; mặc định Asia/Ho_Chi_Minh.
- Nếu có hạn nộp cứng: deadline lượt = min(bắt đầu + thời lượng, hạn nộp). Hiện deadline trước khi xác nhận bắt đầu.
- Điều kiện thi gồm người được giao, lịch, số lượt, cấp trước nếu cấu hình. Backend quyết định tại thời điểm yêu cầu.
- Quy tắc lấy điểm thi lại cấu hình rõ: cao nhất hoặc mới nhất. Vẫn giữ lịch sử mọi lượt.
- Không sửa cấu hình ảnh hưởng bài đang làm; thay đổi lịch phải kiểm tra xung đột và ghi nhật ký.
- Vòng đời quản lý: nháp → lên lịch → đóng → lưu trữ; trạng thái sắp mở/đang mở/đã hết giờ được suy ra từ lịch và việc hủy/đóng thủ công. Không phụ thuộc cron để xác định quyền.

### Bài làm và chấm điểm

- Lượt làm lưu snapshot đề, thứ tự câu/đáp án, thang điểm và deadline; tải lại không sinh đề mới.
- Chỉ có một lượt đang hoạt động cho người học trong cùng ca, trừ khi có quy định đặc biệt sau này.
- Tự lưu theo câu và theo phiên bản ghi; gửi lại không tạo dữ liệu trùng, xung đột trả lỗi rõ ràng.
- Máy chủ là nguồn thời gian; đồng hồ frontend dùng để hiển thị. Yêu cầu lưu quá deadline bị từ chối theo chính sách đã công bố.
- Mất mạng: hiển thị trạng thái, giữ tạm câu trả lời trên thiết bị, đồng bộ lại khi còn hạn. Không hứa nhận đáp án gửi sau hạn. Xóa bản tạm khi đồng bộ/nộp hoặc đăng xuất.
- Nộp bài là thao tác nguyên tử và idempotent. Nộp lại trả cùng biên nhận, không chấm lặp.
- Backend kết thúc lượt hết hạn khi xử lý yêu cầu; worker quét để hoàn tất lượt không có yêu cầu mới.
- Trắc nghiệm do backend chấm; không gửi khóa đáp án xuống trình duyệt khi đang thi.
- Bài có tự luận giữ điểm tạm đến khi hoàn tất chấm. Rubric có tiêu chí, điểm tối đa và nhận xét.
- Sửa điểm lưu người sửa, giá trị trước/sau, lý do. Công bố điểm độc lập với công bố đáp án/giải thích.
- Báo cáo theo chủ đề hiển thị số câu và điểm tối đa; chưa đủ dữ liệu không kết luận thành thạo.

## 5. Kiến trúc tổng thể

```text
React JSX + Vite
    │ HTTPS / JSON + tải tệp có kiểm soát
Backend API (modular monolith)
    ├── PostgreSQL: dữ liệu nghiệp vụ, bài làm, điểm, nhật ký
    ├── Object storage: học liệu, ảnh, bài nộp; mặc định riêng tư
    └── Worker: nhắc lịch, xuất báo cáo, kết thúc lượt hết hạn
```

Frontend và backend là hai ứng dụng độc lập trong cùng repository. Backend dự kiến Node.js JavaScript, PostgreSQL; framework backend và thư viện ORM sẽ chốt khi triển khai. Không cần microservices hoặc Redis ở bước đầu. Worker có thể nhận tác vụ từ bảng jobs trong PostgreSQL; thêm hàng đợi chuyên dụng khi tải thực tế yêu cầu.

Phiên đăng nhập dự kiến dùng cookie HttpOnly, Secure trong production; API có bảo vệ CSRF cho mutation khi dùng cookie và cấu hình CORS rõ ràng. Không lưu token dài hạn trong localStorage. Tệp được cấp quyền qua API hoặc URL ký có thời hạn. Không đưa bí mật vào biến VITE_* vì chúng công khai trong bundle.

## 6. Cấu trúc repository mục tiêu

Giữ frontend ở root như hiện tại để không phải đổi lệnh chạy trong giai đoạn đầu.

```text
skillhub/
├── docs/
│   ├── ARCHITECTURE.md          # Tài liệu này
│   ├── api/                    # OpenAPI, ví dụ request/response
│   └── decisions/              # Quyết định kiến trúc và lý do
├── public/                     # Tài nguyên tĩnh công khai
├── src/
│   ├── main.jsx                # Entry: mount ứng dụng
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx          # Route, lazy loading, trang 404
│   │   ├── providers.jsx       # Session, query cache, toast
│   │   └── navigation.js       # Menu và quyền cần có
│   ├── layouts/
│   │   ├── WorkspaceLayout.jsx # Sidebar/topbar chung
│   │   ├── AuthLayout.jsx
│   │   └── ExamLayout.jsx      # Màn làm bài tập trung
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── organization/
│   │   ├── catalog/
│   │   ├── learning/
│   │   ├── knowledge/
│   │   ├── questions/
│   │   ├── assessments/
│   │   ├── examinations/
│   │   ├── attempts/
│   │   ├── practice/
│   │   ├── grading/
│   │   ├── reports/
│   │   ├── notifications/
│   │   └── settings/
│   ├── shared/
│   │   ├── ui/                 # Button, Dialog, Input, Table, EmptyState
│   │   ├── components/         # PageHeader, SearchFilter, Pagination
│   │   ├── hooks/              # Hook dùng nhiều module
│   │   ├── api/                # HTTP client, chuẩn lỗi; không chứa nghiệp vụ
│   │   ├── lib/                # Date, format, validation helpers
│   │   ├── config/             # Env công khai, cấu hình ứng dụng
│   │   └── styles/             # Tokens, global CSS
│   └── mocks/                  # Dữ liệu/API giả chỉ bật rõ ràng khi dev
├── server/
│   ├── src/
│   │   ├── app.js              # Khởi tạo HTTP server
│   │   ├── config/
│   │   ├── middleware/         # Auth, permission, lỗi, request ID
│   │   ├── modules/            # Theo cùng ranh giới nghiệp vụ frontend
│   │   ├── infrastructure/     # Database, storage, mail, job queue
│   │   └── workers/            # Entry xử lý nền
│   ├── migrations/
│   ├── seeds/                  # Dữ liệu phát triển; không tài khoản mặc định production
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── tests/e2e/                  # Các luồng xuyên frontend/backend
├── .env.example                # Chỉ cấu hình frontend công khai
├── index.html
├── vite.config.js
├── package.json
└── package-lock.json
```

Không tạo hàng loạt file rỗng. Chỉ tạo module, hook, repository khi bước triển khai cần dùng. Không chuyển nguyên cấu trúc này thành một component tổng khổng lồ.

### Bên trong một feature frontend

```text
features/questions/
├── pages/
│   ├── QuestionListPage.jsx
│   └── QuestionEditorPage.jsx
├── components/
│   ├── QuestionFilters.jsx
│   ├── QuestionForm.jsx
│   └── AnswerOptions.jsx
├── hooks/
│   └── useQuestions.js
├── services/
│   └── questions.api.js
├── schemas/
│   └── question.schema.js
├── styles/
│   └── questions.module.css
└── index.js                    # Chỉ export API công khai của feature
```

Luồng: Page → hook/service → shared HTTP client → backend. UI không trực tiếp gọi fetch rải rác. Feature chỉ import API công khai của feature khác; thành phần dùng chung không import ngược feature. Hàm nhỏ giữ gần nơi dùng, chỉ đưa vào shared khi có nhu cầu tái sử dụng thực tế.

### Bên trong một module backend

```text
modules/attempts/
├── attempts.routes.js          # Endpoint + middleware quyền
├── attempts.controller.js      # Đọc request, trả HTTP
├── attempts.service.js         # Luật thi, transaction, deadline
├── attempts.repository.js      # Truy vấn database
├── attempts.validation.js      # Validate dữ liệu vào
└── attempts.test.js            # Quy tắc nghiệp vụ quan trọng
```

Controller không chứa luật chấm hoặc SQL. Module gọi service của module khác khi cần; không truy cập tùy tiện bảng dữ liệu của module khác. Ràng buộc database bảo vệ tính toàn vẹn ngay cả khi có nhiều yêu cầu đồng thời.

## 7. State và hiệu năng frontend

- State cục bộ: useState/useReducer cho form, dialog, đáp án đang nhập.
- URL: bộ lọc, tìm kiếm, phân trang, ID tài nguyên; hỗ trợ refresh và chia sẻ link.
- Dữ liệu server: dự kiến query cache chuyên dụng khi nối API; không sao chép toàn bộ sang global store.
- Context: phiên người dùng và cấu hình giao diện nhỏ, tránh context chứa mọi dữ liệu.
- Lazy-load theo trang; giữ ExamLayout gọn; không tải editor/report nặng trên trang tổng quan.
- CSS Modules cho từng feature, token/global CSS dùng chung. Không cần bộ UI lớn ở giai đoạn đầu.
- Danh sách dùng phân trang phía server; tìm kiếm debounce và hủy request cũ. Chỉ dùng virtualization khi đã đo và thấy cần.
- Không persist đề thi/đáp án đúng vào cache công khai, service worker hay localStorage. Chỉ đáp án người thi chưa đồng bộ được giữ tạm theo chính sách ở mục 4.
- Đo thời gian tương tác trên thiết bị thật trước khi cam kết tốc độ. Framework không tự bảo đảm ứng dụng nhanh.

## 8. Bản đồ route mục tiêu

| Route | Mục đích |
| --- | --- |
| /login | Đăng nhập |
| /app | Tổng quan |
| /app/learning | Danh sách khóa học |
| /app/learning/:courseId/lessons/:lessonId | Học bài |
| /app/knowledge | Tra cứu |
| /app/practice | Thiết lập luyện tập |
| /app/exams | Kỳ thi được tham gia |
| /app/exams/:examId | Chi tiết, điều kiện và lịch |
| /app/results/:attemptId | Kết quả được phép xem |
| /exam/attempts/:attemptId | Làm bài với ExamLayout |
| /manage/questions | Ngân hàng câu hỏi |
| /manage/assessments | Bộ đề |
| /manage/exams | Tổ chức thi |
| /manage/grading | Chấm bài |
| /manage/learning | Quản lý học liệu |
| /manage/groups | Nhóm và thành viên |
| /manage/reports | Báo cáo |
| /admin/users | Tài khoản và phân quyền |
| /admin/catalog | Danh mục |
| /admin/settings | Cấu hình, nhật ký |

Hiện tại đang dùng hash navigation. Khi chuyển sang route trên, cấu hình hosting fallback về index.html cho đường dẫn frontend; /api và tệp phải có quy tắc riêng, không trả index.html khi lỗi API.

## 9. Nhóm dữ liệu chính

| Nhóm | Các thực thể |
| --- | --- |
| Tài khoản | users, sessions, roles, permissions, role_assignments |
| Tổ chức | organizations, groups, group_memberships |
| Danh mục | subjects, topics, levels, competency_targets |
| Học tập | courses, lessons, learning_resources, resource_topics, enrollments, lesson_progress |
| Câu hỏi | questions, question_versions, question_topics, answer_options, rubrics |
| Đề | assessments, assessment_versions, assessment_items, assessment_matrices |
| Kỳ thi | examinations, exam_sessions, exam_assignments, registrations |
| Bài làm | attempts, attempt_items, attempt_answers, submission_receipts |
| Chấm | grading_assignments, criterion_scores, grade_revisions, result_releases |
| Hệ thống | notifications, audit_logs, jobs |

ID quan hệ rõ ràng, khóa ngoại và index theo truy vấn thực tế. Ràng buộc duy nhất bảo vệ thành viên nhóm, thứ tự phiên bản, số lượt và idempotency key. Không lưu tổng điểm frontend gửi lên làm kết quả tin cậy.

## 10. Hợp đồng API khung

Prefix `/api/v1`. Danh sách trả `{ data: [], meta: { page, pageSize, total } }`; chi tiết trả `{ data: {} }`; lỗi trả `{ error: { code, message, fields?, requestId } }`. Timestamp ISO 8601 UTC. Backend giới hạn pageSize, validate input và không trả stack trace.

| Endpoint tiêu biểu | Trách nhiệm |
| --- | --- |
| POST /auth/login; POST /auth/logout; GET /auth/me | Quản lý phiên |
| GET /courses; GET /courses/:id | Nội dung được cấp quyền |
| PUT /lessons/:id/progress | Ghi tiến độ của chính người dùng |
| GET /knowledge?q=... | Tra cứu học liệu được phép |
| GET/POST /questions | Danh sách/tạo câu hỏi |
| POST /questions/:id/versions | Tạo phiên bản mới |
| POST /question-versions/:id/publish | Duyệt và xuất bản |
| GET/POST /assessments | Quản lý bộ đề |
| POST /assessment-versions/:id/publish | Chốt phiên bản đề |
| GET/POST /examinations | Quản lý đợt thi |
| POST /examinations/:id/sessions | Tạo ca |
| POST /exam-sessions/:id/attempts | Bắt đầu hoặc trả lượt đang hoạt động |
| GET /attempts/:id | Đề đã giao, deadline, đáp án của người học; không khóa đáp án |
| PUT /attempts/:id/answers/:itemId | Lưu đáp án kèm revision |
| POST /attempts/:id/submit | Nộp với idempotency key |
| GET /grading/assignments | Bài được giao chấm |
| PUT /grading/assignments/:id/scores | Lưu điểm theo tiêu chí |
| POST /attempts/:id/finalize-grade | Chốt điểm với quyền phù hợp |
| GET /attempts/:id/result | Kết quả theo chính sách công bố |
| GET /reports/topics | Báo cáo trong phạm vi quyền |

Đây là hợp đồng dự kiến. Chốt OpenAPI trước khi hai phía triển khai; việc đổi API phải cập nhật tài liệu và consumer liên quan.

## 11. Chuyển từ code hiện tại

| Hiện tại | Mục tiêu |
| --- | --- |
| src/App.jsx | src/app/App.jsx, router.jsx và layouts/WorkspaceLayout.jsx |
| src/components/Sidebar.jsx | src/layouts/components/Sidebar.jsx |
| src/components/HelpDialog.jsx | src/shared/components/HelpDialog.jsx |
| src/pages/Home.jsx | src/features/dashboard/pages/DashboardPage.jsx |
| src/pages/Workspace.jsx | Thay từng route bằng trang feature thực; giữ thông báo chưa triển khai ở phần chưa làm |
| src/data/navigation.js | src/app/navigation.js |
| src/styles.css | src/shared/styles/tokens.css, global.css và CSS Modules |

Di chuyển theo từng bước, cập nhật import và build sau mỗi bước. Giữ bố cục ảnh, không thêm mục thương mại. Không để module chưa có nghiệp vụ hiển thị thành công giả.

## 12. Kế hoạch triển khai và tiêu chí hoàn thành

1. **Khung FE:** router, layouts, UI cơ bản, trang lỗi, responsive; refresh URL và điều hướng bằng bàn phím hoạt động.
2. **Nền backend:** migration, session, quyền, nhóm, danh mục; kiểm tra người dùng không thể đọc dữ liệu ngoài phạm vi.
3. **Câu hỏi → bộ đề:** soạn/duyệt/phiên bản/ma trận; báo thiếu câu; xuất bản và xem trước đề chính xác.
4. **Kỳ thi → bài làm:** lịch, giao thi, tự lưu, nộp; kiểm tra hết giờ, tải lại, gửi trùng, hai tab và mất mạng.
5. **Chấm → báo cáo:** rubric, điểm tạm/chính thức, công bố riêng; kiểm tra tính điểm và không lộ đáp án sớm.
6. **Học → tra cứu → luyện:** học liệu, quyền tệp, tiến độ, tìm kiếm, liên kết phần yếu với bài học.
7. **Vận hành:** log có request ID, sao lưu và thử phục hồi, health check, migration có kế hoạch khôi phục, đo tải theo số người thi đồng thời dự kiến.

Các bài test ưu tiên: quyền truy cập, deadline phía server, phiên bản đề bất biến, tính điểm, nộp idempotent và công bố kết quả. Kiểm thử E2E một luồng đầy đủ trên desktop/mobile; không coi build thành công là đã kiểm thử nghiệp vụ hoặc responsive.
