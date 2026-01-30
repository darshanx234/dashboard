'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserTable, UserDialog } from '@/components/admin/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  adminUserApi,
  AdminUser,
  GetUsersParams,
  CreateUserDto,
  UpdateUserDto
} from '@/lib/api/admin-users';
import { useAuthStore } from '@/lib/store/auth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Fetch users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetUsersParams = {
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter !== 'all' ? (roleFilter as any) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      };

      const response = await adminUserApi.getUsers(params);
      setUsers(response.users);
      setPagination({
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, toast]);

  // Load users on mount and filter changes
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSaveUser = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      if (editingUser) {
        await adminUserApi.updateUser(editingUser._id, data as UpdateUserDto);
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      } else {
        await adminUserApi.createUser(data as CreateUserDto);
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
      }
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      const result = await adminUserApi.updateUserStatus(userId, status);
      toast({
        title: 'Success',
        description: result.message,
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminUserApi.deleteUser(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage photographers, clients, and administrators
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination.total}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="photographer">Photographer</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        currentUserId={currentUser?.id}
        onEdit={handleEditUser}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteUser}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}
