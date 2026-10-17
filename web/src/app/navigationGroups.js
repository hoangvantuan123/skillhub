import { House, BookOpen, Folder, Boxes } from 'lucide-react';

// Stable navigation order, independent of module registration order.
export const navigationGroups = [
  { id: 'learning', label: 'Học tập', shortLabel: 'Học tập', icon: BookOpen, items: ['learning', 'exams', 'practice', 'knowledge'] },
  { id: 'training', label: 'Quản lý đào tạo', shortLabel: 'Đào tạo', icon: Folder, items: ['manage-questions', 'manage-assessments', 'manage-blueprints', 'manage-levels', 'manage-exams', 'manage-grading', 'manage-groups', 'manage-reports'] },
  { id: 'system', label: 'Quản trị hệ thống', shortLabel: 'Quản trị', icon: Boxes, items: ['admin-users', 'admin-modules', 'admin-catalog'] },
];

export function visibleNavigation(navigation, user, hasPermission) {
  return navigation.filter(item => item.permission ? hasPermission(item.permission) : !item.roles?.length || item.roles.includes(user?.role));
}

export function groupedNavigation(items) {
  return navigationGroups.map(group => ({ ...group, entries: group.items.map(id => items.find(item => item.id === id)).filter(Boolean) })).filter(group => group.entries.length);
}

