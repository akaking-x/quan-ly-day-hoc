import { useEffect, useState, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Button,
  Input,
  Modal,
  Card,
  CardBody,
  Badge,
  ConfirmDialog,
} from '../components/common';
import { offlineNoteApi } from '../services/offlineApi';
import type { Note } from '../types';

// Interactive checkbox component
interface InteractiveCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

const InteractiveCheckbox = ({ checked, onChange }: InteractiveCheckboxProps) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="appearance-none w-4 h-4 border-2 border-gray-400 dark:border-gray-500 rounded cursor-pointer bg-transparent checked:bg-blue-500 checked:border-blue-500 relative
    before:content-[''] before:absolute before:left-[3px] before:top-[0px] before:w-[5px] before:h-[9px] before:border-white before:border-r-2 before:border-b-2 before:rotate-45 before:opacity-0 checked:before:opacity-100"
  />
);

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'general' | 'daily'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [modifiedNotes, setModifiedNotes] = useState<Record<string, string>>({}); // Track modified note contents

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as 'general' | 'daily',
    tags: '',
  });

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType !== 'all') params.type = filterType;

      const res = await offlineNoteApi.getAll(params);
      if (res.success && res.data) {
        setNotes(res.data);
      }
    } catch {
      toast.error('Lỗi khi tải ghi chú');
    }
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Date filter logic
  const getDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'week':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        if (customDateFrom && customDateTo) {
          return { start: parseISO(customDateFrom), end: parseISO(customDateTo) };
        }
        return null;
      default:
        return null;
    }
  }, [dateFilter, customDateFrom, customDateTo]);

  const filteredNotes = notes.filter((note) => {
    // Type filter
    if (filterType !== 'all' && note.type !== filterType) return false;

    // Date filter
    if (getDateRange) {
      const noteDate = new Date(note.date);
      if (!isWithinInterval(noteDate, { start: getDateRange.start, end: getDateRange.end })) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.content.toLowerCase().includes(query) ||
        note.title?.toLowerCase().includes(query) ||
        note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  // Handle checkbox toggle in a note
  const handleCheckboxToggle = (noteId: string, originalContent: string, lineIndex: number) => {
    const lines = (modifiedNotes[noteId] || originalContent).split('\n');
    const line = lines[lineIndex];

    // Toggle checkbox
    if (line.includes('- [ ]')) {
      lines[lineIndex] = line.replace('- [ ]', '- [x]');
    } else if (line.includes('- [x]')) {
      lines[lineIndex] = line.replace('- [x]', '- [ ]');
    }

    const newContent = lines.join('\n');
    setModifiedNotes(prev => ({ ...prev, [noteId]: newContent }));
  };

  // Save modified note
  const saveModifiedNote = async (noteId: string) => {
    const content = modifiedNotes[noteId];
    if (!content) return;

    try {
      await offlineNoteApi.update(noteId, { content });
      toast.success('Đã lưu thay đổi');
      setModifiedNotes(prev => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
      loadNotes();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Cancel modifications
  const cancelModifications = (noteId: string) => {
    setModifiedNotes(prev => {
      const newState = { ...prev };
      delete newState[noteId];
      return newState;
    });
  };

  const openAddModal = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      type: 'general',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content,
      type: note.type,
      tags: note.tags?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title || undefined,
      content: formData.content,
      type: formData.type,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      date: new Date().toISOString(),
    };

    try {
      if (editingNote) {
        await offlineNoteApi.update(editingNote._id, data);
        toast.success('Cập nhật ghi chú thành công');
      } else {
        await offlineNoteApi.create(data);
        toast.success('Tạo ghi chú thành công');
      }
      setIsModalOpen(false);
      loadNotes();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await offlineNoteApi.delete(deleteId);
      toast.success('Xóa ghi chú thành công');
      setDeleteId(null);
      loadNotes();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await offlineNoteApi.togglePin(note._id);
      toast.success(note.pinned ? 'Đã bỏ ghim' : 'Đã ghim ghi chú');
      loadNotes();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const insertChecklist = (template: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + (prev.content ? '\n' : '') + template,
    }));
  };

  // Render content with interactive checkboxes
  const renderInteractiveContent = (note: Note) => {
    const content = modifiedNotes[note._id] || note.content;
    const lines = content.split('\n');
    const hasCheckboxes = content.includes('- [ ]') || content.includes('- [x]');

    if (!hasCheckboxes) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      );
    }

    // Render with interactive checkboxes
    return (
      <div className="space-y-1">
        {lines.map((line, index) => {
          const isUnchecked = line.includes('- [ ]');
          const isChecked = line.includes('- [x]');

          if (isUnchecked || isChecked) {
            const textContent = line.replace(/- \[[ x]\]\s*/, '');
            return (
              <div key={index} className="flex items-start gap-2 group">
                <InteractiveCheckbox
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle(note._id, note.content, index)}
                />
                <span className={`text-sm ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {textContent}
                </span>
              </div>
            );
          }

          // Render non-checkbox lines with markdown
          if (line.trim()) {
            return (
              <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{line}</ReactMarkdown>
              </div>
            );
          }
          return <div key={index} className="h-2" />;
        })}
      </div>
    );
  };

  const NoteCard = ({ note }: { note: Note }) => {
    const isModified = !!modifiedNotes[note._id];

    return (
      <Card className={`transition-all hover:shadow-lg ${note.pinned ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''} ${isModified ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
        <CardBody>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {note.title && (
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {note.title}
                </h3>
              )}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={note.type === 'daily' ? 'primary' : 'gray'}>
                  {note.type === 'daily' ? 'Hàng ngày' : 'Chung'}
                </Badge>
                {note.pinned && (
                  <Badge variant="warning">Ghim</Badge>
                )}
                {isModified && (
                  <Badge variant="primary">Đã sửa</Badge>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(note.date), 'dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
              {renderInteractiveContent(note)}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Save/Cancel buttons when modified */}
              {isModified && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button size="sm" onClick={() => saveModifiedNote(note._id)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Lưu
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => cancelModifications(note._id)}>
                    Hủy
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleTogglePin(note)}
                className={`p-2 rounded-xl transition-colors ${
                  note.pinned
                    ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50'
                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                }`}
                title={note.pinned ? 'Bỏ ghim' : 'Ghim'}
              >
                <svg className="w-4 h-4" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button
                onClick={() => openEditModal(note)}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                title="Sửa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteId(note._id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                title="Xóa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ghi chú</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý ghi chú và checklist</p>
        </div>
        <Button onClick={openAddModal}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm ghi chú
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="space-y-4">
          {/* Search and Type Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm ghi chú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'general', 'daily'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'all' ? 'Tất cả' : type === 'general' ? 'Chung' : 'Hàng ngày'}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lọc theo ngày:
            </span>
            <div className="flex flex-wrap gap-2">
              {(['all', 'today', 'week', 'month', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dateFilter === filter
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter === 'all' ? 'Tất cả' :
                   filter === 'today' ? 'Hôm nay' :
                   filter === 'week' ? 'Tuần này' :
                   filter === 'month' ? 'Tháng này' : 'Tùy chỉnh'}
                </button>
              ))}
            </div>
            {dateFilter === 'custom' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Ghi chú đã ghim
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* All Notes */}
      <div>
        {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tất cả ghi chú</h2>
        )}
        {unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có ghi chú</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Tạo ghi chú đầu tiên để lưu lại những điều quan trọng</p>
                <Button onClick={openAddModal}>Tạo ghi chú</Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinnedNotes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Tiêu đề (tùy chọn)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nhập tiêu đề ghi chú..."
          />

          {/* Quick checklist buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thêm nhanh</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => insertChecklist('- [ ] ')}
                className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
              >
                + Checkbox
              </button>
              <button
                type="button"
                onClick={() => insertChecklist('- [ ] Soạn đề kiểm tra\n- [ ] Chuẩn bị tài liệu\n- [ ] In bài tập')}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
              >
                + Checklist mẫu
              </button>
              <button
                type="button"
                onClick={() => insertChecklist('## Việc cần làm\n- [ ] \n\n## Ghi nhớ\n- \n\n## Lưu ý\n- ')}
                className="px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
              >
                + Template đầy đủ
              </button>
              <button
                type="button"
                onClick={() => insertChecklist('| Học sinh | Bài tập | Điểm |\n|----------|---------|------|\n| | | |')}
                className="px-3 py-1.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900 transition-colors"
              >
                + Bảng
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội dung *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Nhập nội dung ghi chú... (hỗ trợ Markdown)"
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hỗ trợ Markdown: **đậm**, *nghiêng*, - [ ] checkbox, # tiêu đề, | bảng |
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'general' | 'daily' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">Chung</option>
                <option value="daily">Hàng ngày</option>
              </select>
            </div>
            <Input
              label="Tags (phân cách bởi dấu phẩy)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="vd: lớp 10, toán, quan trọng"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit">
              {editingNote ? 'Cập nhật' : 'Tạo ghi chú'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa ghi chú"
        message="Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác."
      />
    </div>
  );
}
