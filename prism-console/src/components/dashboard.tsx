import { getProjects } from '@/lib/api';
import { useSession } from './SessionProvider';
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "./AppLayout";
import ProjectCarousel from './projectCarousel';

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

export default function Dashboard() {
  const { session } = useSession();

  const { data: projects, error, isLoading } = useQuery<Project[], Error>({
    queryKey: ['projects', session],
    queryFn: () => getProjects(session!),
    enabled: !!session,
  });

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

  const breadcrumbs = [
    { label: "Prism NGFW" },
    { label: "Projects Dashboard" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your Prism NGFW projects and configurations
          </p>
        </div>
        
        <div className="w-full px-12">
          <ProjectCarousel projects={projects || []} />
        </div>
      </div>
      
      {/* Stats or additional content area */}
      <div className="bg-muted/50 min-h-[200px] flex-1 rounded-xl md:min-h-min p-6">
        <h3 className="text-lg font-semibold mb-4">Project Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-4 border">
            <h4 className="text-sm font-medium text-muted-foreground">Total Projects</h4>
            <p className="text-2xl font-bold">{projects?.length}</p>
          </div>
          <div className="bg-background rounded-lg p-4 border">
            <h4 className="text-sm font-medium text-muted-foreground">Active Projects</h4>
            <p className="text-2xl font-bold">{projects?.filter(p => p.Status === 'active').length}</p>
          </div>
          <div className="bg-background rounded-lg p-4 border">
            <h4 className="text-sm font-medium text-muted-foreground">Security Projects</h4>
            <p className="text-2xl font-bold">
              {projects?.filter(p => 
                p.name.toLowerCase().includes('firewall') || 
                p.name.toLowerCase().includes('security') || 
                p.name.toLowerCase().includes('ngfw')
              ).length}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
