import React, { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useAdminData';
import { User } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Select } from '../components/UI';
import { Plus, Trash2, Edit2, Loader2, UserCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export const UsersView: React.FC = () => {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<User>();

  const handleOpenModal = (user?: User) => {
    setEditingId(user?.id || null);
    reset(user || { name: '', email: '', role: 'Mapping User', status: 'Active' });
    setIsModalOpen(true);
  };

  const onSubmit = (data: User) => {
    if (editingId) {
      updateUser.mutate({ ...data, id: editingId }, { onSuccess: () => { setIsModalOpen(false); toast.success("Updated"); }});
    } else {
      createUser.mutate(data, { onSuccess: () => { setIsModalOpen(false); toast.success("Created"); }});
    }
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Delete User?")) deleteUser.mutate(id, { onSuccess: () => toast.success("Deleted") });
  }

  if (isLoading) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
         <h1 className="text-2xl font-bold">User Management</h1>
         <Button onClick={() => handleOpenModal()}><Plus size={18}/> Add User</Button>
      </div>

      <Card>
         <table className="w-full">
            <TableHeader>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
                {users.map(user => (
                    <TableRow key={user.id} onClick={() => handleOpenModal(user)}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <UserCircle className="text-slate-400" />
                                <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>
                            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}><Trash2 size={16} className="text-red-500"/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </tbody>
         </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit' : 'Add'} footer={<Button onClick={handleSubmit(onSubmit)}>Save</Button>}>
          <div className="space-y-4">
              <Input label="Name" {...register('name')} />
              <Input label="Email" type="email" {...register('email')} />
              {!editingId && <Input label="Password" type="password" {...register('password')} />}
              <Select label="Role" {...register('role')} options={[{value:'Admin', label:'Admin'}, {value:'Mapping User', label:'Mapping User'}]} />
              <Select label="Status" {...register('status')} options={[{value:'Active', label:'Active'}, {value:'Inactive', label:'Inactive'}]} />
          </div>
      </Modal>
    </div>
  );
};
