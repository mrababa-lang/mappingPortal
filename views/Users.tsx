import React, { useState, useEffect } from 'react';
import { DataService } from '../services/storageService';
import { User } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Select, Pagination } from '../components/UI';
import { Plus, Trash2, Edit2, UserCircle, Shield, CheckCircle2, XCircle, Lock, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Zod Schema
const userSchema = z.object({
  name: z.string().min(1, "Full Name is required."),
  email: z.string().email("Invalid email address."),
  role: z.enum(['Admin', 'Mapping Admin', 'Mapping User']),
  status: z.enum(['Active', 'Inactive']),
  password: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: 'Mapping User', status: 'Active', password: '' }
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(DataService.getUsers());
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: '' // Don't show existing password
      });
    } else {
      setEditingId(null);
      reset({ name: '', email: '', role: 'Mapping User', status: 'Active', password: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: UserFormData) => {
    // Require password for new users
    if (!editingId && !data.password) {
      setError('password', { type: 'manual', message: 'Password is required for new users.' });
      return;
    }

    let updatedUsers = [...users];

    if (editingId) {
      updatedUsers = users.map(u => {
        if (u.id === editingId) {
          // Only update password if a new one was entered
          const updatedUser = { ...u, ...data };
          if (!data.password) {
            updatedUser.password = u.password;
          }
          return updatedUser as User;
        }
        return u;
      });
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        password: data.password!,
        role: data.role,
        status: data.status,
        lastActive: 'Just now'
      };
      updatedUsers.push(newUser);
    }
    
    DataService.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setIsModalOpen(false);
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete;

    const currentUsers = DataService.getUsers();
    const filtered = currentUsers.filter(u => u.id !== id);
    DataService.saveUsers(filtered);
    setUsers(filtered);

    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Pagination Logic
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
            <Button onClick={handleSubmit(onSubmit)}>Save User</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Input 
              label="Full Name" 
              placeholder="John Doe"
              {...register('name')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
          </div>
          <div>
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="john@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
          </div>
          
          {/* Password Field */}
          <div className="relative">
             <div className="absolute top-9 left-3 text-slate-400 pointer-events-none">
               <Lock size={16} />
             </div>
             <Input 
               label={editingId ? "New Password (Leave blank to keep current)" : "Password"}
               type="password"
               placeholder={editingId ? "••••••••" : "Enter secure password"}
               className="pl-9"
               {...register('password')}
             />
             {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select 
                label="Role"
                options={[
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Mapping Admin', label: 'Mapping Admin' },
                  { value: 'Mapping User', label: 'Mapping User' }
                ]}
                {...register('role')}
              />
              {errors.role && <p className="text-red-500 text-xs mt-1 ml-1">{errors.role.message}</p>}
            </div>
            <div>
              <Select 
                label="Status"
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' }
                ]}
                {...register('status')}
              />
              {errors.status && <p className="text-red-500 text-xs mt-1 ml-1">{errors.status.message}</p>}
            </div>
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
            <Button variant="danger" onClick={confirmDelete}>Delete User</Button>
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