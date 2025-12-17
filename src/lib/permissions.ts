import { UserRole, User } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/server';

// ==================== 권한 타입 ====================

export type Permission =
  | 'task:read'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:manage_resources'
  | 'task:manage_answer'
  | 'task:view_submissions'
  | 'board:read'
  | 'board:write'
  | 'board:delete_any'
  | 'question:read'
  | 'question:write'
  | 'question:delete_any'
  | 'doc:read'
  | 'doc:write'
  | 'doc:delete'
  | 'member:read'
  | 'member:manage'
  | 'submission:create'
  | 'submission:read_own'
  | 'submission:read_all'
  | 'submission:delete'
  | 'admin:access'
  | 'admin:manage_roles';

// ==================== 역할별 권한 ====================

export const rolePermissions: Record<UserRole, Permission[]> = {
  user: [
    'task:read',
    'board:read',
    'board:write',
    'question:read',
    'question:write',
    'doc:read',
    'doc:write',
    'member:read',
    'submission:create',
    'submission:read_own',
  ],
  creator: [
    'task:read',
    'task:create',
    'task:edit', // 본인 과제만
    'task:manage_resources', // 본인 과제만
    'task:manage_answer', // 본인 과제만
    'task:view_submissions', // 본인 과제만
    'board:read',
    'board:write',
    'question:read',
    'question:write',
    'doc:read',
    'doc:write',
    'member:read',
    'submission:create',
    'submission:read_own',
  ],
  admin: [
    'task:read',
    'task:create',
    'task:edit',
    'task:delete',
    'task:manage_resources',
    'task:manage_answer',
    'task:view_submissions',
    'board:read',
    'board:write',
    'board:delete_any',
    'question:read',
    'question:write',
    'question:delete_any',
    'doc:read',
    'doc:write',
    'doc:delete',
    'member:read',
    'member:manage',
    'submission:create',
    'submission:read_own',
    'submission:read_all',
    'submission:delete',
    'admin:access',
    'admin:manage_roles',
  ],
};

// ==================== 권한 체크 함수 ====================

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;

  // role이 없는 경우 is_admin으로 폴백
  const role = user.role || (user.is_admin ? 'admin' : 'user');
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * 사용자가 모든 권한을 가지고 있는지 확인
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * 사용자가 Admin인지 확인
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.is_admin === true;
}

/**
 * 사용자가 Creator 이상인지 확인 (Creator 또는 Admin)
 */
export function isCreatorOrAbove(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'creator' || user.role === 'admin' || user.is_admin === true;
}

// ==================== Task 관련 권한 ====================

/**
 * 사용자가 특정 과제의 Creator인지 확인 (DB 조회)
 */
export async function isTaskCreator(userId: string, taskId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('task_creators')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .single();

  if (error || !data) {
    // task_creators에 없으면 tasks.created_by 확인
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('created_by')
      .eq('id', taskId)
      .single();

    return task?.created_by === userId;
  }

  return true;
}

/**
 * 사용자가 특정 과제를 편집할 수 있는지 확인
 */
export async function canEditTask(user: User | null, taskId: string): Promise<boolean> {
  if (!user) return false;

  // Admin은 모든 과제 편집 가능
  if (isAdmin(user)) return true;

  // Creator 권한이 있어야 함
  if (!hasPermission(user, 'task:edit')) return false;

  // Creator는 본인 과제만 편집 가능
  return await isTaskCreator(user.id, taskId);
}

/**
 * 사용자가 특정 과제의 리소스를 관리할 수 있는지 확인
 */
export async function canManageTaskResources(user: User | null, taskId: string): Promise<boolean> {
  if (!user) return false;

  if (isAdmin(user)) return true;

  if (!hasPermission(user, 'task:manage_resources')) return false;

  return await isTaskCreator(user.id, taskId);
}

/**
 * 사용자가 특정 과제의 제출물을 볼 수 있는지 확인
 */
export async function canViewTaskSubmissions(user: User | null, taskId: string): Promise<boolean> {
  if (!user) return false;

  if (isAdmin(user)) return true;

  if (!hasPermission(user, 'task:view_submissions')) return false;

  return await isTaskCreator(user.id, taskId);
}

// ==================== 과제 생성 시 Creator 자동 등록 ====================

/**
 * 과제 생성 시 Creator 권한 자동 부여
 */
export async function assignTaskCreator(
  taskId: string,
  userId: string,
  assignedBy?: string
): Promise<void> {
  await supabaseAdmin
    .from('task_creators')
    .upsert({
      task_id: taskId,
      user_id: userId,
      assigned_by: assignedBy || userId,
    }, {
      onConflict: 'user_id,task_id',
    });
}

/**
 * Creator 권한 해제
 */
export async function removeTaskCreator(taskId: string, userId: string): Promise<void> {
  await supabaseAdmin
    .from('task_creators')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
}

// ==================== 사용자 역할 변경 ====================

/**
 * 사용자 역할 변경 (Admin만 가능)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      role: newRole,
      is_admin: newRole === 'admin', // is_admin도 동기화
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
