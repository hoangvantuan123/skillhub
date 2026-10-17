import React, { useState } from 'react';
import useAttributeCatalog from '../../../shared/hooks/useAttributeCatalog';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import Select from '../../../shared/ui/Select';
import { mockSubjects, mockGroups } from '../../../mocks/mockData';
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, Database } from 'lucide-react';

export default function BatchImportQuestionsModal({ open, onClose, onImportSuccess }) {
  const levelCatalog = useAttributeCatalog('level');
  const [selectedSubject, setSelectedSubject] = useState('sub-mes');
  const [selectedGroup, setSelectedGroup] = useState('grp-mes');
  const [defaultLevel, setDefaultLevel] = useState('L2');
  const [isCriticalDefault, setIsCriticalDefault] = useState(false);
  const [rawText, setRawText] = useState('');
  const [previewList, setPreviewList] = useState([]);
  const [importing, setImporting] = useState(false);

  // Sample batch text template
  const sampleTemplate = `[CÂU HỎI 1]
Level: L0
Format: theory
Điểm liệt: Có
Nội dung: Đấu nối cảm biến tiệm cận quang 3 dây (NPN NO) vào module Digital Input PLC. Dây mang tải (Tín hiệu Output Black) được cấp vào cực nào của tải?
A: Cực dương (+24VDC)
B: Cực âm (0VDC)
C: Nối đất PE trực tiếp
D: Cực xoay chiều 220VAC
Đáp án đúng: A
Giải thích: Cảm biến NPN là dạng Sink Output, đóng mạch về 0VDC khi tác động, do đó tải phải được nối giữa +24VDC và dây tín hiệu Black. Nối nhầm 220VAC sẽ làm nổ module DI.

[CÂU HỎI 2]
Level: L1
Format: case_study
Điểm liệt: Không
Nội dung: Dây chuyền chiết rót tự động gặp lỗi lệch vị trí dừng chai 15mm khi tăng tốc độ từ 60 lên 90 chai/phút. Kỹ sư cần hiệu chỉnh tham số gì trên biến tần (Inverter) và PLC?
A: Tăng thời gian giảm tốc (Deceleration time) lên gấp 3
B: Bổ sung chức năng bù quán tính (Inertia Compensation) và dùng ngắt phần cứng (Hardware Interrupt) đọc Encoder
C: Tắt nguồn toàn bộ tủ điện và vận hành thủ công
D: Giảm điện áp cấp vào động cơ xuống 110V
Đáp án đúng: B
Giải thích: Ở tốc độ cao, chu kỳ quét (Scan cycle) thông thường của PLC không kịp bắt sườn tín hiệu, cần chuyển ngắt đọc xung Encoder tốc độ cao (HSC) và chỉnh dốc giảm tốc Inverter.

[CÂU HỎI 3]
Level: L2
Format: simulation_hmi
Điểm liệt: Không
Nội dung: [THAO TÁC MÔ PHỎNG SCADA/HMI] Trạm trộn số 04 đang ở trạng thái Standby. Thao tác kích hoạt điều độ mẻ tự động: Đổi chế độ sang AUTO, chọn bồn Tank 02 và cài Setpoint 1200 rpm.
A: Thao tác đúng quy trình điều độ MES L3 xuống SCADA L2
B: Để nguyên chế độ Manual rồi ấn chạy
C: Chọn Tank 01 và không cài Setpoint
D: Không kích hoạt điều độ
Đáp án đúng: A
Giải thích: Bắt buộc chuyển AUTO để liên động logic an toàn trước khi nạp Setpoint từ MES xuống PLC.

[CÂU HỎI 4]
Level: L3
Format: critical_safety
Điểm liệt: Có
Nội dung: [ĐIỂM LIỆT TRUY VẾT LÔ HÀNG] Phát hiện 1 mẻ thuốc kháng sinh bị nhiễm khuẩn chéo do van rửa CIP hỏng. Trách nhiệm bắt buộc tức thời của kỹ sư MES trên hệ thống là gì?
A: Xóa lịch sử mẻ hàng khỏi cơ sở dữ liệu để tránh bị trừ KPI
B: Khóa phong tỏa điện tử (Electronic Quarantine/Hold) toàn bộ lô thành phẩm và kích hoạt truy ngược gia phả (Genealogy Backward Trace)
C: Tiếp tục cho đóng gói và xuất bán bình thường
D: Chờ hết ca làm việc mới báo cáo qua tin nhắn
Đáp án đúng: B
Giải thích: Điểm liệt chất lượng tuyệt đối trong MES/GMP: Phải khóa điện tử tức thì (Hold status) ngăn xuất kho, và truy ngược toàn bộ nguyên vật liệu cùng lô liên quan.`;

  const handleLoadSample = () => {
    setRawText(sampleTemplate);
    parseRawText(sampleTemplate);
  };

  const parseRawText = (text) => {
    if (!text.trim()) {
      setPreviewList([]);
      return;
    }

    const blocks = text.split(/\[CÂU HỎI \d+\]/i).filter((b) => b.trim());
    const parsed = blocks.map((block, idx) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      let level = defaultLevel;
      let format = 'theory';
      let isCritical = isCriticalDefault;
      let content = '';
      let options = [];
      let correctAnswer = 'A';
      let explanation = '';

      lines.forEach((line) => {
        if (line.toLowerCase().startsWith('level:')) {
          level = line.split(':')[1]?.trim() || defaultLevel;
        } else if (line.toLowerCase().startsWith('format:')) {
          format = line.split(':')[1]?.trim() || 'theory';
        } else if (line.toLowerCase().startsWith('điểm liệt:')) {
          isCritical = line.toLowerCase().includes('có') || line.toLowerCase().includes('true');
        } else if (line.toLowerCase().startsWith('nội dung:')) {
          content = line.substring(line.indexOf(':') + 1).trim();
        } else if (/^[A-D]:/i.test(line)) {
          const letter = line.charAt(0).toUpperCase();
          const optText = line.substring(2).trim();
          options.push({ letter, text: optText });
        } else if (line.toLowerCase().startsWith('đáp án đúng:')) {
          correctAnswer = line.split(':')[1]?.trim()?.toUpperCase() || 'A';
        } else if (line.toLowerCase().startsWith('giải thích:')) {
          explanation = line.substring(line.indexOf(':') + 1).trim();
        }
      });

      return {
        id: `q-import-${Date.now()}-${idx + 1}`,
        subjectId: selectedSubject,
        targetGroup: selectedGroup,
        level,
        format,
        isCritical,
        content: content || `Câu hỏi nhập số ${idx + 1}`,
        options: options.map((opt) => ({
          id: `opt-${Math.random().toString(36).substring(2, 7)}`,
          text: opt.text,
          isCorrect: opt.letter === correctAnswer,
        })),
        explanation,
        status: 'published',
        version: 1,
        author: 'Ban Khảo thí & MES Lead',
        updatedAt: new Date().toISOString(),
      };
    });

    setPreviewList(parsed);
  };

  const handleExecuteImport = async () => {
    if (previewList.length === 0) {
      alert('Vui lòng nhập hoặc dán nội dung câu hỏi trước khi import!');
      return;
    }

    if (levelCatalog.loading || levelCatalog.error || previewList.some(row => !levelCatalog.options.some(option => option.value === row.level && option.active && option.value !== 'All'))) {
      alert('Có câu hỏi sử dụng cấp độ không có trong danh mục hoặc đã ngừng sử dụng. Vui lòng kiểm tra mã Level.');
      return;
    }
    setImporting(true);
    try {
      if (onImportSuccess) {
        await onImportSuccess(previewList);
      }
      onClose();
    } catch (e) {
      alert('Lỗi khi import: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nhập hàng loạt câu hỏi & Thiết lập câu Điểm liệt"
      width="900px"
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Database}
            loading={importing}
            disabled={previewList.length === 0}
            onClick={handleExecuteImport}
          >
            Nhập {previewList.length} câu hỏi vào Ngân hàng
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-xs text-slate-800 dark:text-slate-200">
        {/* Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-md bg-slate-50/50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Chuyên môn áp dụng:
            </label>
            <Select
              size="sm"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={mockSubjects.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nhóm đối tượng áp dụng:
            </label>
            <Select
              size="sm"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              options={mockGroups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {levelCatalog.label || 'Cấp độ'} mặc định:
            </label>
            <Select
              size="sm"
              value={defaultLevel}
              onChange={(e) => setDefaultLevel(e.target.value)}
              disabled={levelCatalog.loading || !!levelCatalog.error}
              options={levelCatalog.optionsFor(defaultLevel, { includeAll: false })}
            />
          </div>
        </div>

        {/* Action Header for Raw Input */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Dán nội dung cấu trúc (Hỗ trợ Level, Format, Điểm liệt & Đáp án A-D):
          </span>
          <Button size="sm" variant="secondary" icon={Sparkles} onClick={handleLoadSample}>
            Nạp mẫu nhanh 4 câu MES chuẩn
          </Button>
        </div>

        {/* Text Area */}
        <textarea
          rows={7}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            parseRawText(e.target.value);
          }}
          placeholder="Dán nội dung các câu hỏi tại đây theo mẫu [CÂU HỎI 1], Level: L0, Format: theory, Điểm liệt: Có..."
          className="w-full p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
        />

        {/* Live Preview Section */}
        {previewList.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
              <strong className="text-xs font-semibold text-slate-900 dark:text-white">
                Xem trước dữ liệu phân tích ({previewList.length} câu hỏi):
              </strong>
              <div className="flex gap-2">
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  ⚡ {previewList.filter((p) => p.isCritical).length} câu Điểm liệt
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  🎮 {previewList.filter((p) => p.format === 'simulation_hmi').length} câu Mô phỏng HMI
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-auto border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50/80 dark:bg-slate-950 text-left border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-2.5">STT</th>
                    <th className="p-2.5">Cấp Level</th>
                    <th className="p-2.5">Điểm liệt</th>
                    <th className="p-2.5">Dạng câu</th>
                    <th className="p-2.5">Nội dung câu hỏi</th>
                    <th className="p-2.5">Số đáp án</th>
                  </tr>
                </thead>
                <tbody>
                  {previewList.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-semibold">#{idx + 1}</td>
                      <td className="p-2.5">
                        <span className={`badge-level badge-level-${item.level?.toLowerCase()}`}>
                          {levelCatalog.labelFor(item.level)}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {item.isCritical ? (
                          <span className="badge-critical">⚡ Điểm liệt</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300 font-medium">
                        {item.format === 'simulation_hmi' ? '🎮 Mô phỏng HMI' : item.format === 'case_study' ? '💼 Case tình huống' : '📚 Lý thuyết'}
                      </td>
                      <td className="p-2.5 min-w-64 max-w-[400px] whitespace-pre-wrap break-words">
                        {item.content}
                      </td>
                      <td className="p-2.5 text-blue-600 dark:text-blue-400 font-semibold">
                        {item.options.length} phương án
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
