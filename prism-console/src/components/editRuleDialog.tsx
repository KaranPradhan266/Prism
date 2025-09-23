import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from './SessionProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRuleForProject } from '@/lib/api';
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

interface Rule {
    id: string;
    name: string;
    type: string;
    value: string;
    enabled: boolean;
}

interface EditRuleDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    rule: Rule | null;
    onCancel: () => void;
}

export function EditRuleDialog({
    isOpen,
    onOpenChange,
    rule,
    onCancel
}: EditRuleDialogProps) {
    const location = useLocation();
    const { project } = location.state || {};
    const { session } = useSession();

    const [editForm, setEditForm] = useState({
        type: '',
        name: '',
        value: '',
        enabled: true
    });

    const queryClient = useQueryClient();

    // Populate form when rule changes
    useEffect(() => {
        if (rule) {
            setEditForm({
                type: rule.type,
                name: rule.name,
                value: rule.value,
                enabled: rule.enabled
            });
        }
    }, [rule]);

    const updateMutation = useMutation({
        mutationFn: ({ ruleId, form }: { ruleId: string; form: typeof editForm }) => {
            if (!session) {
                throw new Error("No session found");
            }
            return updateRuleForProject(session, project.id, ruleId, form);
        },
        onSuccess: (updatedRule) => {
            queryClient.invalidateQueries({ queryKey: ['rules', session] });
            setEditForm({ type: '', name: '', value: '', enabled: true });
            onOpenChange(false); // Close dialog
        },
        onError: (error) => {
            console.error("Failed to update rule:", error);
        },
    });

    const handleSaveChanges = () => {
        if (!rule) return;
        updateMutation.mutate({ ruleId: rule.id, form: editForm });
    };

    const handleCancelEdit = () => {
        setEditForm({ type: '', name: '', value: '', enabled: true }); 
        onCancel(); // Call parent's onCancel
        onOpenChange(false); // Close dialog
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                            value={rule?.id || ''}
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
    );
}