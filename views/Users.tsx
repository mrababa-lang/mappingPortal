import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Select, Pagination } from '../components/UI';
import { Plus, Trash2, Edit2, UserCircle, Shield, CheckCircle2, XCircle, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useVehicleData';
import { toast } from 'sonner';

export const UsersView: React.FC = () => {
  // Hooks
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<User>>({ 
    name: '', email: '', role: 'Mapping User', status: 'Active', password: ''
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      // Don't show existing password, allow reset
      setFormData({ ...user, password: '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', role: 'Mapping User', status: 'Active', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required.");
      return;
    }

    // Require password for new users
    if (!editingId && !formData.password) {
      toast.error("Password is required for new users.");
      return;
    }

    if (editingId) {
      // Find current user to keep old password if not changing
      const currentUser = users.find(u => u.id === editingId);
      const passwordToSave = formData.password ? formData.password : currentUser?.password;
      
      updateUser.mutate({ ...formData, id: editingId, password: passwordToSave } as User, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("User updated successfully");
        },
        onError: () => toast.error("Failed to update user")
      });
    } else {
      createUser.mutate({
        id: Date.now().toString(),
        name: formData.name!,
        email: formData.email!,
        password: formData.password!,
        role: formData.role! as 'Admin' | 'Mapping Admin' | 'Mapping User',
        status: formData.status! as 'Active' | 'Inactive',
        lastActive: 'Just now'
      }, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("User created successfully");
        },
        onError: () => toast.error("Failed to create user")
      });
    }
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteUser.mutate(itemToDelete, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        toast.success("User deleted successfully");
      },
      onError: () => toast.error("Failed to delete user")
    });
  };

  // Pagination Logic
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoadingUsers) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
           <p className="text-slate-500">Manage system access and roles.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Add User
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedUsers.map(user => (
                <TableRow key={user.id} onClick={() => handleOpenModal(user)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Shield size={14} className="text-indigo-500" />
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">{user.lastActive}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="p-2 h-auto" onClick={(e) => handleOpenModal(user)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={(e) => initiateDelete(user.id, e)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={users.length}
        />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={createUser.isPending || updateUser.isPending}>Save User</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Full Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
          />
          <Input 
            label="Email Address" 
            type="email" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="john@example.com"
          />
          
          {/* Password Field */}
          <div className="relative">
             <div className="absolute top-9 left-3 text-slate-400 pointer-events-none">
               <Lock size={16} />
             </div>
             <Input 
               label={editingId ? "New Password (Leave blank to keep current)" : "Password"}
               type="password"
               value={formData.password}
               onChange={e => setFormData({...formData, password: e.target.value})}
               placeholder={editingId ? "••••••••" : "Enter secure password"}
               className="pl-9"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Role"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
              options={[
                { value: 'Admin', label: 'Admin' },
                { value: 'Mapping Admin', label: 'Mapping Admin' },
                { value: 'Mapping User', label: 'Mapping User' }
              ]}
            />
            <Select 
              label="Status"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={deleteUser.isPending}>Delete User</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
             <AlertTriangle size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Delete User?</h3>
           <p className="text-slate-500 text-sm">
             Are you sure you want to remove this user from the system? <br/>
             This action cannot be undone.
           </p>
        </div>
      </Modal>
    </div>
  );
};