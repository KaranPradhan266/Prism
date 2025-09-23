import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from './SessionProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRuleForProject } from '@/lib/api';
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AddRuleForm {
    name: string;
    type: string;
    value: string;
    enabled: boolean;
}

interface AddRuleDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel: () => void;
}

export function AddRuleDialog({
    isOpen,
    onOpenChange,
    onCancel
}: AddRuleDialogProps) {
    const location = useLocation();
    const { project } = location.state || {};
    const { session } = useSession();

    const [addForm, setAddForm] = useState({
        name: '',
        type: '',
        value: '',
        enabled: true
    });

    const queryClient = useQueryClient();

    const addMutation = useMutation({
        mutationFn: (form: typeof addForm) => {
            if (!session) {
                throw new Error("No session found");
            }
            return createRuleForProject(session, project.id, form);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', session] });
            setAddForm({ name: '', type: '', value: '', enabled: true });
            onOpenChange(false);
        },
        onError: (error: Error) => {
            console.error("Failed to create rule:", error);
        },
    });

    const handleCreateRule = (): void => {
        addMutation.mutate(addForm);
    };

    const handleCancelAdd = (): void => {
        setAddForm({ name: '', type: '', value: '', enabled: true });
        onCancel();
        onOpenChange(false);
    };

    const handleOpenChange = (open: boolean): void => {
        if (!open) {
            setAddForm({ name: '', type: '', value: '', enabled: true });
            onCancel();
        }
        onOpenChange(open);
    };

    const handleInputChange = (field: keyof AddRuleForm) => (
        e: React.ChangeEvent<HTMLInputElement>
    ): void => {
        setAddForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSwitchChange = (checked: boolean): void => {
        setAddForm(prev => ({ ...prev, enabled: checked }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
                            onChange={handleInputChange('name')}
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
                            onChange={handleInputChange('type')}
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
                            onChange={handleInputChange('value')}
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
                                onCheckedChange={handleSwitchChange}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancelAdd}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateRule}
                        disabled={addMutation.isPending || !addForm.type.trim() || !addForm.value.trim()}
                    >
                        {addMutation.isPending ? 'Creating...' : 'Create rule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}