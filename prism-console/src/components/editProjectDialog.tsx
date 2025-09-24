import { useState, useEffect } from 'react';
import { useSession } from './SessionProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProject } from '@/lib/api';
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

interface EditProjectForm {
    name: string;
    path_prefix: string;
    upstream_url: string;
}

interface EditProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel: () => void;
    onUpdate: (data: EditProjectForm) => void;
    project: {
        id: string;
        name: string;
        path_prefix: string;
        upstream_url: string;
    };
}

export function EditProjectDialog({
    isOpen,
    onOpenChange,
    onCancel,
    onUpdate,
    project
}: EditProjectDialogProps) {
    const { session } = useSession();
    const [editForm, setEditForm] = useState<EditProjectForm>({
        name: '',
        path_prefix: '',
        upstream_url: ''
    });

    useEffect(() => {
        if (project) {
            setEditForm({
                name: project.name,
                path_prefix: project.path_prefix,
                upstream_url: project.upstream_url
            });
        }
    }, [project]);

    const queryClient = useQueryClient();

    const editMutation = useMutation<unknown, Error, EditProjectForm>({
        mutationFn: (form) => {
            if (!session) {
                throw new Error("No session found");
            }
            return updateProject(session, project.id, form as unknown as Record<string, unknown>);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', session] });
            onUpdate(editForm);
            onOpenChange(false);
        },
        onError: (error: Error) => {
            console.error("Failed to update project:", error);
        },
    });

    const handleUpdateProject = (): void => {
        editMutation.mutate(editForm);
    };

    const handleCancelEdit = (): void => {
        onCancel();
        onOpenChange(false);
    };

    const handleOpenChange = (open: boolean): void => {
        if (!open) {
            onCancel();
        }
        onOpenChange(open);
    };

    const handleInputChange = (field: keyof EditProjectForm) => (
        e: React.ChangeEvent<HTMLInputElement>
    ): void => {
        setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Make changes to your project. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-project-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="edit-project-name"
                            value={editForm.name}
                            onChange={handleInputChange('name')}
                            className="col-span-3"
                            placeholder="Enter project name"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-project-path-prefix" className="text-right">
                            Path Prefix
                        </Label>
                        <Input
                            id="edit-project-path-prefix"
                            value={editForm.path_prefix}
                            onChange={handleInputChange('path_prefix')}
                            className="col-span-3"
                            placeholder="Enter path prefix"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-project-upstream-url" className="text-right">
                            Upstream URL
                        </Label>
                        <Input
                            id="edit-project-upstream-url"
                            value={editForm.upstream_url}
                            onChange={handleInputChange('upstream_url')}
                            className="col-span-3"
                            placeholder="Enter upstream URL"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateProject}
                        disabled={editMutation.isPending}
                    >
                        {editMutation.isPending ? 'Saving...' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
