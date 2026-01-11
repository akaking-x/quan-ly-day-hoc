import { useState } from 'react';
import { Card, CardBody } from '../components/common';

type Language = 'vi' | 'en';

interface GuideContent {
  title: string;
  description: string;
  sections: {
    id: string;
    title: string;
    icon: JSX.Element;
    content: JSX.Element;
  }[];
}

const guideContent: Record<Language, GuideContent> = {
  vi: {
    title: 'Hướng dẫn sử dụng',
    description: 'Tìm hiểu cách sử dụng ứng dụng hiệu quả',
    sections: [
      {
        id: 'overview',
        title: 'Tổng quan',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Ứng dụng quản lý đóng tiền giúp bạn theo dõi học sinh, lớp học, điểm danh và học phí một cách dễ dàng.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Tính năng chính</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Quản lý thông tin học sinh</li>
                  <li>• Quản lý lớp học và lịch dạy</li>
                  <li>• Điểm danh và theo dõi buổi học</li>
                  <li>• Quản lý thu học phí</li>
                  <li>• Ghi chú hàng ngày</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Lợi ích</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>• Tiết kiệm thời gian quản lý</li>
                  <li>• Theo dõi công nợ chính xác</li>
                  <li>• Báo cáo thu nhập rõ ràng</li>
                  <li>• Lưu trữ dữ liệu an toàn</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'students',
        title: 'Quản lý học sinh',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Thêm học sinh mới</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Vào trang <span className="font-medium text-blue-600 dark:text-blue-400">Học sinh</span> từ menu</li>
              <li>Nhấn nút <span className="font-medium">Thêm học sinh</span></li>
              <li>Điền đầy đủ thông tin: Tên, Số điện thoại, Trường, Lớp, Học phí/buổi</li>
              <li>Chọn loại hình học (Cá nhân hoặc Nhóm)</li>
              <li>Nhấn <span className="font-medium">Thêm học sinh</span> để lưu</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Tìm kiếm học sinh</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Sử dụng thanh tìm kiếm ở đầu trang để tìm học sinh theo tên. Bạn cũng có thể lọc theo loại hình học hoặc lớp.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Xem chi tiết học sinh</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nhấn vào một học sinh để xem chi tiết bao gồm: lịch sử điểm danh, các khoản thanh toán, và tình trạng công nợ.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Theo dõi tiến độ học sinh</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Trong trang chi tiết học sinh, có tab <span className="font-medium text-blue-600">Ghi chú</span> để theo dõi tiến độ. Bạn có thể đánh giá tình trạng học sinh:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Yếu</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Trung bình</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Khá</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Giỏi</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">Xuất sắc</span>
            </div>
          </div>
        ),
      },
      {
        id: 'groups',
        title: 'Quản lý lớp học',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Tạo lớp học mới</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Vào trang <span className="font-medium text-blue-600 dark:text-blue-400">Lớp học</span></li>
              <li>Nhấn <span className="font-medium">Thêm lớp</span></li>
              <li>Nhập tên lớp, năm học, và học phí mặc định</li>
              <li>Thiết lập lịch học cố định (ngày trong tuần, giờ bắt đầu/kết thúc, môn học)</li>
              <li>Lưu lại để hoàn tất</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Thêm học sinh vào lớp</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Trong trang chi tiết lớp, nhấn <span className="font-medium">Thêm học sinh</span> và chọn từ danh sách học sinh hiện có hoặc tạo mới.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Chuyển lớp qua năm mới</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Sử dụng tính năng <span className="font-medium">Chuyển năm</span> để tự động tạo lớp mới cho năm học tiếp theo và tăng cấp lớp cho học sinh.
            </p>
          </div>
        ),
      },
      {
        id: 'attendance',
        title: 'Điểm danh',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Lịch theo kiểu</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Trang điểm danh hiển thị lịch tháng với chỉ báo khối lượng công việc:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li><span className="text-yellow-500">Vàng nhạt</span>: 0-25% khối lượng</li>
              <li><span className="text-yellow-600">Vàng đậm</span>: 26-50% khối lượng</li>
              <li><span className="text-orange-500">Cam</span>: 51-75% khối lượng</li>
              <li><span className="text-red-500">Đỏ</span>: 76-100% khối lượng</li>
            </ul>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Thêm buổi học</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Nhấn <span className="font-medium">Thêm buổi học</span></li>
              <li>Chọn ngày, giờ, môn học</li>
              <li>Chọn lớp hoặc chọn học sinh riêng lẻ</li>
              <li>Lưu để tạo buổi học</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Nhân bản tuần</h4>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Nhấn giữ</span> vào một ngày để chọn tuần, sau đó dùng tính năng <span className="font-medium">Nhân bản tuần</span> để sao chép lịch dạy cho các tuần tiếp theo.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Chọn nhiều ngày</h4>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Shift + Click</span> để chọn nhiều ngày liên tiếp, hoặc <span className="font-medium">kéo chuột/vuốt</span> để chọn vùng. Sau khi chọn 1 ngày, bấm <span className="font-medium text-purple-600">Chọn tuần này</span> để chọn cả tuần.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Ghi chú hàng ngày</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Mỗi ngày có phần ghi chú riêng để bạn lưu lại những việc cần làm (soạn đề, chuẩn bị tài liệu...). Hỗ trợ Markdown và checklist tương tác.</p>
          </div>
        ),
      },
      {
        id: 'payments',
        title: 'Quản lý học phí',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Ghi nhận thanh toán</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Vào trang <span className="font-medium text-blue-600 dark:text-blue-400">Học phí</span></li>
              <li>Nhấn <span className="font-medium">Thêm thanh toán</span></li>
              <li>Chọn học sinh và nhập số tiền</li>
              <li>Chọn thời gian thanh toán và phương thức (tiền mặt/chuyển khoản)</li>
              <li>Lưu để hoàn tất</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Theo dõi công nợ</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Hệ thống tự động tính toán công nợ dựa trên số buổi học và số tiền đã thu. Học sinh còn nợ sẽ hiển thị trong mục <span className="font-medium text-red-600 dark:text-red-400">Cần nhắc đóng tiền</span> trên trang Tổng quan.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Báo cáo thu nhập</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Biểu đồ trên trang Tổng quan hiển thị thu nhập 6 tháng gần nhất để bạn theo dõi xu hướng.
            </p>
          </div>
        ),
      },
      {
        id: 'notes',
        title: 'Ghi chú',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Các loại ghi chú</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li><span className="font-medium">Ghi chú hàng ngày</span>: Gắn với một ngày cụ thể, hiển thị trong trang điểm danh</li>
              <li><span className="font-medium">Ghi chú chung</span>: Không gắn với ngày, dùng để lưu ý tưởng, kế hoạch...</li>
            </ul>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Sử dụng Markdown</h4>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 font-mono text-sm space-y-1">
              <p className="text-gray-700 dark:text-gray-300">**In đậm**</p>
              <p className="text-gray-700 dark:text-gray-300">*In nghiêng*</p>
              <p className="text-gray-700 dark:text-gray-300"># Tiêu đề</p>
              <p className="text-gray-700 dark:text-gray-300">- Danh sách</p>
              <p className="text-gray-700 dark:text-gray-300">- [ ] Checkbox chưa chọn</p>
              <p className="text-gray-700 dark:text-gray-300">- [x] Checkbox đã chọn</p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Checklist nhanh</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Khi viết ghi chú, sử dụng các nút <span className="font-medium text-blue-600">+ Checkbox</span>, <span className="font-medium text-green-600">+ Checklist mẫu</span>, <span className="font-medium text-purple-600">+ Template</span> để chèn nhanh các mẫu checklist.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Ghim ghi chú</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nhấn biểu tượng <span className="font-medium">đánh dấu</span> để ghim ghi chú quan trọng lên đầu danh sách.
            </p>
          </div>
        ),
      },
      {
        id: 'student-portal',
        title: 'Cổng học sinh',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Giới thiệu</h4>
              <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                Cổng học sinh cho phép học sinh tự xem lịch học và tình trạng đóng học phí của mình thông qua mã học sinh 8 ký tự.
              </p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">Mã học sinh</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Mỗi học sinh có một mã riêng gồm 8 ký tự (chữ và số), được tự động tạo khi thêm học sinh. Bạn có thể xem và sao chép mã này:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li>Trong danh sách học sinh - click vào mã để sao chép</li>
              <li>Trong trang chi tiết học sinh</li>
            </ul>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Học sinh truy cập cổng</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Từ trang đăng nhập, bấm <span className="font-medium text-emerald-600">"Tôi là học sinh"</span></li>
              <li>Hoặc truy cập trực tiếp đường dẫn <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">/student</code></li>
              <li>Nhập mã học sinh 8 ký tự</li>
              <li>Xem lịch học và tình trạng học phí</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Tính năng cổng học sinh</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">Xem lịch học</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">30 ngày gần đây và sắp tới</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <p className="font-medium text-green-800 dark:text-green-300 text-sm">Tình trạng học phí</p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-1">Còn nợ / Đã đóng đủ / Dư</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <p className="font-medium text-purple-800 dark:text-purple-300 text-sm">Link học online</p>
                <p className="text-purple-700 dark:text-purple-400 text-xs mt-1">Truy cập nhanh vào lớp học</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <p className="font-medium text-orange-800 dark:text-orange-300 text-sm">Lịch sử điểm danh</p>
                <p className="text-orange-700 dark:text-orange-400 text-xs mt-1">Có mặt / Vắng / Muộn</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'online-link',
        title: 'Link học online',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Bạn có thể thêm link học online (Zoom, Google Meet, Microsoft Teams...) vào mỗi buổi học để học sinh dễ dàng truy cập.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white">Thêm link khi tạo buổi học</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Trong trang Điểm danh, nhấn <span className="font-medium">Thêm buổi học</span></li>
              <li>Điền các thông tin buổi học</li>
              <li>Ở mục <span className="font-medium text-blue-600">"Link học online"</span>, dán link Zoom/Meet/Teams</li>
              <li>Lưu buổi học</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Học sinh truy cập</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Khi học sinh đăng nhập vào cổng học sinh, các buổi học có link online sẽ hiển thị nút <span className="font-medium text-blue-600">"Vào lớp học online"</span> để truy cập nhanh.
            </p>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl mt-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Lưu ý</h4>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• Link chỉ hiển thị cho các buổi học sắp tới (không hiện cho buổi đã qua)</li>
                <li>• Hỗ trợ tất cả các nền tảng: Zoom, Google Meet, Microsoft Teams, Webex...</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'offline',
        title: 'Chế độ Offline',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Giới thiệu</h4>
              <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                Ứng dụng hỗ trợ chế độ offline, cho phép bạn tiếp tục làm việc ngay cả khi không có kết nối internet. Dữ liệu sẽ được đồng bộ tự động khi có mạng trở lại.
              </p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">Kiểm tra trạng thái mạng</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Biểu tượng trạng thái mạng nằm ở <span className="font-medium text-blue-600">thanh menu trên cùng</span> (bên cạnh nút chế độ sáng/tối):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span className="text-green-700 dark:text-green-400 text-sm font-medium">Online - Đã kết nối</span>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
                <span className="text-red-700 dark:text-red-400 text-sm font-medium">Offline - Mất kết nối</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center gap-3">
                <div className="relative">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="text-amber-700 dark:text-amber-400 text-sm font-medium">Chờ đồng bộ - Nhấn để đồng bộ</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-blue-700 dark:text-blue-400 text-sm font-medium">Đang đồng bộ dữ liệu...</span>
              </div>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Tải dữ liệu offline</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Vào <span className="font-medium text-blue-600">Cài đặt</span></li>
              <li>Tìm phần <span className="font-medium">"Tải offline"</span></li>
              <li>Nhấn <span className="font-medium">Tải dữ liệu offline</span> để lưu tất cả dữ liệu vào bộ nhớ thiết bị</li>
              <li>Sau khi tải xong, bạn có thể sử dụng ứng dụng khi không có mạng</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Các trang hỗ trợ offline</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Tổng quan</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Học sinh</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Lớp học</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Điểm danh</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Học phí</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Ghi chú</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-yellow-600 dark:text-yellow-400">~</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Cài đặt</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-red-600 dark:text-red-400">✗</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Người dùng</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ✓ Đầy đủ tính năng | ~ Hạn chế một số tính năng | ✗ Yêu cầu kết nối mạng
            </p>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl mt-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Lưu ý quan trọng</h4>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• Khi offline, dữ liệu mới sẽ được lưu cục bộ và đồng bộ khi có mạng</li>
                <li>• Nếu có thay đổi chờ đồng bộ, biểu tượng sẽ chuyển sang màu vàng</li>
                <li>• Nhấn vào biểu tượng để đồng bộ thủ công khi có mạng</li>
                <li>• Khuyến nghị tải dữ liệu offline định kỳ để có dữ liệu mới nhất</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'notifications',
        title: 'Thông báo trước giờ học',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Giới thiệu</h4>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                Tính năng thông báo giúp học sinh được nhắc nhở trước mỗi buổi học. Hỗ trợ cả thông báo và âm thanh, có thể tùy chỉnh thời gian nhắc.
              </p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">Bật thông báo</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Đăng nhập vào <span className="font-medium text-emerald-600">Cổng học sinh</span></li>
              <li>Nhấn vào biểu tượng <span className="font-medium">⚙️ Cài đặt</span> ở góc trên bên phải</li>
              <li>Tìm phần <span className="font-medium text-blue-600">"Thông báo"</span></li>
              <li>Bật công tắc <span className="font-medium">"Bật thông báo"</span></li>
              <li>Cho phép quyền thông báo khi trình duyệt yêu cầu</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Tùy chỉnh cài đặt</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <p className="font-medium text-purple-800 dark:text-purple-300 text-sm">Thời gian nhắc</p>
                <p className="text-purple-700 dark:text-purple-400 text-xs mt-1">5, 10, 15, hoặc 30 phút trước giờ học</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <p className="font-medium text-orange-800 dark:text-orange-300 text-sm">Âm thanh</p>
                <p className="text-orange-700 dark:text-orange-400 text-xs mt-1">Bật/tắt chuông nhắc nhở</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <p className="font-medium text-green-800 dark:text-green-300 text-sm">Test thông báo</p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-1">Nhấn nút để thử thông báo mẫu</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">Test âm thanh</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">Nhấn nút để nghe chuông mẫu</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl mt-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Lưu ý cho iPhone/iPad</h4>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• Trên iOS, bạn cần <span className="font-medium">thêm ứng dụng vào màn hình chính</span> để nhận thông báo</li>
                <li>• Mở Safari → Nhấn nút Chia sẻ → Chọn "Thêm vào màn hình chính"</li>
                <li>• Mở ứng dụng từ màn hình chính và bật thông báo</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Khắc phục sự cố</h4>
              <ul className="text-red-700 dark:text-red-400 text-sm space-y-1">
                <li>• <span className="font-medium">Không nhận được thông báo?</span> Kiểm tra quyền thông báo trong cài đặt trình duyệt</li>
                <li>• <span className="font-medium">Âm thanh không kêu?</span> Kiểm tra âm lượng thiết bị và tắt chế độ im lặng</li>
                <li>• <span className="font-medium">Cần giữ ứng dụng mở?</span> Không cần, thông báo sẽ hoạt động ngay cả khi đóng tab (trên Android/Desktop)</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'tips',
        title: 'Mẹo sử dụng',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Chế độ tối (Dark Mode)</h4>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Nhấn biểu tượng mặt trời/mặt trăng ở góc trên bên phải để chuyển đổi chế độ sáng/tối. Cổng học sinh cũng hỗ trợ dark mode.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Phím tắt</h4>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                Trên máy tính, sử dụng thanh tìm kiếm để nhanh chóng tìm học sinh hoặc lớp học mà không cần cuộn trang.
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Sao lưu & Khôi phục dữ liệu</h4>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Vào <span className="font-medium">Cài đặt</span> để xuất và nhập backup dữ liệu. Backup bao gồm: Học sinh, Lớp học, Buổi học, Thanh toán. Khuyến nghị sao lưu định kỳ.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Sử dụng trên điện thoại</h4>
              <p className="text-purple-700 dark:text-purple-400 text-sm">
                Ứng dụng được tối ưu hóa cho cả máy tính và điện thoại. Trên điện thoại, sử dụng thanh menu ở cuối màn hình để chuyển trang.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'support',
        title: 'Liên hệ hỗ trợ',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Nếu bạn gặp vấn đề hoặc cần hỗ trợ khi sử dụng ứng dụng, vui lòng liên hệ theo thông tin dưới đây.
            </p>

            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Số điện thoại hỗ trợ</p>
                  <a href="tel:0977040868" className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 hover:underline">
                    0977 040 868
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Thời gian hỗ trợ</h4>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Thứ 2 - Thứ 7: 8:00 - 22:00<br />
                  Chủ nhật: 9:00 - 18:00
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Các vấn đề hỗ trợ</h4>
                <ul className="text-purple-700 dark:text-purple-400 text-sm space-y-1">
                  <li>• Hướng dẫn sử dụng</li>
                  <li>• Khôi phục dữ liệu</li>
                  <li>• Báo lỗi ứng dụng</li>
                  <li>• Góp ý tính năng mới</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  en: {
    title: 'User Guide',
    description: 'Learn how to use the application effectively',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              The tuition management app helps you track students, classes, attendance, and fees easily.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Main Features</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Manage student information</li>
                  <li>• Manage classes and schedules</li>
                  <li>• Track attendance and sessions</li>
                  <li>• Manage tuition payments</li>
                  <li>• Daily notes</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Benefits</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>• Save management time</li>
                  <li>• Track debts accurately</li>
                  <li>• Clear income reports</li>
                  <li>• Secure data storage</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'students',
        title: 'Student Management',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Add New Student</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to <span className="font-medium text-blue-600 dark:text-blue-400">Students</span> page from menu</li>
              <li>Click <span className="font-medium">Add Student</span> button</li>
              <li>Fill in details: Name, Phone, School, Grade, Fee per session</li>
              <li>Select learning type (Individual or Group)</li>
              <li>Click <span className="font-medium">Add Student</span> to save</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Search Students</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Use the search bar at the top to find students by name. You can also filter by learning type or class.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">View Student Details</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Click on a student to view details including: attendance history, payments, and debt status.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Track Student Progress</h4>
            <p className="text-gray-700 dark:text-gray-300">
              In student detail page, use the <span className="font-medium text-blue-600">Notes</span> tab to track progress. You can rate student status:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Weak</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Average</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Good</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Excellent</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">Outstanding</span>
            </div>
          </div>
        ),
      },
      {
        id: 'groups',
        title: 'Class Management',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Create New Class</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to <span className="font-medium text-blue-600 dark:text-blue-400">Classes</span> page</li>
              <li>Click <span className="font-medium">Add Class</span></li>
              <li>Enter class name, school year, and default fee</li>
              <li>Set fixed schedule (day, start/end time, subject)</li>
              <li>Save to finish</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Add Students to Class</h4>
            <p className="text-gray-700 dark:text-gray-300">
              In class detail page, click <span className="font-medium">Add Student</span> and select from existing students or create new.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Advance to New Year</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Use <span className="font-medium">Advance Year</span> feature to automatically create new class for next school year and upgrade student grades.
            </p>
          </div>
        ),
      },
      {
        id: 'attendance',
        title: 'Attendance',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Calendar View</h4>
            <p className="text-gray-700 dark:text-gray-300">
              The attendance page shows monthly calendar with workload indicators:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li><span className="text-yellow-500">Light Yellow</span>: 0-25% workload</li>
              <li><span className="text-yellow-600">Dark Yellow</span>: 26-50% workload</li>
              <li><span className="text-orange-500">Orange</span>: 51-75% workload</li>
              <li><span className="text-red-500">Red</span>: 76-100% workload</li>
            </ul>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Add Session</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Click <span className="font-medium">Add Session</span></li>
              <li>Select date, time, subject</li>
              <li>Choose class or select individual students</li>
              <li>Save to create session</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Duplicate Week</h4>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Long press</span> on a day to select a week, then use <span className="font-medium">Duplicate Week</span> to copy schedule to following weeks.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Multi-Day Selection</h4>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Shift + Click</span> to select multiple consecutive days, or <span className="font-medium">drag</span> to select a range. After selecting 1 day, click <span className="font-medium text-purple-600">Select This Week</span> to select the entire week.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Daily Notes</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Each day has its own notes section to save tasks (prepare tests, materials...). Supports Markdown and interactive checklists.</p>
          </div>
        ),
      },
      {
        id: 'payments',
        title: 'Payment Management',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Record Payment</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to <span className="font-medium text-blue-600 dark:text-blue-400">Payments</span> page</li>
              <li>Click <span className="font-medium">Add Payment</span></li>
              <li>Select student and enter amount</li>
              <li>Choose payment date and method (cash/transfer)</li>
              <li>Save to complete</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Track Debts</h4>
            <p className="text-gray-700 dark:text-gray-300">
              The system automatically calculates debts based on sessions attended and payments received. Students with debt appear in <span className="font-medium text-red-600 dark:text-red-400">Payment Reminders</span> on Dashboard.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Income Reports</h4>
            <p className="text-gray-700 dark:text-gray-300">
              The chart on Dashboard shows income for the last 6 months to track trends.
            </p>
          </div>
        ),
      },
      {
        id: 'notes',
        title: 'Notes',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Note Types</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li><span className="font-medium">Daily Notes</span>: Attached to specific date, shown in attendance page</li>
              <li><span className="font-medium">General Notes</span>: Not date-specific, for ideas, plans...</li>
            </ul>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Using Markdown</h4>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 font-mono text-sm space-y-1">
              <p className="text-gray-700 dark:text-gray-300">**Bold text**</p>
              <p className="text-gray-700 dark:text-gray-300">*Italic text*</p>
              <p className="text-gray-700 dark:text-gray-300"># Heading</p>
              <p className="text-gray-700 dark:text-gray-300">- List item</p>
              <p className="text-gray-700 dark:text-gray-300">- [ ] Unchecked checkbox</p>
              <p className="text-gray-700 dark:text-gray-300">- [x] Checked checkbox</p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Quick Checklist</h4>
            <p className="text-gray-700 dark:text-gray-300">
              When writing notes, use <span className="font-medium text-blue-600">+ Checkbox</span>, <span className="font-medium text-green-600">+ Sample Checklist</span>, <span className="font-medium text-purple-600">+ Template</span> buttons to quickly insert checklist templates.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Pin Notes</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Click the <span className="font-medium">pin</span> icon to pin important notes to the top of the list.
            </p>
          </div>
        ),
      },
      {
        id: 'student-portal',
        title: 'Student Portal',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Introduction</h4>
              <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                Student Portal allows students to view their schedule and payment status using their unique 8-character student code.
              </p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">Student Code</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Each student has a unique 8-character code (letters and numbers), automatically generated when adding a student. You can view and copy this code:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li>In student list - click code to copy</li>
              <li>In student detail page</li>
            </ul>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Student Access</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>From login page, click <span className="font-medium text-emerald-600">"I am a student"</span></li>
              <li>Or directly access <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">/student</code></li>
              <li>Enter 8-character student code</li>
              <li>View schedule and payment status</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Portal Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">View Schedule</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">Past 30 days and upcoming</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <p className="font-medium text-green-800 dark:text-green-300 text-sm">Payment Status</p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-1">Debt / Paid / Credit</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <p className="font-medium text-purple-800 dark:text-purple-300 text-sm">Online Class Link</p>
                <p className="text-purple-700 dark:text-purple-400 text-xs mt-1">Quick access to class</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <p className="font-medium text-orange-800 dark:text-orange-300 text-sm">Attendance History</p>
                <p className="text-orange-700 dark:text-orange-400 text-xs mt-1">Present / Absent / Late</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'online-link',
        title: 'Online Class Links',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Add online class links (Zoom, Google Meet, Microsoft Teams...) to sessions for easy student access.
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-white">Adding Links When Creating Session</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>In Attendance page, click <span className="font-medium">Add Session</span></li>
              <li>Fill in session details</li>
              <li>In <span className="font-medium text-blue-600">"Online Class Link"</span> field, paste your Zoom/Meet/Teams link</li>
              <li>Save the session</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Student Access</h4>
            <p className="text-gray-700 dark:text-gray-300">
              When students log into the portal, sessions with online links will show a <span className="font-medium text-blue-600">"Join Online Class"</span> button.
            </p>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl mt-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Note</h4>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• Links only show for upcoming sessions (not past ones)</li>
                <li>• Supports all platforms: Zoom, Google Meet, Microsoft Teams, Webex...</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'offline',
        title: 'Offline Mode',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Introduction</h4>
              <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                The app supports offline mode, allowing you to continue working even without an internet connection. Data will be automatically synced when you reconnect.
              </p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">Check Network Status</h4>
            <p className="text-gray-700 dark:text-gray-300">
              The network status icon is located in the <span className="font-medium text-blue-600">top menu bar</span> (next to the theme toggle button):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span className="text-green-700 dark:text-green-400 text-sm font-medium">Online - Connected</span>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
                <span className="text-red-700 dark:text-red-400 text-sm font-medium">Offline - Disconnected</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-amber-700 dark:text-amber-400 text-sm font-medium">Pending sync - Click to sync</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-blue-700 dark:text-blue-400 text-sm font-medium">Syncing data...</span>
              </div>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Download Offline Data</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to <span className="font-medium text-blue-600">Settings</span></li>
              <li>Find the <span className="font-medium">"Download Offline"</span> section</li>
              <li>Click <span className="font-medium">Download Offline Data</span> to save all data to device storage</li>
              <li>Once downloaded, you can use the app without internet</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Pages Supporting Offline</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Dashboard</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Students</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Classes</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Attendance</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Payments</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Notes</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-yellow-600 dark:text-yellow-400">~</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Settings</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <span className="text-red-600 dark:text-red-400">✗</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Users</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ✓ Full features | ~ Limited features | ✗ Requires internet
            </p>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl mt-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Important Notes</h4>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• When offline, new data is saved locally and synced when connected</li>
                <li>• If there are pending changes, the icon turns yellow</li>
                <li>• Click the icon to manually sync when online</li>
                <li>• Recommended to download offline data regularly for latest data</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'notifications',
        title: 'Class Reminders',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Introduction</h4>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                The notification feature helps students get reminders before each class. Supports both notifications and sounds, with customizable reminder times.
              </p>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">Enable Notifications</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Log in to <span className="font-medium text-emerald-600">Student Portal</span></li>
              <li>Click on the <span className="font-medium">⚙️ Settings</span> icon in the top right corner</li>
              <li>Find the <span className="font-medium text-blue-600">"Notifications"</span> section</li>
              <li>Toggle <span className="font-medium">"Enable Notifications"</span> on</li>
              <li>Allow notification permission when browser prompts</li>
            </ol>

            <h4 className="font-semibold text-gray-900 dark:text-white mt-6">Customize Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <p className="font-medium text-purple-800 dark:text-purple-300 text-sm">Reminder Time</p>
                <p className="text-purple-700 dark:text-purple-400 text-xs mt-1">5, 10, 15, or 30 minutes before class</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <p className="font-medium text-orange-800 dark:text-orange-300 text-sm">Sound</p>
                <p className="text-orange-700 dark:text-orange-400 text-xs mt-1">Enable/disable reminder sound</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <p className="font-medium text-green-800 dark:text-green-300 text-sm">Test Notification</p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-1">Click button to try sample notification</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">Test Sound</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">Click button to hear sample sound</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl mt-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Note for iPhone/iPad</h4>
              <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <li>• On iOS, you need to <span className="font-medium">add the app to home screen</span> to receive notifications</li>
                <li>• Open Safari → Tap Share button → Select "Add to Home Screen"</li>
                <li>• Open the app from home screen and enable notifications</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Troubleshooting</h4>
              <ul className="text-red-700 dark:text-red-400 text-sm space-y-1">
                <li>• <span className="font-medium">Not receiving notifications?</span> Check notification permissions in browser settings</li>
                <li>• <span className="font-medium">Sound not playing?</span> Check device volume and silent mode</li>
                <li>• <span className="font-medium">Need to keep app open?</span> No, notifications work even with closed tabs (on Android/Desktop)</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'tips',
        title: 'Usage Tips',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Dark Mode</h4>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Click the sun/moon icon in the top right corner to toggle light/dark mode. Student portal also supports dark mode.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Quick Search</h4>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                On desktop, use the search bar to quickly find students or classes without scrolling.
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Backup & Restore Data</h4>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Go to <span className="font-medium">Settings</span> to export and import backup data. Backup includes: Students, Classes, Sessions, Payments. Regular backups recommended.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Mobile Usage</h4>
              <p className="text-purple-700 dark:text-purple-400 text-sm">
                The app is optimized for both desktop and mobile. On mobile, use the bottom menu bar to navigate.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'support',
        title: 'Contact Support',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              If you encounter any issues or need assistance while using the app, please contact us using the information below.
            </p>

            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Support Phone Number</p>
                  <a href="tel:0977040868" className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 hover:underline">
                    0977 040 868
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Support Hours</h4>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Mon - Sat: 8:00 AM - 10:00 PM<br />
                  Sunday: 9:00 AM - 6:00 PM
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">We Can Help With</h4>
                <ul className="text-purple-700 dark:text-purple-400 text-sm space-y-1">
                  <li>• Usage guidance</li>
                  <li>• Data recovery</li>
                  <li>• Bug reports</li>
                  <li>• Feature suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
};

export function Guide() {
  const [activeSection, setActiveSection] = useState('overview');
  const [language, setLanguage] = useState<Language>('vi');

  const content = guideContent[language];
  const currentSection = content.sections.find((s) => s.id === activeSection) || content.sections[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{content.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{content.description}</p>
        </div>
        {/* Language Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setLanguage('vi')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              language === 'vi'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tiếng Việt
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-2">
              <nav className="space-y-1">
                {content.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {section.icon}
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </CardBody>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {currentSection.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentSection.title}</h2>
              </div>
              {currentSection.content}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
