import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useSession } from './SessionProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRulesForProject, updateRuleForProject, createRuleForProject } from '@/lib/api';
import { MoreVertical, Edit, Trash2, Power, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download } from 'lucide-react';
import ProjectCard from './projectCard';

interface Rule {
  id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const ProjectDetails = () => {
  const location = useLocation();
  const { project } = location.state || {};
  const { session } = useSession();

  // State for filtering, sorting, and selection
  const [filterValue, setFilterValue] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Rule | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [editForm, setEditForm] = useState({
    type: '',
    name:'',
    value: '',
    enabled: true
  });
  const [addForm, setAddForm] = useState({
    name: '',
    type: '',
    value: '',
    enabled: true
  });

  const { data: rules, error, isLoading } = useQuery<Rule[], Error>({
    queryKey: ['rules', session],
    queryFn: () => getRulesForProject(session!, project.id),
    enabled: !!session,
  });  

  const handleBulkExport = () => {
    const selectedRulesData = rules?.filter(rule => selectedRules.includes(rule.id));
    console.log('Bulk export rules:', selectedRulesData);
    
    // Create CSV content
    const csvHeaders = ['ID', 'Type', 'Value', 'Status', 'Created At', 'Updated At'];
    const csvRows = selectedRulesData?.map(rule => [
      rule.id,
      rule.type,
      rule.value,
      rule.enabled ? 'Active' : 'Inactive',
      rule.created_at,
      rule.updated_at
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...(csvRows?.map(row => row.join(',')) || [])
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rules-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Filtered and sorted rules
  const processedRules = useMemo(() => {
    if (!rules) return [];

    let filtered = rules.filter(rule => 
      rule.type.toLowerCase().includes(filterValue.toLowerCase()) ||
      rule.value.toLowerCase().includes(filterValue.toLowerCase()) ||
      rule.id.toLowerCase().includes(filterValue.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfig.direction === 'asc'
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }
        
        return 0;
      });
    }

    return filtered;
  }, [rules, filterValue, sortConfig]);

  // Handle sorting
  const handleSort = (key: keyof Rule) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle checkbox selection
  const handleSelectRule = (ruleId: string) => {
    setSelectedRules(current => 
      current.includes(ruleId)
        ? current.filter(id => id !== ruleId)
        : [...current, ruleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRules(current => 
      current.length === processedRules.length 
        ? [] 
        : processedRules.map(rule => rule.id)
    );
  };

  const getSortIcon = (key: keyof Rule) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  // Action handlers
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setEditForm({
      type: rule.type,
      name: rule.name,
      value: rule.value,
      enabled: rule.enabled
    });
    setIsEditDialogOpen(true);
  };

  const handleAddRule = () => {
    setAddForm({
      type: '',
      name:'',
      value: '',
      enabled: true
    });
    setIsAddDialogOpen(true);
  };

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ ruleId, form }: { ruleId: string; form: typeof editForm }) => {
      if (!session) {
        throw new Error("No session found");
      }
      return updateRuleForProject(session, project.id, ruleId, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', session] });
      setIsEditDialogOpen(false);
      setEditingRule(null);
      setEditForm({ type: '', name: '', value: '', enabled: true });
    },
    onError: (error) => {
      // You can handle errors here, e.g., show a notification
      console.error("Failed to update rule:", error);
    },
  });

  const addMutation = useMutation({
    mutationFn: (form: typeof addForm) => {
      if (!session) {
        throw new Error("No session found");
      }
      return createRuleForProject(session, project.id, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', session] });
      setIsAddDialogOpen(false);
      setAddForm({ name: '', type: '', value: '', enabled: true });
    },
    onError: (error) => {
      // You can handle errors here, e.g., show a notification
      console.error("Failed to create rule:", error);
    },
  });

  const handleSaveChanges = () => {
    if (!editingRule) return;
    updateMutation.mutate({ ruleId: editingRule.id, form: editForm });
  };

  const handleCreateRule = () => {
    addMutation.mutate(addForm);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingRule(null);
    setEditForm({ type: '', name:'', value: '', enabled: true });
  };

  const handleCancelAdd = () => {
    setIsAddDialogOpen(false);
    setAddForm({ name:'', type: '', value: '', enabled: true });
  };

  const handleDelete = (rule: Rule) => {
    console.log('Delete rule:', rule);
    // Add your delete logic here
  };

  const handleToggleStatus = (rule: Rule) => {
    console.log('Toggle status for rule:', rule);
    // Add your enable/disable logic here
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  const breadcrumbs = [
    { label: "Prism NGFW", href: "/dashboard" },
    { label: "Projects Dashboard", href: "/dashboard" },
    { label: project.name },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="mb-6">
        <ProjectCard project={project} />
      </div>

      {/* Filter Input */}
      <div className="mb-4 flex items-center gap-4">
        <Input
          placeholder="Filter rules..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddRule}>Add rule</Button>
        {selectedRules.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkExport}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export Selected ({selectedRules.length})
          </Button>
        )}
      </div>

      {/* Selected Rules Info */}
      {selectedRules.length > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-sm">
            {selectedRules.length} rule{selectedRules.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRules.length === processedRules.length && processedRules.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('id')}
                className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
              >
                ID
                {getSortIcon('id')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
              >
                Name
                {getSortIcon('type')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('type')}
                className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
              >
                Type
                {getSortIcon('type')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('value')}
                className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
              >
                Value
                {getSortIcon('value')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('enabled')}
                className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
              >
                Status
                {getSortIcon('enabled')}
              </Button>
            </TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedRules?.map((rule) => (
            <TableRow 
              key={rule.id}
              className={selectedRules.includes(rule.id) ? 'bg-muted/50' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedRules.includes(rule.id)}
                  onCheckedChange={() => handleSelectRule(rule.id)}
                  aria-label={`Select rule ${rule.id}`}
                />
              </TableCell>
              <TableCell>{rule.id}</TableCell>
              <TableCell>{rule.name}</TableCell>
              <TableCell>{rule.type}</TableCell>
              <TableCell>{rule.value}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  rule.enabled 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {rule.enabled ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleEdit(rule)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(rule)}
                      className="cursor-pointer"
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(rule)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>
              Make changes to the rule. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-id" className="text-right">
                ID
              </Label>
              <Input
                id="rule-id"
                value={editingRule?.id || ''}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-name" className="text-right">
                Name
              </Label>
              <Input
                id="rule-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-type" className="text-right">
                Type
              </Label>
              <Input
                id="rule-type"
                value={editForm.type}
                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-value" className="text-right">
                Value
              </Label>
              <Input
                id="rule-value"
                value={editForm.value}
                onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-enabled" className="text-right">
                Enabled
              </Label>
              <div className="col-span-3">
                <Switch
                  id="rule-enabled"
                  checked={editForm.enabled}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Rule</DialogTitle>
            <DialogDescription>
              Create a new rule. Click create when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-rule-name" className="text-right">
                Name
              </Label>
              <Input
                id="add-rule-name"
                value={addForm.name}
                onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter rule name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-rule-type" className="text-right">
                Type
              </Label>
              <Input
                id="add-rule-type"
                value={addForm.type}
                onChange={(e) => setAddForm(prev => ({ ...prev, type: e.target.value }))}
                className="col-span-3"
                placeholder="Enter rule type"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-rule-value" className="text-right">
                Value
              </Label>
              <Input
                id="add-rule-value"
                value={addForm.value}
                onChange={(e) => setAddForm(prev => ({ ...prev, value: e.target.value }))}
                className="col-span-3"
                placeholder="Enter rule value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-rule-enabled" className="text-right">
                Enabled
              </Label>
              <div className="col-span-3">
                <Switch
                  id="add-rule-enabled"
                  checked={addForm.enabled}
                  onCheckedChange={(checked) => setAddForm(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAdd}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={addMutation.isPending || !addForm.type || !addForm.value}>
              {addMutation.isPending ? 'Creating...' : 'Create rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ProjectDetails;