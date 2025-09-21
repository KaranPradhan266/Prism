import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import React, { useEffect, useState } from 'react';
import { getProjects, getRulesForProject } from '@/lib/api';
import { useSession } from './SessionProvider';
import ProjectDetails from "./ProjectDetails"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Clock, ExternalLink, Folder, GitBranch } from "lucide-react"

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

interface Rule {
  id: string;
  type: string;
  value: string;
  // Add other rule properties here
}

const ProjectCard = ({ project }: { project: Project }) => {
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
        <Button size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Dashboard() {
  const { session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (session) {
      getProjects(session)
        .then(data => {
          setProjects(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading) {
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
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <ModeToggle/>
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Prism NGFW
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Projects Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-muted-foreground">
                Manage your Prism NGFW projects and configurations
              </p>
            </div>
            
            <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
          
          {/* Stats or additional content area */}
          <div className="bg-muted/50 min-h-[200px] flex-1 rounded-xl md:min-h-min p-6">
            <h3 className="text-lg font-semibold mb-4">Project Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-muted-foreground">Total Projects</h4>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-muted-foreground">Active Projects</h4>
                <p className="text-2xl font-bold">{projects.filter(p => p.Status === 'active').length}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-muted-foreground">Security Projects</h4>
                <p className="text-2xl font-bold">
                  {projects.filter(p => 
                    p.name.toLowerCase().includes('firewall') || 
                    p.name.toLowerCase().includes('security') || 
                    p.name.toLowerCase().includes('ngfw')
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}