import { useMemo } from 'react';
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Rule {
  id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface SortConfig {
  key: keyof Rule | null;
  direction: 'asc' | 'desc';
}

interface RulesTableProps {
  rules: Rule[];
  filterValue: string;
  sortConfig: SortConfig;
  selectedRules: string[];
  onSort: (key: keyof Rule) => void;
  onSelectRule: (ruleId: string) => void;
  onSelectAll: () => void;
  onEdit: (rule: Rule) => void;
  onDelete: (rule: Rule) => void;
  onToggleStatus: (rule: Rule) => void;
}

export const RulesTable = ({
  rules,
  filterValue,
  sortConfig,
  selectedRules,
  onSort,
  onSelectRule,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleStatus,
}: RulesTableProps) => {
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

  const getSortIcon = (key: keyof Rule) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedRules.length === processedRules.length && processedRules.length > 0}
              onCheckedChange={onSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('id')}
              className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
            >
              ID
              {getSortIcon('id')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('name')}
              className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
            >
              Name
              {getSortIcon('name')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('type')}
              className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
            >
              Type
              {getSortIcon('type')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('value')}
              className="h-auto p-0 font-medium hover:bg-transparent [padding-inline:unset!important]"
            >
              Value
              {getSortIcon('value')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort('enabled')}
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
                onCheckedChange={() => onSelectRule(rule.id)}
                aria-label={`Select rule ${rule.id}`}
              />
            </TableCell>
            <TableCell>{rule.id}</TableCell>
            <TableCell>{rule.name}</TableCell>
            <TableCell>{rule.type}</TableCell>
            <TableCell>{rule.value}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${rule.enabled
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
                    onClick={() => onEdit(rule)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleStatus(rule)}
                    className="cursor-pointer"
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(rule)}
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
  );
};