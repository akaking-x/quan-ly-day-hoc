import type { Language } from '../store/languageStore';

// Common translations used across the app
export const common: Record<string, Record<Language, string>> = {
  // General
  appName: { vi: 'Quản lý đóng tiền', en: 'Tuition Management' },
  version: { vi: 'Phiên bản', en: 'Version' },
  loading: { vi: 'Đang tải...', en: 'Loading...' },
  save: { vi: 'Lưu', en: 'Save' },
  cancel: { vi: 'Hủy bỏ', en: 'Cancel' },
  delete: { vi: 'Xóa', en: 'Delete' },
  edit: { vi: 'Sửa', en: 'Edit' },
  add: { vi: 'Thêm', en: 'Add' },
  search: { vi: 'Tìm kiếm', en: 'Search' },
  filter: { vi: 'Lọc', en: 'Filter' },
  all: { vi: 'Tất cả', en: 'All' },
  confirm: { vi: 'Xác nhận', en: 'Confirm' },
  yes: { vi: 'Có', en: 'Yes' },
  no: { vi: 'Không', en: 'No' },
  download: { vi: 'Tải xuống', en: 'Download' },

  // Navigation
  overview: { vi: 'Tổng quan', en: 'Overview' },
  students: { vi: 'Học sinh', en: 'Students' },
  classes: { vi: 'Lớp học', en: 'Classes' },
  attendance: { vi: 'Điểm danh', en: 'Attendance' },
  payments: { vi: 'Học phí', en: 'Payments' },
  notes: { vi: 'Ghi chú', en: 'Notes' },
  guide: { vi: 'Hướng dẫn', en: 'Guide' },
  settings: { vi: 'Cài đặt', en: 'Settings' },
  users: { vi: 'Người dùng', en: 'Users' },
  mainMenu: { vi: 'Menu chính', en: 'Main Menu' },

  // Status
  present: { vi: 'Có mặt', en: 'Present' },
  absent: { vi: 'Vắng', en: 'Absent' },
  late: { vi: 'Đi muộn', en: 'Late' },
  excused: { vi: 'Có phép', en: 'Excused' },

  // Session types
  scheduled: { vi: 'Lịch cố định', en: 'Scheduled' },
  makeup: { vi: 'Học bù', en: 'Makeup' },

  // Note types
  daily: { vi: 'Hàng ngày', en: 'Daily' },
  general: { vi: 'Chung', en: 'General' },

  // Actions
  pin: { vi: 'Ghim', en: 'Pin' },
  unpin: { vi: 'Bỏ ghim', en: 'Unpin' },
  pinned: { vi: 'Đã ghim', en: 'Pinned' },
};

// Notes page translations
export const notesPage: Record<string, Record<Language, string>> = {
  title: { vi: 'Ghi chú', en: 'Notes' },
  description: { vi: 'Quản lý ghi chú và checklist', en: 'Manage notes and checklists' },
  addNote: { vi: 'Thêm ghi chú', en: 'Add Note' },
  searchPlaceholder: { vi: 'Tìm kiếm ghi chú...', en: 'Search notes...' },
  pinnedNotes: { vi: 'Ghi chú đã ghim', en: 'Pinned Notes' },
  allNotes: { vi: 'Tất cả ghi chú', en: 'All Notes' },
  noNotes: { vi: 'Chưa có ghi chú', en: 'No notes yet' },
  noNotesDesc: { vi: 'Tạo ghi chú đầu tiên để lưu lại những điều quan trọng', en: 'Create your first note to save important information' },
  createNote: { vi: 'Tạo ghi chú', en: 'Create Note' },
  editNote: { vi: 'Chỉnh sửa ghi chú', en: 'Edit Note' },
  addNewNote: { vi: 'Thêm ghi chú mới', en: 'Add New Note' },
  titleOptional: { vi: 'Tiêu đề (tùy chọn)', en: 'Title (optional)' },
  titlePlaceholder: { vi: 'Nhập tiêu đề ghi chú...', en: 'Enter note title...' },
  quickAdd: { vi: 'Thêm nhanh', en: 'Quick Add' },
  addCheckbox: { vi: '+ Checkbox', en: '+ Checkbox' },
  addSampleChecklist: { vi: '+ Checklist mẫu', en: '+ Sample Checklist' },
  addFullTemplate: { vi: '+ Template đầy đủ', en: '+ Full Template' },
  addTable: { vi: '+ Bảng', en: '+ Table' },
  contentRequired: { vi: 'Nội dung *', en: 'Content *' },
  contentPlaceholder: { vi: 'Nhập nội dung ghi chú... (hỗ trợ Markdown)', en: 'Enter note content... (supports Markdown)' },
  markdownHint: { vi: 'Hỗ trợ Markdown: **đậm**, *nghiêng*, - [ ] checkbox, # tiêu đề, | bảng |', en: 'Supports Markdown: **bold**, *italic*, - [ ] checkbox, # heading, | table |' },
  type: { vi: 'Loại', en: 'Type' },
  tagsLabel: { vi: 'Tags (phân cách bởi dấu phẩy)', en: 'Tags (comma separated)' },
  tagsPlaceholder: { vi: 'vd: lớp 10, toán, quan trọng', en: 'e.g.: class 10, math, important' },
  update: { vi: 'Cập nhật', en: 'Update' },
  deleteNote: { vi: 'Xóa ghi chú', en: 'Delete Note' },
  deleteConfirm: { vi: 'Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.', en: 'Are you sure you want to delete this note? This action cannot be undone.' },

  // Toast messages
  loadError: { vi: 'Lỗi khi tải ghi chú', en: 'Error loading notes' },
  updateSuccess: { vi: 'Cập nhật ghi chú thành công', en: 'Note updated successfully' },
  createSuccess: { vi: 'Tạo ghi chú thành công', en: 'Note created successfully' },
  deleteSuccess: { vi: 'Xóa ghi chú thành công', en: 'Note deleted successfully' },
  error: { vi: 'Có lỗi xảy ra', en: 'An error occurred' },
  pinnedSuccess: { vi: 'Đã ghim ghi chú', en: 'Note pinned' },
  unpinnedSuccess: { vi: 'Đã bỏ ghim', en: 'Note unpinned' },

  // Checklist templates
  prepareExam: { vi: 'Soạn đề kiểm tra', en: 'Prepare exam' },
  prepareMaterials: { vi: 'Chuẩn bị tài liệu', en: 'Prepare materials' },
  printExercises: { vi: 'In bài tập', en: 'Print exercises' },
  todoSection: { vi: 'Việc cần làm', en: 'To-do' },
  rememberSection: { vi: 'Ghi nhớ', en: 'Remember' },
  noteSection: { vi: 'Lưu ý', en: 'Notes' },
  studentCol: { vi: 'Học sinh', en: 'Student' },
  exerciseCol: { vi: 'Bài tập', en: 'Exercise' },
  scoreCol: { vi: 'Điểm', en: 'Score' },
};

// Attendance page translations
export const attendancePage: Record<string, Record<Language, string>> = {
  title: { vi: 'Điểm danh', en: 'Attendance' },
  description: { vi: 'Quản lý buổi học và điểm danh', en: 'Manage sessions and attendance' },
  duplicateWeek: { vi: 'Nhân bản tuần', en: 'Duplicate Week' },
  addSession: { vi: 'Thêm buổi học', en: 'Add Session' },
  longPressHint: { vi: 'Nhấn giữ vào ngày để chọn tuần cần nhân bản', en: 'Long press on a day to select week for duplication' },
  sessionsForDay: { vi: 'Buổi học ngày', en: 'Sessions for' },
  workload: { vi: 'Khối lượng công việc', en: 'Workload' },
  sessions: { vi: 'buổi', en: 'sessions' },
  teachingHours: { vi: 'giờ dạy', en: 'teaching hours' },
  maxHours: { vi: 'tối đa', en: 'max' },
  noSessions: { vi: 'Không có buổi học', en: 'No sessions' },
  addSessionForDay: { vi: 'Thêm buổi học cho ngày này', en: 'Add session for this day' },
  dailyNotes: { vi: 'Ghi chú trong ngày', en: 'Daily Notes' },
  noNotes: { vi: 'Chưa có ghi chú', en: 'No notes yet' },
  addNote: { vi: 'Thêm ghi chú', en: 'Add Note' },
  markdownHint: { vi: 'Hỗ trợ Markdown: **đậm**, *nghiêng*, - [ ] checkbox, - danh sách, # tiêu đề', en: 'Supports Markdown: **bold**, *italic*, - [ ] checkbox, - list, # heading' },
  notePlaceholder: { vi: 'Nhập ghi chú cho ngày này... (hỗ trợ Markdown)', en: 'Enter notes for this day... (supports Markdown)' },
  noteSaved: { vi: 'Đã lưu ghi chú', en: 'Note saved' },
  noteSaveError: { vi: 'Lỗi khi lưu ghi chú', en: 'Error saving note' },
  selectedWeek: { vi: 'Tuần đã chọn', en: 'Selected Week' },
  deselect: { vi: 'Bỏ chọn', en: 'Deselect' },
  duplicate: { vi: 'Nhân bản', en: 'Duplicate' },

  // Add session modal
  addNewSession: { vi: 'Thêm buổi học mới', en: 'Add New Session' },
  date: { vi: 'Ngày', en: 'Date' },
  sessionType: { vi: 'Loại', en: 'Type' },
  startTime: { vi: 'Giờ bắt đầu', en: 'Start Time' },
  endTime: { vi: 'Giờ kết thúc', en: 'End Time' },
  subject: { vi: 'Môn học *', en: 'Subject *' },
  subjectPlaceholder: { vi: 'VD: Toán, Lý, Hóa...', en: 'e.g.: Math, Physics, Chemistry...' },
  selectClass: { vi: 'Lớp học', en: 'Class' },
  noClassSelected: { vi: 'Không chọn lớp', en: 'No class selected' },
  selectStudents: { vi: 'Học sinh', en: 'Students' },
  sessionNotes: { vi: 'Ghi chú', en: 'Notes' },
  additionalInfo: { vi: 'Thông tin bổ sung...', en: 'Additional information...' },
  createSession: { vi: 'Tạo buổi học', en: 'Create Session' },
  sessionCreated: { vi: 'Tạo buổi học thành công', en: 'Session created successfully' },
  enterSubject: { vi: 'Vui lòng nhập môn học', en: 'Please enter subject' },
  selectClassOrStudent: { vi: 'Vui lòng chọn lớp hoặc học sinh', en: 'Please select class or students' },

  // Attendance modal
  attendanceTitle: { vi: 'Điểm danh', en: 'Attendance' },
  saveAttendance: { vi: 'Lưu điểm danh', en: 'Save Attendance' },
  attendanceSaved: { vi: 'Lưu điểm danh thành công', en: 'Attendance saved successfully' },

  // Duplicate modal
  duplicateTitle: { vi: 'Nhân bản tuần', en: 'Duplicate Week' },
  duplicateInfo: { vi: 'Các buổi học trong tuần này sẽ được sao chép sang các tuần tiếp theo.', en: 'Sessions from this week will be copied to the following weeks.' },
  numberOfWeeks: { vi: 'Số tuần cần nhân bản', en: 'Number of weeks to duplicate' },
  weeksPlaceholder: { vi: 'VD: 4', en: 'e.g.: 4' },
  duplicateDesc: { vi: 'Các buổi học sẽ được tạo cho', en: 'Sessions will be created for' },
  weeksFollowing: { vi: 'tuần tiếp theo', en: 'following weeks' },
  startingFrom: { vi: 'bắt đầu từ tuần sau tuần đã chọn.', en: 'starting from the week after the selected one.' },
  processing: { vi: 'Đang xử lý...', en: 'Processing...' },
  duplicateSuccess: { vi: 'Đã tạo', en: 'Created' },
  newSessions: { vi: 'buổi học mới', en: 'new sessions' },
};

// Sidebar translations
export const sidebar: Record<string, Record<Language, string>> = {
  mainMenu: { vi: 'Menu chính', en: 'Main Menu' },
  overview: { vi: 'Tổng quan', en: 'Overview' },
  students: { vi: 'Học sinh', en: 'Students' },
  classes: { vi: 'Lớp học', en: 'Classes' },
  attendance: { vi: 'Điểm danh', en: 'Attendance' },
  payments: { vi: 'Học phí', en: 'Payments' },
  notes: { vi: 'Ghi chú', en: 'Notes' },
  guide: { vi: 'Hướng dẫn', en: 'Guide' },
  settings: { vi: 'Cài đặt', en: 'Settings' },
  users: { vi: 'Người dùng', en: 'Users' },
  version: { vi: 'Phiên bản', en: 'Version' },
};
