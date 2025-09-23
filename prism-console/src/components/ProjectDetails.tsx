import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useSession } from './SessionProvider';
import { useQuery } from '@tanstack/react-query';
import { getRulesForProject } from '@/lib/api';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectCard from './projectCard';
import { EditRuleDialog } from './editRuleDialog';
import { AddRuleDialog } from './addRuleDialog';
import { RulesTable } from './rulesTable'; // Import the new component

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
    name: '',
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
    // Note: This will need to be updated to work with the filtered rules from the table component
    // For now, using all rules - you might want to pass processedRules count back up
    setSelectedRules(current =>
      current.length === rules?.length
        ? []
        : rules?.map(rule => rule.id) || []
    );
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
      name: '',
      value: '',
      enabled: true
    });
    setIsAddDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingRule(null);
    setEditForm({ type: '', name: '', value: '', enabled: true });
  };

  const handleCancelAdd = () => {
    setIsAddDialogOpen(false);
    setAddForm({ name: '', type: '', value: '', enabled: true });
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

      {/* Use the extracted RulesTable component */}
      <RulesTable
        rules={rules || []}
        filterValue={filterValue}
        sortConfig={sortConfig}
        selectedRules={selectedRules}
        onSort={handleSort}
        onSelectRule={handleSelectRule}
        onSelectAll={handleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Edit Rule Dialog */}
      <EditRuleDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        rule={editingRule}
        onCancel={handleCancelEdit}
      />

      {/* Add Rule Dialog */}
      <AddRuleDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCancel={handleCancelAdd}
      />

    </AppLayout>
  );
};

export default ProjectDetails;