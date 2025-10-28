'use client'

import { useEffect, useState } from 'react'
// Removed prisma import (client-side)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Search, Plus, KeyRound } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<Array<any>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'ADMIN', status: 'ACTIVE' })

  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', role: 'ADMIN', status: 'ACTIVE' })

  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdUser, setPwdUser] = useState<any>(null)
  const [pwdForm, setPwdForm] = useState({ password: '' })

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? page)
      setPageSize(data.pageSize ?? pageSize)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function createUser() {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (!res.ok) throw new Error('Failed to create user')
      setCreateOpen(false)
      setCreateForm({ email: '', name: '', password: '', role: 'ADMIN', status: 'ACTIVE' })
      await load()
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Failed to create user')
    }
  }

  async function updateUser() {
    if (!editUser) return
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(editUser.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Failed to update user')
      setEditOpen(false)
      setEditUser(null)
      await load()
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Failed to update user')
    }
  }

  async function deleteUser(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      await load()
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Failed to delete user')
    }
  }

  async function setPassword() {
    if (!pwdUser) return
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(pwdUser.id)}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwdForm),
      })
      if (!res.ok) throw new Error('Failed to set password')
      setPwdOpen(false)
      setPwdUser(null)
      setPwdForm({ password: '' })
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Failed to set password')
    }
  }

  function onOpenEdit(user: any) {
    setEditUser(user)
    setEditForm({ name: user.name || '', role: user.role || 'ADMIN', status: user.status || 'ACTIVE' })
    setEditOpen(true)
  }
  function onOpenPwd(user: any) {
    setPwdUser(user)
    setPwdForm({ password: '' })
    setPwdOpen(true)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage admin and moderator accounts</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>Invite or create an admin/moderator account</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Full name (optional)" />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="At least 8 characters" />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <select className="border rounded px-2 py-2" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="MODERATOR">MODERATOR</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <select className="border rounded px-2 py-2" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createUser}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>List of registered users</CardDescription>
            </div>
            <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or name"
                className="w-64"
              />
              <Button type="submit" variant="secondary" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.name ?? '-'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span suppressHydrationWarning>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => onOpenPwd(user)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {total} total
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button variant="outline" disabled={!canNext || loading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <select className="border rounded px-2 py-2" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="MODERATOR">MODERATOR</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <select className="border rounded px-2 py-2" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={updateUser}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Password</DialogTitle>
            <DialogDescription>Set a new password for the selected user</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>New Password</Label>
              <Input type="password" value={pwdForm.password} onChange={(e) => setPwdForm({ password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={setPassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}