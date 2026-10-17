package skillauth

import (
	"context"
	"github.com/jmoiron/sqlx"
)

const PermissionHierarchySchema = `CREATE TABLE IF NOT EXISTS skillhub_permission_nodes(id text PRIMARY KEY,parent_id text REFERENCES skillhub_permission_nodes(id),label text NOT NULL,kind text NOT NULL CHECK(kind IN ('Module','Nhóm menu','Menu / Màn hình','Chức năng','Quyền thao tác')),route text NOT NULL DEFAULT '',description text NOT NULL DEFAULT '',scope_key text REFERENCES skillhub_modules(key),action text);
INSERT INTO skillhub_permission_nodes(id,parent_id,label,kind,route,description,scope_key,action) VALUES ('training',NULL,'Đào tạo','Module','','Học tập · Quản lý đánh giá · Tổ chức thi & Chấm bài · Báo cáo đào tạo',NULL,NULL),
('training:learning','training','Học tập','Nhóm menu','','learning · exams · practice · knowledge · attempts',NULL,NULL),
('training:learning:menu:learning','training:learning','Khóa học','Menu / Màn hình','/app/learning','Xem khóa học và nội dung bài học',NULL,NULL),
('training:learning:menu:learning:function:0','training:learning:menu:learning','Khóa học','Chức năng','/app/learning','Danh sách khóa học',NULL,NULL),
('training:learning:menu:learning:function:0:view','training:learning:menu:learning:function:0','Xem danh sách / chi tiết','Quyền thao tác','learning:view','Quyền của Khóa học','learning','view'),
('training:learning:menu:learning:function:1','training:learning:menu:learning','Bài học','Chức năng','/app/learning/:courseId/lessons/:lessonId','Nội dung bài học',NULL,NULL),
('training:learning:menu:learning:function:1:view','training:learning:menu:learning:function:1','Xem danh sách / chi tiết','Quyền thao tác','learning:view','Quyền của Khóa học','learning','view'),
('training:learning:menu:learning:function:management','training:learning:menu:learning','Khóa học','Chức năng','/app/learning','Xem khóa học và nội dung bài học',NULL,NULL),
('training:learning:menu:learning:function:management:create','training:learning:menu:learning:function:management','Thêm mới','Quyền thao tác','learning:create','Quyền của Khóa học','learning','create'),
('training:learning:menu:learning:function:management:update','training:learning:menu:learning:function:management','Chỉnh sửa','Quyền thao tác','learning:update','Quyền của Khóa học','learning','update'),
('training:learning:menu:learning:function:management:delete','training:learning:menu:learning:function:management','Xóa','Quyền thao tác','learning:delete','Quyền của Khóa học','learning','delete'),
('training:learning:menu:learning:function:management:import','training:learning:menu:learning:function:management','Nhập dữ liệu','Quyền thao tác','learning:import','Quyền của Khóa học','learning','import'),
('training:learning:menu:learning:function:management:export','training:learning:menu:learning:function:management','Xuất dữ liệu','Quyền thao tác','learning:export','Quyền của Khóa học','learning','export'),
('training:learning:menu:learning:function:management:publish','training:learning:menu:learning:function:management','Xuất bản','Quyền thao tác','learning:publish','Quyền của Khóa học','learning','publish'),
('training:learning:menu:exams','training:learning','Kỳ thi của tôi','Menu / Màn hình','/app/exams','Xem kỳ thi, ca thi và vào phòng chờ',NULL,NULL),
('training:learning:menu:exams:function:0','training:learning:menu:exams','Danh sách kỳ thi','Chức năng','/app/exams','Kỳ thi được giao',NULL,NULL),
('training:learning:menu:exams:function:0:view','training:learning:menu:exams:function:0','Xem danh sách / chi tiết','Quyền thao tác','exams:view','Quyền của Kỳ thi của tôi','exams','view'),
('training:learning:menu:exams:function:1','training:learning:menu:exams','Chi tiết kỳ thi','Chức năng','/app/exams/:examId','Thông tin kỳ thi',NULL,NULL),
('training:learning:menu:exams:function:1:view','training:learning:menu:exams:function:1','Xem danh sách / chi tiết','Quyền thao tác','exams:view','Quyền của Kỳ thi của tôi','exams','view'),
('training:learning:menu:exams:function:2','training:learning:menu:exams','Phòng chờ','Chức năng','/app/exams/:examId/lobby','Kiểm tra thông tin trước khi thi',NULL,NULL),
('training:learning:menu:exams:function:2:view','training:learning:menu:exams:function:2','Xem danh sách / chi tiết','Quyền thao tác','exams:view','Quyền của Kỳ thi của tôi','exams','view'),
('training:learning:menu:practice','training:learning','Luyện tập','Menu / Màn hình','/app/practice','Thiết lập và làm bài luyện tập',NULL,NULL),
('training:learning:menu:practice:function:0','training:learning:menu:practice','Thiết lập luyện tập','Chức năng','/app/practice','Chọn nội dung và cấu hình luyện tập',NULL,NULL),
('training:learning:menu:practice:function:0:view','training:learning:menu:practice:function:0','Xem danh sách / chi tiết','Quyền thao tác','practice:view','Quyền của Luyện tập','practice','view'),
('training:learning:menu:practice:function:1','training:learning:menu:practice','Làm bài luyện tập','Chức năng','/app/practice/player','Trả lời câu hỏi luyện tập',NULL,NULL),
('training:learning:menu:practice:function:1:run','training:learning:menu:practice:function:1','Luyện tập','Quyền thao tác','practice:run','Quyền của Luyện tập','practice','run'),
('training:learning:menu:knowledge','training:learning','Kho kiến thức','Menu / Màn hình','/app/knowledge','Tra cứu tài liệu và kiến thức',NULL,NULL),
('training:learning:menu:knowledge:function:0','training:learning:menu:knowledge','Kho kiến thức','Chức năng','/app/knowledge','Tra cứu tài liệu và kiến thức',NULL,NULL),
('training:learning:menu:knowledge:function:0:view','training:learning:menu:knowledge:function:0','Xem danh sách / chi tiết','Quyền thao tác','knowledge:view','Quyền của Kho kiến thức','knowledge','view'),
('training:learning:menu:attempts','training:learning','Làm bài thi','Menu / Màn hình','attempts','Vào phòng thi, làm bài và nộp bài',NULL,NULL),
('training:learning:menu:attempts:function:0','training:learning:menu:attempts','Làm bài thi','Chức năng','','Vào phòng thi, làm bài và nộp bài',NULL,NULL),
('training:learning:menu:attempts:function:0:view','training:learning:menu:attempts:function:0','Xem danh sách / chi tiết','Quyền thao tác','attempts:view','Quyền của Làm bài thi','attempts','view'),
('training:learning:menu:attempts:function:0:take','training:learning:menu:attempts:function:0','Làm bài thi','Quyền thao tác','attempts:take','Quyền của Làm bài thi','attempts','take'),
('training:assessment','training','Quản lý đánh giá','Nhóm menu','','questions · assessments · blueprints · exam_levels',NULL,NULL),
('training:assessment:menu:questions','training:assessment','Ngân hàng câu hỏi','Menu / Màn hình','/manage/questions','Thư mục, câu hỏi, nhập câu hỏi và duyệt nội dung',NULL,NULL),
('training:assessment:menu:questions:function:0','training:assessment:menu:questions','Thư mục & Danh sách câu hỏi','Chức năng','/manage/questions','Duyệt thư mục và câu hỏi',NULL,NULL),
('training:assessment:menu:questions:function:0:view','training:assessment:menu:questions:function:0','Xem danh sách / chi tiết','Quyền thao tác','questions:view','Quyền của Ngân hàng câu hỏi','questions','view'),
('training:assessment:menu:questions:function:1','training:assessment:menu:questions','Thêm câu hỏi','Chức năng','/manage/questions/new','Đăng ký câu hỏi',NULL,NULL),
('training:assessment:menu:questions:function:1:create','training:assessment:menu:questions:function:1','Thêm mới','Quyền thao tác','questions:create','Quyền của Ngân hàng câu hỏi','questions','create'),
('training:assessment:menu:questions:function:2','training:assessment:menu:questions','Chỉnh sửa câu hỏi','Chức năng','/manage/questions/:id/edit','Chi tiết, sửa nội dung',NULL,NULL),
('training:assessment:menu:questions:function:2:view','training:assessment:menu:questions:function:2','Xem danh sách / chi tiết','Quyền thao tác','questions:view','Quyền của Ngân hàng câu hỏi','questions','view'),
('training:assessment:menu:questions:function:2:update','training:assessment:menu:questions:function:2','Chỉnh sửa','Quyền thao tác','questions:update','Quyền của Ngân hàng câu hỏi','questions','update'),
('training:assessment:menu:questions:function:3','training:assessment:menu:questions','Nhập câu hỏi','Chức năng','/manage/questions','Hộp thoại nhập hàng loạt',NULL,NULL),
('training:assessment:menu:questions:function:3:view','training:assessment:menu:questions:function:3','Xem danh sách / chi tiết','Quyền thao tác','questions:view','Quyền của Ngân hàng câu hỏi','questions','view'),
('training:assessment:menu:questions:function:3:import','training:assessment:menu:questions:function:3','Nhập dữ liệu','Quyền thao tác','questions:import','Quyền của Ngân hàng câu hỏi','questions','import'),
('training:assessment:menu:questions:function:management','training:assessment:menu:questions','Ngân hàng câu hỏi','Chức năng','/manage/questions','Thư mục, câu hỏi, nhập câu hỏi và duyệt nội dung',NULL,NULL),
('training:assessment:menu:questions:function:management:delete','training:assessment:menu:questions:function:management','Xóa','Quyền thao tác','questions:delete','Quyền của Ngân hàng câu hỏi','questions','delete'),
('training:assessment:menu:questions:function:management:export','training:assessment:menu:questions:function:management','Xuất dữ liệu','Quyền thao tác','questions:export','Quyền của Ngân hàng câu hỏi','questions','export'),
('training:assessment:menu:questions:function:management:approve','training:assessment:menu:questions:function:management','Phê duyệt','Quyền thao tác','questions:approve','Quyền của Ngân hàng câu hỏi','questions','approve'),
('training:assessment:menu:assessments','training:assessment','Quản lý bộ đề','Menu / Màn hình','/manage/assessments','Đăng ký bộ đề, chọn câu hỏi và xuất bản',NULL,NULL),
('training:assessment:menu:assessments:function:0','training:assessment:menu:assessments','Danh sách bộ đề','Chức năng','/manage/assessments','Quản lý bộ đề',NULL,NULL),
('training:assessment:menu:assessments:function:0:view','training:assessment:menu:assessments:function:0','Xem danh sách / chi tiết','Quyền thao tác','assessments:view','Quyền của Quản lý bộ đề','assessments','view'),
('training:assessment:menu:assessments:function:1','training:assessment:menu:assessments','Đăng ký bộ đề','Chức năng','/manage/assessments/new','Đối tượng, ngôn ngữ và câu hỏi',NULL,NULL),
('training:assessment:menu:assessments:function:1:create','training:assessment:menu:assessments:function:1','Thêm mới','Quyền thao tác','assessments:create','Quyền của Quản lý bộ đề','assessments','create'),
('training:assessment:menu:assessments:function:2','training:assessment:menu:assessments','Chi tiết bộ đề','Chức năng','/manage/assessments/:id','Ma trận, xem trước và xuất bản',NULL,NULL),
('training:assessment:menu:assessments:function:2:view','training:assessment:menu:assessments:function:2','Xem danh sách / chi tiết','Quyền thao tác','assessments:view','Quyền của Quản lý bộ đề','assessments','view'),
('training:assessment:menu:assessments:function:2:update','training:assessment:menu:assessments:function:2','Chỉnh sửa','Quyền thao tác','assessments:update','Quyền của Quản lý bộ đề','assessments','update'),
('training:assessment:menu:assessments:function:2:publish','training:assessment:menu:assessments:function:2','Xuất bản','Quyền thao tác','assessments:publish','Quyền của Quản lý bộ đề','assessments','publish'),
('training:assessment:menu:blueprints','training:assessment','Cấu hình bộ đề & luyện tập','Menu / Màn hình','/manage/blueprints','Ma trận đề, điểm đạt và cấu hình luyện tập',NULL,NULL),
('training:assessment:menu:blueprints:function:0','training:assessment:menu:blueprints','Cấu hình bộ đề & luyện tập','Chức năng','/manage/blueprints','Ma trận đề, điểm đạt và cấu hình luyện tập',NULL,NULL),
('training:assessment:menu:blueprints:function:0:view','training:assessment:menu:blueprints:function:0','Xem danh sách / chi tiết','Quyền thao tác','blueprints:view','Quyền của Cấu hình bộ đề & luyện tập','blueprints','view'),
('training:assessment:menu:blueprints:function:0:update','training:assessment:menu:blueprints:function:0','Chỉnh sửa','Quyền thao tác','blueprints:update','Quyền của Cấu hình bộ đề & luyện tập','blueprints','update'),
('training:assessment:menu:exam_levels','training:assessment','Thiết lập cơ chế thi','Menu / Màn hình','/manage/levels','Cơ chế thi và chính sách cấp độ',NULL,NULL),
('training:assessment:menu:exam_levels:function:0','training:assessment:menu:exam_levels','Thiết lập cơ chế thi','Chức năng','/manage/levels','Cơ chế thi và chính sách cấp độ',NULL,NULL),
('training:assessment:menu:exam_levels:function:0:view','training:assessment:menu:exam_levels:function:0','Xem danh sách / chi tiết','Quyền thao tác','exam_levels:view','Quyền của Thiết lập cơ chế thi','exam_levels','view'),
('training:assessment:menu:exam_levels:function:0:update','training:assessment:menu:exam_levels:function:0','Chỉnh sửa','Quyền thao tác','exam_levels:update','Quyền của Thiết lập cơ chế thi','exam_levels','update'),
('training:organization','training','Tổ chức thi & Chấm bài','Nhóm menu','','exam_management · grading · training_groups',NULL,NULL),
('training:organization:menu:exam_management','training:organization','Tổ chức ca thi','Menu / Màn hình','/manage/exams','Tổ chức kỳ thi, ca thi và đối tượng tham gia',NULL,NULL),
('training:organization:menu:exam_management:function:0','training:organization:menu:exam_management','Danh sách ca thi','Chức năng','/manage/exams','Tổ chức kỳ thi và ca thi',NULL,NULL),
('training:organization:menu:exam_management:function:0:view','training:organization:menu:exam_management:function:0','Xem danh sách / chi tiết','Quyền thao tác','exam_management:view','Quyền của Tổ chức ca thi','exam_management','view'),
('training:organization:menu:exam_management:function:0:create','training:organization:menu:exam_management:function:0','Thêm mới','Quyền thao tác','exam_management:create','Quyền của Tổ chức ca thi','exam_management','create'),
('training:organization:menu:exam_management:function:0:update','training:organization:menu:exam_management:function:0','Chỉnh sửa','Quyền thao tác','exam_management:update','Quyền của Tổ chức ca thi','exam_management','update'),
('training:organization:menu:grading','training:organization','Chấm bài thi','Menu / Màn hình','/manage/grading','Hàng đợi và chi tiết chấm bài',NULL,NULL),
('training:organization:menu:grading:function:0','training:organization:menu:grading','Hàng đợi chấm bài','Chức năng','/manage/grading','Danh sách bài cần chấm',NULL,NULL),
('training:organization:menu:grading:function:0:view','training:organization:menu:grading:function:0','Xem danh sách / chi tiết','Quyền thao tác','grading:view','Quyền của Chấm bài thi','grading','view'),
('training:organization:menu:grading:function:1','training:organization:menu:grading','Chi tiết chấm bài','Chức năng','/manage/grading/:submissionId','Chấm điểm và nhận xét',NULL,NULL),
('training:organization:menu:grading:function:1:view','training:organization:menu:grading:function:1','Xem danh sách / chi tiết','Quyền thao tác','grading:view','Quyền của Chấm bài thi','grading','view'),
('training:organization:menu:grading:function:1:update','training:organization:menu:grading:function:1','Chỉnh sửa','Quyền thao tác','grading:update','Quyền của Chấm bài thi','grading','update'),
('training:organization:menu:training_groups','training:organization','Lớp & Nhóm','Menu / Màn hình','/manage/groups','Quản lý lớp và nhóm học',NULL,NULL),
('training:organization:menu:training_groups:function:0','training:organization:menu:training_groups','Lớp & Nhóm','Chức năng','/manage/groups','Quản lý lớp và nhóm học',NULL,NULL),
('training:organization:menu:training_groups:function:0:view','training:organization:menu:training_groups:function:0','Xem danh sách / chi tiết','Quyền thao tác','training_groups:view','Quyền của Lớp & Nhóm','training_groups','view'),
('training:organization:menu:training_groups:function:0:create','training:organization:menu:training_groups:function:0','Thêm mới','Quyền thao tác','training_groups:create','Quyền của Lớp & Nhóm','training_groups','create'),
('training:organization:menu:training_groups:function:0:update','training:organization:menu:training_groups:function:0','Chỉnh sửa','Quyền thao tác','training_groups:update','Quyền của Lớp & Nhóm','training_groups','update'),
('training:reports','training','Báo cáo đào tạo','Nhóm menu','','reports',NULL,NULL),
('training:reports:menu:reports','training:reports','Báo cáo đào tạo','Menu / Màn hình','/manage/reports','Theo dõi và xuất báo cáo đào tạo',NULL,NULL),
('training:reports:menu:reports:function:0','training:reports:menu:reports','Báo cáo đào tạo','Chức năng','/manage/reports','Theo dõi và xuất báo cáo đào tạo',NULL,NULL),
('training:reports:menu:reports:function:0:view','training:reports:menu:reports:function:0','Xem danh sách / chi tiết','Quyền thao tác','reports:view','Quyền của Báo cáo đào tạo','reports','view'),
('training:reports:menu:reports:function:0:export','training:reports:menu:reports:function:0','Xuất dữ liệu','Quyền thao tác','reports:export','Quyền của Báo cáo đào tạo','reports','export'),
('system',NULL,'Hệ thống','Module','','Tài khoản & Phân quyền · Danh mục nghiệp vụ',NULL,NULL),
('system:security','system','Tài khoản & Phân quyền','Nhóm menu','','users · modules',NULL,NULL),
('system:security:menu:users','system:security','Quản lý tài khoản','Menu / Màn hình','/admin/users','Tài khoản, tổ chức và nhóm quyền',NULL,NULL),
('system:security:menu:users:function:0','system:security:menu:users','Tài khoản','Chức năng','/admin/users','Tab tài khoản và đăng ký người dùng',NULL,NULL),
('system:security:menu:users:function:0:view','system:security:menu:users:function:0','Xem danh sách / chi tiết','Quyền thao tác','users:view','Quyền của Quản lý tài khoản','users','view'),
('system:security:menu:users:function:0:create','system:security:menu:users:function:0','Thêm mới','Quyền thao tác','users:create','Quyền của Quản lý tài khoản','users','create'),
('system:security:menu:users:function:0:update','system:security:menu:users:function:0','Chỉnh sửa','Quyền thao tác','users:update','Quyền của Quản lý tài khoản','users','update'),
('system:security:menu:users:function:1','system:security:menu:users','Nhóm quyền','Chức năng','/admin/users','Tab nhóm quyền và điều kiện tự động',NULL,NULL),
('system:security:menu:users:function:1:view','system:security:menu:users:function:1','Xem danh sách / chi tiết','Quyền thao tác','permissions:view','Quyền của Nhóm quyền & Thành viên','permissions','view'),
('system:security:menu:users:function:1:update','system:security:menu:users:function:1','Chỉnh sửa','Quyền thao tác','permissions:update','Quyền của Nhóm quyền & Thành viên','permissions','update'),
('system:security:menu:users:function:2','system:security:menu:users','Tổ chức & Vai trò','Chức năng','/admin/users','Tab danh mục tổ chức',NULL,NULL),
('system:security:menu:users:function:2:view','system:security:menu:users:function:2','Xem danh sách / chi tiết','Quyền thao tác','users:view','Quyền của Quản lý tài khoản','users','view'),
('system:security:menu:users:function:2:update','system:security:menu:users:function:2','Chỉnh sửa','Quyền thao tác','users:update','Quyền của Quản lý tài khoản','users','update'),
('system:security:menu:modules','system:security','Module & Phân quyền','Menu / Màn hình','/admin/modules','Đăng ký module và chức năng',NULL,NULL),
('system:security:menu:modules:function:0','system:security:menu:modules','Menu & Chức năng','Chức năng','/admin/modules','Bảng phân cấp chức năng',NULL,NULL),
('system:security:menu:modules:function:0:view','system:security:menu:modules:function:0','Xem danh sách / chi tiết','Quyền thao tác','modules:view','Quyền của Module & Phân quyền','modules','view'),
('system:security:menu:modules:function:1','system:security:menu:modules','Đăng ký module','Chức năng','/admin/modules','Tab đăng ký module và quyền',NULL,NULL),
('system:security:menu:modules:function:1:view','system:security:menu:modules:function:1','Xem danh sách / chi tiết','Quyền thao tác','modules:view','Quyền của Module & Phân quyền','modules','view'),
('system:security:menu:modules:function:1:create','system:security:menu:modules:function:1','Thêm mới','Quyền thao tác','modules:create','Quyền của Module & Phân quyền','modules','create'),
('system:security:menu:modules:function:1:update','system:security:menu:modules:function:1','Chỉnh sửa','Quyền thao tác','modules:update','Quyền của Module & Phân quyền','modules','update'),
('system:security:menu:modules:function:1:delete','system:security:menu:modules:function:1','Xóa','Quyền thao tác','modules:delete','Quyền của Module & Phân quyền','modules','delete'),
('system:security:menu:modules:function:1:import','system:security:menu:modules:function:1','Nhập dữ liệu','Quyền thao tác','modules:import','Quyền của Module & Phân quyền','modules','import'),
('system:security:menu:modules:function:1:export','system:security:menu:modules:function:1','Xuất dữ liệu','Quyền thao tác','modules:export','Quyền của Module & Phân quyền','modules','export'),
('system:security:menu:modules:function:2','system:security:menu:modules','Nhóm quyền & Thành viên','Chức năng','/admin/modules','Tab nhóm quyền, mẫu và gán hàng loạt',NULL,NULL),
('system:security:menu:modules:function:2:view','system:security:menu:modules:function:2','Xem danh sách / chi tiết','Quyền thao tác','permissions:view','Quyền của Nhóm quyền & Thành viên','permissions','view'),
('system:security:menu:modules:function:2:update','system:security:menu:modules:function:2','Chỉnh sửa','Quyền thao tác','permissions:update','Quyền của Nhóm quyền & Thành viên','permissions','update'),
('system:catalog','system','Danh mục nghiệp vụ','Nhóm menu','','catalog',NULL,NULL),
('system:catalog:menu:catalog','system:catalog','Danh mục hệ thống','Menu / Màn hình','/admin/catalog','Đăng ký danh mục nghiệp vụ dùng chung',NULL,NULL),
('system:catalog:menu:catalog:function:0','system:catalog:menu:catalog','Cấp bậc','Chức năng','/admin/catalog','Tab cấp bậc',NULL,NULL),
('system:catalog:menu:catalog:function:0:view','system:catalog:menu:catalog:function:0','Xem danh sách / chi tiết','Quyền thao tác','catalog:view','Quyền của Danh mục hệ thống','catalog','view'),
('system:catalog:menu:catalog:function:0:create','system:catalog:menu:catalog:function:0','Thêm mới','Quyền thao tác','catalog:create','Quyền của Danh mục hệ thống','catalog','create'),
('system:catalog:menu:catalog:function:0:update','system:catalog:menu:catalog:function:0','Chỉnh sửa','Quyền thao tác','catalog:update','Quyền của Danh mục hệ thống','catalog','update'),
('system:catalog:menu:catalog:function:1','system:catalog:menu:catalog','Phòng ban','Chức năng','/admin/catalog','Tab phòng ban',NULL,NULL),
('system:catalog:menu:catalog:function:1:view','system:catalog:menu:catalog:function:1','Xem danh sách / chi tiết','Quyền thao tác','catalog:view','Quyền của Danh mục hệ thống','catalog','view'),
('system:catalog:menu:catalog:function:1:create','system:catalog:menu:catalog:function:1','Thêm mới','Quyền thao tác','catalog:create','Quyền của Danh mục hệ thống','catalog','create'),
('system:catalog:menu:catalog:function:1:update','system:catalog:menu:catalog:function:1','Chỉnh sửa','Quyền thao tác','catalog:update','Quyền của Danh mục hệ thống','catalog','update'),
('system:catalog:menu:catalog:function:2','system:catalog:menu:catalog','Vị trí / Nhóm đối tượng','Chức năng','/admin/catalog','Tab vị trí',NULL,NULL),
('system:catalog:menu:catalog:function:2:view','system:catalog:menu:catalog:function:2','Xem danh sách / chi tiết','Quyền thao tác','catalog:view','Quyền của Danh mục hệ thống','catalog','view'),
('system:catalog:menu:catalog:function:2:create','system:catalog:menu:catalog:function:2','Thêm mới','Quyền thao tác','catalog:create','Quyền của Danh mục hệ thống','catalog','create'),
('system:catalog:menu:catalog:function:2:update','system:catalog:menu:catalog:function:2','Chỉnh sửa','Quyền thao tác','catalog:update','Quyền của Danh mục hệ thống','catalog','update'),
('system:catalog:menu:catalog:function:3','system:catalog:menu:catalog','Vai trò nghiệp vụ','Chức năng','/admin/catalog','Tab vai trò',NULL,NULL),
('system:catalog:menu:catalog:function:3:view','system:catalog:menu:catalog:function:3','Xem danh sách / chi tiết','Quyền thao tác','catalog:view','Quyền của Danh mục hệ thống','catalog','view'),
('system:catalog:menu:catalog:function:3:create','system:catalog:menu:catalog:function:3','Thêm mới','Quyền thao tác','catalog:create','Quyền của Danh mục hệ thống','catalog','create'),
('system:catalog:menu:catalog:function:3:update','system:catalog:menu:catalog:function:3','Chỉnh sửa','Quyền thao tác','catalog:update','Quyền của Danh mục hệ thống','catalog','update'),
('system:catalog:menu:catalog:function:4','system:catalog:menu:catalog','Ngôn ngữ','Chức năng','/admin/catalog','Tab ngôn ngữ',NULL,NULL),
('system:catalog:menu:catalog:function:4:view','system:catalog:menu:catalog:function:4','Xem danh sách / chi tiết','Quyền thao tác','catalog:view','Quyền của Danh mục hệ thống','catalog','view'),
('system:catalog:menu:catalog:function:4:create','system:catalog:menu:catalog:function:4','Thêm mới','Quyền thao tác','catalog:create','Quyền của Danh mục hệ thống','catalog','create'),
('system:catalog:menu:catalog:function:4:update','system:catalog:menu:catalog:function:4','Chỉnh sửa','Quyền thao tác','catalog:update','Quyền của Danh mục hệ thống','catalog','update'),
('system:catalog:menu:catalog:function:5','system:catalog:menu:catalog','Cấp độ ISA-95','Chức năng','/admin/catalog','Tab cấp độ',NULL,NULL),
('system:catalog:menu:catalog:function:5:view','system:catalog:menu:catalog:function:5','Xem danh sách / chi tiết','Quyền thao tác','catalog:view','Quyền của Danh mục hệ thống','catalog','view'),
('system:catalog:menu:catalog:function:5:create','system:catalog:menu:catalog:function:5','Thêm mới','Quyền thao tác','catalog:create','Quyền của Danh mục hệ thống','catalog','create'),
('system:catalog:menu:catalog:function:5:update','system:catalog:menu:catalog:function:5','Chỉnh sửa','Quyền thao tác','catalog:update','Quyền của Danh mục hệ thống','catalog','update'),
('personal',NULL,'Chung & Cá nhân','Module','','Tiện ích cá nhân',NULL,NULL),
('personal:utilities','personal','Tiện ích cá nhân','Nhóm menu','','Tổng quan · Cài đặt cá nhân · Thông báo',NULL,NULL),
('personal:utilities:menu:dashboard','personal:utilities','Tổng quan','Menu / Màn hình','/app','Trang tổng quan',NULL,NULL),
('personal:utilities:menu:dashboard:function:0','personal:utilities:menu:dashboard','Quản lý Tổng quan','Chức năng','/app','Trang tổng quan',NULL,NULL),
('personal:utilities:menu:settings','personal:utilities','Cài đặt cá nhân','Menu / Màn hình','/app/settings','Hồ sơ cá nhân · Hiển thị & Múi giờ · Nhật ký hoạt động của tôi',NULL,NULL),
('personal:utilities:menu:settings:function:0','personal:utilities:menu:settings','Quản lý Cài đặt cá nhân','Chức năng','/app/settings','Hồ sơ cá nhân · Hiển thị & Múi giờ · Nhật ký hoạt động của tôi',NULL,NULL),
('personal:utilities:menu:notifications','personal:utilities','Thông báo','Menu / Màn hình','/notifications','Trung tâm thông báo',NULL,NULL),
('personal:utilities:menu:notifications:function:0','personal:utilities:menu:notifications','Quản lý Thông báo','Chức năng','/notifications','Trung tâm thông báo',NULL,NULL) ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id,label=excluded.label,kind=excluded.kind,route=excluded.route,description=excluded.description,scope_key=excluded.scope_key,action=excluded.action;`

type PermissionNode struct {
	ID          string  `json:"id"`
	ParentID    *string `json:"parent_id"`
	Label       string  `json:"label"`
	Kind        string  `json:"kind"`
	Route       string  `json:"route"`
	Description string  `json:"description"`
	ScopeKey    *string `json:"scope_key"`
	Action      *string `json:"action"`
}

func loadPermissionHierarchy(ctx context.Context, db *sqlx.DB) ([]PermissionNode, error) {
	rows, e := db.QueryContext(ctx, `SELECT id,parent_id,label,kind,route,description,scope_key,action FROM skillhub_permission_nodes ORDER BY id`)
	if e != nil {
		return nil, e
	}
	defer rows.Close()
	out := []PermissionNode{}
	for rows.Next() {
		var node PermissionNode
		if e = rows.Scan(&node.ID, &node.ParentID, &node.Label, &node.Kind, &node.Route, &node.Description, &node.ScopeKey, &node.Action); e != nil {
			return nil, e
		}
		out = append(out, node)
	}
	return out, rows.Err()
}
