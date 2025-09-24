import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Clock, ExternalLink, Folder, GitBranch } from "lucide-react"
import { useLocation } from "react-router-dom";
import { EditProjectDialog } from './editProjectDialog';

// You'll need to import or define the Project type
interface Project {
  id: string;
  name: string;
  path_prefix: string;
  updated_at: string;
  created_at: string;
  upstream_url: string;
  description?: string; // Make description optional since it might not exist in your data
  Status: string;
  // Remove type field conflict and add it properly if needed
}

const ProjectCard = ({ project: initialProject }: { project: Project }) => {
  const location = useLocation();
  const isDetailsPage = location.pathname.includes('/project');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [project, setProject] = useState(initialProject);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const handleProjectUpdate = (updatedData: Partial<Project>) => {
    setProject(prevProject => ({ ...prevProject, ...updatedData }));
  };

  const formatDate = (dateString: string) => {
    // Handle your timestamp format: 2025-09-21 01:26:12.759234+00
    const date = new Date(dateString);
  

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400';
      case 'inactive':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400 border-blue-500/20';
    }
  };

  // Determine project type based on path or name
  const getProjectType = (project: Project): string => {
    const pathLower = project.path_prefix.toLowerCase();
    const nameLower = project.name.toLowerCase();

    if (pathLower.includes('api') || nameLower.includes('api')) {
      return 'Backend';
    }
    if (pathLower.includes('dashboard') || nameLower.includes('dashboard') || nameLower.includes('ui')) {
      return 'Frontend';
    }
    if (nameLower.includes('firewall') || nameLower.includes('security') || nameLower.includes('ngfw')) {
      return 'Security';
    }
    return 'General';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Security':
        return '🛡️';
      case 'Frontend':
        return '🎨';
      case 'Backend':
        return '⚙️';
      case 'General':
        return '📁';
      default:
        return '📁';
    }
  };

  const projectType = getProjectType(project);

  // Generate a description if none exists
  const getProjectDescription = (project: Project): string => {
    if (project.description) {
      return project.description;
    }

    // Generate description based on project type and name
    const type = getProjectType(project);
    switch (type) {
      case 'Security':
        return `Security service handling firewall operations at ${project.path_prefix}`;
      case 'Backend':
        return `API service providing backend functionality at ${project.path_prefix}`;
      case 'Frontend':
        return `Frontend application served at ${project.path_prefix}`;
      default:
        return `Application service running at ${project.path_prefix}`;
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
              <span className="text-lg">{getTypeIcon(projectType)}</span>
              <span className="line-clamp-1">{project.name}</span>
            </CardTitle>
            <Badge
              variant="outline"
              className={`shrink-0 capitalize ${getStatusColor(project.Status)}`}
            >
              {project.Status}
            </Badge>
          </div>
          <CardDescription className="text-muted-foreground leading-relaxed">
            {getProjectDescription(project)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Folder className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Path Prefix:</span>
              </div>
              <code className="bg-muted px-2 py-1 rounded-md text-xs font-mono text-foreground border">
                {project.path_prefix}
              </code>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Created:</span>
              </div>
              <span className="text-sm text-foreground">
                {formatDate(project.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Updated:</span>
              </div>
              <span className="text-sm text-foreground">
                {formatDate(project.updated_at)}
              </span>
            </div>

            {/* Add upstream URL if available */}
            {project.upstream_url && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Upstream:</span>
                </div>
                <code className="bg-muted px-2 py-1 rounded-md text-xs font-mono text-foreground border truncate">
                  {project.upstream_url}
                </code>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-4 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span className="text-sm">Type: {projectType}</span>
          </div>
          {isDetailsPage && (
            <Button size="sm" onClick={() => setIsEditDialogOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          )}
        </CardFooter>
      </Card>
      <EditProjectDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCancel={() => setIsEditDialogOpen(false)}
        onUpdate={handleProjectUpdate}
        project={project}
      />
    </>
  );
};

export default ProjectCard;